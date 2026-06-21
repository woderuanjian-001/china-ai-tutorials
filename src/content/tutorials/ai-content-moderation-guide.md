---
title: "Content Moderation with Chinese AI Models: Build Intelligent Review Systems with DeepSeek/Qwen"
description: "Build content moderation systems with Chinese AI models (DeepSeek, Qwen): text sensitive word detection, image moderation, multimodal review, custom policies. Includes moderation API code and enterprise deployment guide."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Content Moderation", "Security", "Sensitive Words", "Text Review", "Image Review", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will use AI to build an automated content moderation system:

- Text sensitive word detection
- Image content moderation
- Custom moderation policies
- Batch moderation API

> Content moderation is a hard requirement for China's internet. AI moderation can replace 80% of manual review work.

---

## Text Content Moderation

```python
import json
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

class TextModerator:
    """AI text content moderator"""

    CATEGORIES = {
        "Political Sensitivity": "Involves political figures, sensitive events, national sovereignty",
        "Pornographic/Vulgar": "Pornographic, vulgar, or borderline content",
        "Violence/Terrorism": "Violence, gore, terrorism",
        "Illegal/Non-compliant": "Fraud, gambling, drugs, pyramid schemes",
        "Personal Attacks": "Verbal abuse, defamation, discrimination, cyberbullying",
        "Spam/Advertising": "Spam ads, false advertising",
        "Normal": "None of the above",
    }

    def moderate(self, text: str) -> dict:
        """Moderate a single text"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a content moderation expert. Classify the text into one of the following categories:
{json.dumps(self.CATEGORIES, ensure_ascii=False, indent=2)}

Output JSON:
{{
  "category": "Category",
  "is_violation": false,
  "reason": "Judgment basis (max 30 words)",
  "violation_text": "Original violating content (empty if none)",
  "confidence": 0.0-1.0
}}

Judgment criteria:
- "Normal" means the content is compliant and does not violate any rules
- Only flag as a violation when there is actual violative content
- Normal technical discussions, news reports, or academic research should be marked as "Normal" even if they mention sensitive terms
- Do not over-moderate""",
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=300,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {
                "category": "Normal",
                "is_violation": False,
                "reason": "AI judgment failed, defaulting to pass",
                "confidence": 0,
            }

    def batch_moderate(self, texts: list[str]) -> list[dict]:
        """Batch moderation"""
        results = []
        for i, text in enumerate(texts):
            result = self.moderate(text)
            result["index"] = i
            result["text_preview"] = text[:50]
            results.append(result)
            print(f"[{i+1}/{len(texts)}] {result['category']}: {result['text_preview']}...")
        return results

    def human_review_queue(self, results: list[dict]) -> list[dict]:
        """Items needing human review (low confidence)"""
        review_needed = []
        for r in results:
            if r["is_violation"] and r["confidence"] < 0.85:
                review_needed.append(r)
            elif not r["is_violation"] and r["confidence"] < 0.7:
                review_needed.append(r)

        print(f"Needs human review: {len(review_needed)}/{len(results)} items")
        return review_needed

# Usage
moderator = TextModerator()

texts = [
    "The weather is so nice today, perfect for going out",
    "Add me on WeChat xxx, get free coupons, limited-time offer",
    "How can you be so stupid, you deserved to be scammed",
]

results = moderator.batch_moderate(texts)

for r in results:
    status = "VIOLATION" if r["is_violation"] else "PASS"
    print(f"{status} | {r['category']} | {r['text_preview']}...")
    if r["is_violation"]:
        print(f"  Reason: {r['reason']}")
```

---

## Image Content Moderation

```python
import base64

class ImageModerator:
    """Image content moderation (using Qwen-VL)"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )

    def moderate(self, image_path: str) -> dict:
        """Moderate a single image"""
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        response = self.client.chat.completions.create(
            model="qwen-vl-plus",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                        },
                        {
                            "type": "text",
                            "text": """Review this image for the following violations:
- Pornographic, nudity, sexual innuendo
- Violence, gore, terror
- Illegal symbols (flags, insignia)
- Personal privacy (ID cards, phone numbers)
- Dangerous behavior or prohibited items

Output JSON:
{"is_violation": false, "violation_type": "", "reason": ""}

Normal landscapes, portraits, products, design images, etc. should be marked as normal.""",
                        },
                    ],
                }
            ],
            temperature=0.1,
            max_tokens=300,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"is_violation": False, "violation_type": "unknown", "reason": "Moderation failed"}

    def batch_moderate_images(self, image_paths: list[str]) -> list[dict]:
        """Batch image moderation"""
        results = []
        for i, path in enumerate(image_paths):
            print(f"[{i+1}/{len(image_paths)}] Moderating: {path}")
            result = self.moderate(path)
            result["path"] = path
            results.append(result)
        return results
```

---

## Custom Moderation Policies

```python
class CustomModerationPolicy:
    """Custom moderation policies — different standards for different scenarios"""

    POLICIES = {
        "strict": {
            "name": "Strict Mode",
            "categories": ["Political Sensitivity", "Pornographic/Vulgar", "Violence/Terrorism", "Illegal/Non-compliant", "Personal Attacks", "Spam/Advertising"],
            "min_confidence": 0.5,
            "auto_block": True,
            "suitable_for": "Products targeting minors",
        },
        "normal": {
            "name": "Normal Mode",
            "categories": ["Pornographic/Vulgar", "Violence/Terrorism", "Illegal/Non-compliant"],
            "min_confidence": 0.7,
            "auto_block": True,
            "suitable_for": "General social platforms",
        },
        "relaxed": {
            "name": "Relaxed Mode",
            "categories": ["Pornographic/Vulgar", "Illegal/Non-compliant"],
            "min_confidence": 0.85,
            "auto_block": False,  # Flag only, no auto-blocking
            "suitable_for": "Tech communities / BBS",
        },
    }

    def apply(self, result: dict, policy_name: str = "normal") -> dict:
        """Apply moderation policy"""
        policy = self.POLICIES[policy_name]

        should_block = (
            result["is_violation"]
            and result["category"] in policy["categories"]
            and result["confidence"] >= policy["min_confidence"]
            and policy["auto_block"]
        )

        return {
            **result,
            "policy": policy["name"],
            "blocked": should_block,
            "action": "Blocked" if should_block else ("Flagged" if result["is_violation"] else "Passed"),
        }

# Usage
policy = CustomModerationPolicy()
moderator = TextModerator()

result = moderator.moderate("Some sensitive content")
decision = policy.apply(result, "normal")
print(f"Moderation result: {decision['action']} ({decision['policy']})")
```

---

## Moderation API Service

```python
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI(title="Content Moderation Service")
moderator = TextModerator()
img_moderator = ImageModerator()
policy = CustomModerationPolicy()

class TextModerationRequest(BaseModel):
    text: str
    policy: str = "normal"

class BatchModerationRequest(BaseModel):
    texts: list[str]
    policy: str = "normal"

@app.post("/api/moderate/text")
async def moderate_text(req: TextModerationRequest):
    """Text moderation API"""
    result = moderator.moderate(req.text)
    decision = policy.apply(result, req.policy)
    return decision

@app.post("/api/moderate/batch")
async def moderate_batch(req: BatchModerationRequest):
    """Batch text moderation"""
    results = moderator.batch_moderate(req.texts)
    decisions = [policy.apply(r, req.policy) for r in results]
    violation_count = sum(1 for d in decisions if d["blocked"])
    return {
        "total": len(decisions),
        "violations": violation_count,
        "pass_rate": f"{(1-violation_count/len(decisions))*100:.1f}%",
        "results": decisions,
    }

@app.post("/api/moderate/image")
async def moderate_image(file: UploadFile = File(...)):
    """Image moderation API"""
    # Save temporary file
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    result = img_moderator.moderate(temp_path)
    return result

# Start: uvicorn moderation_api:app --port 8001
```

---

## Frequently Asked Questions

### Q: Can AI moderation replace human moderation?

**A**: It can replace about 80%. AI handles high-confidence results directly, while low-confidence/edge cases still require human review. This is the mainstream industry approach.

### Q: Will moderation produce false positives?

**A**: Yes. Recommendations: 1) Do not auto-block low-confidence results; route to human review instead; 2) Allow user appeals; 3) Periodically recalibrate moderation standards.

---

## Next Steps

- [AI Security Best Practices](/tutorials/china-ai-security-best-practices/)
- [Enterprise AI Deployment Guide](/tutorials/enterprise-ai-deployment-guide/)

> Based on DeepSeek + Qwen-VL, June 2026.
