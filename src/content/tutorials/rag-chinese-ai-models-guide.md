---
title: "RAG in Practice: Building a Retrieval-Augmented Generation System with Chinese AI Models"
description: "Build a RAG system from scratch: DeepSeek/Qwen + LangChain + ChromaDB/FAISS for document Q&A. Complete Python code covering text splitting, vectorization, retrieval optimization, and multi-model comparison."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["RAG", "LangChain", "Vector Database", "DeepSeek", "Qwen", "ChromaDB", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will build a complete RAG (Retrieval-Augmented Generation) system from scratch:

- Document loading and intelligent splitting
- Text vectorization and vector database storage
- Semantic retrieval + reranking
- DeepSeek / Qwen as the generation model
- Streaming output for the full Q&A pipeline

> 🎯 RAG is the core skill for AI application development in 2026. This tutorial uses Chinese AI models + open-source vector databases — everything can run for free.

---

## What Is RAG?

RAG (Retrieval-Augmented Generation) allows AI to retrieve relevant information from your document library before answering a question, then generate an answer based on the retrieved results:

```
User question → Vector retrieval → Find relevant document chunks → Concatenate context → AI generates answer
```

This solves two core problems:
1. **Knowledge timeliness**: AI's knowledge is cut off at its training date, but RAG can reference the latest documents
2. **Hallucination**: RAG forces the AI to answer based on real documents, drastically reducing fabrication

---

## Step 1: Install Dependencies

```bash
pip install langchain langchain-community chromadb sentence-transformers openai pypdf tiktoken
```

Dependency notes:
- `langchain` — Orchestration framework
- `chromadb` — Lightweight vector database
- `sentence-transformers` — Open-source embedding model
- `openai` — Call DeepSeek/Qwen in OpenAI-compatible format

---

## Step 2: Document Loading and Splitting

```python
from langchain_community.document_loaders import PyPDFLoader, TextLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

# Load a document directory
def load_documents(doc_dir: str) -> list:
    """Load documents in multiple formats"""
    documents = []

    # PDF documents
    pdf_loader = DirectoryLoader(
        doc_dir,
        glob="**/*.pdf",
        loader_cls=PyPDFLoader,
    )
    documents.extend(pdf_loader.load())
    print(f"PDF: {len(pdf_loader.load())} files")

    # Text files
    txt_loader = DirectoryLoader(
        doc_dir,
        glob="**/*.txt",
        loader_cls=TextLoader,
    )
    documents.extend(txt_loader.load())

    # Markdown files
    md_loader = DirectoryLoader(
        doc_dir,
        glob="**/*.md",
        loader_cls=TextLoader,
    )
    documents.extend(md_loader.load())

    return documents

# Intelligent splitting
def split_documents(documents: list, chunk_size: int = 1000, overlap: int = 200) -> list:
    """Split documents into retrieval-friendly chunks"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,   # 1000 characters per chunk
        chunk_overlap=overlap,   # 200-character overlap (maintains context coherence)
        separators=["\n\n", "\n", ".", " ", ""],
        length_function=len,
    )

    chunks = splitter.split_documents(documents)
    print(f"Splitting complete: {len(documents)} documents → {len(chunks)} text chunks")
    return chunks

# Usage
docs = load_documents("./knowledge_base/")
chunks = split_documents(docs)
```

---

## Step 3: Vectorization and Storage

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Use an open-source Chinese embedding model
embeddings = HuggingFaceEmbeddings(
    model_name="shibing624/text2vec-base-chinese",
    model_kwargs={"device": "cpu"},  # or "cuda"
    encode_kwargs={"normalize_embeddings": True},
)

# Create vector database
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",  # Persist to disk
    collection_name="my_knowledge_base",
)

print(f"Vector store created, {vectorstore._collection.count()} records")

# For subsequent use, simply load:
# vectorstore = Chroma(
#     persist_directory="./chroma_db",
#     embedding_function=embeddings,
# )
```

---

## Step 4: Build the Retriever

```python
# Basic semantic retrieval
retriever = vectorstore.as_retriever(
    search_type="similarity",  # Similarity search
    search_kwargs={"k": 4},    # Return top 4
)

# Test retrieval
question = "What is the company's annual leave policy?"
relevant_docs = retriever.get_relevant_documents(question)

for i, doc in enumerate(relevant_docs):
    print(f"\n--- Document chunk {i+1} (relevance: {doc.metadata.get('score', 'N/A')}) ---")
    print(doc.page_content[:200] + "...")
```

### Advanced: MMR Retrieval (Maximal Marginal Relevance)

```python
retriever_mmr = vectorstore.as_retriever(
    search_type="mmr",  # MMR retrieval — balances relevance and diversity
    search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.7},
)
```

### Advanced: Threshold-Based Retrieval

```python
retriever_threshold = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.5, "k": 5},
)
```

---

## Step 5: Integrate DeepSeek to Generate Answers

```python
from openai import OpenAI
from langchain.prompts import ChatPromptTemplate

# Initialize DeepSeek client
llm = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

# Define RAG prompt template
RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a document-based Q&A assistant. Please answer questions strictly based on the provided context below.

Rules:
1. If the context contains the answer, answer based on the context
2. If the context does not contain the answer, honestly say "Based on the provided documents, I cannot answer this question"
3. Cite specific document passages to support your answer
4. Respond professionally and accurately"""),
    ("user", """Context:
{context}

Question: {question}

Please answer based on the context above:"""),
])

def ask_with_rag(question: str, k: int = 4) -> str:
    """Complete RAG Q&A pipeline"""
    # 1. Retrieve relevant documents
    relevant_docs = retriever.get_relevant_documents(question)

    # 2. Concatenate context
    context_parts = []
    for i, doc in enumerate(relevant_docs):
        source = doc.metadata.get("source", "Unknown source")
        context_parts.append(f"[Source {i+1}: {source}]\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts)

    # 3. Build prompt
    messages = [
        {"role": "system", "content": "You are a document-based Q&A assistant. Please answer questions strictly based on the provided context. If the context does not contain relevant information, please state so honestly."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}\n\nPlease answer based on the context and cite information sources."}
    ]

    # 4. Call LLM to generate answer
    response = llm.chat.completions.create(
        model="deepseek-v4-pro",
        messages=messages,
        temperature=0.3,  # Low temperature, more reliant on context
        max_tokens=1024,
    )

    answer = response.choices[0].message.content

    # 5. Return answer + sources
    sources = list(set(
        doc.metadata.get("source", "Unknown")
        for doc in relevant_docs
    ))

    return {
        "answer": answer,
        "sources": sources,
        "context_docs": len(relevant_docs),
    }

# Test
result = ask_with_rag("What is the company's annual leave policy?")
print(f"Answer: {result['answer']}")
print(f"Sources: {result['sources']}")
print(f"Documents retrieved: {result['context_docs']}")
```

---

## Step 6: Using Qwen Instead of DeepSeek

```python
# Switch to Qwen — just change two lines
llm_qwen = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

def ask_with_rag_qwen(question: str, k: int = 4) -> dict:
    """RAG Q&A using Qwen"""
    docs = retriever.get_relevant_documents(question)
    context = "\n\n---\n\n".join(
        f"[{doc.metadata.get('source', '?')}]\n{doc.page_content}"
        for doc in docs
    )

    response = llm_qwen.chat.completions.create(
        model="qwen-plus",
        messages=[{
            "role": "user",
            "content": f"Answer the question based on the context below. If you cannot answer, explain why.\n\nContext:\n{context}\n\nQuestion: {question}"
        }],
        temperature=0.3,
        max_tokens=1024,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": list(set(d.metadata.get("source", "?") for d in docs)),
    }
```

---

## Step 7: Streaming RAG Output

```python
def ask_rag_streaming(question: str) -> str:
    """Streaming RAG — outputs answer token by token"""
    docs = retriever.get_relevant_documents(question)
    context = "\n\n---\n\n".join(
        f"[{doc.metadata.get('source', '?')}]\n{doc.page_content}"
        for doc in docs
    )

    print(f"📄 Retrieved {len(docs)} relevant documents\n")

    response = llm.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[
            {"role": "user", "content": f"Answer based on the context.\nContext: {context}\n\nQuestion: {question}"}
        ],
        temperature=0.3,
        stream=True,
    )

    print("🤖 AI: ", end="")
    full_answer = ""
    for chunk in response:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            print(content, end="", flush=True)
            full_answer += content

    return full_answer

# Streaming Q&A
ask_rag_streaming("Please summarize the company's core values")
```

---

## Step 8: Using FAISS Instead of ChromaDB

```bash
pip install faiss-cpu  # or faiss-gpu
```

```python
from langchain_community.vectorstores import FAISS

# Create FAISS index
vectorstore_faiss = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings,
)

# Save
vectorstore_faiss.save_local("./faiss_index")

# Load
# vectorstore_faiss = FAISS.load_local(
#     "./faiss_index",
#     embeddings,
#     allow_dangerous_deserialization=True,
# )

retriever_faiss = vectorstore_faiss.as_retriever(search_kwargs={"k": 4})
```

### ChromaDB vs FAISS Comparison

| Dimension | ChromaDB | FAISS |
|------|----------|-------|
| Setup Difficulty | Easy (pip) | Easy (pip) |
| Persistence | ✅ Built-in | ✅ save/load |
| Large Scale | Medium (<1M vectors) | **Strong** (billions) |
| Chinese Support | ✅ | ✅ |
| Metadata Filtering | ✅ | ⚠️ Manual required |

---

## Complete RAG Application Class

```python
class ChineseAIRAG:
    """RAG system with swappable Chinese AI models"""

    def __init__(self, model: str = "deepseek"):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="shibing624/text2vec-base-chinese"
        )

        if model == "deepseek":
            self.llm = OpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url="https://api.deepseek.com/v1",
            )
            self.model_name = "deepseek-v4-pro"
        elif model == "qwen":
            self.llm = OpenAI(
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )
            self.model_name = "qwen-plus"

        self.vectorstore = None
        self.retriever = None

    def ingest(self, doc_dir: str):
        """Ingest documents"""
        loader = DirectoryLoader(doc_dir, glob="**/*.txt", loader_cls=TextLoader)
        docs = loader.load()

        chunks = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        ).split_documents(docs)

        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory="./chroma_db",
        )

        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 4})
        print(f"✅ {len(chunks)} text chunks indexed")

    def ask(self, question: str) -> dict:
        """Q&A"""
        if not self.retriever:
            return {"error": "Please ingest documents first (ingest)"}

        docs = self.retriever.get_relevant_documents(question)
        context = "\n\n".join(d.page_content for d in docs)

        response = self.llm.chat.completions.create(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": f"Answer the question based on the context below:\n\n{context}\n\nQuestion: {question}"
            }],
            temperature=0.3,
            max_tokens=1024,
        )

        return {
            "answer": response.choices[0].message.content,
            "sources": list(set(d.metadata.get("source", "?") for d in docs)),
            "doc_count": len(docs),
        }


# Usage
rag = ChineseAIRAG(model="deepseek")
rag.ingest("./docs/")
result = rag.ask("What is RAG?")
print(f"Answer: {result['answer']}\nSources: {result['sources']}")
```

---

## FAQ

### Q: Why not use OpenAI's embedding?

**A**: For Chinese embeddings, `text2vec-base-chinese` performs better, is completely free, and runs locally.

### Q: What scenarios is RAG suitable for?

**A**: Enterprise knowledge bases, customer service bots, contract analysis, academic paper search. Any scenario requiring the AI to answer based on specific documents.

### Q: How can I improve retrieval accuracy?

**A**: 1) Tune chunk_size/overlap; 2) Use MMR retrieval; 3) Add a reranker model.

---

## Next Steps

- [DeepSeek API Beginner's Guide](/tutorials/deepseek-api-beginner-guide/)
- [Qwen API Tutorial](/tutorials/qwen-api-python-tutorial/)
- [Chinese AI Model Comparison](/tutorials/china-ai-model-comparison-2026/)

> 📝 Based on LangChain + DeepSeek/Qwen + ChromaDB/FAISS, tested June 2026.
