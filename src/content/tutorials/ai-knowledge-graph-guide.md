---
title: "Knowledge Graph Construction with Chinese AI: Entity & Relation Extraction Using DeepSeek/Qwen"
description: "Automatically build knowledge graphs with Chinese AI models (DeepSeek, Qwen): entity recognition, relation extraction, graph visualization, Neo4j integration. Includes one-click knowledge graph generation code."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Knowledge Graph", "Entity Recognition", "Neo4j", "Relation Extraction", "Graph Database", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will use AI to automatically build knowledge graphs:

- Automatic entity and relation extraction
- Neo4j graph database integration
- Knowledge graph visualization
- Knowledge Q&A system

> 🎯 Traditional knowledge graph construction requires extensive manual annotation. AI large models automate this process up to 80%.

---

## Entity and Relation Extraction

```python
class KnowledgeExtractor:
    """Automatically extract entities and relations using large models"""

    def __init__(self):
        self.client = client

    def extract(self, text: str) -> dict:
        """Extract knowledge graph triples from text"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """You are a knowledge graph builder. Extract entities and relations from text.

Output JSON:
{
  "entities": [
    {"name": "Entity Name", "type": "Person/Organization/Location/Technology/Concept/Event/Product", "aliases": ["Alias"]}
  ],
  "relations": [
    {"subject": "Subject Entity", "relation": "Relation", "object": "Object Entity"}
  ]
}

Relation types: Founded/WorksAt/LocatedIn/Uses/Invented/BelongsTo/Invested/Acquired/Cooperation/Competition
Only extract relations with clear evidence.""",
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=4096,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"entities": [], "relations": []}

    def extract_from_multiple(self, texts: list[str]) -> dict:
        """Extract from multiple documents and merge"""
        all_entities = {}
        all_relations = []

        for i, text in enumerate(texts):
            print(f"Extracting [{i+1}/{len(texts)}]...")
            kg = self.extract(text)

            # Merge entities (deduplicate)
            for entity in kg["entities"]:
                key = entity["name"].lower()
                if key not in all_entities:
                    all_entities[key] = entity
                else:
                    # Merge aliases
                    existing = all_entities[key]
                    existing["aliases"] = list(set(existing.get("aliases", []) + entity.get("aliases", [])))

            # Merge relations
            all_relations.extend(kg["relations"])

        return {
            "entities": list(all_entities.values()),
            "relations": all_relations,
        }

# Usage
extractor = KnowledgeExtractor()

text = """
Alibaba Group was founded by Jack Ma in 1999 in Hangzhou. Alibaba's Taobao is China's largest e-commerce platform.
Alibaba Cloud is Alibaba's cloud computing subsidiary, providing AI and big data services.
In 2023, Alibaba launched the Tongyi Qianwen large model, competing with Baidu and Tencent in the AI field.
"""

kg = extractor.extract(text)

print(f"Entities ({len(kg['entities'])} total):")
for e in kg["entities"]:
    print(f"  {e['type']}: {e['name']}")

print(f"\nRelations ({len(kg['relations'])} total):")
for r in kg["relations"]:
    print(f"  {r['subject']} -[{r['relation']}]-> {r['object']}")
```

---

## Neo4j Integration

```python
from neo4j import GraphDatabase

class Neo4jKnowledgeGraph:
    """Store knowledge graph in Neo4j"""

    def __init__(self, uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "password"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def import_kg(self, kg: dict):
        """Import knowledge graph into Neo4j"""
        with self.driver.session() as session:
            # Create entity nodes
            for entity in kg["entities"]:
                session.run(
                    f"""
                    MERGE (n:Entity {{name: $name}})
                    SET n.type = $type,
                        n.aliases = $aliases
                    """,
                    name=entity["name"],
                    type=entity["type"],
                    aliases=entity.get("aliases", []),
                )

            # Create relationship edges
            for rel in kg["relations"]:
                session.run(
                    f"""
                    MATCH (a:Entity {{name: $subject}})
                    MATCH (b:Entity {{name: $object}})
                    MERGE (a)-[r:{rel['relation'].replace(' ', '_').replace('-', '_')}]->(b)
                    SET r.type = $relation
                    """,
                    subject=rel["subject"],
                    object=rel["object"],
                    relation=rel["relation"],
                )

            print(f"✅ Imported {len(kg['entities'])} entities, {len(kg['relations'])} relations")

    def query(self, cypher: str) -> list:
        """Execute Cypher query"""
        with self.driver.session() as session:
            result = session.run(cypher)
            return [record.data() for record in result]

    def get_entity_relations(self, entity_name: str) -> list:
        """Query all relations for an entity"""
        return self.query(f"""
            MATCH (n:Entity {{name: '{entity_name}'}})-[r]-(m:Entity)
            RETURN n.name AS source, type(r) AS relation, m.name AS target
        """)

    def find_path(self, from_entity: str, to_entity: str, max_depth: int = 3) -> list:
        """Find paths between two entities"""
        return self.query(f"""
            MATCH path = shortestPath(
                (a:Entity {{name: '{from_entity}'}})-[*..{max_depth}]-(b:Entity {{name: '{to_entity}'}})
            )
            RETURN [node in nodes(path) | node.name] AS path
        """)

    def close(self):
        self.driver.close()

# Usage
neo4j_kg = Neo4jKnowledgeGraph()
neo4j_kg.import_kg(kg)

# Query entity relations
relations = neo4j_kg.get_entity_relations("Alibaba")
for r in relations:
    print(f"{r['source']} -[{r['relation']}]-> {r['target']}")

# Find paths
paths = neo4j_kg.find_path("Jack Ma", "Baidu")
for p in paths:
    print(" → ".join(p["path"]))
```

---

## Knowledge Graph Visualization

```python
import networkx as nx
import matplotlib.pyplot as plt

def visualize_kg(kg: dict, output_file: str = "knowledge_graph.png"):
    """Visualize knowledge graph"""
    G = nx.DiGraph()

    # Color mapping
    color_map = {
        "Person": "#E8563A",
        "Organization": "#4ECDC4",
        "Location": "#F5A623",
        "Technology": "#6C5CE7",
        "Product": "#FF6B6B",
        "Concept": "#45B7D1",
    }

    # Add nodes
    for entity in kg["entities"]:
        G.add_node(
            entity["name"],
            color=color_map.get(entity["type"], "#95A5A6"),
            type=entity["type"],
        )

    # Add edges
    for rel in kg["relations"]:
        G.add_edge(rel["subject"], rel["object"], label=rel["relation"])

    # Draw
    plt.figure(figsize=(16, 12))
    pos = nx.spring_layout(G, k=2, iterations=50)

    # Group nodes by type
    for etype, color in color_map.items():
        nodes = [n for n, d in G.nodes(data=True) if d.get("type") == etype]
        if nodes:
            nx.draw_networkx_nodes(G, pos, nodelist=nodes, node_color=color,
                                   node_size=2000, alpha=0.9, label=etype)

    # Draw edges
    nx.draw_networkx_edges(G, pos, edge_color="#333333", arrows=True,
                           arrowsize=15, width=1.5, alpha=0.6)

    # Draw labels
    nx.draw_networkx_labels(G, pos, font_size=9, font_family="sans-serif")

    # Edge labels
    edge_labels = {(r["subject"], r["object"]): r["relation"] for r in kg["relations"]}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=7)

    plt.legend(loc="upper right")
    plt.title("AI-Built Knowledge Graph", fontsize=16)
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(output_file, dpi=150, bbox_inches="tight")
    print(f"✅ Knowledge graph saved: {output_file}")

# Usage
visualize_kg(kg, "kg_alibaba.png")
```

---

## Knowledge Q&A

```python
def kg_qa(neo4j_kg: Neo4jKnowledgeGraph, question: str) -> str:
    """Knowledge graph-based Q&A"""
    # First extract entities from the question
    extractor = KnowledgeExtractor()
    q_entities = extractor.extract(question)

    # Query relevant information in the graph
    context = []
    for entity in q_entities["entities"]:
        name = entity["name"]
        relations = neo4j_kg.get_entity_relations(name)
        for r in relations:
            context.append(f"{r['source']} {r['relation']} {r['target']}")

    # Use large model to answer based on graph data
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[
            {
                "role": "system",
                "content": f"Answer the question based on the following knowledge graph data:\n" + "\n".join(context),
            },
            {"role": "user", "content": question},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content

# Usage
answer = kg_qa(neo4j_kg, "What is the competitive relationship between Alibaba and Baidu?")
print(answer)
```

---

## Next Steps

- [GraphRAG Knowledge-Enhanced Retrieval](/tutorials/rag-chinese-ai-models-guide/)
- [Neo4j + AI Comprehensive Solution](/tutorials/vector-database-comparison-china/)

> 📝 Based on DeepSeek + Neo4j, June 2026.
