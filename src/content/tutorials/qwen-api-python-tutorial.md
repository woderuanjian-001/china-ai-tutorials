---
title: "Qwen API Python Hands-On Tutorial: From Beginner to Production"
description: "A complete Alibaba Cloud Bailian platform Qwen3.7 API tutorial. From obtaining an API Key to chat, streaming output, Function Calling, vision understanding, and code generation — all in one place."
category: "Qwen"
date: 2026-06-20
updated: 2026-06-20
tags: ["Qwen", "API", "Python", "Alibaba Cloud", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will learn:

- How to obtain a Qwen API Key on the Alibaba Cloud Bailian platform
- How to use the OpenAI SDK to call the full Qwen model family
- How to implement multi-turn conversations, streaming output, and Function Calling
- How to use Qwen-VL models for image analysis
- How to use Qwen-Coder models for code generation

> 🎯 **Qwen is the most complete open-source and enterprise-deployment-friendly Chinese AI model. After reading this, you'll be able to integrate it into any project.**

## Why Choose Qwen?

| Feature | Qwen 3.7 | Other Open-Source Models |
|------|----------|-------------|
| Open-Source License | **Apache 2.0** (most permissive) | DeepSeek MIT / Llama restrictive |
| Language Support | **119 languages** | Typically 20–50 |
| Model Family | LLM + Vision + Audio + Code + Math + TTS | Usually LLM only |
| Cloud-Native | Deeply integrated with Alibaba Cloud / DingTalk | Requires self-deployment |
| API Price (Flash) | **$0.07/M input** | DeepSeek $0.14/M |

## Step 1: Obtain an API Key

1. Visit the [Alibaba Cloud Bailian Console](https://bailian.console.aliyun.com/)
2. Complete real-name verification for your Alibaba Cloud account (requires a phone number)
3. Go to "API-KEY Management" → Click "Create API Key"
4. Copy the key prefixed with `sk-` and save it

```bash
# macOS / Linux
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Windows PowerShell
$env:DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

<div class="callout callout-tip">
💡 <strong>Free quota</strong>: Alibaba Cloud Bailian provides plenty of free tokens for new users — more than enough for development and testing.
</div>

## Step 2: Install the SDK

```bash
pip install openai
```

The Qwen API is compatible with the OpenAI protocol — just change the `base_url`:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
```

### Optional Endpoints

| Region | Base URL |
|------|----------|
| Domestic (Beijing) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| International (Singapore) | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |

## Step 3: Your First API Call

```python
response = client.chat.completions.create(
    model="qwen-plus",  # Best value for money
    messages=[
        {"role": "system", "content": "You are a professional programming assistant."},
        {"role": "user", "content": "Write a binary search tree in Python."}
    ],
    temperature=0.7,
    max_tokens=2048,
)

print(response.choices[0].message.content)
print(f"Token usage: input {response.usage.prompt_tokens}, output {response.usage.completion_tokens}")
```

## Step 4: Qwen Model Selection

Qwen has the most complete model family:

| Model | Best For | Value |
|------|----------|--------|
| `qwen-turbo` | Simple chat, classification, summarization | ⭐⭐⭐⭐⭐ |
| `qwen-plus` | Medium complexity, general tasks | ⭐⭐⭐⭐ |
| `qwen-max` | Complex reasoning, high-quality generation | ⭐⭐⭐ |
| `qwen3.7-max` | Strongest reasoning + coding agent | ⭐⭐ |
| `qwen3.7-plus` | Multimodal understanding + high value | ⭐⭐⭐⭐ |
| `qwen-vl-plus` | Image/video vision understanding | ⭐⭐⭐⭐ |
| `qwen3-coder-next` | Code generation and programming assistance | ⭐⭐⭐ |

## Step 5: Multi-Turn Conversation

```python
# Initialize conversation history
conversation = [
    {"role": "system", "content": "You are a helpful programming assistant."},
    {"role": "user", "content": "Please introduce object-oriented programming in Python."}
]

# Round 1
resp1 = client.chat.completions.create(
    model="qwen-turbo",
    messages=conversation,
)
answer1 = resp1.choices[0].message.content
print(f"Round 1: {answer1}")

# Add AI's response to history
conversation.append({"role": "assistant", "content": answer1})

# Round 2 — AI remembers the previous conversation
conversation.append({
    "role": "user",
    "content": "How does it differ from object-oriented programming in Java?"
})

resp2 = client.chat.completions.create(
    model="qwen-turbo",
    messages=conversation,
)
print(f"Round 2: {resp2.choices[0].message.content}")
```

## Step 6: Advanced Features — Thinking Mode + Web Search

Qwen 3.7 supports chain-of-thought reasoning and web search:

```python
response = client.chat.completions.create(
    model="qwen3.7-max",
    messages=[
        {"role": "user", "content": "Compare the strengths and weaknesses of Rust and Go for backend development in 2026."}
    ],
    extra_body={
        "enable_thinking": True,   # Activate chain-of-thought reasoning
        "enable_search": True,     # Enable web search
    },
    stream=True,
)

for chunk in response:
    # Normal response
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
    # Reasoning process (thinking content)
    if hasattr(chunk.choices[0].delta, "reasoning_content"):
        rc = chunk.choices[0].delta.reasoning_content
        if rc:
            print(f"\n[Thinking]: {rc}")
```

## Step 7: Function Calling

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_current_weather",
        "description": "Query the weather for a specified city",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name, e.g., Beijing, Shanghai, Tokyo"
                }
            },
            "required": ["location"]
        }
    }
}]

messages = [{"role": "user", "content": "What's the weather in Hangzhou?"}]

response = client.chat.completions.create(
    model="qwen-plus",
    messages=messages,
    tools=tools,
)

print(response.model_dump_json())
```

## Step 8: Vision Understanding (Qwen-VL)

```python
response = client.chat.completions.create(
    model="qwen-vl-plus",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {"url": "https://example.com/chart.png"}
            },
            {
                "type": "text",
                "text": "What trend does this chart show? Please analyze in detail."
            }
        ]
    }]
)

print(response.choices[0].message.content)
```

## Step 9: Code Generation (Qwen-Coder)

```python
response = client.chat.completions.create(
    model="qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are a professional systems programming expert."},
        {"role": "user", "content": """Write a Rust function:
- Input: integer n
- Output: all prime numbers less than n
- Requirement: use the Sieve of Eratosthenes for optimal performance"""}
    ],
    temperature=0.1,  # Low temperature recommended for code generation
)

print(response.choices[0].message.content)
```

## Qwen vs Other Chinese AI Models

| Dimension | Qwen | DeepSeek | Kimi |
|----------|------|----------|------|
| Model Variety | ⭐⭐⭐⭐⭐ Most complete | ⭐⭐ Text only | ⭐⭐⭐ |
| Open-Source License | ⭐⭐⭐⭐⭐ Apache 2.0 | ⭐⭐⭐⭐⭐ MIT | ⭐⭐⭐ Modified MIT |
| Coding Ability | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Enterprise Integration | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Multilingual | ⭐⭐⭐⭐⭐ 119 languages | ⭐⭐⭐ | ⭐⭐⭐ |

## FAQ

### Q: Does the Qwen API require a Chinese phone number?

**A**: Alibaba Cloud accounts require real-name verification, which typically requires a Chinese phone number. The international edition (Singapore endpoint) may support overseas registration — check the official policy for the latest details.

### Q: Is Qwen truly open source?

**A**: Yes. Apache 2.0 is one of the most permissive open-source licenses in the industry, allowing commercial use, modification, and redistribution. It is more friendly than Meta's Llama license.

### Q: Should I choose Qwen or DeepSeek?

**A**: Choose DeepSeek for pure coding tasks. Choose Qwen if you need multimodality, enterprise integration, or multilingual support. See the [Ultimate Model Comparison](/tutorials/china-ai-model-comparison-2026/) for details.

## Next Steps

- [2026 Ultimate Comparison of Chinese AI Models](/tutorials/china-ai-model-comparison-2026/)
- [Qwen Vision API Tutorial: Image Understanding in Practice](/tutorials/qwen-vision-api-tutorial/)
- [Alibaba Cloud Bailian Official Documentation](https://help.aliyun.com/zh/model-studio/)

> 📝 **Tutorial version**: Based on Qwen3.7 API, tested and verified on June 20, 2026.
