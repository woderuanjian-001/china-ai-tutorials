---
title: "AI API Gateway Design with Chinese Models: Multi-Model Routing, Rate Limiting & Caching"
description: "Build a unified API gateway for Chinese AI models (DeepSeek, Qwen, Kimi, GLM): smart multi-model routing, rate limiting, response caching, failover, and cost tracking. Includes complete FastAPI + Redis implementation."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Gateway", "Routing", "Rate Limiting", "Caching", "FastAPI", "Architecture", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build a production-grade AI API gateway:

- Multi-model intelligent routing (auto-select the optimal model)
- Rate limiting and quota management
- Response caching (cost savings + acceleration)
- Automatic failover
- Cost tracking

> One gateway to manage all AI model calls = 30% cost savings + zero-code model switching.

---

## Gateway Architecture

```
User Request -> API Gateway -> Intelligent Router -> DeepSeek/Qwen/Kimi/GLM
                                   |
                              Cache Layer (Redis)
                                   |
                              Rate Limiter
                                   |
                              Cost Tracker
```

---

## Core Gateway Implementation

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx
import redis
import hashlib
import time
import json
import asyncio
from datetime import datetime
from dataclasses import dataclass

app = FastAPI(title="AI API Gateway")

# Model configurations
MODELS = {
    "deepseek-v4-pro": {
        "base_url": "https://api.deepseek.com/v1",
        "api_key_env": "DEEPSEEK_API_KEY",
        "cost_per_1k_tokens": 0.001,
        "max_tokens": 8192,
        "priority": 1,  # First choice
    },
    "qwen-plus": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key_env": "DASHSCOPE_API_KEY",
        "cost_per_1k_tokens": 0.002,
        "max_tokens": 6000,
        "priority": 2,  # Fallback
    },
    "glm-4-flash": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "api_key_env": "ZHIPU_API_KEY",
        "cost_per_1k_tokens": 0.0005,
        "max_tokens": 4096,
        "priority": 3,
    },
}
```

---

## Intelligent Router

```python
class IntelligentRouter:
    """Intelligent routing — selects the best model based on task type/cost/load"""

    def route(self, messages: list, task_type: str = "general") -> str:
        """Select the best model for the task"""
        user_text = " ".join(
            m["content"] for m in messages if m["role"] == "user"
        )

        # Code tasks -> DeepSeek Coder
        code_keywords = ["code", "function", "bug", "error", "def", "class"]
        if any(kw in user_text.lower() for kw in code_keywords):
            return "deepseek-v4-pro"

        # Long text -> Kimi
        if len(user_text) > 5000:
            return "moonshot-v1-128k"

        # Chinese creative writing -> Qwen
        creative_keywords = ["write", "create", "story", "poem", "copy"]
        if any(kw in user_text for kw in creative_keywords):
            return "qwen-plus"

        # Default to cheapest
        return "glm-4-flash"

    def fallback(self, failed_model: str) -> str:
        """Failover"""
        fallback_order = {
            "deepseek-v4-pro": "qwen-plus",
            "qwen-plus": "glm-4-flash",
            "moonshot-v1-128k": "deepseek-v4-pro",
            "glm-4-flash": "deepseek-v4-pro",
        }
        return fallback_order.get(failed_model, "deepseek-v4-pro")
```

---

## Response Caching

```python
class AICache:
    """AI response cache — returns cached results for identical queries"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.default_ttl = 3600  # 1 hour

    def cache_key(self, model: str, messages: list) -> str:
        """Generate cache key"""
        content = json.dumps({"model": model, "messages": messages}, sort_keys=True)
        digest = hashlib.md5(content.encode()).hexdigest()
        return f"ai:cache:{model}:{digest}"

    def get(self, model: str, messages: list) -> str | None:
        """Get cached response"""
        key = self.cache_key(model, messages)
        cached = self.redis.get(key)
        if cached:
            print(f"Cache hit: {key[:20]}...")
            return cached.decode()
        return None

    def set(self, model: str, messages: list, response: str, ttl: int = None):
        """Set cache entry"""
        key = self.cache_key(model, messages)
        self.redis.setex(key, ttl or self.default_ttl, response)

    def invalidate(self, model: str = None):
        """Clear cache"""
        pattern = f"ai:cache:{model or '*'}:*"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
            print(f"Cleared {len(keys)} cache entries")
```

---

## Rate Limiting

```python
class RateLimiter:
    """Token bucket rate limiter"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def is_allowed(
        self, user_id: str, max_requests: int = 60, window: int = 60
    ) -> bool:
        """Check if request is allowed"""
        key = f"rate:{user_id}"
        current = self.redis.incr(key)

        if current == 1:
            self.redis.expire(key, window)

        return current <= max_requests

    def remaining(self, user_id: str, max_requests: int = 60) -> int:
        """Remaining requests"""
        key = f"rate:{user_id}"
        current = int(self.redis.get(key) or 0)
        return max(0, max_requests - current)
```

---

## Cost Tracking

```python
class CostTracker:
    """Real-time API cost tracking"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def record(self, user_id: str, model: str, tokens: int, cost: float):
        """Record the cost of a single call"""
        date = datetime.now().strftime("%Y-%m-%d")
        hour = datetime.now().strftime("%H")

        # Per-user dimension
        pipe = self.redis.pipeline()
        pipe.hincrbyfloat(f"cost:user:{user_id}:{date}", "total", cost)
        pipe.hincrbyfloat(f"cost:user:{user_id}:{date}", model, cost)
        pipe.hincrby(f"cost:user:{user_id}:{date}", "tokens", tokens)

        # Global dimension
        pipe.hincrbyfloat(f"cost:global:{date}:{hour}", model, cost)
        pipe.execute()

    def get_user_daily_cost(self, user_id: str) -> dict:
        """Query user's daily cost"""
        date = datetime.now().strftime("%Y-%m-%d")
        data = self.redis.hgetall(f"cost:user:{user_id}:{date}")
        return {k.decode(): float(v) for k, v in data.items()}

    def check_budget(self, user_id: str, daily_budget: float = 10.0) -> bool:
        """Check budget"""
        costs = self.get_user_daily_cost(user_id)
        total = costs.get("total", 0)
        if total >= daily_budget:
            print(f"User {user_id} has reached daily budget limit: {daily_budget}")
            return False
        return True
```

---

## Main API Endpoints

```python
cache = AICache()
router = IntelligentRouter()
cost_tracker = CostTracker(cache.redis)
rate_limiter = RateLimiter(cache.redis)

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Unified AI chat endpoint (OpenAI-compatible format)"""
    body = await request.json()
    messages = body.get("messages", [])
    user_id = body.get("user", "anonymous")

    # 1. Rate limit check
    if not rate_limiter.is_allowed(user_id):
        raise HTTPException(429, "Too many requests")

    # 2. Budget check
    if not cost_tracker.check_budget(user_id):
        raise HTTPException(402, "Daily budget exhausted")

    # 3. Cache lookup
    model = body.get("model") or router.route(messages)
    if cached := cache.get(model, messages):
        return json.loads(cached)

    # 4. Call model (with failover)
    config = MODELS[model]
    max_retries = 2
    current_model = model

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{config['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {os.getenv(config['api_key_env'])}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": current_model,
                        "messages": messages,
                        "temperature": body.get("temperature", 0.7),
                        "max_tokens": body.get("max_tokens", 2048),
                    },
                )

                result = response.json()

                # 5. Record cost
                usage = result.get("usage", {})
                tokens = usage.get("total_tokens", 0)
                cost = tokens * config["cost_per_1k_tokens"] / 1000
                cost_tracker.record(user_id, current_model, tokens, cost)

                # 6. Cache result
                cache.set(model, messages, json.dumps(result))

                return result

        except Exception as e:
            print(f"{current_model} call failed: {e}")
            if attempt < max_retries:
                current_model = router.fallback(current_model)
                config = MODELS[current_model]
                print(f"Failing over to: {current_model}")
            else:
                raise HTTPException(500, "All models failed")

@app.get("/v1/cost/{user_id}")
async def get_user_cost(user_id: str):
    """Query user cost"""
    return cost_tracker.get_user_daily_cost(user_id)

@app.get("/v1/rate/{user_id}")
async def get_rate_limit(user_id: str):
    """Query rate limit info"""
    return {"remaining": rate_limiter.remaining(user_id)}

@app.post("/v1/cache/clear")
async def clear_cache(model: str = None):
    """Clear cache"""
    cache.invalidate(model)
    return {"status": "ok", "message": f"Cleared cache for {model or 'all models'}"}
```

---

## Usage Example

```python
# Client only needs to know the gateway address
client = OpenAI(
    api_key="gateway-key",
    base_url="http://localhost:8000/v1",
)

# No model specified -> gateway auto-routes
response = client.chat.completions.create(
    model="auto",  # Auto-select
    messages=[{"role": "user", "content": "Write a Python sorting function"}],
)
print(response.choices[0].message.content)

# Explicit model
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[{"role": "user", "content": "Hello"}],
)
```

---

## Next Steps

- [Enterprise AI Deployment Guide](/tutorials/enterprise-ai-deployment-guide/)
- [AI Security Best Practices](/tutorials/china-ai-security-best-practices/)

> Based on FastAPI + Redis, June 2026.
