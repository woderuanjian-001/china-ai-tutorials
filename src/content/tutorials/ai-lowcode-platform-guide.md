---
title: "Build AI Apps with Chinese LLMs + Low-Code: DeepSeek/Qwen on DingTalk, Feishu & Coze"
description: "Complete guide to building AI apps with Chinese LLMs on low-code platforms: DingTalk Yida AI plugins, Feishu Base AI, Coze agents with DeepSeek/Qwen, and Dify open-source platform. Zero-code AI app development workflow."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Low-Code", "DingTalk", "Feishu", "Coze", "Dify", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will use low-code platforms to rapidly build AI applications:

- Coze intelligent agent creation
- Dify open-source AI application platform
- DingTalk Yida AI plugins
- Feishu Base + AI integration

> 🎯 You can build AI apps even without coding skills. Low-code platforms lower the barrier to zero.

---

## Platform Comparison

| Platform | Type | Free | Best For |
|----------|------|------|----------|
| **Coze** | ByteDance | ✅ Free | Chatbots |
| **Dify** | Open Source | ✅ Open Source | Full-scenario AI apps |
| **DingTalk Yida** | Alibaba | ⚠️ Partially Free | Enterprise internal |
| **Feishu** | ByteDance | ⚠️ Partially Free | Office collaboration |

---

## Coze Intelligent Agent

### Web-Based Creation

1. Visit [coze.cn](https://www.coze.cn)
2. Create a Bot and configure:
   - **Persona**: You are a "Technical Documentation Assistant" helping programmers write technical docs
   - **Model**: Doubao/DeepSeek/Kimi (selectable)
   - **Plugins**: Web Search, Code Executor
   - **Knowledge Base**: Upload your product documentation

### API Calling Coze Bot

```python
import requests
import json

class CozeBot:
    """Call Coze Bot API"""

    def __init__(self, bot_id: str, api_key: str):
        self.bot_id = bot_id
        self.api_key = api_key

    def chat(self, user_id: str, message: str) -> str:
        """Chat"""
        response = requests.post(
            "https://api.coze.cn/v3/chat",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "bot_id": self.bot_id,
                "user_id": user_id,
                "stream": False,
                "auto_save_history": True,
                "additional_messages": [
                    {
                        "role": "user",
                        "content": message,
                        "content_type": "text",
                    }
                ],
            },
        )

        data = response.json()
        chat_id = data["data"]["id"]

        # Wait for response completion
        return self._wait_for_answer(chat_id)

    def _wait_for_answer(self, chat_id: str, timeout: int = 60) -> str:
        """Wait for Bot response"""
        import time
        start = time.time()

        while time.time() - start < timeout:
            response = requests.post(
                "https://api.coze.cn/v3/chat/retrieve",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"chat_id": chat_id, "conversation_id": chat_id},
            )

            data = response.json()
            status = data["data"]["status"]

            if status == "completed":
                messages = data["data"].get("messages", [])
                for msg in messages:
                    if msg["role"] == "assistant":
                        return msg["content"]
            elif status == "failed":
                return "Generation failed"

            time.sleep(1)

        return "Timeout"

# Usage
bot = CozeBot("your-bot-id", "your-api-key")
answer = bot.chat("user_001", "Write documentation for Python quicksort with code and comments")
print(answer)
```

---

## Dify Open-Source AI Platform

```bash
# One-click Docker deployment of Dify
git clone https://github.com/langgenius/dify.git
cd dify/docker
docker compose up -d

# Visit http://localhost:3000
```

### Dify API Calls

```python
class DifyApp:
    """Call Dify application API"""

    def __init__(self, api_key: str, base_url: str = "http://localhost:5001"):
        self.api_key = api_key
        self.base_url = base_url

    def chat(self, query: str, user: str = "user_001") -> str:
        """Chat"""
        response = requests.post(
            f"{self.base_url}/v1/chat-messages",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "inputs": {},
                "query": query,
                "user": user,
                "response_mode": "blocking",
            },
        )
        return response.json()["answer"]

    def chat_stream(self, query: str, user: str = "user_001"):
        """Streaming chat"""
        response = requests.post(
            f"{self.base_url}/v1/chat-messages",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "inputs": {},
                "query": query,
                "user": user,
                "response_mode": "streaming",
            },
            stream=True,
        )

        for line in response.iter_lines():
            if line:
                line = line.decode("utf-8")
                if line.startswith("data:"):
                    data = json.loads(line[5:])
                    if data.get("answer"):
                        yield data["answer"]

# Using Dify
dify = DifyApp("app-your-api-key")

# Blocking mode
print(dify.chat("Help me analyze this sales data"))

# Streaming mode
for chunk in dify.chat_stream("Explain what RAG is"):
    print(chunk, end="", flush=True)
```

---

## DingTalk Yida AI Integration

```javascript
// DingTalk Yida Form — AI auto-fill fields
export function onFieldChange(fieldId, value) {
  // When user enters a requirement description, AI automatically classifies it
  if (fieldId === 'requirement_desc' && value) {
    callAI(value).then(result => {
      // Auto-fill priority
      this.$('priority').setValue(result.priority);
      // Auto-fill category
      this.$('category').setValue(result.category);
      // Auto-estimate work hours
      this.$('est_hours').setValue(result.est_hours);
    });
  }
}

async function callAI(description) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [{
        role: 'system',
        content: 'You are a project classification assistant. Output JSON: {"priority":"high/medium/low","category":"Frontend/Backend/Data/DevOps","est_hours":number}'
      }, {
        role: 'user',
        content: description
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## Feishu Base + AI

```python
# Feishu Base automatic AI analysis
class FeishuAIAnalyzer:
    """Feishu table AI analysis plugin"""

    def __init__(self):
        self.feishu_token = os.getenv("FEISHU_APP_TOKEN")
        self.table_id = os.getenv("FEISHU_TABLE_ID")

    def get_rows(self) -> list:
        """Get table data"""
        response = requests.get(
            f"https://open.feishu.cn/open-apis/bitable/v1/apps/{self.feishu_token}/tables/{self.table_id}/records",
            headers={"Authorization": f"Bearer {self._get_token()}"},
        )
        return response.json()["data"]["items"]

    def ai_analyze(self, rows: list) -> str:
        """AI analyze table data"""
        data_summary = json.dumps(rows, ensure_ascii=False)[:8000]

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a data analyst. Analyze Feishu table data, output: 1) Overall trends 2) Anomalies 3) Improvement suggestions",
                },
                {"role": "user", "content": data_summary},
            ],
            temperature=0.3,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    def auto_tag_rows(self):
        """AI auto-tag table rows"""
        rows = self.get_rows()

        for row in rows:
            content = json.dumps(row["fields"], ensure_ascii=False)

            # AI classification
            response = client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {
                        "role": "system",
                        "content": "Classify the following content, output JSON: {\"tag\": \"label\", \"sentiment\": \"positive/negative/neutral\"}",
                    },
                    {"role": "user", "content": content},
                ],
                temperature=0.1,
                max_tokens=100,
            )

            result = json.loads(response.choices[0].message.content)

            # Write back to Feishu table
            self._update_row(row["record_id"], {
                "Tag": result["tag"],
                "Sentiment": result["sentiment"],
            })

            print(f"✅ {row['record_id']} → {result}")
```

---

## Selection Guide

| Scenario | Recommended Platform |
|----------|---------------------|
| Internal chatbot | Coze |
| Complex AI workflows | Dify |
| Enterprise internal approvals | DingTalk Yida |
| Office collaboration + AI | Feishu |
| Open-source self-deployment | Dify |
| Product prototype validation | Coze |

---

## Next Steps

- [AI Automation Workflows](/tutorials/ai-powered-automation-guide/)
- [Enterprise AI Deployment Guide](/tutorials/enterprise-ai-deployment-guide/)

> 📝 Based on Coze/Dify/DingTalk/Feishu, June 2026.
