---
title: "Tencent Hunyuan API Complete Guide: Python Integration and WeChat Ecosystem"
description: "Complete Tencent Hunyuan LLM API tutorial: Python SDK, OpenAI compatibility mode, Function Calling, WeChat Mini Program integration. Covers Hunyuan Turbo/Lite model selection and cost optimization."
category: "Tencent"
date: 2026-06-23
tags: ["Tencent", "Hunyuan", "API", "Python", "WeChat", "WeCom"]
level: "Beginner"
---

## What This Tutorial Covers

You will master the complete Tencent Hunyuan LLM API:

- Tencent Cloud platform registration and API Key acquisition
- Hunyuan Turbo / Hunyuan Lite model selection
- Seamless OpenAI compatibility mode switching
- Function Calling and tool integration
- WeChat Mini Program / WeCom integration
- Production cost optimization

> 🎯 Tencent Hunyuan is a major player in China's LLM space. Its biggest advantage: **seamless integration** with the WeChat ecosystem (Mini Programs / Official Accounts / WeCom).

---

## Step 1: Meet the Hunyuan Model Family

| Model | Context | Max Output | Characteristics | Price (per M tokens) |
|------|--------|---------|------|-------------------|
| **Hunyuan Turbo** | 32K | 8K | Flagship, high-performance reasoning | ¥15 / ¥50 |
| **Hunyuan Pro** | 32K | 8K | Balanced performance | ¥10 / ¥30 |
| **Hunyuan Standard** | 8K | 4K | Daily tasks | ¥3 / ¥9 |
| **Hunyuan Lite** | 8K | 4K | Free, best for getting started | **Free** |
| **Hunyuan Vision** | 32K | 8K | Vision understanding | Pay-as-you-go |
| **Hunyuan Embedding** | -- | -- | Text vectorization | ¥0.7 / M tokens |

---

## Step 2: Get Your API Key

1. Visit the [Tencent Cloud Console](https://console.cloud.tencent.com/hunyuan) and sign up
2. Activate the Hunyuan LLM service
3. Create keys under **Access Management > API Key Management**
4. Obtain your **SecretId** + **SecretKey**

```bash
export TENCENT_SECRET_ID="AKIDxxxxxx"
export TENCENT_SECRET_KEY="xxxxxxxxxx"
```

---

## Step 3: OpenAI Compatibility Mode (Recommended)

Hunyuan is fully compatible with the OpenAI SDK -- one-line switch:

```bash
pip install openai
```

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("TENCENT_SECRET_ID"),  # Use SecretId as the API Key
    base_url="https://api.hunyuan.cloud.tencent.com/v1",
)

response = client.chat.completions.create(
    model="hunyuan-turbo",
    messages=[
        {"role": "system", "content": "You are a professional cloud architect"},
        {"role": "user", "content": "Design a cloud architecture for an e-commerce app with 1M DAU"}
    ],
    temperature=0.7,
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

### Streaming Output

```python
response = client.chat.completions.create(
    model="hunyuan-turbo",
    messages=[{"role": "user", "content": "Introduce Tencent Cloud's main product lines"}],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## Step 4: Function Calling

```python
import json

tools = [{
    "type": "function",
    "function": {
        "name": "query_cloud_resources",
        "description": "Query resource usage under a Tencent Cloud account",
        "parameters": {
            "type": "object",
            "properties": {
                "resource_type": {
                    "type": "string",
                    "enum": ["cvm", "cdn", "cos", "cdn"],
                    "description": "Resource type"
                },
                "region": {"type": "string", "description": "Region, e.g., ap-guangzhou"}
            },
            "required": ["resource_type"]
        }
    }
}]

def query_cloud_resources(resource_type: str, region: str = "ap-guangzhou") -> dict:
    """Simulated Tencent Cloud resource query (call Tencent Cloud API in production)"""
    resources = {
        "cvm": {"instances": 12, "total_cpu": 48, "total_memory": "192GB"},
        "cdn": {"domains": 8, "total_bandwidth": "20Gbps"},
        "cos": {"buckets": 15, "total_storage": "5.2TB"},
    }
    return resources.get(resource_type, {"error": "Unknown resource"})

def chat_with_cloud_assistant(query: str) -> str:
    messages = [{"role": "user", "content": query}]

    response = client.chat.completions.create(
        model="hunyuan-turbo",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )

    msg = response.choices[0].message

    if not msg.tool_calls:
        return msg.content

    # Handle tool calls
    messages.append(msg)

    for tool_call in msg.tool_calls:
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)
        result = query_cloud_resources(**func_args)

        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        })

    final = client.chat.completions.create(
        model="hunyuan-turbo",
        messages=messages,
    )

    return final.choices[0].message.content

print(chat_with_cloud_assistant("How are our CVM and CDN resources doing?"))
```

---

## Step 5: WeChat Ecosystem Integration

Hunyuan's biggest differentiator: deep integration with WeChat.

### WeChat Mini Program Integration

```javascript
// Mini Program client code
Page({
  async askAI() {
    const res = await wx.cloud.callContainer({
      config: { env: 'prod-xxx' },
      path: '/hunyuan/chat',
      method: 'POST',
      data: {
        model: 'hunyuan-lite',
        messages: [{ role: 'user', content: this.data.userInput }],
      },
    })
    this.setData({ answer: res.data.choices[0].message.content })
  }
})
```

### WeCom Group Bot

```python
# WeCom group bot + Hunyuan AI
from flask import Flask, request
import requests

app = Flask(__name__)
WECOM_WEBHOOK = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"

@app.route("/wecom-bot", methods=["POST"])
def wecom_bot():
    data = request.json
    user_msg = data.get("text", {}).get("content", "")

    # Call Hunyuan AI for a reply
    response = client.chat.completions.create(
        model="hunyuan-lite",
        messages=[{"role": "user", "content": user_msg}],
        max_tokens=512,
    )

    ai_reply = response.choices[0].message.content

    # Send back to WeCom group
    requests.post(WECOM_WEBHOOK, json={
        "msgtype": "text",
        "text": {"content": f"🤖 AI Assistant: {ai_reply}"}
    })

    return "ok"

if __name__ == "__main__":
    app.run(port=8080)
```

---

## Step 6: Tencent Cloud SDK Native Call

```bash
pip install tencentcloud-sdk-python
```

```python
from tencentcloud.common import credential
from tencentcloud.hunyuan.v20230901 import hunyuan_client, models

cred = credential.Credential(
    os.getenv("TENCENT_SECRET_ID"),
    os.getenv("TENCENT_SECRET_KEY"),
)

client = hunyuan_client.HunyuanClient(cred, "ap-guangzhou")

req = models.ChatCompletionsRequest()
req.Model = "hunyuan-turbo"
req.Messages = [
    {"Role": "user", "Content": "Introduce Tencent Hunyuan LLM in three sentences"}
]

resp = client.ChatCompletions(req)
print(resp.Choices[0].Message.Content)
```

---

## Step 7: Cost Optimization

### Model Selection Guide

| Scenario | Model | Daily Cost Estimate (10K calls) |
|------|------|---------------------|
| Dev/Test | Hunyuan Lite | **¥0 (free)** |
| Customer service bot | Hunyuan Standard | ~¥3 |
| Content generation | Hunyuan Pro | ~¥10 |
| Complex analysis | Hunyuan Turbo | ~¥15 |

### Optimization Tips

```python
# 1. Use Lite for short tasks
def quick_reply(msg: str) -> str:
    response = client.chat.completions.create(
        model="hunyuan-lite",  # Free model
        messages=[{"role": "user", "content": msg}],
        max_tokens=128,         # Limit output
    )
    return response.choices[0].message.content

# 2. Only use Turbo for complex tasks
def deep_analysis(doc: str) -> str:
    response = client.chat.completions.create(
        model="hunyuan-turbo",
        messages=[{"role": "user", "content": f"In-depth analysis: {doc}"}],
        max_tokens=2048,
    )
    return response.choices[0].message.content
```

---

## Comparison with Other Models

| Dimension | Hunyuan Turbo | ERNIE 4.5 | Qwen3 |
|------|-----------|-----------|-------|
| WeChat integration | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Chinese comprehension | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| API pricing | Moderate | Moderate | Moderate |
| Tencent Cloud ecosystem | ⭐⭐⭐⭐⭐ | -- | -- |
| Coding ability | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

> If you're within the Tencent Cloud ecosystem (Mini Programs / WeCom / CloudBase), Hunyuan is the natural first choice.

---

## FAQ

### Q: Can Hunyuan integrate with other Tencent AI services?

**A**: Yes. Hunyuan + Tencent Cloud Document Parsing + Tencent Cloud Translation + Tencent Cloud Speech Recognition can build a complete AI application pipeline.

### Q: Is the free model sufficient?

**A**: Hunyuan Lite is fully adequate for daily customer service, simple Q&A, and copy generation -- and it's permanently free.

### Q: Can it integrate with WeChat Official Accounts?

**A**: Yes. Through the Official Account developer mode + Hunyuan API, you can implement AI auto-reply.

---

## Next Steps

- [Baidu ERNIE API Guide](/tutorials/ernie-api-developer-guide/)
- [China AI Models Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/)

> 📝 Based on Tencent Hunyuan latest API version tested in June 2026.
