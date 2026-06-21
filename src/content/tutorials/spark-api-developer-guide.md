---
title: "iFlytek Spark API Complete Guide: Speech Recognition and Multimodal AI in Action"
description: "Complete iFlytek Spark large model API tutorial: Spark 4.0 Python calling, speech recognition/synthesis, image understanding, Function Calling. Covers the full Spark Pro/Max/Ultra model lineup."
category: "iFlytek"
date: 2026-06-23
tags: ["iFlytek", "Spark", "API", "Python", "Speech Recognition", "TTS"]
level: "Beginner"
---

## What This Tutorial Solves

You will master the complete API usage of the iFlytek Spark large model:

- Spark 4.0 text conversation
- Speech recognition (ASR) and text-to-speech (TTS)
- Image understanding and multimodal input
- Function Calling tool invocation
- WebSocket streaming long-text processing

> 🎯 iFlytek is China's "national team" in AI, a global leader in **speech technology**. The Spark large model has deep vertical expertise in education and government applications.

---

## Step 1: Get to Know the Spark Model Family

| Model | Type | Context | Highlights | Pricing |
|------|------|--------|------|------|
| **Spark 4.0 Max** | Flagship | 128K | Strongest reasoning, complex tasks | Pay-as-you-go |
| **Spark 4.0 Pro** | Balanced | 128K | Go-to for daily development | Pay-as-you-go |
| **Spark 4.0 Lite** | Lightweight | 8K | Generous free quota | **Free** |
| **Spark 4.0 Ultra** | Ultra | 256K | Largest context, research-grade | Pay-as-you-go |
| **Spark ASR** | Speech recognition | — | Chinese/English/dialects | Pay-as-you-go |
| **Spark TTS** | Text-to-speech | — | Multiple voices/emotions | Pay-as-you-go |

---

## Step 2: Obtain an API Key

1. Visit the [iFlytek Open Platform](https://console.xfyun.cn/) and register
2. Create an application → Obtain **APPID** + **APIKey** + **APISecret**
3. Set environment variables:

```bash
export SPARK_APP_ID="your-app-id"
export SPARK_API_KEY="your-api-key"
export SPARK_API_SECRET="your-api-secret"
```

New users receive a generous amount of free quota.

---

## Step 3: Python SDK Installation and Basic Calling

```bash
pip install spark-ai-python
```

### Basic Conversation

```python
from sparkai.llm.llm import ChatSparkLLM
from sparkai.core.messages import ChatMessage
import os

# Create client
spark = ChatSparkLLM(
    spark_api_url="wss://spark-api.xf-yun.com/v4.0/chat",
    spark_app_id=os.getenv("SPARK_APP_ID"),
    spark_api_key=os.getenv("SPARK_API_KEY"),
    spark_api_secret=os.getenv("SPARK_API_SECRET"),
    spark_llm_domain="4.0Ultra",
    temperature=0.7,
    max_tokens=2048,
)

# Send message
messages = [
    ChatMessage(role="system", content="You are an AI assistant in the education domain"),
    ChatMessage(role="user", content="How to implement a simple student grade management system in Python?"),
]

response = spark.generate([messages])
print(response.generations[0][0].text)
```

### Streaming Output

```python
response = spark.stream([
    ChatMessage(role="user", content="Write an 800-word essay on the application of AI in education")
])

for chunk in response:
    if chunk.generations[0][0].text:
        print(chunk.generations[0][0].text, end="", flush=True)
```

---

## Step 4: Direct WebSocket Connection (Long-Text Processing)

Spark's WebSocket interface is ideal for processing very long texts:

```python
import websocket
import json
import hashlib
import hmac
import base64
from datetime import datetime
from urllib.parse import urlencode, urlparse
import ssl

class SparkWebSocket:
    def __init__(self, app_id, api_key, api_secret):
        self.app_id = app_id
        self.api_key = api_key
        self.api_secret = api_secret
        self.ws_url = "wss://spark-api.xf-yun.com/v4.0/chat"
        self.answer = ""

    def _get_auth_url(self):
        """Generate an authenticated WebSocket URL"""
        host = urlparse(self.ws_url).netloc
        path = urlparse(self.ws_url).path
        now = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")

        signature_origin = f"host: {host}\ndate: {now}\nGET {path} HTTP/1.1"
        signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode(),
                signature_origin.encode(),
                hashlib.sha256
            ).digest()
        ).decode()

        authorization = base64.b64encode(
            f"api_key=\"{self.api_key}\", algorithm=\"hmac-sha256\", "
            f"headers=\"host date request-line\", signature=\"{signature}\""
            .encode()
        ).decode()

        params = {
            "authorization": authorization,
            "date": now,
            "host": host,
        }
        return f"{self.ws_url}?{urlencode(params)}"

    def _on_message(self, ws, message):
        data = json.loads(message)
        code = data["header"]["code"]
        if code != 0:
            print(f"Error: {data['header']['message']}")
            ws.close()
            return

        choices = data["payload"]["choices"]
        status = choices["status"]
        content = choices["text"][0]["content"]
        self.answer += content

        if status == 2:  # Complete
            ws.close()

    def _on_error(self, ws, error):
        print(f"WebSocket error: {error}")

    def _on_open(self, ws):
        # Send conversation request
        params = {
            "header": {"app_id": self.app_id},
            "parameter": {
                "chat": {
                    "domain": "4.0Ultra",
                    "temperature": 0.5,
                    "max_tokens": 4096,
                }
            },
            "payload": {
                "message": {
                    "text": [
                        {"role": "user", "content": "Explain the self-attention mechanism in the Transformer architecture in detail"}
                    ]
                }
            }
        }
        ws.send(json.dumps(params))

    def chat(self, question: str) -> str:
        self.answer = ""
        ws = websocket.WebSocketApp(
            self._get_auth_url(),
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
        )
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
        return self.answer

# Usage
spark_ws = SparkWebSocket(
    os.getenv("SPARK_APP_ID"),
    os.getenv("SPARK_API_KEY"),
    os.getenv("SPARK_API_SECRET"),
)
answer = spark_ws.chat("What is the attention mechanism?")
print(answer)
```

---

## Step 5: Speech Recognition (ASR)

iFlytek's speech recognition is world-leading:

```python
import requests
import base64
import hashlib
import hmac
import time
import json
import os

def asr_recognize(audio_path: str) -> str:
    """Speech-to-text"""
    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode()

    # Build authentication parameters
    api_key = os.getenv("SPARK_API_KEY")
    api_secret = os.getenv("SPARK_API_SECRET")
    host = "iat-api.xfyun.cn"
    url = f"https://{host}/v2/iat"
    now = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime())

    signature_origin = f"host: {host}\ndate: {now}\nPOST /v2/iat HTTP/1.1"
    signature = base64.b64encode(
        hmac.new(api_secret.encode(), signature_origin.encode(), hashlib.sha256).digest()
    ).decode()

    authorization = base64.b64encode(
        f'api_key="{api_key}", algorithm="hmac-sha256", '
        f'headers="host date request-line", signature="{signature}"'
        .encode()
    ).decode()

    headers = {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "Date": now,
    }

    body = {
        "common": {"app_id": os.getenv("SPARK_APP_ID")},
        "business": {
            "language": "zh_cn",
            "domain": "iat",
            "accent": "mandarin",
        },
        "data": {
            "status": 0,
            "format": "audio/L16;rate=16000",
            "encoding": "raw",
            "audio": audio_data,
        },
    }

    response = requests.post(url, headers=headers, json=body)
    result = response.json()
    return result["data"]["result"]["text"]

# Recognize speech
text = asr_recognize("recording.wav")
print(f"Recognition result: {text}")
```

---

## Step 6: Text-to-Speech (TTS)

```python
def tts_synthesize(text: str, voice: str = "xiaoyan") -> str:
    """Text-to-speech, returns audio file path"""
    host = "tts-api.xfyun.cn"
    url = f"https://{host}/v2/tts"
    # ... (authentication similar to ASR)

    body = {
        "common": {"app_id": os.getenv("SPARK_APP_ID")},
        "business": {
            "aue": "lame",       # mp3 format
            "voice_name": voice, # Voice: xiaoyan/xiaofeng/aisjiuxu
            "speed": 50,
            "volume": 50,
            "pitch": 50,
        },
        "data": {
            "status": 2,  # One-shot synthesis
            "text": base64.b64encode(text.encode()).decode(),
        },
    }

    response = requests.post(url, headers=headers, json=body)
    audio_base64 = response.json()["data"]["audio"]
    audio_data = base64.b64decode(audio_base64)

    output_path = "output.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_data)

    return output_path

# Synthesize speech
audio_file = tts_synthesize("Hello, welcome to iFlytek Spark", voice="aisjiuxu")
print(f"Audio saved: {audio_file}")
```

---

## Step 7: Image Understanding

```python
def analyze_image_with_spark(image_path: str, question: str) -> str:
    """Analyze images using Spark multimodal capabilities"""
    with open(image_path, "rb") as f:
        image_base64 = base64.b64encode(f.read()).decode()

    spark = ChatSparkLLM(
        spark_api_url="wss://spark-api.xf-yun.com/v4.0/chat",
        spark_app_id=os.getenv("SPARK_APP_ID"),
        spark_api_key=os.getenv("SPARK_API_KEY"),
        spark_api_secret=os.getenv("SPARK_API_SECRET"),
        spark_llm_domain="image",  # Image understanding domain
    )

    messages = [ChatMessage(
        role="user",
        content=[
            {"type": "text", "text": question},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
        ]
    )]

    response = spark.generate([messages])
    return response.generations[0][0].text

# Analyze an image
result = analyze_image_with_spark(
    "classroom.jpg",
    "Describe the scene in this classroom photo, including the number of students, activities, and atmosphere"
)
print(result)
```

---

## Step 8: Cost Optimization

| Scenario | Recommended Model | Daily Cost Estimate (10K calls) |
|------|---------|-----------------|
| Simple Q&A | Spark Lite | **¥0 (free)** |
| Educational tutoring | Spark Pro | ~¥5 |
| Research analysis | Spark Ultra (256K) | ~¥15 |
| Speech recognition | ASR | ~¥3/hr of audio |
| Speech synthesis | TTS | ~¥2/10K characters |

### Free Quota

- Spark Lite: 5,000 free calls per day
- ASR: 500 free calls per day
- TTS: 500 free calls per day

---

## Comparison with Other Models

| Dimension | Spark 4.0 | ERNIE 4.5 | DeepSeek V4 |
|------|---------|-----------|-------------|
| Speech Technology | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Education Domain | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Code Ability | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Chinese Understanding | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

> iFlytek's core strengths lie in two vertical domains: speech and education. If your project involves voice interaction, Spark is the top choice.

---

## FAQ

### Q: Does iFlytek's speech recognition support dialects?

**A**: Yes. It supports Cantonese, Sichuanese, Henan dialect, Hokkien, and many other dialects, as well as mixed Chinese-English recognition.

### Q: How do I choose between WebSocket and HTTP interfaces?

**A**: Use WebSocket for long texts/streaming output; use the LLM SDK for short texts/RESTful APIs. WebSocket supports context management, making it ideal for long conversations.

---

## Next Steps

- [Baidu ERNIE API](/tutorials/ernie-api-developer-guide/)
- [Ultimate Comparison of Chinese AI Models](/tutorials/china-ai-model-comparison-2026/)

> 📝 Based on iFlytek Spark latest API version tested June 2026.
