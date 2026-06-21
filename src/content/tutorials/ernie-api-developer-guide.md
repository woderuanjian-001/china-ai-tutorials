---
title: "Baidu ERNIE API Complete Guide: Python Integration and Enterprise Deployment"
description: "Complete tutorial for Baidu ERNIE 4.5 API: Python SDK calls, Function Calling, plugin system, search augmentation, and enterprise deployment. Full hands-on code for the Qianfan platform."
category: "Baidu AI"
date: 2026-06-20
tags: ["Baidu", "ERNIE", "Python", "Enterprise", "Plugins"]
level: "Beginner"
---

## What This Tutorial Covers

You will master the complete usage of the Baidu ERNIE API:

- Qianfan platform registration and configuration
- ERNIE 4.5 / ERNIE Speed / ERNIE Lite model selection
- Three Python SDK calling methods
- Function Calling + search augmentation
- Plugin system and enterprise deployment
- Cost optimization strategies

> 🎯 Baidu ERNIE has the highest market share in China with the strongest Chinese language understanding (leading in classical texts, idioms, finance, and legal domains). The Qianfan platform provides the most comprehensive enterprise AI application infrastructure.

---

## Step 1: Meet the Baidu AI Model Family

### Core Models

| Model | Type | Context | Characteristics | Price (per 1K tokens) |
|------|------|--------|------|-------------------|
| **ERNIE 4.5** | Flagship | 128K | Strongest Chinese comprehension, knowledge-enhanced | ¥0.12 |
| **ERNIE 4.0 Turbo** | Flagship | 128K | High-performance reasoning | ¥0.08 |
| **ERNIE Speed** | Fast | 8K | Low latency, high concurrency | ¥0.004 |
| **ERNIE Lite** | Lightweight | 8K | Generous free tier | **Free** |
| **ERNIE Tiny** | Ultra-light | 4K | Extremely low cost | ¥0.001 |
| **ERNIE Character** | Role-play | 8K | Emotional conversation | ¥0.012 |

> 💡 The Qianfan platform also provides **text-to-image (ERNIE-ViLG)**, **speech synthesis**, **document parsing**, and more.

---

## Step 2: Get Your API Key

1. Visit the [Qianfan Platform](https://console.bce.baidu.com/qianfan/) and sign up
2. Complete real-name verification (Chinese phone number / enterprise verification)
3. Create an application → get your **API Key** + **Secret Key**
4. Set environment variables:

```bash
export QIANFAN_AK="Your-API-Key"
export QIANFAN_SK="Your-Secret-Key"
```

New users receive substantial free credits. ERNIE Lite is completely free.

---

## Step 3: Install SDK and Basic Usage

```bash
pip install qianfan
```

### Basic Chat

```python
import qianfan
import os

# Use IAM authentication
chat = qianfan.ChatCompletion(
    ak=os.getenv("QIANFAN_AK"),
    sk=os.getenv("QIANFAN_SK"),
)

response = chat.do(
    model="ernie-4.5-8k",  # Or "ernie-speed-8k", "ernie-lite-8k"
    messages=[
        {"role": "system", "content": "You are a senior Python developer"},
        {"role": "user", "content": "Implement a thread-safe LRU cache in Python"}
    ],
    temperature=0.7,
    top_p=0.8,
)

print(response["result"])
```

### Streaming Output

```python
response = chat.do(
    model="ernie-speed-8k",
    messages=[{"role": "user", "content": "Describe three key stages in the development of China's AI industry"}],
    stream=True,
)

for chunk in response:
    print(chunk["result"], end="", flush=True)
```

---

## Step 4: Function Calling (Tool Invocation)

```python
import json

# Define tools
tools = [{
    "type": "function",
    "function": {
        "name": "get_stock_price",
        "description": "Query real-time A-share stock prices",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Stock ticker, e.g., 600519 (Kweichow Moutai)"
                }
            },
            "required": ["code"]
        }
    }
}]

def get_stock_price(code: str) -> dict:
    """Simulated stock query (use East Money / Sina API in production)"""
    stocks = {
        "600519": {"name": "Kweichow Moutai", "price": 1688.50, "change": "+2.3%"},
        "000858": {"name": "Wuliangye", "price": 156.80, "change": "-0.5%"},
        "300750": {"name": "CATL", "price": 228.00, "change": "+5.1%"},
    }
    return stocks.get(code, {"error": "Stock not found"})

def chat_with_tools(user_query: str) -> str:
    response = chat.do(
        model="ernie-4.5-8k",
        messages=[{"role": "user", "content": user_query}],
        tools=tools,
    )

    msg = response.body["choices"][0]["message"]

    if "function_call" not in msg:
        return msg["content"]

    func_call = msg["function_call"]
    func_name = func_call["name"]
    func_args = json.loads(func_call["arguments"])

    print(f"🔧 Calling: {func_name}({func_args})")

    if func_name == "get_stock_price":
        result = get_stock_price(**func_args)

    # Return the result to the AI
    second_response = chat.do(
        model="ernie-4.5-8k",
        messages=[
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": None, "function_call": func_call},
            {"role": "function", "name": func_name, "content": json.dumps(result, ensure_ascii=False)},
        ],
    )

    return second_response["result"]

print(chat_with_tools("What's the current price of Kweichow Moutai? Has it gone up?"))
```

---

## Step 5: Search Augmentation (Real-Time Info)

The Qianfan platform has built-in web search capability:

```python
response = chat.do(
    model="ernie-4.5-8k",
    messages=[{"role": "user", "content": "What are today's latest tech news?"}],
    system="You are a news summary assistant. Answer based on search results.",
    enable_citation=True,  # 🔑 Enable search augmentation
    search_info={"search_mode": "auto"},
)

print(response["result"])
# Search results return citation sources
if "search_info" in response:
    for ref in response["search_info"].get("search_results", []):
        print(f"📎 {ref['title']}: {ref['url']}")
```

---

## Step 6: OpenAI Compatibility Mode

Qianfan also supports OpenAI SDK compatibility:

```bash
pip install openai
```

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("QIANFAN_AK"),
    base_url="https://qianfan.baidubce.com/v2",
)

response = client.chat.completions.create(
    model="ernie-speed-8k",
    messages=[{"role": "user", "content": "Describe autumn in Beijing using a classical Chinese poem"}],
    temperature=0.9,
)

print(response.choices[0].message.content)
```

---

## Step 7: Text-to-Image

```python
from qianfan.resources import Image2Text

# Text-to-image
i2t = Image2Text()
response = i2t.do(
    prompt="A cute orange tabby cat sitting beneath the red walls of the Forbidden City, sunlight filtering through ginkgo leaves, oil painting style",
    model="stable-diffusion-xl",
    size="1024x1024",
    n=1,
)

print(response["data"][0]["url"])
```

---

## Step 8: Cost Optimization

### Model Selection Strategy

| Scenario | Recommended Model | Cost |
|------|---------|------|
| Dev/Test | ERNIE Lite | **Free** |
| High-concurrency API | ERNIE Speed | ¥0.004/1K tokens |
| Complex analysis | ERNIE 4.5 | ¥0.12/1K tokens |
| Lightweight tasks | ERNIE Tiny | ¥0.001/1K tokens |

### Optimization Tips

```python
# 1. Use System Prompt caching (supported by Qianfan)
# 2. Limit max_tokens to avoid waste
response = chat.do(
    model="ernie-speed-8k",
    messages=[{"role": "user", "content": "Summarize this article"}],
    max_output_tokens=512,  # Limit output length
    temperature=0.3,        # Lower temperature for creative tasks
)

# 3. Use async for batch processing
import asyncio
from qianfan import AsyncChatCompletion

async def batch_process(prompts: list[str]) -> list[str]:
    async_chat = AsyncChatCompletion()
    tasks = [
        async_chat.ado(
            model="ernie-speed-8k",
            messages=[{"role": "user", "content": p}],
        )
        for p in prompts
    ]
    results = await asyncio.gather(*tasks)
    return [r["result"] for r in results]

prompts = ["Explain machine learning", "Explain deep learning", "Explain reinforcement learning"]
results = asyncio.run(batch_process(prompts))
```

---

## Pricing Quick Reference

| Model | Input (¥/1K tokens) | Output (¥/1K tokens) |
|------|------------------|------------------|
| ERNIE 4.5 | 0.12 | 0.12 |
| ERNIE 4.0 Turbo | 0.08 | 0.08 |
| ERNIE Speed | 0.004 | 0.004 |
| ERNIE Lite | **0** | **0** |
| ERNIE Tiny | 0.001 | 0.001 |
| ERNIE Character | 0.012 | 0.012 |

---

## Comparison with Other Models

| Dimension | ERNIE 4.5 | DeepSeek V4 | Qwen3 |
|------|-----------|-------------|-------|
| Chinese comprehension | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Coding ability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Knowledge breadth | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| API pricing | Moderate | Low | Moderate |
| Enterprise ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

> ERNIE's strengths are deep Chinese language understanding, enterprise ecosystem (Qianfan platform), and search augmentation. Its coding ability is not as strong as DeepSeek's, but it's irreplaceable for Chinese-language scenarios.

---

## FAQ

### Q: How do I choose between ERNIE and DeepSeek?

**A**: Choose ERNIE for Chinese knowledge-intensive tasks (legal/finance/classical texts); choose DeepSeek for coding/math/reasoning; choose Qwen for multimodal needs.

### Q: Is the Qianfan platform's free tier sufficient?

**A**: ERNIE Lite is completely free, and ERNIE Speed has generous free credits. Individual developers generally don't need to pay.

---

## Next Steps

- [DeepSeek API Beginner Guide](/tutorials/deepseek-api-beginner-guide/)
- [China AI Models Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/)

> 📝 Based on Baidu Qianfan platform latest version tested in June 2026.
