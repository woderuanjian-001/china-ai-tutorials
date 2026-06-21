---
title: "01.AI Yi API Developer Guide: Ultra-Long Context and Multilingual in Practice"
description: "Complete 01.AI Yi series API tutorial: Yi-Large-Turbo (512K context), Yi-Vision multimodal, Yi-Coder programming assistant, OpenAI-compatible calling. Includes practical code for mixed Chinese-English scenarios."
category: "Advanced Models"
date: 2026-06-20
tags: ["01.AI", "Yi", "Long Context", "Multimodal", "OpenAI Compatible", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will master the full 01.AI Yi model lineup:

- Yi-Large-Turbo's 512K ultra-long context
- Yi-Vision multimodal image understanding
- Yi-Coder code generation
- OpenAI-compatible interface calling
- Multilingual translation and long document processing

> 🎯 01.AI was founded by Kai-Fu Lee, a former Google Brain researcher. The Yi series is known for its ultra-large context window (512K) and multilingual capabilities.

---

## 01.AI API Overview

| Model | Context | Highlights | Best For |
|------|--------|------|----------|
| Yi-Large-Turbo | 512K | Ultra-long context + fast | Long documents, multi-turn conversations |
| Yi-Large | 32K | Balanced performance | General tasks |
| Yi-Medium | 16K | Best value | Daily Q&A |
| Yi-Vision | 16K | Multimodal | Image understanding |
| Yi-Coder | 128K | Code-specialized | Programming assistance |

---

## Step 1: Register and Obtain an API Key

1. Visit the [01.AI Open Platform](https://platform.lingyiwanwu.com)
2. Register an account → Complete real-name verification
3. Go to "API Keys" and create a key

```bash
# Set environment variable
export YI_API_KEY="your-api-key-here"
```

---

## Step 2: Basic Conversation

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("YI_API_KEY"),
    base_url="https://api.lingyiwanwu.com/v1",
)

def yi_chat(prompt: str, model: str = "yi-large-turbo") -> str:
    """Basic conversation"""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are Yi, 01.AI's AI assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2048,
    )

    return response.choices[0].message.content

# Test
print(yi_chat("Introduce 01.AI in three sentences"))
```

---

## Step 3: 512K Ultra-Long Context in Practice

Yi-Large-Turbo's core advantage is its **512K context window** — it can process an entire book in one go.

```python
def analyze_long_document(file_path: str, question: str) -> str:
    """Analyze long documents — leveraging the 512K context"""
    with open(file_path, "r", encoding="utf-8") as f:
        document = f.read()

    print(f"Document length: {len(document)} characters (approx. {len(document)//500} pages)")

    response = client.chat.completions.create(
        model="yi-large-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a document analysis expert. Answer questions based on the provided complete document. Cite specific paragraphs.",
            },
            {
                "role": "user",
                "content": f"""Below is the complete document content:
---
{document}
---

Question: {question}

Please answer in detail based on the document content:""",
            },
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Usage
result = analyze_long_document(
    "./legal_contract_200pages.txt",
    "What are the key clauses in the contract? Summarize the liability for breach section",
)
print(result)
```

### Long Conversation Memory

```python
class LongContextChat:
    """Leverage 512K context to maintain extremely long conversation history"""

    def __init__(self):
        self.messages = [
            {"role": "system", "content": "You are Yi, skilled in long document analysis and deep discussion."}
        ]
        self.total_tokens = 0

    def chat(self, user_input: str) -> str:
        self.messages.append({"role": "user", "content": user_input})
        self.total_tokens += len(user_input)

        response = client.chat.completions.create(
            model="yi-large-turbo",
            messages=self.messages,
            temperature=0.7,
            max_tokens=2048,
        )

        reply = response.choices[0].message.content
        self.messages.append({"role": "assistant", "content": reply})
        self.total_tokens += response.usage.total_tokens

        print(f"Cumulative context: ~{self.total_tokens // 4} chars, "
              f"Remaining capacity: {512000 - self.total_tokens // 4} chars")

        return reply

# Test ultra-long conversation
chat = LongContextChat()
for i in range(50):
    chat.chat(f"Question {i+1}: Continuing analysis of the code architecture we discussed earlier...")
```

---

## Step 4: Yi-Vision Multimodal

```python
def yi_vision(image_url: str, prompt: str) -> str:
    """Yi multimodal image understanding"""
    response = client.chat.completions.create(
        model="yi-vision",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        max_tokens=2048,
    )

    return response.choices[0].message.content

# Example
result = yi_vision(
    "https://example.com/chart.jpg",
    "Analyze the data trends in this chart and provide 3 key insights",
)
print(result)
```

### Base64 Image Upload

```python
import base64

def yi_vision_base64(image_path: str, prompt: str) -> str:
    """Use local images"""
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="yi-vision",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        },
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

## Step 5: Yi-Coder Programming Assistant

```python
def yi_coder(task: str, language: str = "Python") -> str:
    """Generate code using Yi-Coder"""
    response = client.chat.completions.create(
        model="yi-coder",
        messages=[
            {
                "role": "system",
                "content": f"You are a {language} expert. Write high-quality, well-commented code with error handling.",
            },
            {"role": "user", "content": task},
        ],
        temperature=0.3,  # Low temperature for code generation
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Code review
def yi_code_review(code: str, language: str = "Python") -> str:
    """Code review"""
    response = client.chat.completions.create(
        model="yi-coder",
        messages=[
            {
                "role": "system",
                "content": "You are a code review expert. Find bugs, security vulnerabilities, performance issues, and readability improvements.",
            },
            {
                "role": "user",
                "content": f"Review the following {language} code:\n```{language}\n{code}\n```",
            },
        ],
        temperature=0.3,
        max_tokens=2048,
    )

    return response.choices[0].message.content

# Test
code = """
def f(x):
    return eval(x)
"""

print("Review result:")
print(yi_code_review(code))
```

---

## Step 6: Multilingual Translation

```python
def yi_translate(text: str, target_lang: str = "English") -> str:
    """Yi multilingual translation — especially strong at Chinese-English translation"""
    response = client.chat.completions.create(
        model="yi-large-turbo",
        messages=[
            {
                "role": "system",
                "content": f"You are a professional translator. Translate the text into {target_lang}, preserving the original meaning while making the expression natural and fluent.",
            },
            {"role": "user", "content": text},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content

# Batch translation
def batch_translate(texts: list[str], target_lang: str = "English") -> list[str]:
    """Batch translation"""
    results = []
    for text in texts:
        translated = yi_translate(text, target_lang)
        results.append(translated)
    return results

# Usage
chinese_texts = [
    "Artificial intelligence is profoundly transforming every aspect of human society.",
    "01.AI is committed to making AI accessible to everyone.",
    "Ultra-long context windows make long document analysis simple and efficient.",
]

translations = batch_translate(chinese_texts, "English")
for cn, en in zip(chinese_texts, translations):
    print(f"Chinese: {cn}")
    print(f"English: {en}\n")
```

---

## Step 7: Streaming Output

```python
def yi_stream_chat(prompt: str):
    """Streaming conversation"""
    response = client.chat.completions.create(
        model="yi-large-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        stream=True,
    )

    full_text = ""
    print("Yi: ", end="")
    for chunk in response:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            print(content, end="", flush=True)
            full_text += content

    print()
    return full_text

yi_stream_chat("Tell me about the three most unique technical advantages of 01.AI")
```

---

## Step 8: Complete Application — Intelligent Document Assistant

```python
class YiDocumentAssistant:
    """Intelligent document assistant powered by Yi"""

    def __init__(self):
        self.documents = {}  # Loaded documents

    def load_document(self, name: str, content: str):
        """Load a document into context"""
        self.documents[name] = content
        print(f"Loaded: {name} ({len(content)} characters)")

    def ask(self, question: str) -> str:
        """Answer a question based on all loaded documents"""
        context = "\n\n---\n\n".join(
            f"[Document: {name}]\n{content}"
            for name, content in self.documents.items()
        )

        response = client.chat.completions.create(
            model="yi-large-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Answer questions based on the provided documents. Cite document names and specific passages.",
                },
                {
                    "role": "user",
                    "content": f"Document materials:\n{context}\n\nQuestion: {question}",
                },
            ],
            temperature=0.3,
            max_tokens=2048,
        )

        return response.choices[0].message.content

    def summarize(self) -> str:
        """Summarize all documents"""
        return self.ask("Please summarize the core content of all documents, listing key points by document")

    def compare(self, doc_a: str, doc_b: str, aspect: str = "All") -> str:
        """Compare two documents"""
        return self.ask(
            f"Please compare document '{doc_a}' and '{doc_b}' from the perspective of '{aspect}', analyzing similarities and differences"
        )

# Usage
assistant = YiDocumentAssistant()
assistant.load_document("2026 AI Trends Report", "[Report content...]")
assistant.load_document("Company Strategic Plan", "[Plan content...]")

print("Summary:")
print(assistant.summarize())
```

---

## Model Selection Guide

| Scenario | Recommended Model | Reason |
|------|---------|------|
| Long document analysis (>50 pages) | Yi-Large-Turbo | 512K context |
| Daily conversation | Yi-Medium | Best value |
| Image understanding | Yi-Vision | Purpose-built multimodal |
| Code generation/review | Yi-Coder | Programming-optimized |
| Multilingual translation | Yi-Large-Turbo | Strong multilingual ability |

---

## FAQ

### Q: Is 512K context actually useful?

**A**: It is very practical for contract review, academic paper analysis, whole-book summarization, and similar scenarios. But for most conversation scenarios, 32K is sufficient. Note: the longer the context, the slower the API response.

### Q: What advantages does Yi have over other Chinese models?

**A**: Yi's ultra-long context (512K) is a killer feature for multi-turn conversations and long document scenarios. Its Chinese-English bilingual ability also outperforms most competitors.

---

## Next Steps

- [Comprehensive Chinese AI Model Comparison](/tutorials/china-ai-model-comparison-2026/)
- [DeepSeek R1 Reasoning Guide](/tutorials/deepseek-r1-reasoning-guide/)

> 📝 Based on 01.AI Yi series, tested June 2026.
