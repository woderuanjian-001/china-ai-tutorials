---
title: "Zhipu GLM-4 API Complete Guide: From Zero to Production AI Apps (2026 Latest)"
description: "Comprehensive guide to ZhipuAI GLM-4.7/GLM-4.6V API: three calling methods, thinking mode, Function Calling, web search, vision understanding, video generation. Complete Python code examples."
category: "ZhipuAI"
date: 2026-06-20
tags: ["Zhipu", "GLM-4", "Python", "Function Calling", "Vision", "Open Source"]
level: "Beginner"
---

## What This Tutorial Covers

You will master the complete ZhipuAI GLM-4 series API:

- Three API calling methods (official SDK, OpenAI compatibility, direct HTTP)
- Thinking mode for deep reasoning
- Function Calling to build AI agents
- Web search for real-time information
- GLM-4.6V multimodal vision understanding
- CogVideoX-2 video generation
- Local deployment of open-source models

> 🎯 ZhipuAI is the only company in China with a full product line covering **language + vision + video + real-time multimodal**. GLM-4.7 achieves world-class coding ability (SWE-Bench 73.8%).

---

## Step 1: Meet the ZhipuAI Model Family

ZhipuAI, founded by the Tsinghua team, has China's most complete large model product lineup:

### Language Models

| Model | Context | Max Output | Price (input/output per M tokens) | Positioning |
|------|--------|---------|--------------------------|------|
| **GLM-4.7** | 200K | 128K | ¥4 / ¥16 | Latest flagship |
| **GLM-4.7-Flash** | 200K | 128K | **Free** | Free flagship |
| **GLM-4.6** | 200K | 128K | Paid | Ultra performance |
| **GLM-4-Plus** | 128K | 4K | ¥5 / ¥5 | Previous-gen flagship |
| **GLM-4.5** | 128K | 96K | ¥4.3 / ¥15.8 | MoE open-source (355B/32B) |
| **GLM-4-Flash** | 128K | 16K | **Free** | Free lightweight |

### Multimodal Models

| Model | Type | Context | Price (input/output) |
|------|------|--------|-----------------|
| **GLM-4.6V** | Vision understanding | 128K | ¥1 / ¥3 |
| **GLM-4.6V-Flash** | Vision (lightweight) | 128K | **Free** |
| **GLM-4V-Flash** | Vision free tier | -- | **Free** |
| **CogView-3-Plus** | Text-to-image | -- | Paid |
| **CogVideoX-2** | Text-to-video | -- | Paid (4K/60fps+audio) |
| **GLM-Realtime** | Real-time multimodal | -- | Paid |

> 💡 **Model selection advice**: Start with the free `glm-4.7-flash` for initial development, upgrade to `glm-4.7` or `glm-4.6` for production as needed.

---

## Step 2: Get Your API Key

1. Visit the [ZhipuAI Open Platform](https://open.bigmodel.cn) and sign up
2. Complete real-name verification (Chinese phone number)
3. Create an API Key in the console
4. Set the environment variable:

```bash
export ZAI_API_KEY="Your-API-Key"
```

New users receive free credits and can begin testing immediately.

---

## Step 3: Method 1 -- Official New SDK (Recommended)

### Install

```bash
pip install zai-sdk
```

> Python >= 3.8 required.

### Basic Chat

```python
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="Your-API-Key")

response = client.chat.completions.create(
    model="glm-4.7-flash",  # Free model, great for beginners
    messages=[
        {"role": "system", "content": "You are a professional Python programming assistant"},
        {"role": "user", "content": "Write a quicksort algorithm in Python and explain its time complexity"}
    ],
    temperature=0.7,
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

### Streaming Output (Typewriter Effect)

```python
response = client.chat.completions.create(
    model="glm-4.7-flash",
    messages=[{"role": "user", "content": "Describe China's AI industry in 200 words"}],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## Step 4: Thinking Mode (Deep Thinking)

Thinking mode allows the model to reason deeply before outputting, ideal for math problems, logic puzzles, and code debugging:

```python
response = client.chat.completions.create(
    model="glm-4.7-flash",
    messages=[
        {"role": "user", "content": "In a room of 10 people, if everyone shakes hands with everyone else exactly once, how many handshakes occur? Reason step by step."}
    ],
    temperature=0.7,
    max_tokens=8192,
    thinking={"type": "enabled"},  # 🔑 Enable deep thinking
)

print(response.choices[0].message.content)
```

**Example thinking mode output:**

```
Thinking process: This is a combination problem. 10 people, each pair shakes hands once.
Equivalent to choosing 2 people from 10, order doesn't matter.
Combination count = C(10,2) = 10 × 9 ÷ 2 = 45.

Answer: 45 handshakes in total.
```

<div class="callout callout-tip">
💡 <strong>When to use thinking mode?</strong> Math proofs, code debugging, logical reasoning, complex analysis. Skip it for simple conversations -- it only adds latency.
</div>

---

## Step 5: Function Calling (Building AI Agents)

This is the core capability for building AI applications -- letting AI call your functions to fetch real-time data or perform actions.

### Complete Example: Building an AI Weather Assistant

```python
from zai import ZhipuAiClient
import json

client = ZhipuAiClient(api_key="Your-API-Key")

# 1. Define tools
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Query today's weather for a specified city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City name, e.g., Beijing, Shanghai, Shenzhen"
                },
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

# 2. Simulated weather query function (use a real API in production)
def get_weather(city: str, unit: str = "celsius") -> dict:
    weather_db = {
        "Beijing": {"temp": 22, "condition": "Sunny", "humidity": 45},
        "Shanghai": {"temp": 28, "condition": "Cloudy", "humidity": 65},
        "Shenzhen": {"temp": 32, "condition": "Thunderstorms", "humidity": 80},
        "Hangzhou": {"temp": 26, "condition": "Overcast", "humidity": 70},
    }
    data = weather_db.get(city, {"temp": 20, "condition": "Unknown", "humidity": 50})
    if unit == "fahrenheit":
        data["temp"] = data["temp"] * 9 / 5 + 32
    data["city"] = city
    return data

# 3. Build the agent function
def chat_with_agent(user_query: str) -> str:
    messages = [{"role": "user", "content": user_query}]

    # First call: AI decides if tools are needed
    response = client.chat.completions.create(
        model="glm-4.7-flash",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )

    msg = response.choices[0].message

    # If no tools needed, return directly
    if not msg.tool_calls:
        return msg.content

    # Handle tool calls
    for tool_call in msg.tool_calls:
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        print(f"🔧 AI calling tool: {func_name}({func_args})")

        if func_name == "get_weather":
            result = get_weather(**func_args)

        # Return result to AI
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        })

    # Second call: AI generates response based on results
    final_response = client.chat.completions.create(
        model="glm-4.7-flash",
        messages=messages,
    )

    return final_response.choices[0].message.content

# Test
print(chat_with_agent("What's the weather like in Beijing today?"))
print(chat_with_agent("Which is hotter, Shenzhen or Hangzhou?"))
```

---

## Step 6: Web Search

Let AI access real-time information rather than relying solely on training data:

```python
response = client.chat.completions.create(
    model="glm-4.7",
    messages=[
        {"role": "user", "content": "What's the latest AI industry news in June 2026?"}
    ],
    tools=[{
        "type": "web_search",
        "web_search": {
            "search_query": "June 2026 AI industry news",
            "search_result": True,
        }
    }],
)

print(response.choices[0].message.content)
```

<div class="callout callout-warning">
⚠️ <strong>Note</strong>: Web search is only available on certain paid models (e.g., glm-4.7, glm-4.6). Free models do not currently support it.
</div>

---

## Step 7: Vision Understanding (GLM-4V Multimodal)

Upload images for AI analysis:

```python
from zai import ZhipuAiClient
import base64

client = ZhipuAiClient(api_key="Your-API-Key")

# Convert image to base64
def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

base64_image = encode_image("photo.jpg")

response = client.chat.completions.create(
    model="glm-4.6v",  # Vision model
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Please describe this image in detail, including the scene, people, colors, and atmosphere"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
            }
        ]
    }],
    temperature=0.5,
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

### GLM-4V Unique Capabilities

- **4K ultra-high-res image understanding**: Supports high-resolution images
- **Variable resolution processing**: Dynamically adjusts based on image complexity
- **2-hour video understanding**: Supports long video content analysis
- **Native multimodal Function Calling**: Images/screenshots can be used directly as tool inputs

---

## Step 8: Method 2 -- OpenAI-Compatible Interface

ZhipuAI is fully compatible with the OpenAI SDK, enabling seamless switching for existing OpenAI projects:

```bash
pip install openai
```

```python
from openai import OpenAI

client = OpenAI(
    api_key="Your-Zhipu-API-Key",
    base_url="https://open.bigmodel.cn/api/paas/v4/"
)

# Usage identical to OpenAI
response = client.chat.completions.create(
    model="glm-4-plus",
    messages=[
        {"role": "system", "content": "You are a talented fiction writer"},
        {"role": "user", "content": "Write a 200-word micro-fiction story"}
    ],
    temperature=0.9,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

This dramatically reduces migration cost -- just change two lines of configuration!

---

## Step 9: Method 3 -- Direct HTTP REST API

No SDK needed, direct HTTP calls:

```python
import requests

url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
headers = {
    "Authorization": "Bearer Your-API-Key",
    "Content-Type": "application/json",
}

data = {
    "model": "glm-4.7-flash",
    "messages": [
        {"role": "user", "content": "Explain artificial intelligence in three sentences"}
    ],
    "temperature": 0.7,
    "max_tokens": 512,
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["choices"][0]["message"]["content"])
```

Suitable for environments where Python packages cannot be installed (e.g., certain serverless platforms).

---

## Step 10: Video Generation (CogVideoX-2)

Zhipu's video generation model supports up to 4K/60fps:

```python
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="Your-API-Key")

# Submit a video generation task
response = client.videos.generations(
    model="cogvideox-2",
    prompt="A cinematic drone shot flying over a bustling Chinese tech city at sunset, neon lights reflecting on glass skyscrapers, 4K quality",
    quality="quality",
    with_audio=True,
    size="1920x1080",
    fps=30,
)

print(f"Task submitted, ID: {response.id}")

# Query task result
result = client.videos.retrieve_videos_result(id=response.id)
print(f"Video URL: {result.video_url}")
```

---

## Error Handling Best Practices

```python
from zai import ZhipuAiClient, ZhipuAiError

client = ZhipuAiClient(api_key="Your-API-Key")

def safe_chat(prompt: str, retries: int = 3) -> str:
    """Safe chat function with retries and error handling"""
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="glm-4.7-flash",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048,
            )
            return response.choices[0].message.content

        except ZhipuAiError as e:
            if "rate_limit" in str(e).lower():
                wait = 2 ** attempt  # Exponential backoff
                print(f"Rate limited, retrying in {wait}s...")
                import time
                time.sleep(wait)
            elif "invalid_api_key" in str(e).lower():
                raise Exception("Invalid API Key, please check") from e
            else:
                raise

    raise Exception(f"Failed after {retries} retries")

print(safe_chat("Hello"))
```

---

## Deploying Open-Source Models (Local)

Zhipu has open-sourced several model versions for local deployment:

### Using Transformers

```bash
pip install transformers torch
```

```python
from transformers import pipeline

# Load GLM-4.6V vision model
pipe = pipeline(
    "image-text-to-text",
    model="Mitchins/GLM-4.6V-Flash-NVFP4-BF16Vision"
)

messages = [{
    "role": "user",
    "content": [
        {"type": "image", "url": "https://example.com/photo.jpg"},
        {"type": "text", "text": "What animal is in this image?"}
    ],
}]

result = pipe(text=messages)
print(result)
```

### Production Deployment with vLLM

```bash
# Server side
vllm serve zai-org/GLM-4.5V \
    --tensor-parallel-size 4 \
    --tool-call-parser glm45 \
    --reasoning-parser glm45 \
    --port 8000
```

```python
# Client side (OpenAI compatible)
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="not-needed")

response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{"role": "user", "content": "Hello, introduce yourself"}],
)
```

---

## Cost Optimization Strategies

### Free Models First

| Scenario | Recommended Free Model |
|------|------------|
| Daily chat | `glm-4.7-flash` |
| Image understanding | `glm-4.6v-flash` / `glm-4v-flash` |
| Simple coding | `glm-4-flash` |
| Lightweight Q&A | `glm-4.5-air` (¥0.9/M tokens) |

### Cost Reduction Tips

1. **Use free models for dev/testing**, switch to paid models before launch
2. **Reuse System Prompts**: Don't send the system prompt with every message
3. **Set max_tokens appropriately**: Avoid wasting output tokens
4. **Leverage caching**: Same context hits can reduce costs

---

## Pricing Quick Reference (June 2026)

| Model | Input (¥/M tokens) | Output (¥/M tokens) |
|------|-------------------|-------------------|
| GLM-4.7 | 4 | 16 |
| GLM-4.7-Flash | **0** | **0** |
| GLM-4.6 | Paid | Paid |
| GLM-4-Plus | 5 | 5 |
| GLM-4.5 | 4.3 | 15.8 |
| GLM-4.5-Air | 0.9 | 3.2 |
| GLM-4-Flash | **0** | **0** |
| GLM-4.6V | 1 | 3 |
| GLM-4.6V-Flash | **0** | **0** |

> 💡 Zhipu also offers a **Coding Plan** (¥20/month), compatible with coding tools like Claude Code and Cline, with 3x the usage of Claude Pro.

---

## Quick Comparison: GLM vs. DeepSeek vs. Qwen

| Dimension | GLM-4.7 | DeepSeek V4 | Qwen3 |
|------|---------|-------------|-------|
| Context | **200K** | 1M | 262K |
| Max output | **128K** | 384K | 32K |
| Open-source | MIT | Fully open | Fully open |
| Multimodal | **Vision+Video+Realtime** | Text primarily | Vision |
| Free models | ✅ Multiple | ✅ | ✅ |
| Coding | SWE-Bench 73.8% | SWE-Bench 74.9% | HumanEval+ 83.5% |

---

## FAQ

### Q: Can I switch between Zhipu API and OpenAI API directly?

**A**: Yes. Just change `base_url` and `api_key` -- no code changes needed. Zhipu is fully compatible with the OpenAI SDK.

### Q: Are the free models good enough?

**A**: `glm-4.7-flash` is perfectly sufficient for daily conversation, simple programming, and content generation. For complex reasoning tasks, use paid models.

### Q: Can GLM-4V understand handwritten Chinese?

**A**: Yes. GLM-4V excels at Chinese OCR, capable of recognizing handwritten Chinese, printed Chinese, and even complex tables.

### Q: How much does video generation cost?

**A**: CogVideoX-2 is billed by usage. A 5-second video costs roughly a few RMB. New users get a free trial quota.

---

## Next Steps

- [DeepSeek API Beginner Guide](/tutorials/deepseek-api-beginner-guide/)
- [China AI Models Ultimate Comparison (2026)](/tutorials/china-ai-model-comparison-2026/)
- [Xiaomi MiMo API Getting Started](/tutorials/mimo-api-getting-started/)

> 📝 **Tutorial Version Notes**: Based on ZhipuAI latest API version as of June 2026. All code tested and verified.
