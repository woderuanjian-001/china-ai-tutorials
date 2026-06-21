---
title: "Chinese AI Image Generation in Practice: From CogView4 to Tongyi Wanxiang — A Complete Guide"
description: "Complete guide to Chinese AI image generation: Zhipu CogView4, Tongyi Wanxiang, Jimeng, CogVideoX. Includes API calls, image-to-image, style transfer, batch generation with production-ready code. Commercial licensing notes included."
category: "Advanced Models"
date: 2026-06-20
tags: ["AI Art", "CogView", "Tongyi Wanxiang", "Jimeng", "Text-to-Image", "Image-to-Image", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will master calling China's mainstream AI image generation models:

- Zhipu CogView4 — Open-source, commercially usable text-to-image
- Tongyi Wanxiang — Alibaba's strongest image model
- Jimeng — ByteDance's AI image generation
- Text-to-image, image-to-image, and style transfer
- Batch generation and cost control

> 🎯 By 2026, Chinese AI image generation has reached commercial-grade quality. Generating a single image costs only ¥0.03-0.3.

---

## Chinese AI Image Generation Models at a Glance

| Model | Provider | Highlights | API Price | Open Source |
|------|------|------|----------|------|
| **CogView4** | Zhipu AI | Best Chinese language understanding, open-source for commercial use | ¥0.1/image | ✅ Open Source |
| **Tongyi Wanxiang** | Alibaba Cloud | High resolution, excellent Asian faces | ¥0.18/image | ❌ |
| **Jimeng** | ByteDance | Creative styles, social sharing | ¥0.15/image | ❌ |
| **CogVideoX** | Zhipu AI | Text-to-video | Free & open source | ✅ Open Source |

---

## Zhipu CogView4 — Open-Source Text-to-Image

```python
import requests
import os
import base64
import time

class CogView4Generator:
    """CogView4 image generator"""

    def __init__(self):
        self.api_key = os.getenv("ZHIPU_API_KEY")
        self.base_url = "https://open.bigmodel.cn/api/paas/v4"

    def text_to_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        style: str = "photorealistic",
    ) -> str:
        """Text-to-image"""
        response = requests.post(
            f"{self.base_url}/images/generations",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": "cogview-4",
                "prompt": prompt,
                "size": size,
                "style": style,  # photorealistic/anime/oil-painting/sketch
                "n": 1,
            },
        )

        data = response.json()
        return data["data"][0]["url"]

    def image_to_image(
        self,
        image_path: str,
        prompt: str,
        strength: float = 0.7,
    ) -> str:
        """Image-to-image"""
        # Upload the original image
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        response = requests.post(
            f"{self.base_url}/images/generations",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": "cogview-4",
                "prompt": prompt,
                "image": b64,  # Reference image
                "strength": strength,  # 0 = fully preserve original, 1 = fully regenerate
            },
        )

        return response.json()["data"][0]["url"]

    def style_transfer(
        self,
        content_image: str,
        style_prompt: str,
    ) -> str:
        """Style transfer — preserve composition, change style"""
        return self.image_to_image(
            content_image,
            f"Transform this image into {style_prompt} style, preserving the original composition and content",
            strength=0.5,
        )

# Usage
cogview = CogView4Generator()

# Text-to-image
url = cogview.text_to_image(
    "Morning in a traditional Chinese classical garden, with misty veils, pavilions and pagodas faintly visible, soft morning light filtering through bamboo groves onto the stone path, 4K ultra HD, cinematic lighting",
    size="1792x1024",
    style="photorealistic",
)
print(f"Image URL: {url}")

# Image-to-image
new_url = cogview.image_to_image(
    "photo.jpg",
    "Transform it into watercolor painting style, soft tones, artful use of negative space",
    strength=0.6,
)
```

---

## Tongyi Wanxiang — Alibaba's Text-to-Image

```python
class TongyiWanxiang:
    """Tongyi Wanxiang image generator"""

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")

    def text_to_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        size: str = "1024*1024",
        n: int = 1,
        seed: int = None,
    ) -> list[str]:
        """Text-to-image"""
        import dashscope
        from dashscope import ImageSynthesis

        response = ImageSynthesis.call(
            api_key=self.api_key,
            model="wanx-v1",
            prompt=prompt,
            negative_prompt=negative_prompt,
            n=n,
            size=size,
            seed=seed,
        )

        if response.status_code == 200:
            return [r["url"] for r in response.output["results"]]
        else:
            raise Exception(f"Generation failed: {response.message}")

    def generate_product_shot(
        self,
        product_desc: str,
        background: str = "Pure white background, studio lighting",
    ) -> str:
        """Product image generation"""
        prompt = f"""Commercial product photography, {product_desc}, {background},
centered composition, professional lighting, crisp details, e-commerce white-background style"""

        urls = self.text_to_image(
            prompt=prompt,
            negative_prompt="Blurry, low quality, distorted, warped, watermark, text",
            size="1024*1024",
        )
        return urls[0]

    def generate_avatar(
        self,
        gender: str = "Female",
        style: str = "Business formal",
        age: str = "25-35",
    ) -> str:
        """Profile photo generation"""
        prompt = f"""Professional headshot, {gender}, {age}, {style},
Asian face, natural smile, soft lighting, light gray background, studio-quality finish"""

        urls = self.text_to_image(
            prompt=prompt,
            negative_prompt="Over-edited, unnatural proportions, uncanny valley",
            size="1024*1024",
        )
        return urls[0]

# Usage
wanx = TongyiWanxiang()

# Product shot
product_url = wanx.generate_product_shot("Silver stainless steel insulated tumbler, 500ml capacity")

# Avatar
avatar_url = wanx.generate_avatar("Male", "Casual programmer attire", "20-30")
```

---

## Batch Generation + Cost Control

```python
import asyncio

class BatchImageGenerator:
    """Batch generation with cost control"""

    def __init__(self, budget: float = 10.0):
        self.budget = budget  # Total budget (CNY)
        self.spent = 0
        self.cost_per_image = 0.1  # CogView ~¥0.1/image

    def can_generate(self, count: int = 1) -> bool:
        """Check if budget allows generation"""
        cost = count * self.cost_per_image
        return self.spent + cost <= self.budget

    def generate_batch(
        self,
        prompts: list[str],
        output_dir: str = "output",
    ) -> list[dict]:
        """Batch generate and save"""
        os.makedirs(output_dir, exist_ok=True)
        results = []
        cogview = CogView4Generator()

        for i, prompt in enumerate(prompts):
            if not self.can_generate():
                print(f"⚠️ Budget exhausted ({self.spent:.2f}/{self.budget}), stopping")
                break

            try:
                url = cogview.text_to_image(prompt)

                # Download and save
                response = requests.get(url)
                filename = f"{output_dir}/image_{i+1:04d}.png"
                with open(filename, "wb") as f:
                    f.write(response.content)

                self.spent += self.cost_per_image

                results.append({
                    "index": i + 1,
                    "prompt": prompt,
                    "url": url,
                    "file": filename,
                })

                print(f"✅ [{i+1}/{len(prompts)}] {prompt[:40]}... "
                      f"(Budget: ¥{self.spent:.2f}/{self.budget})")

                time.sleep(1)  # API rate limiting

            except Exception as e:
                print(f"❌ [{i+1}] Generation failed: {e}")
                continue

        return results

# Usage
generator = BatchImageGenerator(budget=5.0)  # ¥5 budget

prompts = [
    "An orange tabby cat sitting on a windowsill watching the rain, soft natural light",
    "Cyberpunk-style Beijing hutong, neon lights intertwined with red lanterns",
    "A minimalist white coffee cup in the early morning sun",
    # ... more prompts
]

results = generator.generate_batch(prompts)
print(f"Generated {len(results)} images, spent ¥{generator.spent:.2f}")
```

---

## Prompt Engineering: Writing Effective Chinese Prompts

```python
# Chinese AI image generation prompt template

def build_prompt(
    subject: str,
    style: str = "Photorealistic",
    lighting: str = "Natural light",
    composition: str = "Centered",
    quality: str = "4K high definition",
    extra: str = "",
) -> str:
    """Build a high-quality Chinese prompt"""
    return f"{subject}, {style} style, {lighting}, {composition} composition, {quality}, {extra}".strip(", ")

# Examples
prompts = [
    build_prompt("A golden retriever running on a meadow", "Photorealistic", "Golden sunset backlight", "Dynamic", extra="Shallow depth of field"),
    build_prompt("Modern minimalist living room design", "Interior design render", "Warm daylight", "Wide-angle", extra="Nordic style"),
    build_prompt("An ancient swordsman practicing under the moonlight", "Ink wash painting", "Moonlight", "Vertical", extra="Artful negative space, Eastern aesthetics"),
]

# Negative prompts (to avoid generating unwanted content)
NEGATIVE_PROMPTS = [
    "Blurry", "Low quality", "Deformed", "Distorted",
    "Extra fingers", "Unnatural proportions",
    "Watermark", "Signature", "Text",
    "Uncanny valley", "Clashing colors",
]
```

---

## AI Image Generation Cost Comparison

| Scenario | CogView4 | Tongyi Wanxiang | Jimeng |
|------|----------|----------|--------|
| Text-to-image (1024) | ¥0.10 | ¥0.18 | ¥0.15 |
| Image-to-image | ¥0.10 | ¥0.18 | ¥0.20 |
| 100 images/day | ¥10 | ¥18 | ¥15 |
| 1000 images/month | ¥100 | ¥180 | ¥150 |
| Open-source for commercial use | ✅ | ❌ | ❌ |

---

## Commercial Copyright Notes

| Model | Copyright Ownership | Commercial Usage Notes |
|------|----------|----------|
| CogView4 | Belongs to user | Open-source Apache 2.0, commercial use allowed |
| Tongyi Wanxiang | Belongs to user | Alibaba Cloud ToS permits commercial use |
| Jimeng | Belongs to user | ByteDance ToS permits commercial use |

> ⚠️ While copyright belongs to the user, if generated content infringes on third-party rights (e.g., generating an image resembling a celebrity), the user bears responsibility.

---

## Next Steps

- [Zhipu GLM API Guide](/tutorials/glm-api-developer-guide/)
- [China Multimodal AI Guide](/tutorials/multimodal-chinese-ai-guide/)

> 📝 Based on CogView4 / Tongyi Wanxiang / Jimeng / CogVideoX, tested June 2026.
