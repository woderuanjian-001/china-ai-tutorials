---
title: "Deploying Open-Source Chinese AI Models Locally: Ollama/vLLM/Docker Complete Guide"
description: "Local deployment of open-source Chinese AI models in practice: DeepSeek/Qwen/GLM local execution, Ollama one-click deployment, vLLM high-performance inference, Docker containerization. Includes hardware recommendations and performance optimization."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Open Source", "Local Deployment", "Ollama", "vLLM", "Docker", "DeepSeek", "Expert"]
level: "Expert"
---

## What Problem Does This Tutorial Solve?

You will learn to deploy open-source Chinese AI models locally:

- Ollama one-click deployment of DeepSeek / Qwen
- vLLM high-performance inference serving
- Docker complete containerization
- Hardware configuration recommendations
- Performance optimization in practice

> 🎯 Data stays local, no API fees, no network dependency, full control. Local deployment = privacy + free + low latency.

---

## Why Deploy Locally?

| Dimension | Cloud API | Local Deployment |
|-----------|-----------|------------------|
| Data Security | ⚠️ Data uploaded to cloud | ✅ Data never leaves local |
| Cost | Pay per token | One-time hardware investment |
| Latency | 200-800ms | 10-50ms |
| Control | ⚠️ Model may update unexpectedly | ✅ Version locking |
| Network Dependency | ❌ Internet required | ✅ Offline capable |
| Maintenance | ✅ Zero maintenance | ⚠️ Requires maintenance |

---

## Step 1: Hardware Recommendations

### Minimum Requirements

| Model Size | GPU VRAM | RAM | Disk | Budget |
|------------|----------|-----|------|--------|
| 1.5B (Qwen2.5-1.5B) | 4GB | 8GB | 10GB | Any computer |
| 7B (DeepSeek-7B) | 8GB | 16GB | 20GB | ~$700 |
| 14B (Qwen2.5-14B) | 16GB | 32GB | 30GB | ~$2,100 |
| 72B (Qwen2.5-72B) | 48GB (dual GPU) | 64GB | 80GB | ~$7,000 |

### GPU Recommendations

| GPU | VRAM | Supported Models | Price | Rating |
|-----|------|------------------|-------|--------|
| RTX 3060 12GB | 12GB | 7B Q4 | ~$280 | ⭐⭐⭐ |
| RTX 4060 Ti 16GB | 16GB | 7B Q8, 14B Q4 | ~$500 | ⭐⭐⭐⭐ |
| RTX 4090 24GB | 24GB | 14B Q8, 34B Q4 | ~$1,800 | ⭐⭐⭐⭐⭐ |
| MacBook M2 Max 64GB | Unified 64GB | 34B Q8 | ~$2,800 | ⭐⭐⭐⭐ |
| A100 80GB | 80GB | 72B Q8 | ~$11,000 | 🏢 Enterprise |

---

## Step 2: Ollama One-Click Deployment

Ollama is the simplest way to deploy locally — a single command launches a model.

```bash
# Install Ollama
# Windows: https://ollama.com/download/windows
# Mac: https://ollama.com/download/mac
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# Download and run the DeepSeek series
ollama run deepseek-r1:7b       # DeepSeek R1 7B
ollama run deepseek-coder:6.7b  # DeepSeek Coder
ollama run deepseek-v3:7b       # DeepSeek V3

# Download and run the Qwen series
ollama run qwen2.5:7b           # Qwen 2.5 7B
ollama run qwen2.5:14b          # Qwen 2.5 14B
ollama run qwen2.5-coder:7b     # Qwen Coder
ollama run qwen2:72b            # Qwen 72B (large VRAM required!)

# Download and run GLM
ollama run glm4:9b              # ChatGLM-4 9B

# List installed models
ollama list

# Start API server (OpenAI-format compatible)
ollama serve
# API address: http://localhost:11434
```

### Ollama API Calling

```python
from openai import OpenAI

# Ollama is OpenAI API compatible!
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # Ollama does not require a real key
)

response = client.chat.completions.create(
    model="deepseek-r1:7b",
    messages=[{"role": "user", "content": "Explain artificial intelligence in three sentences"}],
    temperature=0.7,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### Ollama Modelfile Customization

```bash
# Create a custom model
cat > Modelfile << 'EOF'
FROM deepseek-r1:7b

# Set system prompt
SYSTEM """You are my personal coding assistant.
Style: concise, practical, code-first.
Default language: Python."""

# Set parameters
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
EOF

# Build custom model
ollama create my-coder -f Modelfile

# Run custom model
ollama run my-coder
```

---

## Step 3: vLLM High-Performance Inference

vLLM is the production-grade inference engine of choice, with 5-10x the throughput of Ollama.

```bash
# Install
pip install vllm
```

```python
# vllm_serve.py — vLLM inference server
from vllm import LLM, SamplingParams
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

# Initialize model
print("Loading model...")
llm = LLM(
    model="deepseek-ai/deepseek-llm-7b-chat",
    tensor_parallel_size=1,      # Number of GPUs
    dtype="float16",             # Precision
    max_model_len=4096,          # Max context length
    gpu_memory_utilization=0.9,  # VRAM utilization ratio
    trust_remote_code=True,
)

sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.95,
    max_tokens=2048,
)

# FastAPI service
app = FastAPI(title="Local AI Inference Service")

class ChatRequest(BaseModel):
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int = 1024

@app.post("/v1/chat/completions")
async def chat(request: ChatRequest):
    # Build prompt
    prompt = ""
    for msg in request.messages:
        role = msg["role"]
        content = msg["content"]
        if role == "system":
            prompt += f"<|system|>\n{content}</s>\n"
        elif role == "user":
            prompt += f"<|user|>\n{content}</s>\n"
        elif role == "assistant":
            prompt += f"<|assistant|>\n{content}</s>\n"
    prompt += "<|assistant|>\n"

    # Inference
    outputs = llm.generate(
        [prompt],
        SamplingParams(
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        ),
    )

    return {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": outputs[0].outputs[0].text,
            }
        }]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### vLLM Performance Optimization

```python
# Optimized configuration
llm = LLM(
    model="deepseek-ai/deepseek-llm-7b-chat",
    # VRAM optimization
    gpu_memory_utilization=0.92,     # Use as much VRAM as possible
    max_num_batched_tokens=8192,     # Batch token count
    max_num_seqs=32,                 # Max concurrent sequences

    # Acceleration options
    enforce_eager=False,             # Enable CUDA graph
    enable_prefix_caching=True,      # Prefix caching (saves computation for shared prefixes)

    # Quantization (optional, reduces VRAM)
    # quantization="awq",            # AWQ quantization
)
```

---

## Step 4: Docker Containerized Deployment

```dockerfile
# Dockerfile
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y python3.10 python3-pip
RUN pip3 install vllm fastapi uvicorn

# Copy code
WORKDIR /app
COPY vllm_serve.py .

# Expose port
EXPOSE 8000

# Start service
CMD ["python3", "vllm_serve.py"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-server:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/models  # Model cache
      - ./vllm_serve.py:/app/vllm_serve.py
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
```

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Test
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

---

## Step 5: Quantization — Save VRAM

```python
# Use llama.cpp for GGUF quantization
"""
Install: pip install llama-cpp-python
"""

from llama_cpp import Llama

# Load quantized model
llm = Llama(
    model_path="./qwen2.5-7b-instruct-q4_k_m.gguf",
    n_ctx=4096,          # Context length
    n_gpu_layers=-1,     # All layers on GPU (-1 = all)
    n_threads=8,         # CPU thread count
)

# Inference
output = llm(
    "Q: What is RAG?\nA:",
    max_tokens=256,
    temperature=0.7,
    stop=["Q:", "\n"],
)

print(output["choices"][0]["text"])
```

### Quantization Precision Comparison

| Quantization Level | Model Size | Quality Loss | Recommended Scenario |
|--------------------|------------|--------------|----------------------|
| FP16 (no quantization) | 100% | 0% | Sufficient VRAM available |
| Q8_0 | 50% | <0.1% | Nearly lossless |
| Q4_K_M | 25% | <1% | **Recommended** — best balance |
| Q2_K | 16% | 3-5% | Extreme VRAM saving |
| Q4_0 | 25% | 1-2% | Legacy format |

---

## Step 6: Performance Benchmarking

```python
import time
import concurrent.futures
import statistics

def benchmark_llm(api_url: str, prompt: str, concurrency: int = 1):
    """Benchmark local model"""

    def single_request():
        start = time.time()
        response = client.chat.completions.create(
            model="deepseek-r1:7b",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        latency = time.time() - start
        return {
            "latency": latency,
            "tokens": response.usage.completion_tokens,
        }

    # Concurrency test
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(single_request) for _ in range(100)]
        results = [f.result() for f in futures]

    latencies = [r["latency"] for r in results]
    tokens = [r["tokens"] for r in results]

    print(f"Concurrency: {concurrency}")
    print(f"Total requests: {len(results)}")
    print(f"Average latency: {statistics.mean(latencies)*1000:.0f}ms")
    print(f"P99 latency: {sorted(latencies)[-1]*1000:.0f}ms")
    print(f"Total tokens: {sum(tokens)}")
    print(f"Throughput: {len(results)/sum(latencies):.1f} req/s")

# Test different concurrency levels
for c in [1, 4, 8, 16]:
    benchmark_llm("http://localhost:11434", "Introduce artificial intelligence", c)
    print()
```

---

## Complete Solution Comparison

| Solution | Difficulty | Performance | Use Case |
|----------|------------|-------------|----------|
| **Ollama** | ⭐ Very easy | ⭐⭐ | Personal use, dev/test |
| **vLLM** | ⭐⭐ Moderate | ⭐⭐⭐⭐⭐ | Production, high concurrency |
| **Docker + vLLM** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Containerized deployment, microservices |
| **llama.cpp** | ⭐⭐ | ⭐⭐⭐ | CPU inference, low-spec machines |
| **Text Generation Inference** | ⭐⭐ | ⭐⭐⭐⭐ | HuggingFace ecosystem |

---

## FAQ

### Q: Can my office laptop (no discrete GPU) run these?

**A**: Yes. Use Ollama + CPU mode to run 1.5B-7B quantized models. Response speed is about 2-8 tokens per second — acceptable.

### Q: Do local models perform the same as API versions?

**A**: Quantized models (Q4) have approximately 1% quality degradation, imperceptible in most scenarios. FP16 versions are completely identical.

---

## Next Steps

- [DeepSeek API Beginner Guide](/tutorials/deepseek-api-beginner-guide/)
- [DeepSeek Fine-Tuning Guide](/tutorials/deepseek-fine-tuning-guide/)

> 📝 Based on Ollama/vLLM/Docker + DeepSeek/Qwen/GLM, tested June 2026.
