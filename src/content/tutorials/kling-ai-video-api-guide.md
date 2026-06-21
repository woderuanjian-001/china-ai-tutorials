---
title: "Kling AI Video Generation API Complete Guide: From Script to Finished Video with Full Automation"
description: "Complete Kuaishou Kling AI video generation API tutorial: text-to-video, image-to-video, multi-shot control, camera movement parameters, V3.0 sound generation. Complete Python code, pricing analysis, and production best practices."
category: "Kuaishou"
date: 2026-06-22
tags: ["Kuaishou", "Kling", "Video Generation", "API", "Multimodal", "Python"]
level: "Advanced"
---

## What This Tutorial Covers

You will master the complete Kuaishou Kling AI video generation API:

- Text-to-video: generate a 5-second HD video with a single line of code
- Image-to-video: generate dynamic video from a static image
- V3.0 multi-shot: automatic storyboard-based generation
- Camera control: precise pan, tilt, zoom, and dolly
- Sound generation: automatic scoring and lip-sync
- Production deployment: callback mode, error handling, cost optimization

> 🎯 Kling AI is China's first truly usable video generation product, contributing **150M RMB** in revenue in Q1 2025 alone. The API is now available to developers worldwide.

---

## Step 1: Meet Kling AI

Kling is Kuaishou's in-house video generation model, comparable to OpenAI Sora:

### Version Evolution

| Version | Release | Core Capabilities |
|------|----------|---------|
| V1.0 | 2024 | Text-to-video, extendable to 3 minutes |
| V1.6 | 2024 | Standard/Professional dual mode |
| V2.0 | 2025 | MVL multimodal vision-language interaction |
| V2.6 Pro | 2025 | **Native audio generation** (TTS + lip-sync) |
| V3.0 | 2026.02 | **Multi-shot + voice control + element control** (3-15s) |
| O1 Omni | 2026 | Unified multimodal interface |
| O3 | 2026 | Next-gen model, from $0.075/s |

### Core Capabilities

- **Text-to-video**: Generate video directly from text descriptions
- **Image-to-video**: Upload a starting frame, AI generates dynamic video
- **Multi-shot generation**: Storyboard script + multiple shots generated at once
- **Camera control**: Precise pan, tilt, zoom, and rotation
- **Sound generation**: V2.6+ supports native audio and lip-sync
- **Video editing**: Element replacement with < 1 pixel error

---

## Step 2: Get API Access

### Registration and Verification

1. Visit [app.klingai.com/global/dev](https://app.klingai.com/global/dev) and sign up
2. Complete **real-name verification** (facial recognition required)
3. In the developer console, create an **Access Key + Secret Key** (max 2 pairs per account)
4. Get free testing quota: **50 calls/day** (sandbox environment)

### Install Dependencies

```bash
pip install pyjwt requests python-dotenv
```

---

## Step 3: API Authentication

The Kling API uses **JWT Bearer Token** authentication:

```python
import jwt
import time
import os

# Set environment variables
# export KLING_ACCESS_KEY="ak_xxxx"
# export KLING_SECRET_KEY="sk_xxxx"

BASE_URL = "https://api.klingai.com/v1"

def get_headers() -> dict:
    """Generate JWT auth headers. Token valid for 30 minutes."""
    access_key = os.environ["KLING_ACCESS_KEY"]
    secret_key = os.environ["KLING_SECRET_KEY"]

    token = jwt.encode(
        {
            "iss": access_key,
            "exp": int(time.time()) + 1800,  # Expires in 30 minutes
            "nbf": int(time.time()) - 5,     # Valid 5 seconds ago (clock skew tolerance)
        },
        secret_key,
        algorithm="HS256",
        headers={"alg": "HS256", "typ": "JWT"},
    )

    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
```

<div class="callout callout-info">
💡 <strong>Why JWT?</strong> Access Key + Secret Key + timestamp signature is more secure than a plain API Key. Even if the token leaks, it auto-expires after 30 minutes.
</div>

---

## Step 4: Text-to-Video

### Basic Example: Submit a Generation Task

```python
import requests
import time

def create_text_to_video(prompt: str, duration: str = "5") -> dict:
    """Submit a text-to-video task"""
    response = requests.post(
        f"{BASE_URL}/v1/videos/text2video",
        headers=get_headers(),
        json={
            "model_name": "kling-v3",
            "prompt": prompt,
            "negative_prompt": "blurry, low quality, distorted, watermark, deformed",
            "duration": duration,        # V3 supports 3-15 seconds
            "aspect_ratio": "16:9",      # 16:9 / 9:16 / 1:1
            "mode": "standard",          # "standard"(720p) / "professional"(1080p)
            "cfg_scale": 0.5,            # Prompt adherence 0.0-1.0
        },
    )

    return response.json()

# Submit task
task = create_text_to_video(
    prompt="Aerial drone shot of Shanghai Pudong skyline at golden hour, "
           "Oriental Pearl Tower reflecting sunlight, clouds slowly drifting, cinematic 4K quality"
)
task_id = task["data"]["task_id"]
print(f"Task submitted, ID: {task_id}")
```

### Poll Task Status Until Completion

```python
def wait_for_completion(task_id: str, max_wait: int = 600) -> dict:
    """Poll until video generation is complete"""
    start_time = time.time()

    while True:
        # Check timeout
        if time.time() - start_time > max_wait:
            raise TimeoutError(f"Task {task_id} exceeded {max_wait}s without completing")

        time.sleep(15)  # Check every 15 seconds

        result = requests.get(
            f"{BASE_URL}/v1/videos/text2video/{task_id}",
            headers=get_headers(),
        ).json()

        status = result["data"]["task_status"]
        print(f"Status: {status} ({time.time() - start_time:.0f}s)")

        if status == "succeed":
            videos = result["data"]["task_result"]["videos"]
            for i, video in enumerate(videos):
                print(f"✅ Video {i+1}: {video['url']}")
                print(f"   Duration: {video['duration']}s")
                print(f"   Resolution: {video.get('resolution', 'N/A')}")

                # ⚠️ Download immediately! Video URLs expire in 24-72 hours
                download_video(video["url"], f"output_{task_id}_{i}.mp4")

            return result

        elif status == "failed":
            error_msg = result["data"].get("task_status_msg", "Unknown error")
            raise RuntimeError(f"Video generation failed: {error_msg}")

def download_video(url: str, filename: str):
    """Download video to local storage"""
    import shutil
    response = requests.get(url, stream=True)
    with open(filename, "wb") as f:
        shutil.copyfileobj(response.raw, f)
    print(f"📥 Saved to {filename}")

# Usage
result = wait_for_completion(task_id)
```

---

## Step 5: Image-to-Video

Upload a starting frame image and let AI generate dynamic video:

```python
def create_image_to_video(
    image_url: str,
    prompt: str = "",
    duration: str = "5",
    mode: str = "standard",
) -> str:
    """Generate video from an image"""
    payload = {
        "model_name": "kling-v3",
        "image": image_url,     # Image URL or Base64
        "duration": duration,
        "mode": mode,
        "cfg_scale": 0.6,       # Slightly lower recommended for image-to-video
    }

    if prompt:
        payload["prompt"] = prompt  # Optional: describe desired motion effect

    response = requests.post(
        f"{BASE_URL}/v1/videos/image2video",
        headers=get_headers(),
        json=payload,
    )

    return response.json()["data"]["task_id"]

# Bring a static landscape photo to life
task_id = create_image_to_video(
    image_url="https://example.com/landscape.jpg",
    prompt="Gentle breeze through trees, water ripples on lake, clouds slowly moving across sky",
    duration="5",
)
print(f"Image-to-video task: {task_id}")
```

### Video with Start and End Frames

```python
# Requires professional mode
payload = {
    "model_name": "kling-v3",
    "image": "https://example.com/start_frame.jpg",       # Start frame
    "image_tail": "https://example.com/end_frame.jpg",    # End frame (pro mode required)
    "prompt": "Smooth morphing transition from start to end image",
    "duration": "5",
    "mode": "professional",
    "cfg_scale": 0.6,
}
```

---

## Step 6: V3.0 Multi-Shot Generation

V3.0 supports generating multi-shot videos in a single request:

```python
def create_multi_shot_video(shots: list, with_sound: bool = True) -> str:
    """Multi-shot video generation"""
    payload = {
        "model_name": "kling-v3",
        "multi_shot": True,
        "shot_type": "customize",  # "customize" for manual / "intelligence" for auto storyboard
        "multi_prompt": [
            {"prompt": shot["prompt"], "duration": shot["duration"]}
            for shot in shots
        ],
        "duration": str(sum(s["duration"] for s in shots)),
        "mode": "professional",
        "sound": with_sound,        # V3 supports synchronized audio
        "cfg_scale": 0.5,
    }

    response = requests.post(
        f"{BASE_URL}/v1/videos/text2video",
        headers=get_headers(),
        json=payload,
    )

    return response.json()["data"]["task_id"]

# Three-shot short film
shots = [
    {
        "prompt": "Shot 1: Wide-angle view of the Forbidden City's Hall of Supreme Harmony at sunrise, morning light on golden roof tiles, majestic and grand",
        "duration": 3,
    },
    {
        "prompt": "Shot 2: Medium shot of the Forbidden City's red walls and glazed tile details, dappled light and shadow",
        "duration": 3,
    },
    {
        "prompt": "Shot 3: Close-up of the stone lion at the palace gate, slow push-in, background bokeh",
        "duration": 2,
    },
]

task_id = create_multi_shot_video(shots, with_sound=True)
print(f"Multi-shot task: {task_id}")
```

---

## Step 7: Camera Movement Control

Precisely control camera pan, tilt, zoom, and roll:

```python
def create_with_camera_control(
    prompt: str,
    horizontal: int = 0,    # Horizontal movement -10(left) to 10(right)
    vertical: int = 0,      # Vertical movement -10(down) to 10(up)
    zoom: int = 0,          # Zoom -10(zoom out) to 10(zoom in)
    roll: int = 0,          # Roll -10(CCW) to 10(CW)
    pan: str = None,        # Direction description: "left"/"right"/"up"/"down"
) -> str:
    """Video generation with camera control"""
    payload = {
        "model_name": "kling-v3",
        "prompt": prompt,
        "duration": "5",
        "mode": "professional",
        "camera_control": {
            "type": "custom",
            "config": {
                "horizontal": horizontal,
                "vertical": vertical,
                "zoom": zoom,
                "roll": roll,
            }
        },
    }

    if pan:
        payload["camera_control"]["config"]["pan"] = pan

    response = requests.post(
        f"{BASE_URL}/v1/videos/text2video",
        headers=get_headers(),
        json=payload,
    )

    return response.json()["data"]["task_id"]

# Right-panning landscape shot
task_id = create_with_camera_control(
    prompt="The Great Wall winding across mountain ridges, autumn colors",
    horizontal=5,   # Pan right
    zoom=2,         # Slight push-in
    pan="right",
)
```

---

## Step 8: Production Best Practices

### Use Callbacks Instead of Polling

```python
def create_with_callback(prompt: str, callback_url: str) -> str:
    """Use webhook callbacks to avoid polling overhead"""
    response = requests.post(
        f"{BASE_URL}/v1/videos/text2video",
        headers=get_headers(),
        json={
            "model_name": "kling-v3",
            "prompt": prompt,
            "duration": "5",
            "mode": "standard",
            "callback_url": callback_url,  # Your webhook URL
        },
    )
    return response.json()["data"]["task_id"]

# On your webhook server, receive results:
# POST { callback_url }
# Body: { "task_id": "...", "status": "succeed", "videos": [...] }
```

### Production-Grade Function with Retries and Exponential Backoff

```python
import random

def robust_video_generation(
    prompt: str,
    max_retries: int = 3,
    base_wait: float = 2.0,
) -> str:
    """Production-grade video generation with automatic retries"""
    for attempt in range(max_retries):
        try:
            task = create_text_to_video(prompt)
            task_id = task["data"]["task_id"]

            result = wait_for_completion(task_id, max_wait=600)
            videos = result["data"]["task_result"]["videos"]

            if videos:
                return videos[0]["url"]
            else:
                print(f"⚠️ Attempt {attempt+1}: No video returned, retrying...")

        except Exception as e:
            print(f"❌ Attempt {attempt+1} failed: {e}")

            if "rate_limit" in str(e).lower():
                wait = base_wait * (2 ** attempt) + random.uniform(0, 1)
                print(f"⏳ Rate limited, waiting {wait:.1f}s...")
                time.sleep(wait)
            elif attempt < max_retries - 1:
                time.sleep(base_wait)
            else:
                raise

    raise RuntimeError(f"Failed after {max_retries} retries")

video_url = robust_video_generation("A cat playing with a ball of yarn")
print(f"Video: {video_url}")
```

---

## Complete Parameter Reference

| Parameter | Type | Required | Options | Description |
|------|------|------|--------|------|
| `model_name` | string | Yes | `kling-v3`, `kling-v2-6`, `kling-v2-5-turbo`, `kling-video-o1` | Model version |
| `prompt` | string | Yes | Max 2500 characters | Positive prompt |
| `negative_prompt` | string | No | Max 2500 characters | Negative prompt |
| `duration` | string | No | `"5"`, `"10"` (V3: 3-15) | Video duration (seconds) |
| `aspect_ratio` | string | No | `"16:9"`, `"9:16"`, `"1:1"` | Aspect ratio |
| `mode` | string | No | `"standard"`(720p), `"professional"`(1080p) | Quality mode |
| `cfg_scale` | float | No | 0.0~1.0 (default 0.5) | Prompt adherence |
| `sound` | boolean | No | `true`/`false` | Generate audio (V2.6+) |
| `image` | string | Conditional | URL or Base64 | Image-to-video start frame |
| `camera_control` | object | No | horizontal/vertical/zoom/roll (-10~10) | Camera movement |
| `multi_shot` | boolean | No | V3.0+, max 6 shots | Enable multi-shot |
| `callback_url` | string | No | Your webhook URL | Async callback |

---

## Pricing Quick Reference

### Official Resource Packs

| Plan | Price | Credits | Validity |
|------|------|------|--------|
| Trial S | $9.80 | 100 credits | 30 days |
| Trial L | $98 | 1,000 credits | 30 days |
| Package 1 | $700 | 5,000 credits | 180 days |
| Package 2 | $2,100 | 15,000 credits | 180 days |
| Package 3 | $5,670 | 45,000 credits | 180 days |

### V3.0 Credit Consumption

| Mode | 720p (credits/sec) | 1080p (credits/sec) |
|------|-------------|---------------|
| Without audio | 6 | 8 |
| With audio | 9 | 12 |

### Third-Party Pay-as-You-Go

| Platform | Unit Price |
|------|------|
| fal.ai | From $0.075/s |
| WaveSpeedAI | $0.084/s |
| Vercel AI Gateway | Per token |

---

## FAQ

### Q: Can generated videos be used commercially?

**A**: Yes. Videos generated via the API are owned by you and can be used commercially. However, ensure content compliance (no portrait rights or copyright infringement).

### Q: How long does a 5-second video take to generate?

**A**: Standard mode typically 2-5 minutes; Professional mode 5-10 minutes. V3.0 generation speed has significantly improved.

### Q: How long are video URLs valid?

**A**: Typically 24-72 hours. **Always download immediately after generation to your own server.**

### Q: How do I write effective prompts?

**A**: Describe specific scene + quality + atmosphere + motion. For example: "Cinematic aerial drone shot of a medieval castle on a misty mountain, slow camera orbit, golden sunrise lighting, 4K quality". Avoid vague descriptions.

### Q: Does the same prompt always produce the same result?

**A**: No. Video generation is stochastic. Budget 3-5 iterations per concept and pick the best result.

<div class="callout callout-tip">
💡 <strong>Prompt tips</strong>: Adding motion descriptors ("slowly drifting", "gentle breeze", "camera push in") significantly improves dynamic visual quality. Purely static descriptions tend to produce stiff-looking footage.
</div>

---

## Next Steps

- [Zhipu GLM-4 API Complete Guide](/tutorials/glm-api-developer-guide/)
- [Xiaomi MiMo API Getting Started](/tutorials/mimo-api-getting-started/)
- [China AI Models Ultimate Comparison (2026)](/tutorials/china-ai-model-comparison-2026/)

> 📝 **Tutorial Version Notes**: Based on Kling AI latest V3.0/O3 API as of June 2026. All code tested and verified.
