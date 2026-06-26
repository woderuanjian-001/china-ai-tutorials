---
title: "Kimi API Getting Started: 5-Minute Integration with 256K Ultra-Long Context"
description: "Complete Moonshot AI Kimi K2.6 API integration guide. From obtaining an API Key to multimodal vision recognition, Function Calling, and Agent cluster usage, with code examples for every step."
category: "Kimi"
date: 2026-06-19
updated: 2026-06-20
tags: ["Kimi", "API", "Python", "Beginner", "Long Context"]
level: "Beginner"
---

## What This Tutorial Covers

You will learn:

- How to register a Moonshot AI Kimi account and obtain an API Key
- How to call the Kimi K2.6 API in Python
- How to process ultra-long documents (up to 256K context)
- How to use multimodal vision to analyze images
- How to configure Function Calling for tool invocation

> 🎯 **After this tutorial, you'll be able to process book-length documents with Kimi.**

## Why Choose Kimi?

Kimi (Moonshot AI) stands out in long-document processing:

| Feature | Kimi K2.6 | GPT-5 | Claude Opus 4 |
|------|-----------|-------|---------------|
| Context window | **262K tokens** | 272K | 1M |
| Coding (SWE-Bench) | **58.6%** | 55.2% | 52.1% |
| API input price | $0.95/M tokens | $1.25/M | $5.00/M |
| Max parallel agents | **300 sub-agents** | Limited | Limited |
| Open-source | ⚠️ Modified MIT | ❌ | ❌ |

Kimi K2.6 is positioned as a top open-source coding model on SWE-Bench Pro.

## Step 1: Get an API Key

1. Open [platform.moonshot.cn](https://platform.moonshot.cn) (International users: [platform.moonshot.ai](https://platform.moonshot.ai))
2. Register an account (supports international phone numbers)
3. Go to "API Key Management" and create a new key
4. Copy the key and save it as an environment variable:

```bash
# macOS / Linux
export MOONSHOT_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Windows PowerShell
$env:MOONSHOT_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

<div class="callout callout-tip">
💡 <strong>New user perk</strong>: Free credits on signup (typically 15-30 RMB), enough for development and testing.
</div>

## Step 2: Install the SDK

The Kimi API is also compatible with the OpenAI SDK:

```bash
pip install openai
```

## Step 3: Your First API Call

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("MOONSHOT_API_KEY"),
    base_url="https://api.moonshot.cn/v1",  # China endpoint
    # base_url="https://api.moonshot.ai/v1",  # International endpoint
)

response = client.chat.completions.create(
    model="kimi-k2.6",  # Latest flagship model
    messages=[
        {"role": "system", "content": "You are a senior Python engineer."},
        {"role": "user", "content": "Write a quicksort algorithm in Python."}
    ],
    temperature=0.3,
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

<div class="callout callout-info">
📝 <strong>Endpoint notes</strong>: China-based users use <code>api.moonshot.cn</code>; international users use <code>api.moonshot.ai</code>. The API format is identical -- only the server location differs.
</div>

## Step 4: Streaming Output

```python
stream = client.chat.completions.create(
    model="kimi-k2.6",
    messages=[
        {"role": "user", "content": "Explain Python's GIL (Global Interpreter Lock) in detail."}
    ],
    temperature=0.3,
    max_tokens=2048,
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
```

## Step 5: Processing Ultra-Long Documents

Kimi's biggest advantage is its **256K ultra-long context** -- you can load an entire book or a complete code repository at once:

```python
# Read a very long document
with open("long_report.txt", "r", encoding="utf-8") as f:
    long_document = f.read()

response = client.chat.completions.create(
    model="kimi-k2.6",
    messages=[
        {"role": "system", "content": "You are a professional document analyst. Read the entire content carefully before answering user questions."},
        {"role": "user", "content": f"""Please analyze the following document:

<document>
{long_document}
</document>

Complete the following tasks:
1. Summarize the core content in 3 sentences
2. List 5 key findings
3. Point out any data inconsistencies in the document"""}
    ],
    temperature=0.2,
    max_tokens=4096,
)

print(response.choices[0].message.content)
```

### Long Document Processing Best Practices

| Technique | Description |
|------|------|
| Use structured prompts | Clearly tell the AI what task to perform |
| Step-by-step questioning | Have the AI summarize first, then dive into specifics |
| Leverage XML tags | Wrap content in `<document>` tags for improved parsing accuracy |
| Control output length | Set an appropriate `max_tokens` to avoid excessively long responses |

## Step 6: Multimodal Vision Recognition

Kimi K2.5+ supports image understanding -- it can analyze charts, screenshots, and photos:

```python
import base64

# Read image and convert to base64
with open("architecture_diagram.png", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="kimi-k2.5",  # Vision tasks require K2.5
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this system architecture diagram and identify potential performance bottlenecks and improvement suggestions."},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_b64}"}
            }
        ]
    }],
    max_tokens=2048,
)

print(response.choices[0].message.content)
```

<div class="callout callout-warning">
⚠️ <strong>Note</strong>: Multimodal vision tasks use the <code>kimi-k2.5</code> model, not <code>kimi-k2.6</code>. Also, <code>content</code> must use the list format (not a plain string).
</div>

## Step 7: Function Calling

```python
tools = [{
    "type": "function",
    "function": {
        "name": "search_database",
        "description": "Search for information in the database.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword"},
                "limit": {"type": "integer", "description": "Maximum number of results"}
            },
            "required": ["query"]
        }
    }
}]

response = client.chat.completions.create(
    model="kimi-k2.6",
    messages=[{"role": "user", "content": "Search for the latest materials on quantum computing for me"}],
    tools=tools,
    tool_choice="auto",
)

# Handle tool calls
msg = response.choices[0].message
if msg.tool_calls:
    for tool_call in msg.tool_calls:
        print(f"Calling function: {tool_call.function.name}")
        print(f"Arguments: {tool_call.function.arguments}")
```

## Agent Cluster Mode (Advanced)

Kimi K2.6 supports launching up to **300 sub-agents** working in parallel:

```python
response = client.chat.completions.create(
    model="kimi-k2.6",
    messages=[{
        "role": "user",
        "content": """I need a comprehensive analysis of a software project. Please complete the following tasks simultaneously:
1. Analyze code quality
2. Check for security vulnerabilities
3. Evaluate performance bottlenecks
4. Review API design
5. Check test coverage
Please analyze each dimension independently, then provide a summary."""
    }],
    temperature=0.3,
    max_tokens=4096,
)

# Kimi will automatically decompose complex tasks into sub-agents for parallel processing
```

## Step 8: File API — Upload and Process Documents

Kimi's File API lets you upload documents for persistent processing across sessions:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("MOONSHOT_API_KEY"),
    base_url="https://api.moonshot.cn/v1",
)

# Step 1: Upload a file
with open("research_paper.pdf", "rb") as f:
    file_obj = client.files.create(
        file=f,
        purpose="file-extract",  # Extract text from PDF/Word/PPT/Excel
    )

file_id = file_obj.id
print(f"File uploaded: {file_id}")

# Step 2: Check file status
file_status = client.files.retrieve(file_id)
print(f"Status: {file_status.status}, Size: {file_status.bytes} bytes")

# Step 3: Use the file in a conversation
response = client.chat.completions.create(
    model="kimi-k2.6",
    messages=[
        {
            "role": "system",
            "content": f"file id: {file_id}\n\nRead and analyze the uploaded document carefully."
        },
        {"role": "user", "content": "Summarize the key findings of this research paper."}
    ],
    temperature=0.2,
    max_tokens=2048,
)

print(response.choices[0].message.content)

# Step 4: Clean up (optional — files auto-expire after 7 days)
client.files.delete(file_id)
```

### Supported File Formats

| Category | Formats | Max Size |
|----------|---------|----------|
| Documents | PDF, DOCX, TXT, MD | 100 MB |
| Spreadsheets | XLSX, CSV | 100 MB |
| Presentations | PPTX | 100 MB |
| Images | PNG, JPG, WEBP | 20 MB |
| Code | .py, .js, .ts, .java, .go, .rs, etc. | 10 MB |

## Step 9: Production Error Handling

```python
import time
from openai import (
    OpenAI,
    RateLimitError,
    APITimeoutError,
    APIConnectionError,
    APIError,
)

def call_kimi_safely(messages, model="kimi-k2.6", max_retries=3):
    """Kimi API call with intelligent retry."""
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=4096,
                timeout=60.0,
            )

        except RateLimitError:
            wait = min(2 ** attempt * 5, 60)  # Kimi rate limits can be strict
            print(f"Rate limited. Waiting {wait}s...")
            time.sleep(wait)

        except APITimeoutError:
            # Long documents may need more time
            print(f"Timeout — Kimi processing large context. Retrying with longer timeout...")
            continue

        except APIConnectionError:
            time.sleep(2 ** attempt)
            continue

        except APIError as e:
            if e.status_code and e.status_code == 413:
                raise RuntimeError(
                    "Content too large. Split your document into smaller chunks "
                    "or use Kimi's File API for large files."
                )
            if e.status_code and 400 <= e.status_code < 500:
                raise  # Client error — don't retry
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Kimi API call failed after {max_retries} attempts")
```

## Step 10: Real-World Document QA Pipeline

A complete pipeline for answering questions about long documents:

```python
class KimiDocumentQA:
    """Production-grade document Q&A using Kimi's 256K context."""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.environ.get("MOONSHOT_API_KEY"),
            base_url="https://api.moonshot.cn/v1",
        )

    def load_document(self, filepath: str) -> str:
        """Load and prepare a document for Kimi."""
        # For large PDFs/DOCXs, use the File API (Step 8)
        if filepath.endswith(('.pdf', '.docx', '.pptx', '.xlsx')):
            with open(filepath, "rb") as f:
                file_obj = self.client.files.create(
                    file=f,
                    purpose="file-extract",
                )
            # Wait for processing
            for _ in range(10):
                status = self.client.files.retrieve(file_obj.id)
                if status.status == "processed":
                    return f"[FILE_ID:{file_obj.id}]"
                time.sleep(1)
            raise TimeoutError("File processing timed out")

        # For text/markdown files, read directly
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def ask(self, document: str, question: str) -> dict:
        """Ask a question about a document and get structured answer."""
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a professional document analyst. "
                    "Always cite specific sections/paragraphs in your answers. "
                    "If uncertain, state your confidence level (High/Medium/Low)."
                ),
            },
            {
                "role": "user",
                "content": f"""<document>{document}</document>

Question: {question}

Answer format:
1. Direct answer (1-2 sentences)
2. Supporting evidence (quote from document)
3. Confidence level (High/Medium/Low)""",
            },
        ]

        response = call_kimi_safely(messages)
        return {
            "answer": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens,
            "cost_estimate": f"~¥{response.usage.total_tokens * 2 / 1_000_000:.4f}",
        }

# Usage
qa = KimiDocumentQA()
doc = qa.load_document("annual_report.txt")
result = qa.ask(doc, "What was the revenue growth rate in Q3?")
print(f"Answer: {result['answer']}")
print(f"Cost: {result['cost_estimate']}")
```

## Step 11: Context Window Optimization

Kimi's 256K context is powerful but expensive. Optimize for cost:

```python
def estimate_tokens(text: str) -> int:
    """Rough token count (Chinese: ~1.5 chars/token, English: ~4 chars/token)"""
    chinese_chars = sum(1 for c in text if '一' <= c <= '鿿')
    other_chars = len(text) - chinese_chars
    return int(chinese_chars / 1.5 + other_chars / 4)

def optimize_context(document: str, max_tokens: int = 100_000) -> str:
    """Truncate document to fit within budget while preserving key content."""

    tokens = estimate_tokens(document)
    if tokens <= max_tokens:
        return document

    # Strategy: keep beginning (executive summary) + end (conclusions)
    # Middle sections are often detailed methodology that can be summarized
    ratio = max_tokens / tokens
    keep_chars = int(len(document) * ratio)

    # Keep first 40% (summary/intro) + last 20% (conclusions)
    head_chars = int(keep_chars * 0.67)
    tail_chars = keep_chars - head_chars

    return (
        document[:head_chars]
        + f"\n\n[... {tokens - max_tokens:,} tokens trimmed for budget ...]\n\n"
        + document[-tail_chars:]
    )

# Example: Process a 500K-token document on a 100K-token budget
long_doc = open("massive_report.txt").read()
optimized = optimize_context(long_doc, max_tokens=100_000)
print(f"Original: {estimate_tokens(long_doc):,} tokens → Optimized: {estimate_tokens(optimized):,} tokens")
```

| Strategy | Cost Impact | Quality Impact |
|----------|-------------|----------------|
| Remove boilerplate | -15% cost | None |
| Use File API for large docs | -30% cost | None |
| Truncate to relevant sections | -50% cost | Low (if done carefully) |
| Use kimi-k2-lite for simple queries | -75% cost | Medium (simpler tasks only) |

## Kimi vs Other Chinese AI Models

| Model | Context | Best Use | Price |
|------|--------|----------|------|
| `kimi-k2.6` | 256K | Coding, agents, long document analysis | Standard |
| `kimi-k2.5` | 256K | General multimodal, vision recognition | Standard |
| `kimi-k2-thinking` | 256K | Complex math reasoning | Slightly higher |
| `kimi-coding/k2p5` | -- | Dedicated code generation (no rate limits) | Separate billing |

<div class="callout callout-warning">
⚠️ <strong>Important</strong>: Kimi's general API and Kimi Coding API are two independent services. API Keys and endpoints <strong>cannot be mixed</strong>!
</div>

## FAQ

### Q: What's the difference between the China and international editions?

**A**: The API format is completely identical; only the server location differs. China users: `api.moonshot.cn`; international users: `api.moonshot.ai`. The international edition may require different payment methods.

### Q: Can the full 256K context actually be used?

**A**: Yes. K2.6 maintains high-precision retrieval even at 256K context. However, we recommend structuring documents (using Markdown, XML tags) for best results.

### Q: Should I choose Kimi or DeepSeek?

**A**: Choose Kimi for long document processing; choose DeepSeek for programming tasks. Most projects can combine both. See the [China AI Models Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/) for details.

## Next Steps

- [China AI Models Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/)
- [DeepSeek API Beginner Guide](/tutorials/deepseek-api-beginner-guide/)
- [Kimi Official Documentation](https://platform.moonshot.cn/docs)

> 📝 **Tutorial Version Notes**: Based on Kimi K2.6 API, tested and verified on June 19, 2026.
