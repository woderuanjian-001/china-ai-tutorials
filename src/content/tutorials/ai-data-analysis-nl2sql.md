---
title: "NL2SQL with Chinese AI Models: Natural Language to SQL Data Analysis with DeepSeek/Qwen"
description: "Query databases with natural language using Chinese AI models: DeepSeek/Qwen-powered NL2SQL, intelligent chart generation, data insight analysis. Includes MySQL/PostgreSQL integration code."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Data Analysis", "SQL", "NL2SQL", "Database", "Charts", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will build an AI system for querying databases with natural language:

- Natural language to SQL queries
- Automatic chart generation
- Data insight analysis
- Web-based interactive interface

> 🎯 "What were the top 10 best-selling products last month?" → AI auto-generates SQL → returns results + charts. Your boss never needs to bother you again.

---

## NL2SQL Core Implementation

```python
class NL2SQL:
    """Natural Language to SQL"""

    def __init__(self, db_type: str = "mysql"):
        self.client = client
        self.db_type = db_type
        self.schema_cache = {}

    def get_schema(self, tables: list[str] = None) -> str:
        """Get database table schema"""
        import pymysql

        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME"),
        )

        cursor = conn.cursor()

        if not tables:
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]

        schema = []
        for table in tables:
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            schema.append(f"Table {table} (")
            for col in columns:
                schema.append(f"  {col[0]} {col[1]} -- {col[4] or ''}")
            schema.append(")")

        conn.close()
        return "\n".join(schema)

    def generate_sql(self, question: str, schema: str = None) -> dict:
        """Natural language → SQL"""
        if not schema:
            schema = self.get_schema()

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a SQL expert. Generate {self.db_type} queries based on the database schema and user question.

Database schema:
{schema}

Rules:
1. Only generate SELECT statements (security restriction)
2. Use appropriate JOIN, WHERE, GROUP BY, ORDER BY
3. Auto-add LIMIT 100 for large table queries
4. Pay attention to date field formats

Output JSON:
{{
  "sql": "Generated SQL",
  "explanation": "SQL explanation",
  "tables_used": ["Tables involved"],
  "has_aggregation": true/false
}}""",
                },
                {"role": "user", "content": question},
            ],
            temperature=0.1,
            max_tokens=1024,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"sql": "", "explanation": "Generation failed"}

    def execute_sql(self, sql: str) -> list[dict]:
        """Safely execute SQL"""
        # Security check — only allow SELECT
        if not sql.strip().upper().startswith("SELECT"):
            raise ValueError("Only SELECT queries are allowed")

        # Block dangerous keywords
        dangerous = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE"]
        for word in dangerous:
            if word in sql.upper():
                raise ValueError(f"Operation {word} is forbidden")

        import pymysql

        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME"),
        )

        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(sql)
        results = cursor.fetchall()
        conn.close()

        return results

    def ask(self, question: str) -> dict:
        """Natural language query (complete pipeline)"""
        # 1. NL → SQL
        print(f"🤔 Question: {question}")
        result = self.generate_sql(question)
        sql = result["sql"]
        print(f"📝 SQL: {sql}")

        if not sql:
            return {"error": "Unable to generate SQL"}

        # 2. Execute query
        try:
            data = self.execute_sql(sql)
            print(f"✅ Returned {len(data)} rows")
        except Exception as e:
            return {"error": str(e), "sql": sql}

        # 3. AI interprets results
        if data:
            sample = json.dumps(data[:5], ensure_ascii=False, default=str)
            explanation = self._explain_results(question, sql, sample, len(data))
        else:
            explanation = "Query returned no results"

        return {
            "question": question,
            "sql": sql,
            "sql_explanation": result["explanation"],
            "data": data,
            "row_count": len(data),
            "explanation": explanation,
        }

    def _explain_results(self, question: str, sql: str, sample: str, total: int) -> str:
        """AI interprets query results"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a data analyst. Interpret the query results in natural language, 2-4 sentences.",
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\nSQL: {sql}\nTotal rows: {total}\nSample data: {sample}",
                },
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return response.choices[0].message.content

# Usage
nl2sql = NL2SQL()

# Natural language query
result = nl2sql.ask("上个月销售额最高的10个产品是什么？")

print(f"\n{'='*50}")
print(f"SQL: {result['sql']}")
print(f"Returned: {result['row_count']} rows")
print(f"Interpretation: {result['explanation']}")

if result.get("data"):
    print("\nData preview:")
    for row in result["data"][:3]:
        print(f"  {row}")
```

---

## Automatic Chart Generation

```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")  # Non-GUI backend
matplotlib.rcParams["font.sans-serif"] = ["Microsoft YaHei"]

class AutoChartGenerator:
    """Automatic chart generation"""

    def suggest_and_generate(self, data: list[dict], question: str) -> str:
        """AI suggests chart type and generates it"""
        # 1. AI analyzes data and suggests chart
        sample = json.dumps(data[:3], ensure_ascii=False, default=str)
        keys = list(data[0].keys()) if data else []

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Select the best chart type based on the data.

Data fields: {keys}
Sample: {sample}
Question: {question}

Output JSON:
{{
  "chart_type": "bar/line/pie/scatter",
  "x_field": "X-axis field",
  "y_field": "Y-axis field",
  "title": "Chart title",
  "sort": true/false
}}

Rules:
- Category comparison → bar
- Time trend → line
- Proportion distribution → pie
- Correlation → scatter""",
                },
            ],
            temperature=0.1,
        )

        try:
            config = json.loads(response.choices[0].message.content)
        except:
            config = {"chart_type": "bar", "x_field": keys[0], "y_field": keys[1] if len(keys) > 1 else keys[0]}

        # 2. Generate chart
        return self._render(data, config)

    def _render(self, data: list[dict], config: dict) -> str:
        """Render chart"""
        chart_type = config["chart_type"]
        x_field = config["x_field"]
        y_field = config.get("y_field", x_field)
        title = config.get("title", "Data Chart")

        x = [str(row.get(x_field, "")) for row in data]
        y = [float(row.get(y_field, 0)) if row.get(y_field) else 0 for row in data]

        plt.figure(figsize=(12, 6))

        # Color palette
        colors = ["#E8563A", "#4ECDC4", "#F5A623", "#6C5CE7", "#FF6B6B"]

        if chart_type == "bar":
            plt.bar(x, y, color=colors[:len(x)])
        elif chart_type == "line":
            plt.plot(x, y, marker="o", color=colors[0], linewidth=2)
        elif chart_type == "pie":
            plt.pie(y, labels=x, autopct="%1.1f%%", colors=colors)
        elif chart_type == "scatter":
            plt.scatter(x, y, c=colors[0], s=100, alpha=0.6)

        plt.title(title, fontsize=16, fontweight="bold")
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        # Save
        filename = f"chart_{int(time.time())}.png"
        plt.savefig(filename, dpi=150, bbox_inches="tight")
        plt.close()

        return filename

# Usage
chart_gen = AutoChartGenerator()
# chart_path = chart_gen.suggest_and_generate(result["data"], result["question"])
# print(f"📊 Chart generated: {chart_path}")
```

---

## Data Insight AI

```python
class DataInsightAI:
    """AI data insight discovery"""

    def discover_insights(self, data: list[dict], context: str = "") -> list[dict]:
        """Discover insights from data"""
        summary = {
            "row_count": len(data),
            "columns": list(data[0].keys()) if data else [],
            "sample": data[:5],
            "context": context,
        }

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """You are a senior data analyst. Discover valuable insights from the data.

Output JSON array:
[
  {
    "type": "trend/anomaly/correlation/distribution",
    "finding": "Finding description",
    "importance": "high/medium/low",
    "evidence": "Data evidence",
    "recommendation": "Recommended action"
  }
]

Requirements:
- Identify the 3-5 most noteworthy findings
- Data-driven, no empty claims
- Provide specific actionable recommendations""",
                },
                {"role": "user", "content": json.dumps(summary, ensure_ascii=False, default=str)},
            ],
            temperature=0.5,
            max_tokens=2048,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
insight_ai = DataInsightAI()
# insights = insight_ai.discover_insights(sales_data, "2026年Q1销售数据")
# for ins in insights:
#     print(f"[{ins['importance']}] {ins['type']}: {ins['finding']}")
```

---

## Web Interactive Interface

```python
# Quick NL2SQL interface with Gradio
import gradio as gr

def build_nl2sql_ui():
    """Build NL2SQL interactive interface"""
    nl2sql = NL2SQL()
    chart_gen = AutoChartGenerator()
    insight_ai = DataInsightAI()

    def process_query(question: str, history: list):
        """Process user query"""
        result = nl2sql.ask(question)

        if "error" in result:
            return history, "Query error", None

        # Generate chart
        if result.get("data") and len(result["data"]) > 0:
            chart_path = chart_gen.suggest_and_generate(result["data"], question)
        else:
            chart_path = None

        response_text = f"""### 📊 Query Results

**SQL**: `{result['sql']}`

**Returned**: {result['row_count']} rows

**Interpretation**: {result['explanation']}"""

        history.append((question, response_text))
        return history, response_text, chart_path

    with gr.Blocks(title="AI Data Analysis Assistant") as demo:
        gr.Markdown("# 🤖 AI Data Analysis Assistant")
        gr.Markdown("Query your database with natural language")

        chatbot = gr.Chatbot(height=400)
        with gr.Row():
            question = gr.Textbox(
                placeholder="E.g., What were the top 10 best-selling products last month?",
                label="Question",
                scale=8,
            )
            submit = gr.Button("Query", variant="primary", scale=1)

        with gr.Row():
            result_text = gr.Markdown(label="Result")
            chart = gr.Image(label="Chart", visible=True)

        submit.click(
            process_query,
            inputs=[question, chatbot],
            outputs=[chatbot, result_text, chart],
        )

    demo.launch()

# build_nl2sql_ui()
```

---

## Next Steps

- [AI Model Benchmarking](/tutorials/ai-model-benchmark-guide/)
- [AI Startup Guide](/tutorials/ai-startup-guide-zero-cost/)

> 📝 Based on DeepSeek + MySQL + Matplotlib, June 2026.
