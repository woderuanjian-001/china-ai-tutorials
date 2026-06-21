---
title: "Chinese AI Model Performance Benchmarking: Latency, Throughput & Concurrency Full Comparison"
description: "Practical AI model performance benchmarking: complete comparison of DeepSeek/Qwen/Kimi/GLM across latency (Time to First Token), throughput (Tokens/s), and concurrency capacity. Includes Python benchmarking scripts and visualizations."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Benchmark", "Performance", "Latency", "Throughput", "Comparison", "Evaluation", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will make data-driven model selection decisions for your AI applications:

- Time to First Token (TTFT) latency comparison
- Generation speed (Tokens/s) comparison
- Concurrency capacity testing
- Long-text performance degradation analysis
- Visualized results comparison

> 🎯 "Which model to choose" cannot be based on gut feeling. Use data to make the right architectural decisions.

---

## Benchmark Metrics

| Metric | Meaning | Impact |
|--------|---------|--------|
| **TTFT** | Time to First Token | User-perceived response speed |
| **TPS** | Tokens Per Second | Output generation speed |
| **TPOT** | Time Per Output Token | Average time per generated token |
| **TOTAL** | Total response time | Total time from request to completion |
| **CONCURRENCY** | Concurrent processing capacity | Number of simultaneous users supported |

---

## Benchmark Framework

```python
import time
import statistics
import concurrent.futures
from dataclasses import dataclass
from openai import OpenAI
import matplotlib.pyplot as plt
import json
import os

@dataclass
class BenchmarkResult:
    """Single benchmark result"""
    model: str
    ttft: float  # Time to First Token (seconds)
    total_time: float  # Total time
    output_tokens: int
    prompt_tokens: int
    tokens_per_second: float
    time_per_token: float  # ms/token

    def __repr__(self):
        return (
            f"{self.model}: TTFT={self.ttft:.2f}s, TPS={self.tokens_per_second:.1f}, "
            f"Output={self.output_tokens} tokens, Total={self.total_time:.2f}s"
        )
```

---

## Model Configuration

```python
MODELS = {
    "deepseek-v4-pro": {
        "name": "DeepSeek V4 Pro",
        "base_url": "https://api.deepseek.com/v1",
        "api_key_env": "DEEPSEEK_API_KEY",
    },
    "qwen-plus": {
        "name": "Qwen Plus",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key_env": "DASHSCOPE_API_KEY",
    },
    "moonshot-v1-8k": {
        "name": "Kimi (Moonshot)",
        "base_url": "https://api.moonshot.cn/v1",
        "api_key_env": "MOONSHOT_API_KEY",
    },
    "glm-4-flash": {
        "name": "GLM-4 Flash",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "api_key_env": "ZHIPU_API_KEY",
    },
}
```

---

## Single Performance Test

```python
def run_single_benchmark(
    model_key: str,
    prompt: str,
    max_tokens: int = 1024,
) -> BenchmarkResult:
    """Run a complete performance benchmark on a single model"""
    config = MODELS[model_key]

    client = OpenAI(
        api_key=os.getenv(config["api_key_env"]),
        base_url=config["base_url"],
    )

    start_time = time.time()
    first_token_time = None
    output_text = ""

    # Stream call to accurately measure first token
    stream = client.chat.completions.create(
        model=model_key,
        messages=[
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.7,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            if first_token_time is None:
                first_token_time = time.time()
            output_text += chunk.choices[0].delta.content

    end_time = time.time()

    # Token count (simplified estimate; use tiktoken in production)
    output_tokens = len(output_text) * 1.5  # Chinese ~1.5 chars/token
    prompt_tokens = len(prompt) * 1.5

    return BenchmarkResult(
        model=config["name"],
        ttft=first_token_time - start_time if first_token_time else float("inf"),
        total_time=end_time - start_time,
        output_tokens=int(output_tokens),
        prompt_tokens=int(prompt_tokens),
        tokens_per_second=output_tokens / (end_time - start_time) if end_time > start_time else 0,
        time_per_token=(end_time - start_time) / output_tokens * 1000 if output_tokens > 0 else 0,
    )
```

---

## Multi-Round Benchmark + Statistical Analysis

```python
def run_repeated_benchmark(
    model_key: str,
    prompt: str,
    iterations: int = 10,
) -> dict:
    """Run multi-round benchmark on a single model, compute statistics"""
    results = []

    for i in range(iterations):
        print(f"  [{model_key}] Round {i+1}/{iterations}...")
        result = run_single_benchmark(model_key, prompt)
        results.append(result)
        time.sleep(1)  # Avoid triggering rate limits

    # Statistical analysis
    ttfts = [r.ttft for r in results]
    tps_list = [r.tokens_per_second for r in results]
    total_times = [r.total_time for r in results]

    return {
        "model": MODELS[model_key]["name"],
        "iterations": iterations,
        "ttft": {
            "mean": statistics.mean(ttfts),
            "median": statistics.median(ttfts),
            "p95": sorted(ttfts)[int(len(ttfts) * 0.95)],
            "stdev": statistics.stdev(ttfts) if len(ttfts) > 1 else 0,
        },
        "tps": {
            "mean": statistics.mean(tps_list),
            "median": statistics.median(tps_list),
            "p95": sorted(tps_list)[int(len(tps_list) * 0.95)],
        },
        "total_time": {
            "mean": statistics.mean(total_times),
            "median": statistics.median(total_times),
        },
        "raw_results": results,
    }
```

---

## Concurrency Test

```python
def run_concurrency_test(
    model_key: str,
    prompt: str,
    concurrency: int,
) -> dict:
    """Test model performance at a specific concurrency level"""
    config = MODELS[model_key]
    client = OpenAI(
        api_key=os.getenv(config["api_key_env"]),
        base_url=config["base_url"],
    )

    def single_request(index: int) -> dict:
        """Single request"""
        start = time.time()
        try:
            response = client.chat.completions.create(
                model=model_key,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=512,
                temperature=0,
            )
            elapsed = time.time() - start
            return {
                "index": index,
                "success": True,
                "time": elapsed,
                "tokens": response.usage.total_tokens,
            }
        except Exception as e:
            return {
                "index": index,
                "success": False,
                "error": str(e),
                "time": time.time() - start,
            }

    # Concurrent execution
    results = []
    start_time = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(single_request, i)
            for i in range(concurrency)
        ]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    total_time = time.time() - start_time
    success_count = sum(1 for r in results if r["success"])
    success_times = [r["time"] for r in results if r["success"]]

    return {
        "model": config["name"],
        "concurrency": concurrency,
        "total_time": total_time,
        "success_rate": success_count / concurrency,
        "avg_response": statistics.mean(success_times) if success_times else 0,
        "p95_response": sorted(success_times)[int(len(success_times) * 0.95)] if success_times else 0,
        "requests_per_second": concurrency / total_time,
    }
```

---

## Full Benchmark Run

```python
def run_full_benchmark():
    """Run complete model benchmark"""
    prompts = {
        "short": "Write a bubble sort function in Python",
        "medium": "Explain the differences between REST API and GraphQL, describe their use cases, and provide code examples",
        "long": "Provide a detailed analysis of the Chinese AI industry trends from 2025 to 2026, including: 1) Large model competitive landscape 2) AI application deployment 3) Policy and regulation 4) Investment and financing 5) Talent market. At least 200 words of analysis for each aspect.",
    }

    all_results = {}

    for prompt_type, prompt in prompts.items():
        print(f"\n{'='*60}")
        print(f"📝 Benchmark type: {prompt_type} ({len(prompt)} characters)")
        print(f"{'='*60}")

        all_results[prompt_type] = {}

        for model_key in MODELS:
            print(f"\n🔍 Testing {MODELS[model_key]['name']}...")
            result = run_repeated_benchmark(model_key, prompt, iterations=5)
            all_results[prompt_type][model_key] = result

            print(f"  TTFT mean: {result['ttft']['mean']:.2f}s")
            print(f"  TPS mean: {result['tps']['mean']:.1f}")
            print(f"  Total time mean: {result['total_time']['mean']:.2f}s")

    return all_results
```

---

## Visualization

```python
def visualize_results(all_results: dict):
    """Visualize benchmark results"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Chinese AI Model Performance Comparison", fontsize=16, fontweight="bold")

    models = [m["name"] for m in MODELS.values()]
    colors = ["#E8563A", "#4ECDC4", "#F5A623", "#6C5CE7"]

    for prompt_type, results in all_results.items():
        # Extract TTFT and TPS
        ttft_means = [results[m]["ttft"]["mean"] for m in results]
        tps_means = [results[m]["tps"]["mean"] for m in results]

        print(f"\n📊 {prompt_type}:")
        for i, model in enumerate(models):
            print(f"  {model}: TTFT={ttft_means[i]:.2f}s, TPS={tps_means[i]:.1f}")

    # TTFT comparison bar chart
    ax1 = axes[0, 0]
    prompt_types = list(all_results.keys())
    x = range(len(MODELS))
    width = 0.25

    for i, pt in enumerate(prompt_types):
        ttft = [all_results[pt][m]["ttft"]["mean"] for m in all_results[pt]]
        ax1.bar([xi + i*width for xi in x], ttft, width, label=pt)

    ax1.set_title("TTFT Comparison (seconds)")
    ax1.set_xticks([xi + width for xi in x])
    ax1.set_xticklabels(models, rotation=15)
    ax1.legend()
    ax1.set_ylabel("Seconds")

    # TPS comparison bar chart
    ax2 = axes[0, 1]
    for i, pt in enumerate(prompt_types):
        tps = [all_results[pt][m]["tps"]["mean"] for m in all_results[pt]]
        ax2.bar([xi + i*width for xi in x], tps, width, label=pt)

    ax2.set_title("TPS Comparison (tokens/sec)")
    ax2.set_xticks([xi + width for xi in x])
    ax2.set_xticklabels(models, rotation=15)
    ax2.legend()
    ax2.set_ylabel("tokens/sec")

    plt.tight_layout()
    plt.savefig("benchmark_results.png", dpi=150)
    plt.show()

    print("\n📈 Chart saved: benchmark_results.png")
```

---

## Decision Matrix

Based on benchmark results, recommendations by scenario:

| Scenario | Recommended Model | Key Metric |
|----------|------------------|------------|
| Chatbot | DeepSeek V4 | TTFT < 0.5s |
| Code Generation | DeepSeek Coder | TPS > 80 |
| Long Document Analysis | Kimi K2 | 128K context |
| Low-Cost Batch | GLM-4 Flash | $0.001/1K tokens |
| Multilingual Translation | Qwen Plus | Multi-language accuracy |

---

## FAQ

### Q: Why do benchmark results vary for the same model each time?

**A**: Network fluctuations, server load, model randomness, and other factors all affect results. That's why you should run multiple rounds and use statistics rather than testing only once.

### Q: What to do when free quota runs out?

**A**: You can use local Ollama models as a baseline comparison. Be sure to note the "local/cloud" difference.

---

## Next Steps

- [Chinese AI Model Pricing Comparison](/tutorials/china-ai-model-pricing-comparison/)
- [AI Coding Assistant Comparison](/tutorials/ai-coding-assistant-comparison/)

> 📝 Benchmarked June 2026. Results may vary with API version updates.
