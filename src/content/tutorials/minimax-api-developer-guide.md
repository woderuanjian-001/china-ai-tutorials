---
title: "MiniMax API Complete Guide: The Lightweight Multimodal AI Choice"
description: "Complete MiniMax (Xiyu Technology) API tutorial: Python SDK calls, ChatCompletion Pro, speech synthesis TTS, video generation. Covers MiniMax-Text-01 and Speech-02 model hands-on examples."
category: "MiniMax"
date: 2026-06-20
tags: ["MiniMax", "API", "Python", "TTS", "Multimodal", "Speech"]
level: "Beginner"
---

## What This Tutorial Solves

You will master the complete usage of the MiniMax (Xiyu Technology) API:

- MiniMax-Text-01 LLM invocation
- Speech synthesis (TTS) -- multiple voices and emotions
- Video generation (Video-01)
- Python SDK hands-on
- Integration with other Chinese AI models

> 🎯 MiniMax was founded by Yan Junjie, former VP of SenseTime, and is a major player in Chinese multimodal AI. Its TTS capabilities are top-tier in Chinese speech synthesis, with a clean and developer-friendly API.

---

## Step 1: Understanding MiniMax

| Product | Type | Core Capability | Pricing |
|---------|------|---------------|---------|
| **MiniMax-Text-01** | Language Model | Conversation, writing, coding | Very low (far below GPT) |
| **Speech-02** | Speech Synthesis | TTS, 20+ voices, emotions | Per-character billing |
| **Speech-01** | Speech Recognition | ASR, Chinese-English mixed | Per-minute billing |
| **Video-01** | Video Generation | Text-to-video / image-to-video | Per-second billing |
| **Music-01** | Music Generation | AI composition | Per-track billing |

---

## Step 2: Getting an API Key

1. Visit the [MiniMax Open Platform](https://platform.minimaxi.com/) and register
2. Complete verification -> Create an API Key
3. Set the environment variable:

```bash
export MINIMAX_API_KEY="your-api-key"
```

---

## Step 3: Installation and Basic Usage

```bash
pip install openai
```

MiniMax is fully compatible with the OpenAI SDK:

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("MINIMAX_API_KEY"),
    base_url="https://api.minimaxi.com/v1",
)

response = client.chat.completions.create(
    model="MiniMax-Text-01",
    messages=[
        {"role": "system", "content": "你是一个创意写作助手"},
        {"role": "user", "content": "写一个关于AI与人类友谊的短篇故事，200字"}
    ],
    temperature=0.8,
    max_tokens=1024,
)

print(response.choices[0].message.content)
```

---

## Step 4: Function Calling

```python
import json

tools = [{
    "type": "function",
    "function": {
        "name": "search_knowledge_base",
        "description": "Search the knowledge base for information",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "top_k": {"type": "integer", "description": "Number of results", "default": 3}
            },
            "required": ["query"]
        }
    }
}]

def search_knowledge_base(query: str, top_k: int = 3) -> list:
    """Simulated knowledge base search"""
    docs = [
        {"title": "Product Manual", "score": 0.95, "content": f"Product info about '{query}'..."},
        {"title": "FAQ", "score": 0.87, "content": f"FAQ about '{query}'..."},
        {"title": "Technical Docs", "score": 0.76, "content": f"Technical details about '{query}'..."},
    ]
    return docs[:top_k]

def ask_with_knowledge(question: str) -> str:
    messages = [{"role": "user", "content": question}]

    response = client.chat.completions.create(
        model="MiniMax-Text-01",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )

    msg = response.choices[0].message

    if not msg.tool_calls:
        return msg.content

    for tc in msg.tool_calls:
        args = json.loads(tc.function.arguments)
        result = search_knowledge_base(**args)

        messages.append(msg)
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": json.dumps(result, ensure_ascii=False)
        })

    final = client.chat.completions.create(
        model="MiniMax-Text-01",
        messages=messages,
    )

    return final.choices[0].message.content

print(ask_with_knowledge("如何配置API访问权限？"))
```

---

## Step 5: Speech Synthesis (TTS)

MiniMax's TTS is its most outstanding capability:

```python
import requests

def text_to_speech(text: str, voice: str = "male-qn-qingse") -> str:
    """Text-to-speech"""
    url = "https://api.minimaxi.com/v1/t2a_v2"

    headers = {
        "Authorization": f"Bearer {os.getenv('MINIMAX_API_KEY')}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "speech-02-hd",
        "text": text,
        "voice_setting": {
            "voice_id": voice,
            "speed": 1.0,
            "vol": 1.0,
            "pitch": 0,
            "emotion": "happy",  # Emotion: happy/sad/angry/fearful
        },
        "audio_setting": {
            "sample_rate": 32000,
            "format": "mp3",
        },
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    # Save audio
    import base64
    audio_bytes = base64.b64decode(data["data"]["audio"])

    filename = f"tts_output.mp3"
    with open(filename, "wb") as f:
        f.write(audio_bytes)

    return filename

# Generate speech
audio_file = text_to_speech(
    "你好！我是MiniMax的AI语音助手。今天天气不错，适合出门走走。",
    voice="male-qn-qingse"
)
print(f"Audio file: {audio_file}")
```

### Available Voices

| Voice ID | Type | Style |
|----------|------|-------|
| `male-qn-qingse` | Male | Clear and gentle |
| `female-shaonv` | Female | Lively young girl |
| `female-yujie` | Female | Mature and confident |
| `male-qn-jingying` | Male | Elite business professional |

---

## Step 6: Video Generation

```python
def create_video(prompt: str, duration: int = 5) -> str:
    """Text-to-video"""
    url = "https://api.minimaxi.com/v1/video_generation"

    headers = {
        "Authorization": f"Bearer {os.getenv('MINIMAX_API_KEY')}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "video-01",
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": "16:9",
    }

    response = requests.post(url, headers=headers, json=payload)
    task_id = response.json()["task_id"]

    # Poll until completion
    import time
    for _ in range(60):
        time.sleep(10)
        status_resp = requests.get(
            f"{url}?task_id={task_id}",
            headers=headers
        )
        status = status_resp.json()
        if status.get("status") == "completed":
            return status["video_url"]

    raise TimeoutError("Video generation timed out")

# Generate video
video_url = create_video(
    "A peaceful Chinese garden with koi fish swimming in a pond, cherry blossoms falling"
)
print(f"Video: {video_url}")
```

---

## Step 7: Cost and Optimization

| Service | Pricing |
|---------|---------|
| Text-01 Input | ¥1 / million tokens |
| Text-01 Output | ¥3 / million tokens |
| Speech-02 TTS | ¥2 / thousand characters |
| Video-01 | ¥10 / second |

New MiniMax users receive free credits. Text-01 pricing is approximately 1/5 of GPT-5.

---

## Comparison with Other Models

| Dimension | MiniMax | DeepSeek | iFlytek |
|-----------|---------|----------|---------|
| TTS Quality | 5/5 | 2/5 | 5/5 |
| Language Model | 3/5 | 5/5 | 4/5 |
| Video Generation | 4/5 | -- | -- |
| API Pricing | Low | Very low | Medium |

> MiniMax is positioned as a lightweight multimodal solution. For speech/video, choose MiniMax; for text reasoning, choose DeepSeek.

---

## FAQ

### Q: Is MiniMax suitable for production?

**A**: Very mature for speech synthesis and video generation. For pure text conversation, DeepSeek or Qwen is recommended.

### Q: What emotions does TTS support?

**A**: Happy, sad, angry, fearful, neutral. Each emotion significantly affects the expressiveness of the voice.

---

## Next Steps

- [iFlytek Spark API Guide](/tutorials/spark-api-developer-guide/)
- [Chinese AI Model Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/)

> 📝 Based on MiniMax's latest API as of June 2026. All code tested and verified.
