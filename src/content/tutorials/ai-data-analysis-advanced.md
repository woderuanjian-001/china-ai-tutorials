---
title: "Chinese AI Data Analysis Advanced: Multidimensional Analytics, Anomaly Detection & Predictive Modeling with DeepSeek/Qwen"
description: "Perform advanced data analysis with Chinese AI models: multidimensional cross-analysis, intelligent anomaly detection, time series predictive modeling, and natural language chart generation. Includes Pandas and DeepSeek complete data analysis workflow."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Data Analysis", "Visualization", "Prediction", "Anomaly Detection", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will perform deep data analysis with AI:

- Multidimensional cross-analysis
- Intelligent anomaly detection
- Time series predictive modeling
- Natural language chart generation

> Upload 100,000 rows of sales data to AI -> ask "Analyze the reasons for the sales decline" -> 1 minute later receive: root cause analysis + visualizations + improvement suggestions. AI is a super-accelerator for data analysis.

---

## Multidimensional Cross-Analysis

```python
class MultiDimensionAnalyzer:
    """AI multidimensional data analysis"""

    def __init__(self):
        self.client = client

    def analyze(self, data_description: str, columns: list[dict], analysis_goal: str) -> dict:
        """Multidimensional cross-analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Perform multidimensional cross-analysis of the data.

Data overview: {data_description}
Field definitions: {json.dumps(columns, ensure_ascii=False)}
Analysis goal: {analysis_goal}

Output JSON:
{{
  "summary": {{
    "total_rows": Data volume,
    "time_range": "Time range",
    "key_metrics": {{"metric_name": "value"}}
  }},
  "dimension_analysis": [
    {{
      "dimension": "Analysis dimension",
      "breakdown": {{"category_value": "metric_value"}},
      "insight": "Finding",
      "recommendation": "Recommendation"
    }}
  ],
  "correlations": [
    {{"factor1": "Factor A", "factor2": "Factor B", "correlation": "Positive/Negative/None", "strength": "Strong/Medium/Weak", "explanation": "Explanation"}}
  ],
  "anomalies": ["Anomalous data points found"],
  "actionable_insights": ["Actionable insights (by priority)"],
  "further_questions": ["Suggested directions for further analysis"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_sql(self, analysis_request: str, table_schema: dict) -> str:
        """Generate SQL queries from natural language"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Convert the natural language analysis request into a SQL query.

Analysis request: {analysis_request}
Table schema: {json.dumps(table_schema, ensure_ascii=False)}

Output SQL directly, well-formatted, with comments. If it's a data warehouse (e.g., ClickHouse), use the appropriate SQL dialect.""",
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )
        return response.choices[0].message.content

# Usage
analyzer = MultiDimensionAnalyzer()

columns = [
    {"name": "order_date", "type": "date", "description": "Order date"},
    {"name": "product_category", "type": "string", "description": "Product category"},
    {"name": "region", "type": "string", "description": "Region"},
    {"name": "channel", "type": "string", "description": "Sales channel"},
    {"name": "amount", "type": "float", "description": "Order amount"},
    {"name": "customer_type", "type": "string", "description": "Customer type (new/returning)"},
]

result = analyzer.analyze(
    "E-commerce platform Q1 2026 sales data, approximately 100,000 orders",
    columns,
    "Analyze regional sales trends, category performance, and channel efficiency to identify growth opportunities",
)

print(f"Data volume: {result.get('summary', {}).get('total_rows')}")
print(f"Key metrics: {result.get('summary', {}).get('key_metrics')}")

print("\nCorrelation analysis:")
for corr in result.get("correlations", []):
    print(f"  {corr['factor1']} <-> {corr['factor2']}: {corr['correlation']} ({corr['strength']})")

print("\nActionable insights:")
for insight in result.get("actionable_insights", []):
    print(f"  {insight}")
```

---

## Intelligent Anomaly Detection

```python
class AnomalyDetector:
    """AI intelligent anomaly detection"""

    ANOMALY_TYPES = {
        "point": "Point anomaly — a single data point that is clearly deviating",
        "contextual": "Contextual anomaly — anomalous only in a specific context (e.g., high temperature on a weekend)",
        "collective": "Collective anomaly — a group of data points with an anomalous pattern",
        "trend_change": "Trend shift — a sudden change in trend",
    }

    def detect_anomalies(self, data_description: str, metrics: dict, context: str = "") -> dict:
        """Detect anomalies in data"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Detect anomalies in the data.

Data: {data_description}
Metrics: {json.dumps(metrics, ensure_ascii=False)}
Business context: {context}

Output JSON:
{{
  "anomalies": [
    {{
      "id": "A001",
      "type": "Anomaly type",
      "metric": "Anomalous metric",
      "value": Anomalous value,
      "expected_range": "Normal range",
      "deviation": "Degree of deviation",
      "time": "Time of anomaly",
      "severity": "Severe/Moderate/Minor",
      "possible_causes": ["Possible causes (ordered by likelihood)"],
      "business_impact": "Business impact assessment",
      "recommended_action": "Recommended action"
    }}
  ],
  "overall_assessment": "Overall data health assessment",
  "systemic_issues": ["Systemic issues (common root causes of multiple anomalies)"],
  "false_positive_risk": ["Anomalies that may be false positives"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def root_cause_analysis(self, anomaly: dict, relevant_data: dict) -> dict:
        """Root cause analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Perform root cause analysis on the anomaly.

Anomaly: {json.dumps(anomaly, ensure_ascii=False)}
Related data: {json.dumps(relevant_data, ensure_ascii=False)[:6000]}

Output JSON:
{{
  "root_cause": "Root cause conclusion",
  "causal_chain": ["Causal chain (from symptom to root cause)"],
  "evidence": ["Supporting evidence"],
  "alternative_explanations": ["Other possible explanations"],
  "confidence": "Confidence level",
  "recommended_fix": "Fix recommendation",
  "prevention": "Preventive measures"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
detector = AnomalyDetector()

anomalies = detector.detect_anomalies(
    "E-commerce website visit and transaction data from the past 30 days",
    {
        "daily_visitors": "Average 50,000, today 82,000",
        "conversion_rate": "Average 3.2%, today 1.1%",
        "avg_order_value": "Average 280 CNY, today 310 CNY",
        "bounce_rate": "Average 45%, today 68%",
    },
    context="Today is the first day of the 618 mega sale, site-wide 20% off",
)

print(f"Data health: {anomalies.get('overall_assessment')}")
for a in anomalies.get("anomalies", []):
    print(f"ALERT {a['metric']}: {a['value']} (Normal: {a['expected_range']}) — {a['severity']}")
    print(f"   Causes: {a.get('possible_causes', [])}")
```

---

## Predictive Modeling

```python
class ForecastModeler:
    """AI predictive modeling"""

    def build_forecast(self, historical_data_desc: str, target: str, horizon: str, factors: list[str]) -> dict:
        """Build a predictive model"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Perform predictive modeling based on historical data.

Historical data: {historical_data_desc}
Forecast target: {target}
Forecast horizon: {horizon}
Influencing factors: {json.dumps(factors, ensure_ascii=False)}

Output JSON:
{{
  "forecast_method": "Recommended forecasting method (ARIMA/Prophet/LSTM, etc.)",
  "forecast_values": [
    {{"period": "Time period", "predicted": Predicted value, "lower_bound": Lower bound, "upper_bound": Upper bound, "confidence": "Confidence level"}}
  ],
  "trend": "Trend assessment",
  "seasonality": "Seasonal pattern (if any)",
  "key_drivers": ["Primary drivers"],
  "scenarios": {{
    "optimistic": "Optimistic scenario",
    "pessimistic": "Pessimistic scenario",
    "most_likely": "Most likely scenario"
  }},
  "accuracy_assessment": "Forecast accuracy assessment",
  "risks": ["Forecast risk factors"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def what_if_analysis(self, baseline: dict, changes: list[dict]) -> dict:
        """What-If scenario analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Perform What-If scenario analysis.

Baseline scenario: {json.dumps(baseline, ensure_ascii=False)}
Change assumptions: {json.dumps(changes, ensure_ascii=False)}

Output JSON:
{{
  "scenarios": [
    {{
      "scenario": "Scenario name",
      "change": "Change description",
      "impact": {{
        "metric": "Impacted metric",
        "magnitude": "Impact magnitude",
        "direction": "Increase/Decrease/Unchanged"
      }},
      "probability": "Probability of occurrence",
      "time_to_impact": "Time until impact manifests"
    }}
  ],
  "most_impactful_factor": "Most impactful factor",
  "robust_strategy": "Strategy effective across all scenarios",
  "hedging_suggestions": ["Hedging suggestions"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
forecaster = ForecastModeler()

forecast = forecaster.build_forecast(
    "Monthly sales data for the past 24 months (2024.06-2026.06), overall upward trend with Q4 peak season effect each year",
    target="Monthly sales for the next 6 months",
    horizon="2026.07-2026.12",
    factors=["Seasonality", "Promotional activities", "Competitor dynamics", "Macroeconomic conditions"],
)

print(f"Forecast method: {forecast.get('forecast_method')}")
print(f"Trend: {forecast.get('trend')}")
for fv in forecast.get("forecast_values", []):
    print(f"  {fv['period']}: {fv['predicted']} (Range: {fv['lower_bound']}-{fv['upper_bound']})")
```

---

## Natural Language Chart Generation

```python
class ChartGenerator:
    """AI natural language -> charts"""

    CHART_TYPES = {
        "Trend": "Line chart",
        "Comparison": "Bar chart / Column chart",
        "Proportion": "Pie chart / Donut chart",
        "Distribution": "Histogram / Box plot",
        "Relationship": "Scatter plot / Bubble chart",
        "Heatmap": "Heatmap",
        "Flow": "Sankey diagram",
    }

    def recommend_chart(self, data_context: str, message: str) -> dict:
        """Recommend the best chart type"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Recommend the best chart type for the data.

Data: {data_context}
Message to convey: {message}

Available charts: {json.dumps(self.CHART_TYPES, ensure_ascii=False)}

Output JSON:
{{
  "recommended_chart": "Recommended chart",
  "reason": "Recommendation rationale",
  "alternatives": ["Alternative charts"],
  "x_axis": "X-axis",
  "y_axis": "Y-axis",
  "grouping": "Grouping method",
  "color_scheme": "Color scheme suggestion",
  "annotations": ["Key data points to annotate"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_echarts_config(self, chart_type: str, data: dict, title: str) -> dict:
        """Generate ECharts configuration"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate an ECharts chart configuration.

Chart type: {chart_type}
Data: {json.dumps(data, ensure_ascii=False)}
Title: {title}

Output a complete ECharts option JSON object including:
- title, tooltip, legend
- xAxis, yAxis
- series (with color configuration)
- Responsive settings

Use English labels.""",
                },
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_narrative(self, chart_config: dict, data_summary: str) -> str:
        """Generate chart narrative"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a data narrative for the chart.

Chart config: {json.dumps(chart_config, ensure_ascii=False)[:2000]}
Data summary: {data_summary}

Generate:
1. One-line title (engaging)
2. Key findings (3 points)
3. Data interpretation (explain why)
4. Action recommendations (what to do based on the data)

Write in approachable, easy-to-understand language.""",
                },
            ],
            temperature=0.5,
            max_tokens=800,
        )
        return response.choices[0].message.content

# Usage
charts = ChartGenerator()

rec = charts.recommend_chart(
    "Monthly revenue by product line, Jan-Jun 2026: Product A (100,120,130,125,140,155), Product B (80,85,90,95,100,105), Product C (50,45,40,35,30,25)",
    "Show the growth trend comparison across three product lines",
)

print(f"Recommended: {rec.get('recommended_chart')}")
print(f"X-axis: {rec.get('x_axis')} | Y-axis: {rec.get('y_axis')}")

echarts = charts.generate_echarts_config(
    "Line chart",
    {
        "categories": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "series": [
            {"name": "Product A", "data": [100, 120, 130, 125, 140, 155]},
            {"name": "Product B", "data": [80, 85, 90, 95, 100, 105]},
            {"name": "Product C", "data": [50, 45, 40, 35, 30, 25]},
        ],
    },
    "Monthly Revenue by Product Line",
)
print(f"\nECharts config (partial): \n{json.dumps(echarts, ensure_ascii=False, indent=2)[:400]}")
```

---

## Data Analysis AI Pipeline

```
Raw Data
    |
    v
AI Data Cleaning -> Missing value imputation / Format standardization / Outlier flagging
    |
    v
AI Exploratory Analysis -> Descriptive statistics / Correlations / Distributions / Multidimensional cross-analysis
    |
    v
AI Anomaly Detection -> Auto-detect anomalies + Root cause analysis
    |
    v
AI Predictive Modeling -> Trend forecasting + Scenario analysis
    |
    v
AI Visualization -> Chart recommendations + ECharts generation
    |
    v
AI Reporting -> Data narrative + Action recommendations
```

---

## Next Steps

- [AI Recommendation System](/tutorials/ai-personalization-recommendation/)
- [AI E-Commerce Operations](/tutorials/ai-ecommerce-optimization/)

> Based on Pandas + ECharts + DeepSeek, June 2026.
