---
title: "SenseTime SenseNova API Developer Guide"
description: "Complete SenseTime SenseNova large model API tutorial: SenseChat conversation, multimodal understanding, code generation, and function calling. Covers both Python SDK and REST API calling methods."
category: "Advanced Models"
date: 2026-06-20
tags: ["SenseTime", "SenseNova", "Multimodal", "Function Calling", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will quickly get started with the SenseTime SenseNova large model:

- SenseChat text conversation
- Multimodal image-text understanding
- Function Calling
- Dual-mode: Python SDK / REST API

> 🎯 SenseTime is a global leader in computer vision. The SenseNova large model stands out especially in multimodal capabilities.

---

## Model Family

| Model | Capability | Context | Pricing |
|------|------|--------|------|
| **SenseChat 5.5** | General text | 128K | ¥2/M |
| **SenseNova-Vision** | Image-text understanding | 32K | ¥3/M |
| **SenseNova-Coder** | Code generation | 32K | ¥2/M |
| **SenseNova-TTS** | Text-to-speech | - | ¥2/10K chars |

---

## Quick Start

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("SENSENOVA_API_KEY"),
    base_url="https://api.sensenova.cn/v1",
)

def chat(prompt: str, system: str = "") -> str:
    """Basic conversation"""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model="sensechat-5.5",
        messages=messages,
        temperature=0.7,
        max_tokens=2048,
    )
    return response.choices[0].message.content

# Test
result = chat("What are SenseTime's core technology strengths?")
print(result)
```

---

## Multimodal Understanding

```python
import base64

def vision_chat(image_path: str, question: str) -> str:
    """Image-text understanding"""
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    response = client.chat.completions.create(
        model="sensenova-vision",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": question},
                ],
            }
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content

# Usage
description = vision_chat("street.jpg", "Describe the main buildings and human activity in this street scene photo")
print(description)
```

---

## Function Calling

```python
import json

# Define tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather information for a specified city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"],
            },
        },
    }
]

def function_calling_demo(user_query: str):
    """Function calling demo"""
    response = client.chat.completions.create(
        model="sensechat-5.5",
        messages=[{"role": "user", "content": user_query}],
        tools=tools,
        tool_choice="auto",
    )

    msg = response.choices[0].message
    if msg.tool_calls:
        for tool_call in msg.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            print(f"Calling function: {func_name}({args})")

            # Execute the function
            if func_name == "get_weather":
                result = {"city": args["city"], "temp": 25, "weather": "Sunny"}
                print(f"Result: {result}")
    else:
        print(msg.content)

function_calling_demo("What's the weather in Beijing today?")
```

---

## Streaming Chat

```python
def stream_chat(prompt: str):
    """Streaming conversation"""
    stream = client.chat.completions.create(
        model="sensechat-5.5",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)

stream_chat("Write a short poem about AI")
```

---

## Direct REST API Call

```python
import requests

def rest_api_chat(prompt: str, api_key: str) -> str:
    """Direct REST API call"""
    response = requests.post(
        "https://api.sensenova.cn/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "sensechat-5.5",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2048,
        },
    )
    return response.json()["choices"][0]["message"]["content"]
```

---

## SenseTime vs Other Models

| Advantage | Description |
|------|------|
| **Best Multimodal** | Built on deep CV expertise, most thorough visual understanding |
| **128K Context** | SenseChat 5.5 supports ultra-long documents |
| **Mature Industry Solutions** | Vertical solutions for finance, healthcare, autonomous driving |
| **Data Security** | Supports private deployment |

---

## Next Steps

- [Chinese Multimodal AI Guide](/tutorials/multimodal-chinese-ai-guide/)
- [Chinese AI Model Pricing Comparison](/tutorials/china-ai-model-pricing-comparison/)

> 📝 Based on SenseTime SenseNova API, June 2026.
