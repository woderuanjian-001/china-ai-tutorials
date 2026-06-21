---
title: "Ollama Deep Dive: Local Chinese AI Model Optimization and GPU Acceleration with Qwen and DeepSeek"
description: "Advanced Ollama guide for Chinese AI models: Modelfile customization, GPU layer tuning, quantization comparison (Q4/Q8/FP16), API concurrency, multi-model orchestration with Qwen and DeepSeek local deployment best practices."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Ollama", "Local Models", "GPU", "Quantization", "Modelfile", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will take Ollama from "it runs" to "it runs well":

- Modelfile custom system prompts
- Precise GPU layer control
- Quantization precision comparison and selection
- Multi-model concurrent API service
- Performance monitoring and optimization

> 🎯 Local AI = zero API fees + data never leaves your machine. Mastering Ollama tuning means mastering the cost and privacy levers of AI applications.

---

## Modelfile Custom Models

### Basic Modelfile

```dockerfile
# Modelfile -- Create custom AI assistants

FROM qwen2.5:7b

# System prompt
SYSTEM """
You are a "Code Review Expert." When analyzing code, strictly follow:

1. Security first -- check for SQL injection/XSS/credential leaks
2. Performance -- N+1 queries/unreasonable caching/large data loops
3. Maintainability -- function length/nesting depth/naming conventions
4. Error handling -- proper try-catch/error propagation

Response format:
🔴 Critical: ...
🟡 Warning: ...
🟢 Suggestion: ...
"""

# Parameter presets
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

# Stop words
PARAMETER stop "<|endoftext|>"
PARAMETER stop "User:"

# Template (conversation format)
TEMPLATE """
{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}
<|user|>
{{ .Prompt }}<|end|>
<|assistant|>
{{ .Response }}<|end|>
"""
```

### Creating and Using

```bash
# Create a custom model from a Modelfile
ollama create code-reviewer -f Modelfile

# List custom models
ollama list

# Use the custom model
ollama run code-reviewer
```

### Chinese-Specific Modelfile

```dockerfile
# Chinese customer service assistant
FROM qwen2.5:14b

SYSTEM """
You are "Smart Customer Service Assistant." Response requirements:

1. Use Simplified Chinese with a warm, natural tone
2. If a question is beyond your scope, don't make things up -- direct the user to human support
3. For refunds/complaints/legal issues, provide official contact information
4. Keep responses concise, no more than 200 characters
5. Use emoji to make replies friendlier 😊
"""

PARAMETER temperature 0.5
PARAMETER repeat_penalty 1.1
PARAMETER num_predict 512
```

---

## Precise GPU Layer Control

```bash
# Fully on GPU (requires sufficient VRAM)
ollama run qwen2.5:7b --num-gpu 999

# Partially on GPU (when VRAM is limited)
ollama run qwen2.5:7b --num-gpu 20

# Fully on CPU (no GPU or debugging)
ollama run qwen2.5:7b --num-gpu 0
```

```python
# Control GPU layers via API
import requests

def run_with_gpu_config(model: str, prompt: str, gpu_layers: int):
    """Precise GPU usage control"""
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "options": {
                "num_gpu": gpu_layers,
                "num_thread": 8,  # CPU threads
            },
            "stream": False,
        },
    )
    return response.json()["response"]

# Test performance with different GPU configurations
for layers in [0, 10, 20, 35]:
    start = time.time()
    result = run_with_gpu_config("qwen2.5:7b", "用 Python 写一个快速排序", layers)
    elapsed = time.time() - start
    print(f"GPU layers {layers}: {elapsed:.2f}s")
```

---

## Quantization Precision Comparison

| Quantization Level | Model Size | VRAM Required | Quality Loss | Use Case |
|-------------------|------------|---------------|-------------|----------|
| **Q2_K** | Smallest | ~3GB | Noticeable | Barely runs |
| **Q4_K_M** (recommended) | Small | ~6GB | Minimal | Daily use |
| **Q5_K_M** | Medium | ~8GB | Nearly none | High quality needs |
| **Q8_0** | Larger | ~12GB | None | Near-original |
| **FP16** | Largest | ~16GB | Identical | Production/eval |

```python
# Compare output quality across quantization levels
models = [
    "qwen2.5:7b-q4_K_M",
    "qwen2.5:7b-q5_K_M",
    "qwen2.5:7b-q8_0",
]

prompt = "详细解释 TCP 三次握手的过程，并说明为什么需要三次而不是两次"

for model in models:
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "options": {"temperature": 0.1},
            "stream": False,
        },
    )
    result = response.json()
    print(f"\n{'='*50}")
    print(f"Model: {model}")
    print(f"Generation speed: {result['eval_count']/result['eval_duration']*1e9:.0f} tokens/s")
    print(f"Output length: {len(result['response'])} characters")
```

---

## Ollama API Concurrent Service

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import httpx
import asyncio
import json

app = FastAPI()

class OllamaPool:
    """Ollama model connection pool"""

    def __init__(self):
        self.base_url = "http://localhost:11434"
        self.semaphore = asyncio.Semaphore(3)  # Max concurrency

    async def chat(self, model: str, messages: list) -> dict:
        """Async chat (non-streaming)"""
        async with self.semaphore:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                    },
                )
                return response.json()

    async def chat_stream(self, model: str, messages: list):
        """Async streaming chat"""
        async with self.semaphore:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                    },
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            yield line

pool = OllamaPool()

@app.post("/v1/chat/completions")
async def chat_completions(request: dict):
    """OpenAI API format compatible"""
    messages = request.get("messages", [])
    model = request.get("model", "qwen2.5:7b")

    if request.get("stream"):
        return StreamingResponse(
            pool.chat_stream(model, messages),
            media_type="text/event-stream",
        )
    else:
        result = await pool.chat(model, messages)
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": result["message"]["content"],
                }
            }]
        }
```

---

## Multi-Model Orchestration Pipeline

```python
class MultiModelPipeline:
    """Multi-model pipeline -- use different models for different stages"""

    def __init__(self):
        self.base_url = "http://localhost:11434"

    def call_model(self, model: str, system: str, prompt: str) -> str:
        """Call a specific model"""
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "options": {"temperature": 0.3},
            },
        )
        return response.json()["message"]["content"]

    def generate_article(self, topic: str) -> dict:
        """Multi-model collaboration for article writing"""
        # Stage 1: Outline -- use a reasoning-strong model
        outline = self.call_model(
            "deepseek-r1:7b",
            "你是文章大纲规划师。只输出结构清晰的大纲。",
            f"为「{topic}」设计一个详细的大纲",
        )

        # Stage 2: Content -- use a Chinese-writing-strong model
        content = self.call_model(
            "qwen2.5:14b",
            "你是专业内容写手。根据大纲写出流畅的正文。",
            f"大纲:\n{outline}\n\n请写出完整的正文。",
        )

        # Stage 3: Proofread -- use a careful model
        proofread = self.call_model(
            "qwen2.5:7b",
            "你是严格的文章校对。检查错别字、逻辑、表达。",
            f"请校对以下文章，给出修改后的版本：\n\n{content}",
        )

        return {
            "outline": outline,
            "draft": content,
            "final": proofread,
        }

# Usage
pipeline = MultiModelPipeline()
article = pipeline.generate_article("2026年AI Agent发展趋势")
print(f"Outline: {len(article['outline'])} chars")
print(f"Draft: {len(article['draft'])} chars")
print(f"Final: {len(article['final'])} chars")
```

---

## Performance Monitoring

```python
import subprocess
import json

class OllamaMonitor:
    """Monitor Ollama runtime status"""

    def get_running_models(self) -> list:
        """View currently loaded models"""
        result = subprocess.run(
            ["ollama", "ps"],
            capture_output=True,
            text=True,
        )
        return result.stdout

    def get_gpu_usage(self) -> dict:
        """Query GPU usage"""
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu",
                 "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
            )
            parts = result.stdout.strip().split(", ")
            return {
                "gpu_util": parts[0],
                "mem_used": parts[1],
                "mem_total": parts[2],
                "temp": parts[3],
            }
        except FileNotFoundError:
            return {"error": "No NVIDIA GPU"}

    def benchmark_model(self, model: str, prompt: str, iterations: int = 5) -> dict:
        """Quick performance benchmark"""
        times = []
        tokens_per_sec = []

        for i in range(iterations):
            start = time.time()
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            elapsed = time.time() - start
            result = response.json()

            times.append(elapsed)
            tps = result["eval_count"] / (result["eval_duration"] / 1e9)
            tokens_per_sec.append(tps)

        return {
            "model": model,
            "avg_time": statistics.mean(times),
            "avg_tps": statistics.mean(tokens_per_sec),
            "min_time": min(times),
            "max_time": max(times),
        }

# Usage
monitor = OllamaMonitor()
print(monitor.get_running_models())
print(monitor.get_gpu_usage())

# Test different quantization levels
for model in ["qwen2.5:7b-q4_K_M", "qwen2.5:7b-q5_K_M", "qwen2.5:7b-q8_0"]:
    result = monitor.benchmark_model(model, "用200字介绍深度学习")
    print(f"{model}: {result['avg_tps']:.0f} tokens/s, {result['avg_time']:.2f}s")
```

---

## FAQ

### Q: My GPU only has 8GB VRAM. What models can I run?

**A**: You can run Qwen2.5:7b (Q4, ~6GB), DeepSeek-R1:7b (Q4, ~5GB), ChatGLM3:6b (Q4, ~5GB). Qwen2.5:14b requires 16GB VRAM.

### Q: Can Ollama load multiple models simultaneously?

**A**: Yes, but limited by VRAM + RAM. 16GB VRAM can load two 7B models simultaneously. Already-loaded models stay in memory when switching, so response is instant.

---

## Next Steps

- [Chinese AI Open-Source Deployment Guide](/tutorials/china-ai-open-source-deployment/)
- [AI Model Benchmarking Guide](/tutorials/ai-model-benchmark-guide/)

> 📝 Based on Ollama 0.5+ / Qwen2.5 / DeepSeek-R1, tested June 2026.
