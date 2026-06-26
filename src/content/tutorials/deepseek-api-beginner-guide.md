---
title: "DeepSeek API From Zero to Production: Complete Python Guide (2026 Latest)"
description: "Account registration, API key setup, first API call, streaming output, function calling — a complete DeepSeek V4 API tutorial for beginners. Every step includes runnable code examples."
category: "DeepSeek"
date: 2026-06-18
updated: 2026-06-20
tags: ["DeepSeek", "API", "Python", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will learn:

- Register a DeepSeek account and obtain an API key
- Call the DeepSeek API from Python
- Implement streaming output and function calling
- Handle common errors and rate limits
- Understand key differences between DeepSeek and other models

> 🎯 **After reading this, you will be able to use the DeepSeek API in your own projects from scratch.**

## Why Choose DeepSeek?

DeepSeek has become one of the top choices for developers globally in 2026. Here are the key numbers:

| Feature | DeepSeek V4 | GPT-5 | Claude Opus 4 |
|---------|-------------|-------|---------------|
| API input price | **$0.14/M tokens** | $1.25/M | $5.00/M |
| API output price | **$0.28/M tokens** | $10.00/M | $25.00/M |
| Context window | 1M tokens | 272K | 1M |
| Coding (HumanEval) | **93.2%** | 91.5% | 88.3% |
| Open source | ✅ MIT license | ❌ | ❌ |

**In one sentence**: DeepSeek's coding ability is world-class, and it costs roughly 1/10 to 1/50 of OpenAI.

## Step 1: Register and Get an API Key

1. Open [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up with email or phone number (international numbers supported)
3. After logging in, go to the **API Keys** page
4. Click "Create API Key", give it a name, and confirm
5. **Copy the key immediately** — it is shown only once!

<div class="callout callout-warning">
⚠️ <strong>Important</strong>: You need to top up your balance to use the API. The minimum top-up is $2. Without a balance, the API returns a <code>402 Insufficient Balance</code> error.
</div>

### Set Environment Variables

```bash
# macOS / Linux
export DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Windows PowerShell
$env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

<div class="callout callout-tip">
💡 <strong>Security tip</strong>: Never hardcode your API key in source code! Always use environment variables or a .env file. If you use GitHub, remember to add .env to .gitignore.
</div>

## Step 2: Install the SDK

The DeepSeek API is **fully compatible with the OpenAI SDK**. Just install the official OpenAI Python package:

```bash
pip install openai
```

This is one of DeepSeek's biggest advantages: if you have used the OpenAI API before, migration requires changing only two lines of code.

## Step 3: Your First API Call

```python
import os
from openai import OpenAI

# Create the client — only base_url and api_key need to change
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",  # Key: this is DeepSeek's endpoint
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",  # Fast model; use deepseek-v4-pro for complex tasks
    messages=[
        {"role": "system", "content": "You are a helpful programming assistant."},
        {"role": "user", "content": "Explain what an API is in one sentence."},
    ],
    temperature=1.0,  # DeepSeek recommends 1.0
    top_p=1.0,
)

print(response.choices[0].message.content)
```

### What Does This Code Do?

1. Creates an OpenAI client, but points it to DeepSeek's servers
2. Passes a `system` message (sets assistant behavior) and a `user` message (your question)
3. Calls `chat.completions.create()` to send the request
4. Prints the returned content

**Only 2 differences from the OpenAI API**: `base_url` and `model` name. All other parameters are identical.

<div class="callout callout-info">
📝 <strong>Model selection</strong>: <code>deepseek-v4-flash</code> is for daily use — fast and cheap. <code>deepseek-v4-pro</code> is for complex reasoning and coding tasks. The legacy <code>deepseek-chat</code> and <code>deepseek-reasoner</code> will be deprecated on July 24, 2026 — do not use them.
</div>

## Step 4: Streaming Output (Real-Time Display)

By default, the API waits until the model finishes generating everything before returning. For long responses, this can take tens of seconds. Streaming lets results appear word by word:

```python
stream = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[
        {"role": "user", "content": "Write a 300-word essay on AI safety."}
    ],
    stream=True,  # Enable streaming
)

for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
```

### Streaming vs Non-Streaming

| | Non-Streaming | Streaming |
|---|---|---|
| Time to first byte | Waits for full completion | **Instant** |
| User experience | ❌ Waiting anxiety | ✅ Seeing progress |
| Implementation complexity | Simple | Slightly more complex |
| Suitable scenarios | Backend processing, batch tasks | Chat interfaces, real-time interaction |

## Step 5: Thinking Mode

DeepSeek V4 supports three thinking modes, controlled via the `thinking_mode` parameter:

```python
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[
        {"role": "user", "content": "Solve this math problem: If 3x + 7 = 22, find x."}
    ],
    extra_body={"thinking_mode": "thinking"},  # DeepSeek-specific parameter
    temperature=1.0,
    top_p=1.0,
)

print(response.choices[0].message.content)
```

| Mode | Description | Cost | Suitable Scenarios |
|------|-------------|------|---------------------|
| `non-thinking` | No reasoning process shown | Lowest | Simple Q&A, translation, summarization |
| `thinking` | Shows reasoning steps | Medium | Coding, math, analysis |
| `thinking_max` | Deepest reasoning | Highest | Tasks requiring absolute correctness |

## Step 6: Function Calling

Function calling allows the AI to invoke functions you define. Here is a weather assistant example:

```python
import json

# Define tools
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Query the current weather for a given city.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g., Beijing, Tokyo"},
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["city"]
        }
    }
}]

# Simulated weather function
def get_weather(city: str, unit: str = "celsius") -> dict:
    # In a real project, call a real weather API here
    return {
        "city": city,
        "temperature": 22,
        "unit": unit,
        "condition": "Sunny"
    }

# Interact with the AI
messages = [{"role": "user", "content": "What's the weather like in Beijing today?"}]

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # AI decides automatically whether to call the tool
    extra_body={"thinking_mode": "thinking"},
)

# Check if a tool call is needed
msg = response.choices[0].message
if msg.tool_calls:
    tool_call = msg.tool_calls[0]
    print(f"AI called tool: {tool_call.function.name}")
    print(f"Arguments: {tool_call.function.arguments}")

    # Execute the real function
    args = json.loads(tool_call.function.arguments)
    result = get_weather(**args)

    # Return the result to the AI
    messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(result, ensure_ascii=False)})

    # Let the AI generate a final response based on the result
    final_response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=messages,
    )
    print(f"AI final response: {final_response.choices[0].message.content}")
```

### Function Calling Workflow

```
User query → AI decides whether to call a tool → Tool called → Result obtained → AI generates final response
```

## Step 7: Error Handling

In production, you must handle various API errors:

```python
import time

RETRIABLE = {408, 409, 425, 429, 500, 502, 503, 504}

def chat_with_retry(messages, max_attempts=4):
    """API call with retry mechanism"""
    backoff = 0.5  # Start with 0.5-second wait

    for attempt in range(max_attempts):
        try:
            return client.chat.completions.create(
                model="deepseek-v4-flash",
                messages=messages,
                temperature=1.0,
                top_p=1.0,
            )
        except Exception as e:
            status = getattr(e, "status", None)

            if status == 401:
                raise Exception("Invalid API key. Please check.") from e
            if status == 402:
                raise Exception("Insufficient balance. Please top up. Minimum $2.") from e
            if status == 429:
                print(f"Too many requests. Waiting {backoff} seconds before retrying...")
                time.sleep(backoff)
                backoff *= 2  # Exponential backoff
                continue
            if status in RETRIABLE and attempt < max_attempts - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise
```

| HTTP Status | Meaning | Solution |
|-------------|---------|----------|
| 400 | Malformed request | Check JSON format |
| **401** | Invalid API key | Regenerate the key |
| **402** | Insufficient balance | Top up (minimum $2) |
| **429** | Rate limited | Implement exponential backoff |
| 500/503 | Server error | Wait and retry |

## Step 8: Cost Optimization Tips

1. **Use V4-Flash by default**. Most daily tasks do not need the Pro model.
2. **Use non-thinking mode by default**. Only enable thinking when deep reasoning is needed.
3. **Limit max_tokens**. Most responses complete within 2000 tokens.
4. **Log usage for every call**. Monitor reasoning token consumption and catch anomalies early.

```python
response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=500,  # Limit output length
)

print(f"Input: {response.usage.prompt_tokens} tokens")
print(f"Output: {response.usage.completion_tokens} tokens")
print(f"Total cost: ~${(response.usage.prompt_tokens * 0.14 + response.usage.completion_tokens * 0.28) / 1_000_000:.6f}")
```

## FAQ

### Q: Is DeepSeek free?

**A**: The web chat at [chat.deepseek.com](https://chat.deepseek.com) is free. The API is pay-as-you-go, but pricing is extremely low — a $2 top-up covers thousands of calls.

### Q: Is the DeepSeek API fully compatible with the OpenAI API?

**A**: Core features (chat, streaming, function calling) are fully compatible. Some advanced parameters (like `logprobs`) may differ. The vast majority of projects can call DeepSeek directly with the OpenAI SDK.

### Q: Is my data secure?

**A**: By default, data sent via the API is not used for model training. If you need the highest level of data privacy, you can self-host the open-source DeepSeek model (MIT license).

### Q: Which model should I use?

**A**: Use `deepseek-v4-flash` for daily development and `deepseek-v4-pro` for complex coding/reasoning. When unsure, start with Flash and upgrade if the results are not good enough.

## Next Steps

- Learn [DeepSeek Function Calling in Practice: Build an AI Weather Assistant](/tutorials/deepseek-function-calling-guide/)
- See the [Ultimate China AI Model Comparison](/tutorials/china-ai-model-comparison-2026/)
- Read the [DeepSeek Official API Documentation](https://platform.deepseek.com/api-docs/)

> 📝 **Tutorial Version Notes**: This tutorial is based on the DeepSeek V4 API, verified on June 18, 2026. If the API has been updated, please consult the official documentation.
