---
title: "Chinese Embedding Model Comparison: BGE/ME5/text2vec Selection Guide"
description: "Comprehensive evaluation of Chinese embedding models: BGE-M3, ME5-Large, text2vec-base-chinese, Jina Embeddings — performance comparison on retrieval, clustering, and similarity tasks. Includes MTEB Chinese leaderboard interpretation and code examples."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Embedding", "Vector", "BGE", "MTEB", "Semantic Search", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will select the best Chinese embedding model:

- Comparison of four major models: BGE-M3 / ME5 / text2vec / Jina
- MTEB Chinese leaderboard interpretation
- Semantic search / RAG / clustering in action
- Local deployment vs cloud API

> 🎯 Embedding is the foundation of RAG and semantic search. Choosing the wrong embedding model = cutting RAG effectiveness in half.

---

## Chinese Embedding Models at a Glance

| Model | Dimensions | Max Length | Local | Pricing |
|------|------|----------|------|------|
| **BGE-M3** ⭐ | 1024 | 8192 | ✅ Ollama | Free |
| **ME5-Large** | 1024 | 512 | ✅ | Free |
| **text2vec-base-chinese** | 768 | 512 | ✅ | Free |
| **Jina Embeddings v3** | 1024 | 8192 | ❌ Cloud | ¥0.2/M |
| **Qwen-Embedding** | 1536 | 32K | ❌ DashScope | ¥2/M |

---

## Quick Start

```python
# Using BGE-M3 (Ollama local)
import requests

def bge_embed(text: str) -> list[float]:
    """BGE-M3 embedding"""
    response = requests.post(
        "http://localhost:11434/api/embed",
        json={"model": "bge-m3", "input": text},
    )
    return response.json()["embeddings"][0]

# Using text2vec (sentence-transformers)
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("shibing624/text2vec-base-chinese")

def text2vec_embed(text: str) -> list[float]:
    return model.encode(text).tolist()

# Using Jina Embeddings (cloud)
from openai import OpenAI

jina_client = OpenAI(
    api_key=os.getenv("JINA_API_KEY"),
    base_url="https://api.jina.ai/v1",
)

def jina_embed(text: str) -> list[float]:
    response = jina_client.embeddings.create(
        model="jina-embeddings-v3",
        input=text,
    )
    return response.data[0].embedding

# Using Qwen Embedding
qwen_client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

def qwen_embed(text: str) -> list[float]:
    response = qwen_client.embeddings.create(
        model="text-embedding-v3",
        input=text,
        dimensions=1024,  # Configurable dimensions
    )
    return response.data[0].embedding
```

---

## Semantic Search in Practice

```python
import numpy as np
from typing import list

class SemanticSearch:
    """Semantic search engine"""

    def __init__(self, embed_fn):
        self.embed = embed_fn
        self.documents = []
        self.embeddings = []

    def index(self, docs: list[str]):
        """Build index"""
        self.documents = docs
        self.embeddings = [self.embed(doc) for doc in docs]
        print(f"✅ Indexed {len(docs)} documents")

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search"""
        query_emb = self.embed(query)
        query_vec = np.array(query_emb)

        scores = []
        for i, doc_emb in enumerate(self.embeddings):
            doc_vec = np.array(doc_emb)
            similarity = np.dot(query_vec, doc_vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(doc_vec)
            )
            scores.append((i, float(similarity)))

        scores.sort(key=lambda x: x[1], reverse=True)

        return [
            {"rank": i+1, "document": self.documents[idx], "score": score}
            for i, (idx, score) in enumerate(scores[:top_k])
        ]

# Test
docs = [
    "Python is a high-level programming language widely used in data science",
    "JavaScript is mainly used for front-end web development",
    "Machine learning is a branch of artificial intelligence",
    "Deep neural networks perform excellently in image recognition",
    "React is a popular JavaScript front-end framework",
]

search = SemanticSearch(bge_embed)
search.index(docs)

results = search.search("AI and deep learning")
for r in results:
    print(f"[{r['rank']}] Similarity {r['score']:.3f}: {r['document']}")
```

---

## Text Clustering

```python
from sklearn.cluster import KMeans

def cluster_texts(texts: list[str], embed_fn, n_clusters: int = 3) -> dict:
    """AI text clustering"""
    embeddings = np.array([embed_fn(t) for t in texts])

    # K-Means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(embeddings)

    # Group by cluster
    clusters = {}
    for i, label in enumerate(labels):
        if label not in clusters:
            clusters[int(label)] = []
        clusters[int(label)].append(texts[i])

    # Use AI to generate cluster labels
    for label, texts_in_cluster in clusters.items():
        sample = "\n".join(texts_in_cluster[:3])
        summary = chat(f"Summarize the common theme of the following texts in a few words:\n{sample}")
        print(f"Cluster {label} ({len(texts_in_cluster)} items): {summary}")

    return clusters

# Usage
texts = [
    "How to do data analysis with Python",
    "Pandas data analysis library tutorial",
    "React Hooks best practices",
    "Vue 3 Composition API tutorial",
    "TensorFlow 2.0 getting started guide",
    "PyTorch deep learning framework tutorial",
]
clusters = cluster_texts(texts, bge_embed, n_clusters=3)
```

---

## Unified API Encapsulation

```python
class EmbeddingRouter:
    """Multi-embedding service router"""

    PROVIDERS = {
        "bge-local": {"type": "ollama", "model": "bge-m3"},
        "text2vec-local": {"type": "sentence-transformers", "model": "text2vec-base-chinese"},
        "jina-cloud": {"type": "jina", "model": "jina-embeddings-v3"},
        "qwen-cloud": {"type": "qwen", "model": "text-embedding-v3"},
    }

    def __init__(self, provider: str = "bge-local"):
        self.set_provider(provider)

    def set_provider(self, provider: str):
        """Switch provider"""
        config = self.PROVIDERS[provider]
        self.provider = provider
        self.model_name = config["model"]

        if config["type"] == "ollama":
            self._embed = lambda t: requests.post(
                "http://localhost:11434/api/embed",
                json={"model": self.model_name, "input": t},
            ).json()["embeddings"][0]
        elif config["type"] == "sentence-transformers":
            self._local_model = SentenceTransformer(config["model"])
            self._embed = lambda t: self._local_model.encode(t).tolist()
        elif config["type"] == "jina":
            self._embed = jina_embed
        elif config["type"] == "qwen":
            self._embed = qwen_embed

    def embed(self, text: str) -> list[float]:
        return self._embed(text)

# Usage
router = EmbeddingRouter("bge-local")
vec = router.embed("What is RAG?")

# Switch to cloud
router.set_provider("qwen-cloud")
vec = router.embed("What is RAG?")
```

---

## Performance Comparison (MTEB Chinese)

| Task | BGE-M3 | ME5 | text2vec | Jina v3 |
|------|--------|-----|----------|---------|
| Semantic Similarity | 0.72 | 0.69 | 0.65 | 0.74 |
| Retrieval R@10 | 0.68 | 0.65 | 0.58 | 0.71 |
| Clustering V-measure | 0.55 | 0.52 | 0.48 | 0.56 |
| Speed (local) | 180/s | 250/s | 300/s | Cloud |
| **Recommendation** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Selection Guide

```
Scenario: RAG retrieval-augmented generation
  → BGE-M3 (local, free, 8192 length)

Scenario: Short text similarity
  → ME5-Large (fastest speed)

Scenario: High-accuracy cloud
  → Jina v3 (best performance, but paid)

Scenario: 32K long documents
  → Qwen-Embedding (longest context)

Scenario: Offline / air-gapped
  → text2vec-base-chinese (lightweight)
```

---

## Next Steps

- [RAG Vector Database Tutorial](/tutorials/vector-database-comparison-china/)
- [Ollama Local Model Deep Dive](/tutorials/ollama-local-deep-dive/)

> 📝 Based on MTEB Chinese leaderboard data, June 2026.
