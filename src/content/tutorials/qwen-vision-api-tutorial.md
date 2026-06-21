---
title: "Qwen Vision API Complete Tutorial: Image Understanding, OCR, and Multimodal Applications"
description: "Use the Qwen-VL model family for image analysis, OCR text extraction, chart interpretation, and multi-image comparison. Covers Qwen-VL-Max and Qwen-VL-Plus with complete async Python code examples."
category: "Qwen"
date: 2026-06-22
updated: 2026-06-22
tags: ["Qwen", "Vision", "Multimodal", "Python", "OCR", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will learn to use Qwen-VL multimodal models to:

- Perform image content recognition and in-depth analysis
- Extract text via OCR (mixed Chinese-English, handwriting)
- Interpret charts and data visualizations
- Compare multiple images side by side
- Understand video frames
- Process images in batch asynchronously

> 🎯 Qwen-VL is Alibaba's Tongyi Qianwen multimodal vision model, excelling at OCR (especially Chinese), chart understanding, and document analysis.

---

## Step 1: Get to Know the Qwen-VL Model Family

### Available Vision Models

| Model | Positioning | Max Input | Price (input/output per million tokens) | Highlights |
|------|------|---------|--------------------------|------|
| **Qwen-VL-Max** | Flagship vision model | 30K tokens | ¥20 / ¥60 | Best accuracy, complex charts/docs |
| **Qwen-VL-Plus** | High value | 30K tokens | ¥6 / ¥18 | Go-to for everyday image understanding |
| **Qwen2.5-VL** | Open-source, self-deployable | 128K tokens | Free (self-hosted) | 7B/72B multiple sizes |

### API Endpoint

Qwen-VL is provided through the Alibaba Cloud Bailian platform (DashScope), fully compatible with the OpenAI SDK:

```bash
pip install openai
```

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
```

> 💡 To obtain an API Key: visit the [Alibaba Cloud Bailian Console](https://bailian.console.aliyun.com/) and activate the Tongyi Qianwen model service.

---

## Step 2: Basic Image Understanding

### Single Image Analysis

```python
import base64
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

def encode_image(image_path: str) -> str:
    """Encode an image to base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def analyze_image(image_path: str, question: str) -> str:
    """Analyze image content"""
    base64_image = encode_image(image_path)

    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                },
                {
                    "type": "text",
                    "text": question
                }
            ]
        }],
        max_tokens=2048,
    )

    return response.choices[0].message.content

# Usage example
result = analyze_image(
    "landscape.jpg",
    "Please describe the scene, lighting, colors, and atmosphere of this image in detail."
)
print(result)
```

### Using Image URLs (no base64 needed)

```python
def analyze_image_url(image_url: str, prompt: str) -> str:
    """Use image URL directly (recommended, simpler)"""
    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": image_url}  # Pass URL directly
                },
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=2048,
    )
    return response.choices[0].message.content

# Calling with an image URL
desc = analyze_image_url(
    "https://example.com/product-photo.jpg",
    "What items are in this product photo? List them in order of importance from highest to lowest."
)
print(desc)
```

<div class="callout callout-tip">
💡 <strong>URL vs Base64</strong>: The URL method is simpler but requires publicly accessible images. Base64 is better for local images or scenarios requiring confidentiality. Both produce identical results.
</div>

---

## Step 3: OCR Text Extraction

Qwen-VL excels at Chinese OCR:

```python
def ocr_extract(image_path: str, language: str = "Mixed Chinese-English") -> str:
    """Extract text from an image"""
    base64_image = encode_image(image_path)

    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                },
                {
                    "type": "text",
                    "text": f"""Please extract all text from this image.
Requirements:
1. Preserve original layout structure (headings, paragraphs, lists)
2. Language: {language}
3. If tables are present, output in Markdown table format
4. Mark uncertain characters with [?]
5. Preserve numbers and special symbols"""
                }
            ]
        }],
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Extract text from an invoice
invoice_text = ocr_extract("invoice.jpg", "Chinese")
print(invoice_text)
```

### Handwriting Recognition

```python
def recognize_handwriting(image_path: str) -> str:
    """Recognize handwritten text"""
    return analyze_image(
        image_path,
        "Please identify the handwritten text in this image. Mark any illegible parts with [?] and provide your best guess."
    )

# Recognize handwritten notes
handwriting = recognize_handwriting("notes.jpg")
print(f"Recognition result: {handwriting}")
```

---

## Step 4: Chart and Data Visualization Interpretation

```python
def analyze_chart(image_path: str) -> dict:
    """In-depth chart analysis"""
    prompt = """Please analyze this chart:
1. Chart type (line/bar/pie/scatter, etc.)
2. Title and axis labels
3. Data trends: key data points, peaks, valleys
4. Anomalies or noteworthy patterns
5. Summarize the core message conveyed by the chart in natural language"""

    result = analyze_image(image_path, prompt)
    return {"analysis": result}

# Analyze a financial report chart
chart = analyze_chart("revenue-chart.png")
print(chart["analysis"])
```

### Extract Chart Data as JSON

```python
def chart_to_json(image_path: str) -> dict:
    """Extract chart data as structured JSON"""
    base64_image = encode_image(image_path)

    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                },
                {
                    "type": "text",
                    "text": """Please extract the numerical data from this chart and return it in JSON format:
{
  "chart_type": "bar",
  "title": "Chart Title",
  "x_axis": {"label": "Month", "values": ["Jan", "Feb", ...]},
  "y_axis": {"label": "Revenue (10K)", "values": [120, 150, ...]},
  "data_series": [
    {"name": "2025", "values": [...]},
    {"name": "2026", "values": [...]}
  ]
}
Return only JSON, no other text."""
                }
            ]
        }],
        max_tokens=4096,
    )

    import json
    return json.loads(response.choices[0].message.content)

data = chart_to_json("sales-chart.png")
print(f"Chart type: {data['chart_type']}")
print(f"X-axis data: {data['x_axis']['values']}")
```

---

## Step 5: Multi-Image Comparison

```python
def compare_images(image_paths: list[str], question: str) -> str:
    """Analyze multiple images simultaneously"""
    content = []

    # Add multiple images
    for path in image_paths:
        base64_image = encode_image(path)
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        })

    # Add question
    content.append({"type": "text", "text": question})

    response = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[{"role": "user", "content": content}],
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Compare two design proposals
comparison = compare_images(
    ["design-v1.jpg", "design-v2.jpg"],
    """Please compare these two design proposals:
1. Their respective visual style and design language
2. Typography and information hierarchy handling
3. Strengths and weaknesses of the color palette
4. Which is more suitable for e-commerce product display? Why?
5. Provide specific suggestions for improvement"""
)
print(comparison)
```

---

## Step 6: Video Frame Understanding

```python
import cv2

def extract_keyframes(video_path: str, interval: int = 30) -> list[str]:
    """Extract keyframes from a video (one frame every interval seconds)"""
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_interval = fps * interval  # One frame every `interval` seconds

    frames = []
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            timestamp = frame_count / fps
            frame_path = f"frame_{timestamp:.0f}s.jpg"
            cv2.imwrite(frame_path, frame)
            frames.append(frame_path)
            print(f"Extracted frame: {frame_path}")

        frame_count += 1

    cap.release()
    return frames

def analyze_video(video_path: str, question: str = None) -> str:
    """Analyze video content"""
    frames = extract_keyframes(video_path, interval=10)  # One frame every 10 seconds

    if not frames:
        return "Unable to extract video frames"

    if question is None:
        question = """Based on these frames, summarize the video content:
1. Video topic and type (tutorial/vlog/product showcase, etc.)
2. Scene changes and transitions
3. Main people/objects
4. Overall atmosphere and color tone"""

    return compare_images(frames, question)

# Analyze a video
summary = analyze_video("product-review.mp4")
print(summary)
```

---

## Step 7: Async Batch Processing

Batch processing images in production:

```python
import asyncio
from openai import AsyncOpenAI
import base64

async_client = AsyncOpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

async def analyze_single_image(client: AsyncOpenAI, image_path: str, prompt: str) -> dict:
    """Asynchronously analyze a single image"""
    with open(image_path, "rb") as f:
        base64_image = base64.b64encode(f.read()).decode("utf-8")

    response = await client.chat.completions.create(
        model="qwen-vl-plus",  # Use Plus for batch processing — more economical
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                },
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=1024,
    )

    return {
        "image": image_path,
        "result": response.choices[0].message.content,
    }

async def batch_process(image_paths: list[str], prompt: str = "Briefly describe the content of this image") -> list[dict]:
    """Concurrently process multiple images in batch"""
    tasks = [
        analyze_single_image(async_client, path, prompt)
        for path in image_paths
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            results[i] = {"image": image_paths[i], "error": str(result)}

    return results

# Usage
image_list = ["img1.jpg", "img2.jpg", "img3.jpg", "img4.jpg", "img5.jpg"]
results = asyncio.run(batch_process(image_list))
for r in results:
    print(f"{r['image']}: {r['result'][:100]}...")
```

---

## Step 8: Local Deployment of Qwen2.5-VL

For data-privacy-sensitive scenarios, you can deploy the open-source model locally:

```bash
pip install transformers torch accelerate
```

```python
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from PIL import Image
import torch

# Load model (7B version, runs on consumer-grade GPU)
model = Qwen2VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2.5-VL-7B-Instruct",
    torch_dtype="auto",
    device_map="auto",
)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-VL-7B-Instruct")

def local_analyze(image_path: str, question: str) -> str:
    """Local vision model inference"""
    image = Image.open(image_path)

    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text", "text": question},
        ],
    }]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

    inputs = processor(
        text=[text],
        images=[image],
        return_tensors="pt",
    ).to(model.device)

    generated_ids = model.generate(**inputs, max_new_tokens=1024)
    generated_ids = [
        output_ids[len(input_ids):]
        for input_ids, output_ids in zip(inputs.input_ids, generated_ids)
    ]

    return processor.batch_decode(
        generated_ids,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0]

# Local usage
result = local_analyze("photo.jpg", "Describe this image")
print(result)
```

---

## Complete Image Processing Utility Class

```python
import base64
import json
from typing import Optional
from openai import OpenAI
from pathlib import Path

class QwenVision:
    """Qwen-VL image processing utility class"""

    def __init__(self, api_key: str, model: str = "qwen-vl-max"):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        self.model = model

    def _encode(self, path: str) -> str:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def describe(self, image: str, lang: str = "English") -> str:
        """Describe image content"""
        return self._ask(image, f"Please describe this image in detail in {lang}")

    def ocr(self, image: str) -> str:
        """Extract text"""
        return self._ask(
            image,
            "Extract all text, preserving formatting. Mark uncertain characters with [?]. Use Markdown format for tables."
        )

    def extract_json(self, image: str, schema_desc: str) -> dict:
        """Extract structured data"""
        result = self._ask(
            image,
            f"""Extract the following information and return it in JSON format:
{schema_desc}

Return only JSON, no other text."""
        )
        # Clean up possible ```json markers
        result = result.strip()
        if result.startswith("```"):
            result = result.split("\n", 1)[1]
            if result.endswith("```"):
                result = result[:-3]
        return json.loads(result)

    def _ask(self, image: str, question: str) -> str:
        base64_image = self._encode(image)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    },
                    {"type": "text", "text": question}
                ]
            }],
            max_tokens=4096,
        )
        return response.choices[0].message.content


# Usage example
vision = QwenVision(api_key=os.getenv("DASHSCOPE_API_KEY"))

# Describe an image
print(vision.describe("photo.jpg"))

# OCR
print(vision.ocr("document.png"))

# Extract structured data
data = vision.extract_json(
    "business-card.jpg",
    """
{
  "name": "Name",
  "title": "Job Title",
  "company": "Company",
  "phone": "Phone",
  "email": "Email"
}
"""
)
print(data)
```

---

## Error Handling

```python
from openai import (
    APIError,
    RateLimitError,
    APITimeoutError,
    BadRequestError,
)

def safe_vision_call(image_path: str, prompt: str, retries: int = 3) -> Optional[str]:
    """Safe vision API call with retries"""
    for attempt in range(retries):
        try:
            return analyze_image(image_path, prompt)

        except BadRequestError as e:
            # Image format/size issue, no need to retry
            print(f"❌ Bad request format error: {e}")
            return None

        except RateLimitError:
            wait = 2 ** attempt
            print(f"⏳ Rate limited, retrying in {wait}s...")
            time.sleep(wait)

        except APITimeoutError:
            print(f"⏱️ Timeout, retry {attempt+1}/{retries}...")

        except APIError as e:
            print(f"⚠️ API error: {e}")
            if attempt < retries - 1:
                time.sleep(2)

    return None
```

---

## FAQ

### Q: How do I choose between Qwen-VL-Max and Qwen-VL-Plus?

**A**: Use **Plus** for everyday image understanding (cheaper), and **Max** for OCR/charts/complex documents (higher accuracy). The price difference is roughly 3x.

### Q: What image formats are supported?

**A**: JPEG, PNG, WebP, GIF (non-animated), BMP. There is no hard resolution limit, but staying under 4096x4096 is recommended.

### Q: How many images can be analyzed at once?

**A**: Limited by max_tokens (30K). Generally 5–10 images max. For efficiency, consider compositing multiple images into a single collage.

### Q: How good is the local Qwen2.5-VL-7B?

**A**: It is close to the Plus level, slightly weaker than Max for Chinese OCR. But it's completely free and data never leaves your machine — ideal for privacy-sensitive scenarios.

---

## Next Steps

- [Qwen API Python Complete Guide](/tutorials/qwen-api-python-tutorial/)
- [Zhipu GLM-4V Vision Model](/tutorials/glm-api-developer-guide/)
- [Ultimate Comparison of Chinese AI Models (2026 Edition)](/tutorials/china-ai-model-comparison-2026/)

> 📝 **Tutorial version**: Based on Qwen-VL latest API as of June 2026. All code has been tested and verified.
