---
title: "Data Labeling with Chinese AI Models: Auto-Annotation with DeepSeek/Qwen + Label Studio"
description: "Complete data labeling guide with Chinese AI models: auto-annotation with DeepSeek/Qwen, Label Studio configuration, Chinese NLP labeling, quality review. Includes Python scripts for AI-driven auto-labeling."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Data Labeling", "NLP", "Label Studio", "Auto-Annotation", "Preprocessing", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will use AI to dramatically improve data labeling efficiency:

- Large model auto-annotation (saves 70% manual work)
- Label Studio local deployment
- Chinese NLP labeling in practice
- Annotation quality review process

> 🎯 Data labeling is the most painful part of AI development. Use large models for auto-annotation + human review, and boost efficiency by 10x.

---

## Large Model Auto-Annotation

```python
class AIDataLabeler:
    """Auto-label data using large models"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

    def text_classification(self, texts: list[str], labels: list[str]) -> list[dict]:
        """Auto-labeling for text classification"""
        results = []

        for text in texts:
            response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a text classifier. Classify the text into one of the following categories:
{json.dumps(labels, ensure_ascii=False)}

Output JSON: {{"label": "category", "confidence": 0.0-1.0, "reason": "classification rationale"}}""",
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.1,
                max_tokens=200,
            )

            try:
                result = json.loads(response.choices[0].message.content)
                result["text"] = text
                results.append(result)
            except:
                results.append({"text": text, "label": "unknown", "confidence": 0})

        return results

    def ner_labeling(self, text: str, entity_types: list[str]) -> list[dict]:
        """Auto-labeling for Named Entity Recognition"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an NER annotator. Identify the following entity types in the text:
{json.dumps(entity_types, ensure_ascii=False)}

Output JSON array: [{{"entity": "entity text", "type": "type", "start": start_position, "end": end_position}}]

Note: start/end are character indices.""",
                },
                {"role": "user", "content": text},
            ],
            temperature=0,
            max_tokens=1024,
        )

        try:
            entities = json.loads(response.choices[0].message.content)
            # Add confidence
            for ent in entities:
                ent["confidence"] = 0.85  # Default confidence for AI annotations
            return entities
        except:
            return []

    def sentiment_labeling(self, texts: list[str]) -> list[dict]:
        """Auto-labeling for sentiment analysis"""
        results = []

        for text in texts:
            response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {
                        "role": "system",
                        "content": """Sentiment analyzer. Output JSON:
{"sentiment": "positive/negative/neutral", "score": 0.0-1.0, "keywords": ["sentiment keywords"]}""",
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.1,
                max_tokens=200,
            )

            try:
                result = json.loads(response.choices[0].message.content)
                result["text"] = text
                results.append(result)
            except:
                results.append({"text": text, "sentiment": "neutral", "score": 0.5})

        return results

    def generate_labels_for_label_studio(self, texts: list[str], task_type: str) -> list[dict]:
        """Generate Label Studio-compatible annotation format"""
        tasks = []

        if task_type == "classification":
            labels = ["正面", "负面", "中性"]
            results = self.sentiment_labeling(texts)

            for r in results:
                tasks.append({
                    "data": {"text": r["text"]},
                    "predictions": [{
                        "model_version": "deepseek-v4-auto",
                        "result": [{
                            "from_name": "sentiment",
                            "to_name": "text",
                            "type": "choices",
                            "value": {"choices": [r["sentiment"]]},
                        }],
                        "score": r.get("score", 0.8),
                    }],
                })

        elif task_type == "ner":
            for text in texts:
                entities = self.ner_labeling(text, ["人名", "地名", "组织", "时间", "数字"])

                predictions = []
                for ent in entities:
                    predictions.append({
                        "from_name": "label",
                        "to_name": "text",
                        "type": "labels",
                        "value": {
                            "start": ent["start"],
                            "end": ent["end"],
                            "text": ent["entity"],
                            "labels": [ent["type"]],
                        },
                    })

                tasks.append({
                    "data": {"text": text},
                    "predictions": [{
                        "model_version": "deepseek-v4-auto",
                        "result": predictions,
                    }],
                })

        return tasks

# Usage
labeler = AIDataLabeler()

texts = [
    "This product quality is excellent, used it for half a year with zero issues",
    "Shipping is way too slow, waited a whole week, very disappointed",
    "Nice weather today, perfect for going out",
]

# Sentiment labeling
results = labeler.sentiment_labeling(texts)
for r in results:
    print(f"{r['sentiment']}: {r['text'][:30]}...")

# NER labeling
entities = labeler.ner_labeling(
    "2024年3月，马云在杭州阿里巴巴总部发表演讲",
    ["人名", "地名", "组织", "时间"],
)
for ent in entities:
    print(f"{ent['type']}: {ent['entity']} (confidence: {ent['confidence']})")
```

---

## Label Studio Local Deployment

```bash
# Install via pip
pip install label-studio

# Start
label-studio start --port 8080

# Docker installation (recommended for production)
docker run -it -p 8080:8080 \
  -v $(pwd)/mydata:/label-studio/data \
  heartexlabs/label-studio:latest
```

### Label Studio API + AI

```python
import requests

class LabelStudioManager:
    """Label Studio management API"""

    def __init__(self, url: str = "http://localhost:8080", api_key: str = ""):
        self.url = url
        self.headers = {"Authorization": f"Token {api_key}"}

    def create_project(self, title: str, label_config: str) -> int:
        """Create a labeling project"""
        response = requests.post(
            f"{self.url}/api/projects",
            headers=self.headers,
            json={"title": title, "label_config": label_config},
        )
        return response.json()["id"]

    def import_tasks(self, project_id: int, tasks: list[dict]):
        """Import labeling tasks (with AI predictions)"""
        response = requests.post(
            f"{self.url}/api/projects/{project_id}/import",
            headers=self.headers,
            json=tasks,
        )
        return response.json()

    def export_annotations(self, project_id: int, format: str = "JSON"):
        """Export annotation results"""
        response = requests.get(
            f"{self.url}/api/projects/{project_id}/export",
            headers=self.headers,
            params={"exportType": format},
        )
        return response.json()

    def setup_ml_backend(self, project_id: int, ml_backend_url: str):
        """Configure ML backend for auto-labeling"""
        response = requests.post(
            f"{self.url}/api/ml",
            headers=self.headers,
            json={
                "project": project_id,
                "url": ml_backend_url,
                "title": "AI Auto Labeling",
            },
        )
        return response.json()

# Label Studio labeling config (XML)
SENTIMENT_CONFIG = """
<View>
  <Text name="text" value="$text"/>
  <View style="display: flex; gap: 10px;">
    <Choices name="sentiment" toName="text" choice="single">
      <Choice value="正面" style="background: #4ECDC4"/>
      <Choice value="负面" style="background: #E8563A"/>
      <Choice value="中性" style="background: #95A5A6"/>
    </Choices>
  </View>
</View>
"""

# Generate Label Studio tasks
labeler = AIDataLabeler()
texts = ["服务态度很好，下次还来", "产品质量太差了", "一般般吧"]
tasks = labeler.generate_labels_for_label_studio(texts, "classification")

# Import into Label Studio
ls = LabelStudioManager(api_key="your-api-key")
project_id = ls.create_project("情感标注项目", SENTIMENT_CONFIG)
ls.import_tasks(project_id, tasks)
print(f"✅ Imported {len(tasks)} tasks into project #{project_id}")
```

---

## Annotation Quality Review

```python
def audit_labels(tasks: list[dict], sample_size: int = 20) -> dict:
    """Audit AI annotation quality"""
    import random

    # Random sampling
    samples = random.sample(tasks, min(sample_size, len(tasks)))

    correct = 0
    errors = []

    print(f"Spot-checking {len(samples)} annotations:")
    for i, task in enumerate(samples, 1):
        text = task["data"]["text"]
        prediction = task["predictions"][0]["result"][0]
        ai_label = prediction["value"]["choices"][0]

        print(f"\n[{i}] Original: {text[:50]}...")
        print(f"    AI Label: {ai_label}")
        human = input(f"    Human judgment (1=correct 2=incorrect): ")

        if human == "1":
            correct += 1
        else:
            correct_label = input("    Correct label: ")
            errors.append({"text": text, "ai_label": ai_label, "correct": correct_label})

    accuracy = correct / len(samples)
    print(f"\n{'='*40}")
    print(f"Audit result: {correct}/{len(samples)} = {accuracy:.1%}")

    if accuracy < 0.85:
        print(f"⚠️ Accuracy below 85%, recommend re-labeling!")
    else:
        print(f"✅ Accuracy is acceptable, AI annotations can be adopted")

    return {"accuracy": accuracy, "errors": errors}
```

---

## Labeling Cost Comparison

| Method | 1000 texts | Speed | Accuracy |
|------|-----------|------|--------|
| Pure manual | ¥300-800 | 2-3 days | 95% |
| AI auto + human review | ¥30-50 | 2-3 hours | 93% |
| Pure AI | ¥2-5 | 5 minutes | 85% |

> 💡 Recommended approach: AI auto-annotation + 20% human spot-check. 90% cost reduction with only a 2% accuracy drop.

---

## Next Steps

- [DeepSeek Fine-Tuning Guide](/tutorials/deepseek-fine-tuning-guide/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> 📝 Based on DeepSeek + Label Studio, June 2026.
