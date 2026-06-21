---
title: "Enterprise Search with Chinese AI Models: Semantic Search & Hybrid Retrieval with DeepSeek/BGE"
description: "Build enterprise search engines with Chinese AI models: semantic search, hybrid retrieval, reranking, search suggestions. Includes complete Elasticsearch + BGE Embedding + Reranker solution with DeepSeek integration."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Search Engine", "Semantic Search", "Elasticsearch", "Reranker", "Hybrid Retrieval", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build an AI search engine that goes beyond traditional keyword search:

- Semantic search (understanding the user's true intent)
- Hybrid retrieval (keyword + semantic)
- Reranker re-ranking
- Search suggestions and auto-completion

> 🎯 Traditional search only matches keywords. AI search understands that "laptop is hot" = "laptop cooling issues".

---

## System Architecture

```
User Search Query
    ↓
Query Rewriting (AI expands with synonyms)
    ↓
Hybrid Retrieval → Elasticsearch (BM25) + Vector Search (BGE)
    ↓
Result Fusion (RRF)
    ↓
Reranker Re-ranking (BGE-Reranker)
    ↓
AI Answer Generation
    ↓
Return Results
```

---

## Hybrid Retrieval Engine

```python
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer
import numpy as np

class AISearchEngine:
    """AI search engine"""

    def __init__(self):
        self.es = Elasticsearch("http://localhost:9200")
        self.embedder = SentenceTransformer("BAAI/bge-m3")
        self.reranker = SentenceTransformer("BAAI/bge-reranker-v2-m3")
        self.client = client

    def index_documents(self, docs: list[dict], index_name: str = "docs"):
        """Index documents (with vectors)"""
        for i, doc in enumerate(docs):
            # Generate embedding vector
            embedding = self.embedder.encode(doc["content"]).tolist()

            self.es.index(
                index=index_name,
                id=i,
                body={
                    "title": doc["title"],
                    "content": doc["content"],
                    "embedding": embedding,  # Vector field
                },
            )
        print(f"✅ Indexed {len(docs)} documents")

    def hybrid_search(
        self,
        query: str,
        index_name: str = "docs",
        top_k: int = 10,
        keyword_weight: float = 0.3,
        vector_weight: float = 0.7,
    ) -> list[dict]:
        """Hybrid search (keyword + semantic)"""
        # 1. Vector search
        query_embedding = self.embedder.encode(query).tolist()

        vector_results = self.es.search(
            index=index_name,
            body={
                "size": top_k * 2,
                "query": {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                            "params": {"query_vector": query_embedding},
                        },
                    }
                },
            },
        )

        # 2. BM25 keyword search
        keyword_results = self.es.search(
            index=index_name,
            body={
                "size": top_k * 2,
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^2", "content"],
                    }
                },
            },
        )

        # 3. RRF (Reciprocal Rank Fusion)
        fused = self._rrf_fusion(
            vector_results["hits"]["hits"],
            keyword_results["hits"]["hits"],
            k=60,
        )

        return fused[:top_k]

    def _rrf_fusion(self, results_a: list, results_b: list, k: int = 60) -> list[dict]:
        """RRF fusion of two result sets"""
        scores = {}

        # First result set
        for rank, hit in enumerate(results_a):
            doc_id = hit["_id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        # Second result set
        for rank, hit in enumerate(results_b):
            doc_id = hit["_id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        # Sort by RRF score
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

        # Fetch full documents
        results = []
        for doc_id in sorted_ids:
            doc = self.es.get(index="docs", id=doc_id)
            results.append({
                "id": doc_id,
                "title": doc["_source"]["title"],
                "content": doc["_source"]["content"],
                "score": scores[doc_id],
            })

        return results

    def rerank(self, query: str, candidates: list[dict], top_k: int = 5) -> list[dict]:
        """Reranker re-ranking"""
        pairs = [(query, doc["content"][:500]) for doc in candidates]
        scores = self.reranker.predict(pairs, show_progress_bar=False)

        # Add scores and re-rank
        for doc, score in zip(candidates, scores):
            doc["rerank_score"] = float(score)

        candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
        return candidates[:top_k]
```

---

## Query Rewriting

```python
class QueryRewriter:
    """AI query rewriting — expand synonyms and variants"""

    def rewrite(self, query: str) -> list[str]:
        """Generate query variants"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Generate synonymous variants of the search query. Output JSON array:
[
  "Original query",
  "Synonymous variant 1",
  "Synonymous variant 2",
  "More technical variant",
  "More colloquial variant"
]

Example: "computer slow" → ["computer slow", "computer running slowly", "computer performance degraded", "system response latency", "machine got sluggish"]""",
                },
                {"role": "user", "content": query},
            ],
            temperature=0.7,
            max_tokens=300,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return [query]

    def hybrid_search_with_rewrite(self, engine: AISearchEngine, query: str, top_k: int = 5) -> list[dict]:
        """Hybrid search with query rewriting + deduplication"""
        queries = self.rewrite(query)

        all_results = {}
        for q in queries:
            results = engine.hybrid_search(q, top_k=top_k)
            for r in results:
                doc_id = r["id"]
                if doc_id not in all_results or r["score"] > all_results[doc_id]["score"]:
                    all_results[doc_id] = r

        # Sort
        sorted_results = sorted(all_results.values(), key=lambda x: x["score"], reverse=True)
        return sorted_results[:top_k]
```

---

## Search Suggestions and Auto-Completion

```python
class SearchSuggest:
    """Search suggestions"""

    def suggest(self, partial_query: str, history: list[str] = None) -> list[str]:
        """AI search suggestions"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""The user typed "{partial_query}". Generate 5 search suggestions.

{f"Search history: {history}" if history else ""}

Suggestion rules:
- Complete what the user might be searching for
- Based on common search intent
- Each suggestion no more than 15 words
- Output as a JSON string array""",
                },
            ],
            temperature=0.5,
            max_tokens=200,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def related_searches(self, query: str) -> list[str]:
        """Related search recommendations"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {"role": "user", "content": f"The user searched for「{query}」. Generate 5 related search suggestions. JSON string array."},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
suggest = SearchSuggest()
print(suggest.suggest("Python data", ["Python data analysis", "Python data visualization"]))
print(suggest.related_searches("machine learning beginner"))
```

---

## AI Answer Generation

```python
def generate_ai_answer(query: str, search_results: list[dict]) -> str:
    """Generate AI answer based on search results"""
    context = "\n\n".join(
        f"[Source {i+1}] {r['title']}\n{r['content'][:500]}"
        for i, r in enumerate(search_results[:5])
    )

    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[
            {
                "role": "system",
                "content": f"""Answer the user's question based on the following search results.

Search results:
{context}

Rules:
- Synthesize information from multiple sources
- Cite sources using [Source N] notation
- If search results don't contain a direct answer, honestly state so
- Keep the answer concise and informative, 200-400 words""",
            },
            {"role": "user", "content": query},
        ],
        temperature=0.3,
        max_tokens=1000,
    )
    return response.choices[0].message.content

# Complete search flow
def ai_search(query: str) -> dict:
    """End-to-end AI search"""
    engine = AISearchEngine()
    rewriter = QueryRewriter()
    suggest = SearchSuggest()

    # 1. Query rewriting + hybrid retrieval
    candidates = rewriter.hybrid_search_with_rewrite(engine, query)

    # 2. Reranker re-ranking
    reranked = engine.rerank(query, candidates, top_k=5)

    # 3. AI generates answer
    answer = generate_ai_answer(query, reranked)

    # 4. Related searches
    related = suggest.related_searches(query)

    return {
        "query": query,
        "answer": answer,
        "sources": [{"title": r["title"], "score": r["rerank_score"]} for r in reranked],
        "related": related,
    }
```

---

## Next Steps

- [Embedding Model Comparison](/tutorials/vector-embedding-chinese-compare/)
- [RAG Tutorial](/tutorials/rag-chinese-ai-models-guide/)

> 📝 Based on Elasticsearch + BGE + DeepSeek, June 2026.
