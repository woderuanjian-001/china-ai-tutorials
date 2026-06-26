---
title: "Qwen Agent Framework Guide: Complete Bailian Platform Agent Development Tutorial"
description: "Alibaba Cloud Bailian Platform Agent development full tutorial: Qwen Agent creation, knowledge base configuration, plugin ecosystem, API integration, multi-Agent collaboration. Includes DingTalk bot and WeCom integration hands-on code."
category: "Qwen"
date: 2026-06-20
tags: ["Qwen", "Agent", "Bailian", "DingTalk", "WeCom", "Alibaba Cloud", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will learn to build production-grade AI Agents on the Alibaba Cloud Bailian platform:

- Bailian platform Agent creation and configuration
- Knowledge base retrieval augmentation
- Plugin ecosystem (Amap/Weather/Calculator)
- API integration calls
- DingTalk / WeCom bots

> 🎯 Bailian is Alibaba Cloud's one-stop AI Agent platform, offering visual orchestration + API access. The native ecosystem for Qwen.

---

## Bailian Agent Core Concepts

```
Agent = Model + Instructions + Knowledge Base + Plugins + Workflow

Model: qwen3.7-plus / qwen3.7-max / qwen3.6-flash
Instructions: System Prompt + Few-shot examples
Knowledge Base: Your documents/FAQ/database
Plugins: Amap / Weather / Code Interpreter / Custom
Workflow: Multi-step orchestration (conditions/loops/API calls)
```

---

## Step 1: Creating an Agent on Bailian

1. Visit [Alibaba Cloud Bailian](https://bailian.console.aliyun.com)
2. Go to "Agents" -> "Create Agent"
3. Configure:

```yaml
Model: qwen3.7-plus
Temperature: 0.7
Context Length: 6000

System Instructions: |
  You are an "Alibaba Cloud Technical Advisor," specializing in answering
  questions about Alibaba Cloud products.
  Rules:
  1. Prioritize answers from the knowledge base
  2. When price/specifications are involved, cite official documentation
  3. When uncertain, state the uncertainty and provide ways to get help

Knowledge Base: Bind "Alibaba Cloud Product Documentation"
Plugins: None (knowledge base mode is sufficient)
```

---

## Step 2: API Calling the Agent

```python
import os
import requests
import json

class BailianAgent:
    """Bailian Agent API client"""

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        self.app_id = os.getenv("BAILIAN_APP_ID")  # Agent application ID
        self.base_url = "https://dashscope.aliyuncs.com/api/v1"

    def chat(self, message: str, session_id: str = None) -> dict:
        """Call the Bailian Agent"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        body = {
            "model": self.app_id,  # Bailian uses app_id as model
            "input": {
                "messages": [{"role": "user", "content": message}],
                "session_id": session_id or "",
            },
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2048,
            },
        }

        response = requests.post(
            f"{self.base_url}/apps/{self.app_id}/completion",
            headers=headers,
            json=body,
            timeout=60,
        )

        data = response.json()
        return {
            "answer": data["output"]["text"],
            "session_id": data.get("output", {}).get("session_id", ""),
            "usage": data.get("usage", {}),
        }

    def stream_chat(self, message: str, session_id: str = None):
        """Streaming call"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-DashScope-SSE": "enable",  # Enable SSE streaming
        }

        body = {
            "model": self.app_id,
            "input": {
                "messages": [{"role": "user", "content": message}],
                "session_id": session_id or "",
            },
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2048,
                "incremental_output": True,  # Incremental output
            },
        }

        response = requests.post(
            f"{self.base_url}/apps/{self.app_id}/completion",
            headers=headers,
            json=body,
            stream=True,
            timeout=60,
        )

        for line in response.iter_lines():
            if line:
                line = line.decode("utf-8")
                if line.startswith("data:"):
                    data = json.loads(line[5:])
                    text = data.get("output", {}).get("text", "")
                    if text:
                        yield text

# Usage
agent = BailianAgent()

# Regular conversation
result = agent.chat("What is the difference between ECS cloud servers and lightweight application servers?")
print(result["answer"])

# Streaming conversation
for chunk in agent.stream_chat("Introduce Alibaba Cloud's core products"):
    print(chunk, end="", flush=True)
```

---

## Step 3: Knowledge Base Configuration

```python
# Manage Bailian knowledge base via API
class BailianKnowledgeBase:
    """Bailian knowledge base management"""

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def upload_document(self, kb_id: str, file_path: str) -> str:
        """Upload a document to the knowledge base"""
        url = "https://dashscope.aliyuncs.com/api/v1/knowledge_bases/documents"

        with open(file_path, "rb") as f:
            files = {"file": f}
            data = {"knowledge_base_id": kb_id}

            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
                data=data,
            )

        result = response.json()
        doc_id = result.get("document_id")
        print(f"Document uploaded: {file_path} -> {doc_id}")
        return doc_id

    def search(self, kb_id: str, query: str, top_k: int = 5) -> list:
        """Search the knowledge base"""
        url = "https://dashscope.aliyuncs.com/api/v1/knowledge_bases/search"

        body = {
            "knowledge_base_id": kb_id,
            "query": query,
            "top_k": top_k,
        }

        response = requests.post(url, headers=self.headers, json=body)
        data = response.json()

        results = []
        for item in data.get("documents", []):
            results.append({
                "content": item.get("text", ""),
                "score": item.get("score", 0),
                "source": item.get("metadata", {}).get("source", ""),
            })

        return results

    def list_documents(self, kb_id: str) -> list:
        """List all documents in the knowledge base"""
        url = f"https://dashscope.aliyuncs.com/api/v1/knowledge_bases/{kb_id}/documents"
        response = requests.get(url, headers=self.headers)
        return response.json().get("documents", [])
```

---

## Step 4: Plugin Integration

Bailian's built-in plugins include:

| Plugin | Function | Use Case |
|--------|----------|----------|
| Amap | Location search/route planning | Local life/travel |
| Weather Query | Real-time weather/forecast | Travel/agriculture |
| Code Interpreter | Execute Python code | Data analysis |
| Web Search | Real-time internet search | Information lookup |
| Calculator | Math calculations | General use |

```python
# Declare plugin usage in Agent instructions
system_prompt = """You can use the following plugins:
1. When the user asks about location information, use the "Amap" plugin
2. When the user asks about the weather, use the "Weather Query" plugin
3. When the user needs to calculate, use the "Calculator" plugin

When calling a plugin, first state which plugin you will use, then provide the result."""

# Bailian automatically recognizes and invokes declared plugins
```

---

## Step 5: DingTalk Bot Integration

```python
from fastapi import FastAPI, Request
import hmac
import hashlib
import base64
import time

app = FastAPI()

# DingTalk bot configuration
DINGTALK_APP_SECRET = os.getenv("DINGTALK_APP_SECRET")

def verify_dingtalk_sign(timestamp: str, sign: str) -> bool:
    """Verify DingTalk signature"""
    secret = DINGTALK_APP_SECRET
    string_to_sign = f"{timestamp}\n{secret}"
    hmac_code = hmac.new(
        secret.encode(), string_to_sign.encode(), hashlib.sha256
    ).digest()
    expected = base64.b64encode(hmac_code).decode()
    return sign == expected

@app.post("/dingtalk/webhook")
async def dingtalk_webhook(request: Request):
    """DingTalk bot callback"""
    body = await request.json()

    # Verify signature
    timestamp = request.headers.get("timestamp", "")
    sign = request.headers.get("sign", "")
    if not verify_dingtalk_sign(timestamp, sign):
        return {"error": "Signature verification failed"}

    # Extract user message
    user_message = body.get("text", {}).get("content", "").strip()
    if not user_message:
        return {"msgtype": "text", "text": {"content": "Please enter your question"}}

    # Call Bailian Agent
    agent = BailianAgent()
    result = agent.chat(user_message)

    # Return in DingTalk format
    return {
        "msgtype": "text",
        "text": {"content": result["answer"][:5000]},  # DingTalk 5000 char limit
    }

# DingTalk Webhook URL configuration
# 1. DingTalk group -> Group Settings -> Smart Group Assistant -> Add Bot
# 2. Select "Custom (Webhook access)"
# 3. Configure Webhook URL -> point to your service address /dingtalk/webhook
```

---

## Step 6: WeCom Bot

```python
from wechatpy.enterprise import WeChatClient
from wechatpy.enterprise.crypto import WeChatCrypto

# WeCom configuration
WECOM_CORP_ID = os.getenv("WECOM_CORP_ID")
WECOM_AGENT_ID = os.getenv("WECOM_AGENT_ID")
WECOM_SECRET = os.getenv("WECOM_SECRET")
WECOM_TOKEN = os.getenv("WECOM_TOKEN")
WECOM_ENCODING_AES_KEY = os.getenv("WECOM_ENCODING_AES_KEY")

# Initialize
client = WeChatClient(WECOM_CORP_ID, WECOM_SECRET)
crypto = WeChatCrypto(WECOM_TOKEN, WECOM_ENCODING_AES_KEY, WECOM_CORP_ID)

def handle_wecom_message(msg_content: str, user_id: str) -> str:
    """Handle WeCom messages"""
    agent = BailianAgent()

    # Use session_id to maintain conversation
    result = agent.chat(msg_content, session_id=f"wecom_{user_id}")

    return result["answer"]

@app.post("/wecom/callback")
async def wecom_callback(request: Request):
    """WeCom callback"""
    body = await request.body()
    msg_signature = request.query_params.get("msg_signature", "")
    timestamp = request.query_params.get("timestamp", "")
    nonce = request.query_params.get("nonce", "")

    # Decrypt message
    decrypted = crypto.decrypt_message(body, msg_signature, timestamp, nonce)
    msg = json.loads(decrypted)

    if msg.get("MsgType") == "text":
        content = msg.get("Content", "")
        user_id = msg.get("FromUserName", "")

        # AI processing
        reply = handle_wecom_message(content, user_id)

        # Reply
        client.message.send_text(
            agent_id=WECOM_AGENT_ID,
            user_ids=[user_id],
            content=reply,
        )

    return "success"
```

---

## Bailian vs Direct API Call Comparison

| Dimension | Bailian Agent | Direct Qwen API |
|-----------|-------------|-----------------|
| Development difficulty | Low-code | Write code |
| Knowledge base | Built-in | Must build RAG yourself |
| Plugins | Built-in ecosystem | Must write tools yourself |
| Flexibility | Constrained by platform | Full freedom |
| Cost | From ¥0.008/call | ¥2/million tokens |
| Best for | Business users, rapid validation | Developers, custom needs |

---

## FAQ

### Q: What is the relationship between Bailian and ModelScope?

**A**: ModelScope is Alibaba's open-source model community, while Bailian is the enterprise-grade AI application platform. They complement each other: find models on ModelScope -> deploy applications on Bailian.

### Q: Can I use my own models on Bailian?

**A**: Bailian supports deploying open-source models (Qwen/Llama, etc.) and also provides platform-hosted models directly.

---

## Next Steps

- [Qwen API Tutorial](/tutorials/qwen-api-python-tutorial/)
- [Qwen Vision API](/tutorials/qwen-vision-api-tutorial/)

> 📝 Based on Alibaba Cloud Bailian Platform + Qwen, tested June 2026.
