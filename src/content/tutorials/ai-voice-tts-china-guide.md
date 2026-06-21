---
title: "Chinese AI TTS Hands-On: Complete Comparison of iFlytek, Volcano Engine & Alibaba Cloud TTS"
description: "A complete guide to mainstream Chinese TTS services: iFlytek Open Platform, Volcano Engine Voice, and Alibaba Cloud Speech Synthesis. Includes streaming synthesis, voice cloning, multi-emotion speech, real-time conversation, complete code, and cost comparison."
category: "Advanced Models"
date: 2026-06-27
tags: ["TTS", "Speech Synthesis", "iFlytek", "Volcano Engine", "Voice Cloning", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will master mainstream Chinese speech synthesis services:

- iFlytek Open Platform TTS (most voice options)
- Volcano Engine Voice (by ByteDance, fastest)
- Alibaba Cloud Speech Synthesis (most comprehensive scenarios)
- Streaming synthesis and real-time playback
- Introduction to voice cloning
- Cost comparison and selection guide

> 🎯 By 2026, AI voices are nearly indistinguishable from real human voices. iFlytek offers 200+ voice options, and Volcano Engine has the fastest synthesis speed in the industry.

---

## Service Overview

| Service | Provider | Voices | Free Quota | Price | Highlights |
|---------|----------|--------|------------|-------|------------|
| **iFlytek TTS** | iFlytek | 200+ | 500K chars | $2/10K chars | Emotional speech |
| **Volcano Voice** | ByteDance | 80+ | 1M chars | $1.5/10K chars | Fastest speed |
| **Alibaba Cloud TTS** | Alibaba Cloud | 100+ | 1M chars | $2/10K chars | Best streaming |

---

## iFlytek Open Platform — Emotional Speech Synthesis

```python
import websocket
import json
import hashlib
import base64
import hmac
import time
import wave
import os
import pyaudio
from urllib.parse import urlencode

class XunfeiTTS:
    """iFlytek speech synthesis"""

    def __init__(self):
        self.app_id = os.getenv("XUNFEI_APP_ID")
        self.api_key = os.getenv("XUNFEI_API_KEY")
        self.api_secret = os.getenv("XUNFEI_API_SECRET")
        self.ws_url = "wss://tts-api.xfyun.cn/v2/tts"

    def _build_url(self) -> str:
        """Build authenticated URL"""
        host = "tts-api.xfyun.cn"
        date = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime())

        signature_origin = f"host: {host}\ndate: {date}\nGET /v2/tts HTTP/1.1"
        signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode(),
                signature_origin.encode(),
                hashlib.sha256,
            ).digest()
        ).decode()

        authorization = (
            f'api_key="{self.api_key}", algorithm="hmac-sha256", '
            f'headers="host date request-line", signature="{signature}"'
        )

        params = {
            "authorization": base64.b64encode(authorization.encode()).decode(),
            "date": date,
            "host": host,
        }
        return f"{self.ws_url}?{urlencode(params)}"

    def synthesize(
        self,
        text: str,
        voice: str = "xiaoyan",  # Voice persona
        speed: int = 50,  # Speed 0-100
        volume: int = 50,  # Volume 0-100
        emotion: str = "neutral",  # neutral/happy/sad/angry
        output_file: str = "output.wav",
    ):
        """Synthesize speech and save to file"""
        ws = websocket.create_connection(self._build_url())

        # Send synthesis parameters
        params = {
            "common": {"app_id": self.app_id},
            "business": {
                "aue": "raw",  # Audio encoding
                "sfl": 1,  # Stream return
                "auf": "audio/L16;rate=16000",
                "vcn": voice,  # Voice persona
                "speed": speed,
                "volume": volume,
                "pitch": 50,
                "tte": "UTF8",
                "emotion": emotion,
            },
            "data": {
                "status": 2,  # 2 = last fragment
                "text": base64.b64encode(text.encode()).decode(),
            },
        }
        ws.send(json.dumps(params))

        # Receive audio data
        audio_data = b""
        while True:
            result = ws.recv()
            if not result:
                break
            msg = json.loads(result)

            if msg.get("code") != 0:
                raise Exception(f"Synthesis failed: {msg.get('message')}")

            audio = base64.b64decode(msg["data"]["audio"])
            audio_data += audio

            if msg["data"]["status"] == 2:
                break

        ws.close()

        # Save as WAV
        with wave.open(output_file, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            wf.writeframes(audio_data)

        return output_file

    def play_audio(self, file_path: str):
        """Play audio"""
        p = pyaudio.PyAudio()
        wf = wave.open(file_path, "rb")

        stream = p.open(
            format=p.get_format_from_width(wf.getsampwidth()),
            channels=wf.getnchannels(),
            rate=wf.getframerate(),
            output=True,
        )

        chunk = 1024
        data = wf.readframes(chunk)
        while data:
            stream.write(data)
            data = wf.readframes(chunk)

        stream.stop_stream()
        stream.close()
        p.terminate()

# Usage
xunfei = XunfeiTTS()

# Basic synthesis
xunfei.synthesize(
    "Welcome to iFlytek speech synthesis — a brand new experience powered by AI.",
    voice="xiaoyan",  # Xiaoyan — sweet female voice
    emotion="happy",
    output_file="welcome.wav",
)

# Multi-emotion demo
emotions = [
    ("I'm so happy today!", "happy"),
    ("This makes me very sad.", "sad"),
    ("Stop immediately!", "angry"),
]

for text, emotion in emotions:
    filename = f"emotion_{emotion}.wav"
    xunfei.synthesize(text, emotion=emotion, output_file=filename)
    print(f"✅ {emotion}: {filename}")
```

---

## Volcano Engine Voice — ByteDance Streaming TTS

```python
import requests
import json

class VolcanoTTS:
    """Volcano Engine speech synthesis (ByteDance)"""

    def __init__(self):
        self.app_id = os.getenv("VOLCANO_APP_ID")
        self.token = os.getenv("VOLCANO_TOKEN")
        self.cluster = "volcano_tts"

    def synthesize(
        self,
        text: str,
        voice: str = "zh_female_qingxin",
        output_file: str = "volcano_tts.wav",
    ):
        """Streaming speech synthesis"""
        url = "https://openspeech.bytedance.com/api/v1/tts"

        headers = {
            "Authorization": f"Bearer; {self.token}",
            "Content-Type": "application/json",
        }

        body = {
            "app": {"appid": self.app_id, "token": "placeholder"},
            "user": {"uid": "user_001"},
            "audio": {
                "voice_type": voice,
                "encoding": "wav",
                "speed_ratio": 1.0,
                "volume_ratio": 1.0,
                "pitch_ratio": 1.0,
            },
            "request": {
                "reqid": str(int(time.time() * 1000)),
                "text": text,
                "text_type": "plain",
                "operation": "query",
            },
        }

        response = requests.post(url, headers=headers, json=body, timeout=30)
        data = response.json()

        if data.get("code") == 3000:
            # Success
            audio_base64 = data.get("audio", "")
            if audio_base64:
                with open(output_file, "wb") as f:
                    f.write(base64.b64decode(audio_base64))
                return output_file
        else:
            raise Exception(f"Synthesis failed: {data.get('message')}")

    def text_to_speech_stream(self, text: str, voice: str = "zh_female_qingxin"):
        """Streaming audio generator"""
        # Split long text into segments
        segments = []
        current = ""

        for char in text:
            current += char
            if len(current) >= 200 and char in ".。！？!?\n":
                segments.append(current)
                current = ""

        if current:
            segments.append(current)

        for i, segment in enumerate(segments):
            print(f"Synthesizing... [{i+1}/{len(segments)}]")
            file_path = self.synthesize(segment, voice, f"segment_{i}.wav")
            yield file_path

# Usage
volcano = VolcanoTTS()

volcano.synthesize(
    "Volcano Engine speech synthesis service provides you with high-quality voice generation capabilities.",
    voice="zh_female_qingxin",
    output_file="volcano_demo.wav",
)
```

---

## Alibaba Cloud Speech Synthesis — Most Comprehensive Scenarios

```python
import dashscope

class AliyunTTS:
    """Alibaba Cloud speech synthesis"""

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")

    def synthesize(
        self,
        text: str,
        voice: str = "zhixiaobai",  # Zhi Xiaobai
        rate: float = 1.0,
        output_file: str = "aliyun_tts.wav",
    ):
        """Speech synthesis"""
        from dashscope.audio.tts import SpeechSynthesizer

        result = SpeechSynthesizer.call(
            model="sambert-zhixiaobai-v1",
            text=text,
            sample_rate=16000,
            format="wav",
            api_key=self.api_key,
        )

        if result.get_audio_data():
            with open(output_file, "wb") as f:
                f.write(result.get_audio_data())
            return output_file
        else:
            raise Exception("Synthesis failed")

    def synthesize_with_ssml(self, ssml_text: str, output_file: str = "ssml.wav"):
        """SSML tag synthesis (fine-grained control)"""
        from dashscope.audio.tts import SpeechSynthesizer

        result = SpeechSynthesizer.call(
            model="sambert-zhixiaobai-v1",
            text=ssml_text,
            text_type="SSML",
            sample_rate=16000,
            format="wav",
            api_key=self.api_key,
        )

        if result.get_audio_data():
            with open(output_file, "wb") as f:
                f.write(result.get_audio_data())
            return output_file

# SSML fine-grained control
ssml = """
<speak>
  Welcome to<break time="500ms"/>Alibaba Cloud Speech Synthesis.
  We offer
  <say-as interpret-as="digits">200</say-as>
  different voice options for you to choose from.
  <break time="1s"/>
  Let's start experiencing now!
</speak>
"""
aliyun = AliyunTTS()
aliyun.synthesize_with_ssml(ssml, "ssml_demo.wav")
```

---

## Real-Time Voice Conversation System

```python
import threading
import queue

class RealtimeVoiceChat:
    """Real-time voice conversation: ASR → LLM → TTS"""

    def __init__(self):
        self.xunfei = XunfeiTTS()
        self.audio_queue = queue.Queue()
        self.running = False

    def start_listening(self):
        """Start voice listening"""
        self.running = True
        # Use iFlytek speech recognition or pyaudio recording
        threading.Thread(target=self._listen_loop).start()
        threading.Thread(target=self._speak_loop).start()

    def _listen_loop(self):
        """Listening loop"""
        while self.running:
            # Record + ASR recognition
            user_text = self._record_and_recognize()
            if user_text:
                # AI response
                response = self._ai_chat(user_text)
                # Synthesize speech and put in queue
                self.audio_queue.put(response)

    def _speak_loop(self):
        """Playback loop"""
        while self.running:
            try:
                text = self.audio_queue.get(timeout=1)
                file_path = self.xunfei.synthesize(text)
                self.xunfei.play_audio(file_path)
            except queue.Empty:
                continue

    def _record_and_recognize(self) -> str:
        """Record + speech recognition (simplified)"""
        # Actual implementation requires pyaudio recording + ASR API
        pass

    def _ai_chat(self, text: str) -> str:
        """Call LLM"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[{"role": "user", "content": text}],
            max_tokens=200,
        )
        return response.choices[0].message.content

    def stop(self):
        """Stop"""
        self.running = False
```

---

## Cost Comparison

| Service | Free Quota | 10K Chars | 100K Chars | 1M Chars |
|---------|------------|-----------|------------|----------|
| iFlytek | 500K chars | $2 | $20 | $200 |
| Volcano Engine | 1M chars | $1.5 | $15 | $150 |
| Alibaba Cloud | 1M chars | $2 | $20 | $200 |

> 💡 Recommendation: Personal projects — use Volcano Engine (largest free quota of 1M chars). Commercial use — choose iFlytek (richest voice and emotion options).

---

## Next Steps

- [Multimodal AI Guide](/tutorials/multimodal-chinese-ai-guide/)
- [China AI Model Pricing Comparison](/tutorials/china-ai-model-pricing-comparison/)

> 📝 Based on iFlytek/Volcano/Aliyun TTS, June 2026.
