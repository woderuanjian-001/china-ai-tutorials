---
title: "FastGPT Knowledge Base with Chinese AI Models: Private Data Q&A System with DeepSeek/Qwen"
description: "Complete FastGPT tutorial with Chinese AI models: Docker deployment, knowledge base training, API integration, workflow orchestration, WeCom embedding. Build a private data AI Q&A system with DeepSeek/Qwen."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["FastGPT", "Knowledge Base", "Private Deployment", "Docker", "WeCom", "Beginner"]
level: "Beginner"
---

## What This Tutorial Covers

You will build a private knowledge base AI Q&A system with FastGPT:

- One-click Docker deployment
- Knowledge base import and training
- API integration
- Workflow orchestration
- Embedding into WeCom / DingTalk

> 🎯 FastGPT is the most active open-source knowledge base project in China (GitHub 18K+ stars). Private data + AI = enterprise-grade intelligent Q&A.

---

## Docker Deployment

```bash
# 1. Create directory
mkdir fastgpt && cd fastgpt

# 2. Download configuration files
curl -O https://raw.githubusercontent.com/labring/FastGPT/main/files/docker/docker-compose.yml
curl -O https://raw.githubusercontent.com/labring/FastGPT/main/projects/app/data/config.json

# 3. Edit config.json to set AI model configuration
# "llmModels": [
#   {
#     "model": "deepseek-v4-pro",
#     "name": "DeepSeek",
#     "baseUrl": "https://api.deepseek.com/v1",
#     "apiKey": "your-key"
#   }
# ]

# 4. Start
docker compose up -d

# 5. Visit http://localhost:3000
```

---

## API: Calling the Knowledge Base

```python
import requests

class FastGPTClient:
    """FastGPT API Client"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def create_knowledge_base(self, name: str, tags: list[str] = None) -> str:
        """Create a knowledge base"""
        response = requests.post(
            f"{self.base_url}/api/core/dataset/create",
            headers=self.headers,
            json={
                "parentId": None,
                "name": name,
                "type": "dataset",
                "tags": tags or [],
            },
        )
        result = response.json()
        kb_id = result["data"]
        print(f"Knowledge base created: {name} (ID: {kb_id})")
        return kb_id

    def upload_file(self, kb_id: str, file_path: str) -> str:
        """Upload a file to the knowledge base"""
        with open(file_path, "rb") as f:
            response = requests.post(
                f"{self.base_url}/api/core/dataset/collection/create/file",
                headers={"Authorization": self.headers["Authorization"]},
                files={"file": f},
                data={
                    "datasetId": kb_id,
                    "trainingType": "chunk",  # chunk/qa/auto
                    "chunkSize": 512,
                },
            )

        collection_id = response.json()["data"]
        print(f"File uploaded: {file_path} → {collection_id}")
        return collection_id

    def search(self, kb_id: str, query: str, top_k: int = 5) -> list[dict]:
        """Search the knowledge base"""
        response = requests.post(
            f"{self.base_url}/api/core/dataset/searchTest",
            headers=self.headers,
            json={
                "datasetId": kb_id,
                "text": query,
                "limit": top_k,
            },
        )

        results = response.json()["data"]
        return [
            {"content": r["content"], "score": r["score"], "source": r.get("sourceName", "")}
            for r in results
        ]

    def chat_with_kb(
        self,
        kb_ids: list[str],
        question: str,
        stream: bool = False,
    ) -> str:
        """AI Q&A based on knowledge base"""
        response = requests.post(
            f"{self.base_url}/api/v1/chat/completions",
            headers=self.headers,
            json={
                "model": "deepseek-v4-pro",
                "messages": [
                    {"role": "user", "content": question},
                ],
                "datasetIds": kb_ids,
                "stream": stream,
                "temperature": 0.3,
            },
        )

        if stream:
            return response.iter_lines()
        else:
            return response.json()["choices"][0]["message"]["content"]

# Usage
fastgpt = FastGPTClient("http://localhost:3000", "your-api-key")

# Create knowledge base
kb_id = fastgpt.create_knowledge_base("Product Manual", ["Product", "FAQ"])

# Upload files
fastgpt.upload_file(kb_id, "product_manual.pdf")
fastgpt.upload_file(kb_id, "faq_document.docx")

# Search
results = fastgpt.search(kb_id, "How to reset the device?")
for r in results:
    print(f"Similarity {r['score']:.3f}: {r['content'][:80]}...")

# Q&A
answer = fastgpt.chat_with_kb([kb_id], "What should I do if the device can't connect to WiFi?")
print(f"\n🤖 AI: {answer}")
```

---

## Workflow Orchestration

```python
# FastGPT workflow — multi-step automation
workflow_config = {
    "nodes": [
        {
            "nodeId": "start",
            "name": "User Input",
            "type": "systemInput",
        },
        {
            "nodeId": "search",
            "name": "Knowledge Base Search",
            "type": "datasetSearch",
            "inputs": {
                "datasets": [kb_id],
                "query": "{{start.userQuestion}}",
                "limit": 5,
            },
        },
        {
            "nodeId": "classify",
            "name": "Intent Classification",
            "type": "aiChat",
            "inputs": {
                "model": "deepseek-v4-pro",
                "systemPrompt": """Classify user intent:
- Product inquiry → Answer using knowledge base
- Complaint / suggestion → Transfer to human agent
- Chitchat → Friendly reply""",
            },
        },
        {
            "nodeId": "answer",
            "name": "Generate Answer",
            "type": "aiChat",
            "inputs": {
                "model": "deepseek-v4-pro",
                "systemPrompt": "Answer the question based on the following knowledge base content:\n{{search.result}}",
            },
        },
    ],
    "edges": [
        {"from": "start", "to": "search"},
        {"from": "search", "to": "classify"},
        {"from": "classify", "to": "answer"},
    ],
}

# Deploy workflow via API
def deploy_workflow(config: dict) -> str:
    """Deploy a workflow"""
    response = requests.post(
        f"{fastgpt.base_url}/api/core/app/create",
        headers=fastgpt.headers,
        json={
            "name": "Customer Service Workflow",
            "type": "advanced",
            "modules": config,
        },
    )
    return response.json()["data"]  # Returns appId
```

---

## Embedding into WeCom

```python
from fastapi import FastAPI, Request
import xml.etree.ElementTree as ET

app = FastAPI()
fastgpt = FastGPTClient("http://localhost:3000", "your-api-key")

@app.post("/wecom/callback")
async def wecom_callback(request: Request):
    """WeCom message callback → FastGPT knowledge base Q&A"""
    body = await request.body()

    # Parse XML message
    root = ET.fromstring(body)
    msg_type = root.find("MsgType").text

    if msg_type == "text":
        content = root.find("Content").text
        user_id = root.find("FromUserName").text

        # Call FastGPT knowledge base
        answer = fastgpt.chat_with_kb(
            kb_ids=["your-kb-id"],
            question=content,
        )

        # Reply to user
        reply_xml = f"""
        <xml>
          <ToUserName>{user_id}</ToUserName>
          <FromUserName>{root.find('ToUserName').text}</FromUserName>
          <CreateTime>{int(time.time())}</CreateTime>
          <MsgType>text</MsgType>
          <Content>{answer[:2000]}</Content>
        </xml>"""

        return Response(content=reply_xml, media_type="application/xml")

    return "success"
```

---

## FastGPT vs. Dify vs. Coze

| Dimension | FastGPT | Dify | Coze |
|------|---------|------|------|
| Open-source | ✅ Apache 2.0 | ✅ Apache 2.0 | ❌ |
| Deployment | Docker (easy) | Docker (easy) | Cloud only |
| Workflows | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Knowledge base | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Chinese ecosystem | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best for** | KB Q&A | Full-scenario AI apps | Chatbots |

---

## FAQ

### Q: How large a document can FastGPT handle?

**A**: Individual files should ideally be under 10MB. For very large documents, split them first and control via chunk size. Default chunk size is 512 tokens, which can be adjusted.

### Q: How accurate are knowledge base answers?

**A**: Depends on document quality and chunk strategy. General Q&A accuracy can reach 90%+. We recommend manually annotating some high-quality Q&A pairs to boost performance.

---

## Next Steps

- [RAG Vector Database Tutorial](/tutorials/vector-database-comparison-china/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> 📝 Based on FastGPT v4.8+, June 2026.
