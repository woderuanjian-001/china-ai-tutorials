---
title: "Xiaomi MiMo API Getting Started: 1M Ultra-Long Context + Coding Agent Guide"
description: "Complete Xiaomi MiMo V2.5 Pro API tutorial: multiple access paths, thinking mode, long-text processing, Agent development. 1M context, Claude Sonnet-level coding ability, priced at 2/5 of GPT-5.5."
category: "Xiaomi"
date: 2026-06-20
tags: ["Xiaomi", "MiMo", "API", "Agent", "Open Source", "Long Context"]
level: "Beginner"
---

## What This Tutorial Solves

You will master the complete usage of the Xiaomi MiMo large model:

- Three API access paths (Alibaba Cloud Bailian / Token Plan / third-party proxies)
- Correct use of Thinking mode
- 1M ultra-long context processing (contract analysis, long document RAG)
- Open-source model local deployment with vLLM
- Agent framework integration (Claude Code / Codex / OpenCode)

> 🎯 Xiaomi MiMo is led by "post-95 AI prodigy" Luo Fuli (formerly a core developer of DeepSeek-V2). MiMo-V2-Flash is reported to achieve strong results on the SWE-Bench coding benchmark, and is **open-sourced under the MIT license**.

---

## Step 1: Understanding the MiMo Model Family

Xiaomi began releasing the MiMo series in 2025, positioned as the AI infrastructure for the "people-car-home" ecosystem:

### Core Models

| Model | Architecture | Total Params | Active Params | Context | Key Feature |
|-------|-------------|-------------|---------------|---------|-------------|
| **MiMo-V2.5-Pro** | MoE | 1.02T | 42B | **1M** | Latest flagship, deep reasoning |
| **MiMo-V2.5** | MoE Multimodal | 310B | 15B | **1M** | Text + image + video + audio |
| **MiMo-V2-Flash** | MoE | 309B | 15B | 256K | **MIT open-source**, SOTA coding |
| **MiMo-V2-Omni** | MoE Multimodal | -- | -- | 256K | Full-modal understanding |
| **MiMo-V2.5-TTS** | Speech Synthesis | -- | -- | -- | Emotion control, dialects |
| **MiMo-V2.5-ASR** | Speech Recognition | -- | -- | -- | Chinese-English bilingual, noise-robust |

### Key Metrics

- **SWE-Bench Verified**: 73.4% (open-source #1, rivaling Claude Sonnet)
- **Inference Speed**: Approximately **3x** that of DeepSeek-V3.2
- **Long Context Retrieval**: 95%+ accuracy at 800K tokens depth
- **Pricing**: Input $1.00/M tokens (**2.5x cheaper** than GPT-5.5)

---

## Step 2: Obtaining API Access

There are currently three ways to access MiMo:

### Method A: Alibaba Cloud Bailian Platform (Mainland China only)

Access Xiaomi-direct models through Alibaba Cloud Bailian. Requires an API Key for the China North 2 (Beijing) region.

**API Base URL:**
```
https://dashscope.aliyuncs.com/compatible-mode/v1
```

**Getting a Key:**
1. Visit the [Alibaba Cloud Bailian Console](https://bailian.console.aliyun.com/)
2. Select the China North 2 (Beijing) region
3. Enable the "Xiaomi MiMo" model service
4. Create an API Key

### Method B: Xiaomi Token Plan Platform (Globally available)

Official subscription platform launched in 2026, with nodes in three regions:

| Region | OpenAI-Compatible Endpoint |
|--------|---------------------------|
| China (CN) | `https://token-plan-cn.xiaomimimo.com/v1` |
| Singapore (SGP) | `https://token-plan-sgp.xiaomimimo.com/v1` |
| Europe (AMS) | `https://token-plan-ams.xiaomimimo.com/v1` |

Registration: https://platform.xiaomimimo.com/console/plan-manage

### Method C: Third-Party Platforms

| Platform | Base URL | Model Name |
|----------|----------|------------|
| OpenRouter | `https://openrouter.ai/api/v1` | `xiaomi/mimo-v2.5-pro` |
| WaveSpeedAI | `https://llm.wavespeed.ai/v1` | `xiaomi/mimo-v2.5` |
| Vercel AI Gateway | Use Vercel SDK | `mimo-v2.5-pro` |

> 💡 **Platform recommendation**: Mainland China users should use Alibaba Cloud Bailian (low latency). Overseas users should use Token Plan or OpenRouter.

---

## Step 3: Basic API Calls

### OpenAI-Compatible Format (Universal method)

```bash
pip install openai
```

```python
from openai import OpenAI
import os

# Choose base_url based on your platform
client = OpenAI(
    api_key=os.getenv("MIMO_API_KEY"),
    base_url="https://token-plan-cn.xiaomimimo.com/v1",  # Token Plan CN
)

response = client.chat.completions.create(
    model="mimo-v2.5-pro",
    messages=[
        {"role": "system", "content": "You are a professional programming assistant"},
        {"role": "user", "content": "Write a binary search algorithm in Python, with comments"}
    ],
    temperature=1.0,  # MiMo recommends 1.0
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

### Alibaba Cloud Bailian Format

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

response = client.chat.completions.create(
    model="xiaomi/mimo-v2.5-pro",
    messages=[{"role": "user", "content": "Explain what the Transformer architecture is"}],
    extra_body={"enable_thinking": True},  # Thinking mode passed via extra_body
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## Step 4: Thinking Mode (Critical!)

MiMo's thinking mode is similar to DeepSeek's but has some important differences:

### Enabling Thinking

```python
response = client.chat.completions.create(
    model="mimo-v2.5-pro",
    messages=[
        {"role": "user", "content": "Prove that √2 is irrational"}
    ],
    max_tokens=4096,
    extra_body={"enable_thinking": True},  # Non-standard parameter, passed via extra_body
    stream=True,
)

reasoning = ""
answer = ""
is_answering = False

for chunk in response:
    if not chunk.choices:
        continue
    delta = chunk.choices[0].delta

    # Process reasoning chain
    if hasattr(delta, "reasoning_content") and delta.reasoning_content:
        reasoning += delta.reasoning_content
        if not is_answering:
            print(f"[Thinking] {delta.reasoning_content}", end="", flush=True)

    # Process final response
    if delta.content:
        if not is_answering:
            is_answering = True
            print("\n\n[Answer] ", end="")
        print(delta.content, end="", flush=True)
```

### Thinking Mode Considerations

| Point | Description |
|-------|-------------|
| **Multi-turn conversations** | Each assistant message **must retain** the `reasoning_content` field |
| **max_tokens** | Limits the combined length of chain-of-thought + output |
| **Incompatible parameters** | `reasoning_effort`, `thinking_budget` are not supported |
| **Recommended frameworks** | Use tools like OpenCode that properly handle `reasoning_content` |

<div class="callout callout-warning">
⚠️ <strong>Critical pitfall</strong>: In multi-turn conversations, if the previous turn's `reasoning_content` is lost, the API will error. Make sure to keep it intact in the messages array.
</div>

---

## Step 5: 1M Ultra-Long Context Processing

MiMo-V2.5-Pro supports 1M tokens of context, ideal for processing ultra-long documents:

```python
def analyze_long_document(document_path: str, question: str) -> str:
    """Analyze ultra-long documents (contracts, papers, codebases)"""
    with open(document_path, "r", encoding="utf-8") as f:
        content = f.read()

    # If the document is too long, process in segments
    # MiMo's 1M context can directly handle most long documents

    response = client.chat.completions.create(
        model="mimo-v2.5-pro",
        messages=[
            {
                "role": "system",
                "content": "You are a professional document analysis assistant. Please answer questions based on the provided document content."
            },
            {
                "role": "user",
                "content": f"Document content:\n\n{content}\n\nQuestion: {question}"
            }
        ],
        temperature=1.0,
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Example usage
answer = analyze_long_document(
    "contract.txt",
    "Which clauses in this contract are unfavorable to Party B? List them one by one."
)
print(answer)
```

### Long Context Use Cases

| Scenario | Description |
|----------|-------------|
| Contract review | Analyze hundreds of pages of contracts at once |
| Codebase understanding | Use the entire project's code as context |
| Paper analysis | Compare and analyze multiple papers simultaneously |
| Customer service KB | Full product documentation as RAG context |

---

## Step 6: Function Calling (Tool Use)

```python
import json

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "Search the company's internal database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search keyword"},
                    "limit": {"type": "integer", "description": "Number of results", "default": 5}
                },
                "required": ["query"]
            }
        }
    }
]

def search_database(query: str, limit: int = 5) -> list:
    """Simulated database search (connect to real DB in production)"""
    # Connect to your database here
    results = [
        {"title": f"Document: {query}-related-{i}", "score": 0.95 - i * 0.1}
        for i in range(limit)
    ]
    return results

def agent_query(user_input: str) -> str:
    messages = [{"role": "user", "content": user_input}]

    response = client.chat.completions.create(
        model="mimo-v2.5-pro",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )

    msg = response.choices[0].message

    if not msg.tool_calls:
        return msg.content

    for tool_call in msg.tool_calls:
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        if func_name == "search_database":
            result = search_database(**func_args)

        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        })

    final = client.chat.completions.create(
        model="mimo-v2.5-pro",
        messages=messages,
    )

    return final.choices[0].message.content

print(agent_query("How were the company's sales last quarter?"))
```

---

## Step 7: Local Deployment of Open-Source Models

MiMo-V2-Flash is fully open-sourced under the MIT license and can be used commercially for free:

### Using vLLM

```bash
pip install vllm
```

```bash
# Start the service
vllm serve "XiaomiMiMo/MiMo-V2-Flash" --port 8000
```

```python
# Client-side call
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="XiaomiMiMo/MiMo-V2-Flash",
    messages=[{"role": "user", "content": "What is Rust's ownership system?"}],
)
```

### Open-Source Resources

| Resource | URL |
|----------|-----|
| GitHub Organization | https://github.com/XiaomiMiMo |
| HuggingFace | https://huggingface.co/XiaomiMiMo |
| MiMo-V2-Flash (MIT) | GitHub / HuggingFace |
| vLLM Support | One-click deployment |

---

## Step 8: Integration with AI Coding Tools

### Claude Code (via MiMo2API)

The open-source project [MiMo2API](https://github.com/Fly143/MiMo2API) provides an Anthropic Messages API compatibility layer:

```bash
git clone https://github.com/Fly143/MiMo2API.git
cd MiMo2API
chmod +x deploy.sh
./deploy.sh
```

Once started, Claude Code can use MiMo as its backend.

### Codex CLI

Edit `~/.codex/config.toml`:

```toml
model_provider = "xiaomi"
model = "mimo-v2.5-pro"

[model_providers.xiaomi]
name = "Xiaomi MiMo"
base_url = "https://token-plan-cn.xiaomimimo.com/v1"
env_key = "MIMO_API_KEY"
```

### Cline / OpenClaw

Select Xiaomi -> MiMo models in the model settings.

---

## Parameter Quick Reference

| Parameter | MiMo Range | Default | Notes |
|-----------|-----------|---------|-------|
| `temperature` | 0 ~ 1.5 | 1.0 | **Recommended 1.0**; too low weakens reasoning |
| `top_p` | 0.01 ~ 1.0 | 0.95 | Nucleus sampling |
| `max_tokens` | -- | -- | **Counts both chain-of-thought + output** |
| `presence_penalty` | -2 ~ 2 | 0 | MiMo-specific |
| `stop` | Up to 4 sequences | -- | Stop words |
| `tools` | Supported | -- | Only `tool_choice: auto` |
| `enable_thinking` | bool | true | Pass via `extra_body` |

### Unsupported Parameters

`top_k`, `reasoning_effort`, `parallel_tool_calls`, `seed`, `logprobs`, `n`, `audio`

---

## Pricing (June 2026)

### Pay-as-You-Go

| Billing Item | V2.5-Pro | V2.5 Standard | V2-Flash |
|-------------|----------|--------------|----------|
| Input (cache miss) | $1.00/M | $0.14/M | ~$0.10/M |
| Output | $3.00/M | $0.28/M | ~$0.40/M |
| Input (cache hit) | $0.20/M | $0.0028/M | $0.02/M |

### Token Plan Subscription

| Plan | China Price | International Price | Credits/Month |
|------|------------|-------------------|---------------|
| Lite | ¥39 | $6 | ~4.1B points |
| Standard | ¥99 | $16 | ~11B points |
| Pro | ¥329 | $50 | ~38B points |

### Price Comparison with Major Models

| Model | Input ($/M) | Output ($/M) | Context |
|-------|------------|-------------|---------|
| **MiMo V2.5 Pro** | **$1.00** | **$3.00** | **1M** |
| DeepSeek V4-Pro | $0.44 | $0.87 | 128K |
| GPT-5.5 | $2.50 | $15.00 | 272K |
| Claude Opus 4.8 | $5.00 | $25.00 | 1M |

> In 1M long-context scenarios, MiMo's price advantage is especially pronounced.

---

## FAQ

### Q: MiMo vs DeepSeek -- how to choose?

**A**: Choose MiMo for long-context tasks (1M vs 128K), DeepSeek for deep reasoning and math. Both are top-tier for coding.

### Q: Can overseas users call the API directly?

**A**: Yes. Use Token Plan's Singapore or Europe nodes, or go through platforms like OpenRouter.

### Q: Can the open-source model be used commercially?

**A**: MiMo-V2-Flash is under the **MIT license** and is fully available for commercial use. Check the specific licenses for other models.

### Q: How many additional tokens does thinking mode consume?

**A**: The thinking process counts toward the max_tokens limit but is not billed separately (only final output is charged).

---

## Next Steps

- [Zhipu GLM-4 API Complete Guide](/tutorials/glm-api-developer-guide/)
- [Chinese AI Model Ultimate Comparison (2026 Edition)](/tutorials/china-ai-model-comparison-2026/)
- [Kling AI Video Generation API Guide](/tutorials/kling-api-developer-guide/)

> 📝 **Tutorial version notes**: Based on Xiaomi MiMo's latest API version as of June 2026. All code tested and verified.
