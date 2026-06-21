---
title: "Chinese AI Workflow Automation: n8n, Coze & Dify Low-Code AI Apps with DeepSeek/Qwen/GLM"
description: "Build AI automation workflows with Chinese AI models and low-code platforms: n8n AI node orchestration, Coze bot development, and Dify knowledge base applications. Includes three-platform comparison and complete workflow examples."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Workflow", "Automation", "Coze", "Dify", "n8n", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will learn to build AI workflows using low-code platforms:

- n8n automation + AI nodes
- Coze (Kouzi) agent development
- Dify knowledge base applications
- Three-platform comparison and selection guide

> 🎯 Don't know how to code? No problem. Drag-and-drop nodes + AI capabilities = build an intelligent customer service bot in 10 minutes. AI workflows enable non-technical people to build AI applications.

---

## n8n + AI Nodes

n8n is an open-source workflow automation platform with 400+ integration nodes. Through n8n's AI nodes (based on LangChain), you can build complex AI workflows.

```python
# Note: n8n is primarily built via Web UI drag-and-drop. The code below demonstrates API automation scenarios.

import requests
from datetime import datetime

class N8nAIWorkflow:
    """n8n AI workflow management"""

    def __init__(self, n8n_url: str, api_key: str):
        self.base_url = n8n_url
        self.headers = {
            "X-N8N-API-KEY": api_key,
            "Content-Type": "application/json",
        }

    def execute_workflow(self, workflow_id: str, input_data: dict) -> dict:
        """Execute n8n workflow"""
        response = requests.post(
            f"{self.base_url}/webhook/{workflow_id}",
            json=input_data,
        )
        return response.json()

    def ai_content_pipeline(self):
        """AI content automation pipeline — Python-side orchestration"""
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

        # 1. AI generates content
        content_response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {"role": "system", "content": "You are a professional content creator"},
                {"role": "user", "content": "Write a 1000-word article about AI automation for a WeChat Official Account"},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        article = content_response.choices[0].message.content

        # 2. AI review
        review_response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": "Review the following article for sensitive content, factual errors, and typos. Output JSON: {\"approved\": true/false, \"issues\": [\"issues\"], \"fixed_text\": \"corrected text\"}"
                },
                {"role": "user", "content": article},
            ],
            temperature=0.1,
            max_tokens=2000,
        )
        try:
            review = json.loads(review_response.choices[0].message.content)
        except:
            review = {"approved": True, "issues": [], "fixed_text": article}

        # 3. If approved, publish to platforms (trigger n8n Webhook)
        if review.get("approved"):
            publish_data = {
                "title": "AI Automation: Let Your Workflows Run Themselves",
                "content": review.get("fixed_text", article),
                "platforms": ["WeChat Official Account", "Zhihu", "Juejin"],
                "publish_time": datetime.now().isoformat(),
            }
            return publish_data

        return {"status": "rejected", "issues": review.get("issues", [])}

# Usage
n8n = N8nAIWorkflow("http://localhost:5678", "your-n8n-api-key")
```

**Typical n8n AI Workflow**

```
Webhook Trigger
    │
    ▼
AI Node (DeepSeek) → Generate Content
    │
    ▼
Condition → Quality Score > 80?
    │
    ├── Yes → Format → Feishu Notification → Publish to CMS
    │
    └── No → Return to AI for Rewrite (max 3 retries)
```

---

## Coze Agent Development

Coze (Kouzi) is ByteDance's AI agent development platform, supporting knowledge bases, plugins, and workflow orchestration.

```python
class CozeAgent:
    """Coze API integration"""

    def __init__(self, api_key: str, bot_id: str):
        self.api_key = api_key
        self.bot_id = bot_id
        self.base_url = "https://api.coze.cn"

    def chat(self, user_id: str, message: str, conversation_id: str = None) -> dict:
        """Call Coze Bot for conversation"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "bot_id": self.bot_id,
            "user_id": user_id,
            "query": message,
            "stream": False,
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id

        response = requests.post(
            f"{self.base_url}/v3/chat",
            headers=headers,
            json=payload,
        )

        data = response.json()
        return {
            "conversation_id": data.get("conversation_id"),
            "messages": [msg.get("content") for msg in data.get("messages", []) if msg.get("type") == "answer"],
        }

    def create_knowledge_base(self, documents: list[dict]) -> str:
        """Create a knowledge base (via API)"""
        # Using the Coze Web Console is more convenient in practice
        # Shown here for API invocation logic
        pass

# Coze workflow configuration example (configured on Coze platform, not code)
"""
┌─────────────────────────────────────────┐
│              User Input                  │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         Knowledge Base Retrieval (RAG)   │
│   ┌─────────┐  ┌─────────┐             │
│   │Product   │  │  FAQ    │             │
│   │Manual    │  │  Docs   │             │
│   └─────────┘  └─────────┘             │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         LLM Node (DeepSeek)              │
│   System: Answer user questions based    │
│   on the knowledge base                  │
│   Temperature: 0.3                       │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│           Conditional Branch             │
│   Problem resolved? ──── Yes → Output    │
│       │                                  │
│       No → Escalate to human agent plugin│
└─────────────────────────────────────────┘
"""
```

---

## Dify Knowledge Base Applications

Dify is an open-source LLM application development platform. Its core features include RAG knowledge bases, agent orchestration, and workflows.

```python
class DifyApp:
    """Dify API integration"""

    def __init__(self, api_key: str, base_url: str = "https://api.dify.ai/v1"):
        self.api_key = api_key
        self.base_url = base_url

    def chat_messages(self, query: str, user: str, conversation_id: str = "") -> dict:
        """Chat application API"""
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        payload = {
            "inputs": {},
            "query": query,
            "response_mode": "blocking",
            "user": user,
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id

        response = requests.post(
            f"{self.base_url}/chat-messages",
            headers=headers,
            json=payload,
        )
        return response.json()

    def run_workflow(self, workflow_inputs: dict, user: str) -> dict:
        """Run Dify workflow"""
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        response = requests.post(
            f"{self.base_url}/workflows/run",
            headers=headers,
            json={"inputs": workflow_inputs, "response_mode": "blocking", "user": user},
        )
        return response.json()

    def upload_document(self, file_path: str, dataset_id: str) -> dict:
        """Upload a document to the knowledge base"""
        headers = {"Authorization": f"Bearer {self.api_key}"}

        with open(file_path, "rb") as f:
            files = {"file": f}
            data = {"dataset_id": dataset_id}
            response = requests.post(
                f"{self.base_url}/datasets/{dataset_id}/documents",
                headers=headers,
                files=files,
                data=data,
            )
        return response.json()

# Usage
dify = DifyApp(os.getenv("DIFY_API_KEY"))

# Dify workflow node chain example
"""
Input Node (User Question)
    │
    ▼
Knowledge Retrieval Node → Retrieve relevant content from documents (Top-K=5, Score>0.7)
    │
    ▼
LLM Node → Generate answer based on retrieved content + user question
    │
    ▼
Conditional Branch Node → Confidence > 0.8?
    │
    ├── Yes → Output directly
    │
    └── No → Prompt user for more information
"""
```

---

## Three-Platform Comparison

| Dimension | n8n | Coze (Kouzi) | Dify |
|-----------|-----|-------------|------|
| **Positioning** | General automation | Agent development | LLM app platform |
| **AI Capabilities** | LangChain nodes | Built-in LLM + plugins | RAG + Agent |
| **Deployment** | Self-hosted/Cloud | Cloud (SaaS) | Self-hosted/Cloud |
| **Knowledge Base** | Via vector DB | ✅ Built-in | ✅ Built-in |
| **Workflow** | 400+ integrations | ✅ Visual | ✅ Visual |
| **Open Source** | ✅ Yes | ❌ No | ✅ Yes |
| **Best For** | Automation + AI hybrid | Chatbots/Agents | Enterprise AI apps |
| **Learning Curve** | Moderate | Easy | Easy |

### Selection Guide

```
Need AI + traditional SaaS automation? → n8n
Need to quickly build a chatbot? → Coze (Kouzi)
Need enterprise-grade RAG knowledge base apps? → Dify
Need full customization? → Use APIs directly (see other chapters in this tutorial)
```

---

## Hybrid Architecture: n8n + Dify + DeepSeek

```python
class HybridAIWorkflow:
    """Hybrid AI workflow — n8n orchestration + Dify knowledge base + DeepSeek reasoning"""

    def customer_service_pipeline(self, user_message: str, user_id: str) -> dict:
        """Intelligent customer service pipeline"""
        # 1. Dify intent recognition
        intent = dify.chat_messages(
            query=f"Recognize the intent of the following user message, reply with intent category only: {user_message}",
            user=user_id,
        )

        # 2. Route based on intent
        intent_text = intent.get("answer", "")

        if "after-sales" in intent_text or "return" in intent_text or "refund" in intent_text:
            # → Knowledge base query
            kb_answer = dify.chat_messages(
                query=user_message,
                user=user_id,
                conversation_id="aftersale_kb_session",
            )
            return {"route": "Knowledge Base", "answer": kb_answer.get("answer")}

        elif "human" in intent_text or "complaint" in intent_text:
            # → n8n triggers human escalation flow
            return {"route": "Human Agent", "message": "Transferring you to a human agent, please hold..."}

        else:
            # → DeepSeek direct reply
            response = client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {"role": "system", "content": "You are a customer service assistant. Respond in a friendly and professional manner."},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.5,
                max_tokens=500,
            )
            return {"route": "AI Direct Reply", "answer": response.choices[0].message.content}

# Usage
hybrid = HybridAIWorkflow()
result = hybrid.customer_service_pipeline("The screen on my phone has a crack — how do I return it?", "user_12345")
print(f"Route: {result['route']}")
print(f"Answer: {result.get('answer', result.get('message', ''))[:200]}")
```

---

## Next Steps

- [Function Calling Guide](/tutorials/ai-function-calling-guide/)
- [AI Model Deployment Optimization](/tutorials/ai-model-deployment-optimization/)

> 📝 Based on n8n + Coze + Dify + DeepSeek, June 2026.
