---
title: "Chinese Multimodal AI Hands-On: Image Understanding + Video Generation Complete Guide"
description: "Complete guide to Chinese multimodal AI models: Qwen-VL/Kimi-Vision/GLM-4V/Yi-Vision for image understanding, Kling/CogVideo/Video-01 for video generation. Includes OCR/chart parsing/video analysis hands-on code."
category: "Advanced Models"
date: 2026-06-27
tags: ["Multimodal", "Vision", "Video Generation", "Qwen-VL", "Kling", "OCR", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will master the complete capabilities of Chinese multimodal AI:

- Image understanding (Qwen-VL / GLM-4V / Kimi-Vision)
- OCR text recognition
- Chart data extraction
- Video content analysis
- AI video generation (Kling / CogVideo)

> 🎯 2026 is the year of "multimodal AI" explosion. Image understanding + video generation give AI fully opened senses.

---

## Chinese Multimodal Model Matrix

| Model | Type | Top Capability | Pricing |
|-------|------|---------------|---------|
| **Qwen-VL-Max** | Image Understanding | OCR + Charts + Video | ¥2/M |
| **GLM-4V** | Image Understanding | High-res details + multi-image comparison | ¥5/M |
| **Kimi-Vision** | Image Understanding | Document OCR | ¥2/M |
| **Yi-Vision** | Image Understanding | Scene understanding | ¥2/M |
| **Kling V3.0** | Video Generation | Text-to-video + image-to-video | ¥2/use |
| **CogVideoX** | Video Generation | Open-source, local deployment | Free |
| **MiniMax Video** | Video Generation | Fastest generation | ¥1/use |

---

## Step 1: Qwen-VL Image Understanding

```python
from openai import OpenAI
import os, base64

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

def qwen_vision(image_url: str, prompt: str) -> str:
    """Qwen-VL image understanding"""
    response = client.chat.completions.create(
        model="qwen-vl-plus",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content

# Test 1: Scene understanding
result = qwen_vision(
    "https://example.com/office.jpg",
    "描述这张办公室照片中的所有物品，按类别分组",
)
print(result)
```

### Local Image Upload

```python
def encode_image(image_path: str) -> str:
    """Encode a local image to Base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def qwen_vision_local(image_path: str, prompt: str) -> str:
    """Use a local image"""
    b64 = encode_image(image_path)

    response = client.chat.completions.create(
        model="qwen-vl-plus",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content
```

---

## Step 2: OCR Text Recognition

```python
def ocr_extract(image_path: str) -> dict:
    """Extract structured text from an image"""
    prompt = """请识别图片中的所有文字，并按以下 JSON 格式输出：
{
  "title": "Document title (if any)",
  "paragraphs": ["paragraph 1", "paragraph 2", ...],
  "tables": [{"headers": [...], "rows": [[...]]}],
  "key_values": {"field_name": "field_value"},
  "raw_text": "Complete plain text"
}

如果某个部分不存在，设为空数组/空对象。"""

    result = qwen_vision_local(image_path, prompt)

    try:
        return json.loads(result)
    except:
        return {"raw_text": result, "error": "JSON parsing failed"}

# OCR receipt/invoice
def ocr_receipt(image_path: str) -> dict:
    """Dedicated invoice OCR"""
    prompt = """这是一张发票/收据。提取以下信息（JSON格式）：
{
  "invoice_number": "",
  "date": "",
  "seller": "",
  "buyer": "",
  "items": [{"name": "", "quantity": 0, "unit_price": 0, "amount": 0}],
  "total": 0,
  "tax": 0
}"""
    result = qwen_vision_local(image_path, prompt)
    return json.loads(result)
```

---

## Step 3: Chart Data Extraction

```python
def chart_to_data(image_path: str) -> dict:
    """Extract data from chart images"""
    prompt = """Analyze this chart and extract data:

1. Chart type (bar/line/pie/scatter)
2. X-axis label and Y-axis label
3. Values for each data series (as precise as possible)
4. Data trend description

Output in JSON format."""

    result = qwen_vision_local(image_path, prompt)
    return json.loads(result)

def chart_to_code(image_path: str, language: str = "python") -> str:
    """Generate plotting code from a chart screenshot"""
    prompt = f"""Analyze this chart, then regenerate similar chart code using {language} (matplotlib/echarts).
Must include:
- Same chart type
- Similar color scheme
- Appropriate labels and title
- Directly runnable code"""

    return qwen_vision_local(image_path, prompt)
```

---

## Step 4: Multi-Image Comparative Analysis

```python
def compare_images(image_paths: list[str], aspect: str = "differences") -> str:
    """Compare and analyze multiple images"""
    content = []

    for path in image_paths:
        b64 = encode_image(path)
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
        })

    content.append({
        "type": "text",
        "text": f"请对比以上 {len(image_paths)} 张图片，分析它们之间的{aspect}。",
    })

    response = client.chat.completions.create(
        model="qwen-vl-max",  # Use Max for more accurate multi-image comparison
        messages=[{"role": "user", "content": content}],
        max_tokens=2048,
    )

    return response.choices[0].message.content

# Compare two design mockups
diff = compare_images(
    ["design_v1.png", "design_v2.png"],
    "布局、配色、字体、间距等方面的差异",
)
print(diff)
```

---

## Step 5: Video Content Analysis

```python
def analyze_video(video_url: str, analysis_type: str = "summary") -> str:
    """Analyze video content"""
    prompts = {
        "summary": "请总结这个视频的主要内容",
        "key_moments": "请列出视频中的关键时刻（时间点+描述）",
        "objects": "请识别视频中出现的所有人物、物体和场景",
        "transcript": "请提取视频中的所有对话和字幕文字",
    }

    prompt = prompts.get(analysis_type, prompts["summary"])

    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "video_url", "video_url": {"url": video_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Usage
analysis = analyze_video("https://example.com/presentation.mp4", "key_moments")
print(analysis)
```

---

## Step 6: GLM-4V High-Precision Understanding

```python
def glm_vision(image_path: str, prompt: str) -> str:
    """GLM-4V high-resolution image understanding (better detail)"""
    glm_client = OpenAI(
        api_key=os.getenv("ZAI_API_KEY"),
        base_url="https://open.bigmodel.cn/api/paas/v4/",
    )

    b64 = encode_image(image_path)

    response = glm_client.chat.completions.create(
        model="glm-4v",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content

# GLM-4V excels at detail recognition
result = glm_vision(
    "product_detail.jpg",
    "请分析这张产品图的以下细节：产品材质、表面纹理、标签文字、包装设计特点",
)
```

---

## Step 7: Kling Video Generation

```python
import requests
import time

class KlingVideoGenerator:
    """Kling AI video generation"""

    def __init__(self):
        self.access_key = os.getenv("KLING_ACCESS_KEY")
        self.secret_key = os.getenv("KLING_SECRET_KEY")
        self.base_url = "https://api.klingai.com/v1"

        # Get JWT Token
        self.token = self._get_token()

    def _get_token(self) -> str:
        """Get JWT authentication token"""
        import jwt
        payload = {
            "access_key": self.access_key,
            "exp": int(time.time()) + 1800,
            "iat": int(time.time()),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def text_to_video(self, prompt: str, duration: int = 5) -> str:
        """Text-to-video"""
        response = requests.post(
            f"{self.base_url}/videos/text2video",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "model": "kling-v3.0",
                "prompt": prompt,
                "duration": duration,
                "aspect_ratio": "16:9",
                "negative_prompt": "低质量、模糊、变形、文字乱码",
            },
        )

        data = response.json()
        task_id = data["data"]["task_id"]
        print(f"Generation task created: {task_id}")

        # Poll until completion
        return self._wait_for_completion(task_id)

    def image_to_video(self, image_path: str, prompt: str = "") -> str:
        """Image-to-video (animate a static image)"""
        b64 = encode_image(image_path)

        response = requests.post(
            f"{self.base_url}/videos/image2video",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "model": "kling-v3.0",
                "image": b64,
                "prompt": prompt,
                "duration": 5,
            },
        )

        return self._wait_for_completion(
            response.json()["data"]["task_id"]
        )

    def _wait_for_completion(self, task_id: str, timeout: int = 300) -> str:
        """Wait for video generation to complete"""
        start = time.time()

        while time.time() - start < timeout:
            response = requests.get(
                f"{self.base_url}/videos/task/{task_id}",
                headers={"Authorization": f"Bearer {self.token}"},
            )

            status = response.json()["data"]["status"]

            if status == "completed":
                return response.json()["data"]["video_url"]
            elif status == "failed":
                raise Exception("Video generation failed")

            print(f"Generating... ({int(time.time()-start)}s)")
            time.sleep(3)

        raise TimeoutError("Video generation timed out")

# Usage
kling = KlingVideoGenerator()

# Text-to-video
video_url = kling.text_to_video(
    "一个未来城市的清晨，飞行汽车在空中穿行，阳光透过玻璃幕墙洒在街道上，广角镜头，电影质感",
    duration=5,
)
print(f"Video URL: {video_url}")

# Image-to-video
# video_url = kling.image_to_video("product.png", "产品缓慢旋转展示")
```

---

## Multimodal Application Scenarios Summary

| Scenario | Recommended Model | Key Capability |
|----------|------------------|---------------|
| Invoice/ID OCR | Qwen-VL | Structured extraction |
| Chart-to-data | Qwen-VL-Max | Numerical precision |
| Design mockup comparison | GLM-4V | Detail recognition |
| Document understanding | Kimi-Vision | Long document OCR |
| Scene understanding | Yi-Vision | Semantic comprehension |
| Short video generation | Kling V3.0 | Text/image-to-video |
| Free video generation | CogVideoX | Open-source, local |

---

## FAQ

### Q: Can vision models replace OCR engines?

**A**: For regular documents, yes. But for structured forms, handwriting, stamps, and other professional OCR scenarios, dedicated engines (like Baidu OCR API) are still more accurate.

### Q: Can AI-generated videos be used commercially?

**A**: Yes. Copyright of Kling/CogVideo generated videos belongs to the user. However, if the video contains recognizable real people or trademarks, you must obtain authorization.

---

## Next Steps

- [Qwen Vision API Tutorial](/tutorials/qwen-vision-api-tutorial/)
- [Kling AI Video Generation Guide](/tutorials/kling-ai-video-api-guide/)

> 📝 Based on Qwen-VL/GLM-4V/Kling/CogVideoX, tested June 2026.
