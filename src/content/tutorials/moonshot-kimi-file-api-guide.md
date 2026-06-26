---
title: "Kimi K2 File API Deep Dive: Long Document Processing and Structured Extraction"
description: "Complete Kimi K2 File API tutorial: PDF/Word/Excel/PPT file upload, long-document Q&A, table structured extraction, batch document processing. Includes Moonshot platform 128K context hands-on code."
category: "Kimi"
date: 2026-06-20
tags: ["Moonshot", "Kimi", "Long Documents", "File Processing", "128K", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

Kimi's biggest advantage is its **262K ultra-long context + file understanding**. You will learn:

- Upload PDF/Word/Excel/PPT/image files
- Analyze multiple documents simultaneously with 262K context
- Extract structured table data
- Batch document intelligent processing
- File conversation API integration

> 🎯 Kimi's file processing capability is among the strongest of all Chinese AI models. 262K context = read a 400,000-word book in one go.

---

## Moonshot File API Basics

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("MOONSHOT_API_KEY"),
    base_url="https://api.moonshot.cn/v1",
)
```

### Uploading Files

```python
def upload_file(file_path: str) -> str:
    """Upload a file to Moonshot and return the file_id"""
    file_object = client.files.create(
        file=open(file_path, "rb"),
        purpose="file-extract",  # Extract file contents
    )
    print(f"File uploaded: {file_object.id} ({file_object.bytes} bytes)")
    return file_object.id

# Upload examples
pdf_id = upload_file("annual_report.pdf")
excel_id = upload_file("sales_data.xlsx")
```

### Listing / Deleting Files

```python
# List all files
files = client.files.list()
for f in files.data:
    print(f"{f.id}: {f.filename} ({f.bytes} bytes, {f.created_at})")

# Delete a file
client.files.delete(pdf_id)
```

---

## Single Document Deep Q&A

```python
def chat_with_document(file_id: str, question: str) -> str:
    """Ask questions based on file contents"""
    response = client.chat.completions.create(
        model="kimi-k2.6",
        messages=[
            {
                "role": "system",
                "content": "You are Kimi, an AI assistant specialized in long document analysis. Answer questions based on the user's file content, citing specific page numbers and paragraphs.",
            },
            {
                "role": "system",
                "content": file_id,  # Pass file via system message
            },
            {"role": "user", "content": question},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content

# Usage
answer = chat_with_document(pdf_id, "What are the core conclusions of this report? What key data supports them?")
print(answer)
```

---

## Multi-Document Comparative Analysis

```python
def compare_documents(file_ids: list[str], compare_aspect: str) -> str:
    """Analyze and compare multiple documents simultaneously"""
    # Build system message with multiple files
    system_content = """You are a document analysis expert. Compare the following documents and find their similarities and differences on the specified aspect.
Cite the source document when referencing."""

    messages = [{"role": "system", "content": system_content}]

    # Add files one by one
    for i, fid in enumerate(file_ids, 1):
        messages.append({
            "role": "system",
            "content": f"[Document {i}] {fid}",
        })

    messages.append({
        "role": "user",
        "content": f"Compare these documents on \"{compare_aspect}\": main content, similarities and differences, and each one's characteristics.",
    })

    response = client.chat.completions.create(
        model="moonshot-v1-128k",
        messages=messages,
        temperature=0.3,
        max_tokens=4096,
    )

    return response.choices[0].message.content

# Compare three competitive analysis reports
comparison = compare_documents(
    [pdf_id_1, pdf_id_2, pdf_id_3],
    "Pricing strategy, target customer segments, and core feature differences",
)
print(comparison)
```

---

## Excel Table Structured Extraction

```python
import json

def extract_table_data(file_id: str) -> list[dict]:
    """Extract structured table data from Excel/CSV files"""
    response = client.chat.completions.create(
        model="moonshot-v1-128k",
        messages=[
            {
                "role": "system",
                "content": f"""You are a data analysis assistant. File ID: {file_id}
Extract all table data from the file and output it in JSON array format.
Each record should include all column fields. If there are multiple sheets, distinguish them with sheet_name.""",
            },
            {
                "role": "user",
                "content": "Please extract all data from this Excel file and return it in JSON format.",
            },
        ],
        temperature=0,  # Use temperature=0 for data extraction
        max_tokens=8192,
    )

    content = response.choices[0].message.content

    # Extract the JSON portion
    try:
        # Find the start and end positions of the JSON array
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
    except json.JSONDecodeError:
        pass

    return [{"raw": content}]

# Usage
data = extract_table_data(excel_id)
for row in data[:5]:
    print(row)
```

---

## Intelligent Table Q&A

```python
def query_table(file_id: str, query: str) -> str:
    """Natural language queries against table data"""
    response = client.chat.completions.create(
        model="moonshot-v1-128k",
        messages=[
            {
                "role": "system",
                "content": f"You are a data analyst. Answer questions based on the data in file {file_id}.",
            },
            {
                "role": "user",
                "content": f"""Answer based on the table data:
{query}

Provide specific figures and analysis, not just conclusions.""",
            },
        ],
        temperature=0.1,
    )

    return response.choices[0].message.content

# Natural language query
result = query_table(excel_id, "What are the top 5 products by Q3 sales? What is their month-over-month growth rate?")
print(result)
```

---

## Batch Document Processing Pipeline

```python
import time
from concurrent.futures import ThreadPoolExecutor

def batch_process_documents(file_paths: list[str], task: str) -> list[dict]:
    """Upload and process documents in batch"""
    results = []

    def process_one(path: str) -> dict:
        try:
            # Upload
            file_id = upload_file(path)

            # Analyze
            response = client.chat.completions.create(
                model="moonshot-v1-128k",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a document processing assistant. {task}",
                    },
                    {
                        "role": "system",
                        "content": file_id,
                    },
                    {"role": "user", "content": f"Perform the following on this document: {task}"},
                ],
                temperature=0.3,
            )

            # Clean up
            client.files.delete(file_id)

            return {
                "file": path,
                "status": "success",
                "result": response.choices[0].message.content,
            }
        except Exception as e:
            return {"file": path, "status": "error", "error": str(e)}

    # Parallel processing (mind API rate limits)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(process_one, p) for p in file_paths]
        for future in futures:
            results.append(future.result())
            time.sleep(1)  # Rate limiting

    return results

# Batch processing
contracts = ["contract1.pdf", "contract2.pdf", "contract3.pdf"]
results = batch_process_documents(contracts, "Extract key contract terms: parties, amount, duration, and breach of contract liability")
```

---

## Kimi Context Management Strategy

```python
class KimiSession:
    """Manage Kimi sessions with long conversations + files"""

    def __init__(self):
        self.messages = []
        self.files = {}
        self.total_tokens = 0

    def add_file(self, name: str, file_path: str):
        """Add a file to the session"""
        file_id = upload_file(file_path)
        self.files[name] = file_id
        # Files also consume tokens
        self.total_tokens += self._estimate_file_tokens(file_path)

    def ask(self, question: str) -> str:
        """Q&A based on all context"""
        # Build messages
        current_msg = [
            {"role": "system", "content": "You are Kimi, skilled at comprehensively analyzing multiple documents."},
        ]

        # Add all files
        for name, fid in self.files.items():
            current_msg.append({
                "role": "system",
                "content": f"[{name}] {fid}",
            })

        # Add conversation history
        current_msg.extend(self.messages[-10:])  # Keep last 10 turns

        # Add new question
        current_msg.append({"role": "user", "content": question})

        response = client.chat.completions.create(
            model="moonshot-v1-128k",
            messages=current_msg,
            temperature=0.5,
        )

        answer = response.choices[0].message.content

        # Save to history
        self.messages.append({"role": "user", "content": question})
        self.messages.append({"role": "assistant", "content": answer})
        self.total_tokens += response.usage.total_tokens

        # Check context usage
        usage_pct = self.total_tokens / 262000 * 100
        if usage_pct > 70:
            print(f"⚠️ Context usage at {usage_pct:.0f}%, consider clearing")

        return answer

    def _estimate_file_tokens(self, file_path: str) -> int:
        """Estimate file token count"""
        size = os.path.getsize(file_path)
        # Rough estimate: Chinese ~1.5 characters per token
        return int(size * 0.7)

    def summarize_so_far(self) -> str:
        """Compress context -- summarize the conversation so far"""
        summary_prompt = "Summarize the key points of the conversation so far, retaining key information and conclusions."
        summary = self.ask(summary_prompt)

        # Replace history with summary
        self.messages = [
            {"role": "system", "content": f"Summary of previous conversation: {summary}"},
        ]
        return summary
```

---

## Supported File Formats

| Format | Extensions | Max Size | Notes |
|--------|-----------|----------|-------|
| PDF | `.pdf` | 100 MB | Includes scanned document OCR |
| Word | `.doc` `.docx` | 100 MB | Includes tables/images |
| Excel | `.xls` `.xlsx` | 100 MB | Multiple sheets |
| PPT | `.ppt` `.pptx` | 100 MB | Includes notes |
| Images | `.jpg` `.png` | 20 MB | OCR text extraction |
| Text | `.txt` `.md` | 10 MB | Raw text |

---

## FAQ

### Q: Can the 262K context really be fully utilized?

**A**: Theoretically yes, but in practice, beyond 150K tokens, the model's attention to the middle portion declines. Recommendation: place key information at the beginning or end, and preprocess middle sections with summaries.

### Q: How long are uploaded files retained?

**A**: Moonshot files are retained on the server for 7 days. For long-term use, upload, analyze, and save results immediately.

---

## Next Steps

- [Kimi API Getting Started](/tutorials/kimi-api-getting-started/)
- [Chinese AI Model Pricing Comparison](/tutorials/china-ai-model-pricing-comparison/)

> 📝 Based on Kimi K2.6 API, tested June 2026.
