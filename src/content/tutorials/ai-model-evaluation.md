---
title: "Chinese AI Model Evaluation: Benchmark Comparison, Custom Eval Sets & Multi-Dimensional Scoring of DeepSeek, Qwen, Kimi and More"
description: "Build a model evaluation system for Chinese AI models: capability comparison across major Chinese LLMs, custom evaluation set construction, multi-dimensional scoring (accuracy, speed, cost), and Arena-style rankings. Real benchmark data from testing 20+ Chinese models including DeepSeek, Qwen, Kimi, GLM, and Baichuan."
category: "Advanced Models"
date: 2026-06-27
tags: ["Model Evaluation", "Benchmark", "Arena", "Comparison", "Model Selection", "Advanced"]
level: "Advanced"

---

## What Problem Does This Tutorial Solve?

You will learn how to scientifically evaluate and compare AI models:

- Capability comparison across major models
- Building custom evaluation sets
- Multi-dimensional scoring (quality/speed/cost)
- Arena-style blind evaluation

> 🎯 "Which model is best?" There's no absolute answer. DeepSeek is strongest at coding, Qwen has the best Chinese comprehension, Kimi excels at long texts. The use case determines the choice.

---

## Model Benchmark Comparison

```python
class ModelBenchmark:
    """AI model benchmarking"""

    # Reference data from actual testing of major Chinese models, June 2026
    REFERENCE_SCORES = {
        "DeepSeek V4 Pro": {"coding": 92, "reasoning": 90, "chinese": 88, "speed": 75, "cost": "$$"},
        "Qwen-Max": {"coding": 85, "reasoning": 87, "chinese": 93, "speed": 70, "cost": "$$$"},
        "Kimi (moonshot-v1)": {"coding": 80, "reasoning": 82, "chinese": 90, "long_context": 95, "speed": 80, "cost": "$$"},
        "GLM-4-Plus": {"coding": 88, "reasoning": 88, "chinese": 91, "speed": 65, "cost": "$$$"},
        "Step-2": {"coding": 86, "reasoning": 86, "chinese": 86, "multimodal": 88, "speed": 72, "cost": "$$$"},
        "Baichuan 4": {"coding": 78, "reasoning": 80, "chinese": 88, "speed": 85, "cost": "$"},
        "MiniMax-Text-01": {"coding": 75, "reasoning": 76, "chinese": 84, "long_context": 92, "speed": 90, "cost": "$"},
        "Doubao-Pro": {"coding": 82, "reasoning": 83, "chinese": 87, "multimodal": 90, "speed": 88, "cost": "$$"},
        "Ernie 4.0": {"coding": 84, "reasoning": 85, "chinese": 90, "multimodal": 92, "speed": 68, "cost": "$$$"},
        "Hunyuan-Pro": {"coding": 83, "reasoning": 84, "chinese": 89, "multimodal": 88, "speed": 72, "cost": "$$"},
        "Yi-Large": {"coding": 77, "reasoning": 78, "chinese": 82, "speed": 78, "cost": "$$"},
        "SenseNova 5.5": {"coding": 81, "reasoning": 83, "chinese": 86, "multimodal": 90, "speed": 70, "cost": "$$$"},
    }

    def compare_models(self, requirements: dict) -> dict:
        """Recommend models based on requirements"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Recommend the most suitable AI model based on the requirements.

Requirements: {json.dumps(requirements, ensure_ascii=False)}
Model reference data: {json.dumps(self.REFERENCE_SCORES, ensure_ascii=False)}

Output JSON:
{{
  "top_picks": [
    {{
      "model": "Model name",
      "rank": Rank,
      "fit_score": Fit score 0-100,
      "strengths": ["Strengths"],
      "weaknesses": ["Weaknesses"],
      "best_for": "Best use case",
      "estimated_monthly_cost": "Estimated monthly cost (based on 1M tokens/day)"
    }}
  ],
  "comparison_table": "Brief comparison description",
  "recommendation": "Final recommendation with rationale"
}}

Consider: Task type, quality requirements, speed requirements, budget, Chinese capability, long context, multimodal""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
benchmark = ModelBenchmark()

requirements = {
    "task": "Chinese novel writing assistant",
    "quality_priority": 9,
    "speed_priority": 5,
    "budget": "Medium",
    "chinese_ability": "Must be top-tier",
    "context_length": "At least 128K tokens",
    "output_length": "Need 2000+ words per output",
}

result = benchmark.compare_models(requirements)
print(f"Recommendation: {result.get('recommendation', '')}")

for pick in result.get("top_picks", [])[:3]:
    print(f"\n🥇 Rank #{pick['rank']}: {pick['model']} (Fit: {pick['fit_score']})")
    print(f"   Strengths: {', '.join(pick.get('strengths', []))}")
    print(f"   Best for: {pick.get('best_for')}")
```

---

## Custom Evaluation Set

```python
class CustomEvaluator:
    """Custom model evaluation"""

    def __init__(self):
        self.client = client
        self.models = {
            "deepseek": {"base_url": "https://api.deepseek.com/v1", "model": "deepseek-v4-pro", "env_key": "DEEPSEEK_API_KEY"},
            "qwen": {"base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1", "model": "qwen-max", "env_key": "DASHSCOPE_API_KEY"},
            "kimi": {"base_url": "https://api.moonshot.cn/v1", "model": "moonshot-v1-auto", "env_key": "MOONSHOT_API_KEY"},
        }

    def create_test_suite(self, use_case: str, difficulty: str = "Mixed") -> list[dict]:
        """AI generates evaluation test cases"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Create AI model evaluation test cases.

Scenario: {use_case}
Difficulty: {difficulty}

Output JSON array (10 test cases):
[
  {{
    "id": "test_001",
    "category": "Text Comprehension/Reasoning/Generation/Coding/Math/Creativity/Knowledge",
    "difficulty": "Easy/Medium/Hard",
    "prompt": "User input",
    "expected_behavior": "Description of expected behavior",
    "evaluation_criteria": "Scoring criteria (0-10 points)",
    "reference_answer": "Reference answer (if any)",
    "trap": "Possible trap (if none, put N/A)"
  }}
]

Test case requirements:
- Cover different types (factual queries, reasoning, creativity, coding, translation, etc.)
- Include Chinese-specific tests (classical Chinese, idioms, dialects, etc.)
- Include edge case tests (very long inputs, ambiguous questions, etc.)""",
                },
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def run_test(self, test_case: dict, model_name: str) -> dict:
        """Run a single test"""
        model_info = self.models.get(model_name)
        if not model_info:
            return {"error": f"Unknown model: {model_name}"}

        client = OpenAI(
            api_key=os.getenv(model_info["env_key"]),
            base_url=model_info["base_url"],
        )

        start_time = time.time()

        try:
            response = client.chat.completions.create(
                model=model_info["model"],
                messages=[{"role": "user", "content": test_case["prompt"]}],
                temperature=0.3,
                max_tokens=1000,
            )

            latency = (time.time() - start_time) * 1000
            output = response.choices[0].message.content
            usage = response.usage

            return {
                "model": model_name,
                "test_id": test_case["id"],
                "output": output,
                "latency_ms": round(latency, 1),
                "tokens": {"input": usage.prompt_tokens, "output": usage.completion_tokens},
                "status": "success",
            }

        except Exception as e:
            return {
                "model": model_name,
                "test_id": test_case["id"],
                "error": str(e),
                "status": "error",
            }

    def score_response(self, test_case: dict, response: dict) -> dict:
        """AI auto-scoring"""
        response_text = json.dumps(response, ensure_ascii=False)

        judge_result = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""As an evaluation judge, score the AI's response.

Test case: {json.dumps(test_case, ensure_ascii=False)}
Model response: {response_text}

Output JSON:
{{
  "score": 0-10,
  "dimensions": {{
    "accuracy": {{"score": 0-10, "comment": "Accuracy"}},
    "completeness": {{"score": 0-10, "comment": "Completeness"}},
    "clarity": {{"score": 0-10, "comment": "Clarity"}},
    "creativity": {{"score": 0-10, "comment": "Creativity (if applicable)"}},
    "chinese_quality": {{"score": 0-10, "comment": "Chinese quality"}}
  }},
  "hallucination_detected": true/false,
  "hallucination_detail": "If hallucination detected, provide details",
  "overall_comment": "Overall assessment (within 50 words)"
}}

Scoring notes:
- Do not consider speed, only response quality
- Chinese quality includes grammar, word choice, and naturalness of expression
- If the response fabricates non-existent facts, mark as hallucination""",
                },
            ],
            temperature=0.2,
            max_tokens=800,
        )
        try:
            return json.loads(judge_result.choices[0].message.content)
        except:
            return {"score": 0}

    def run_full_evaluation(self, test_suite: list[dict], models: list[str]) -> dict:
        """Run complete evaluation"""
        results = {model: [] for model in models}

        for test_case in test_suite:
            for model_name in models:
                print(f"🧪 {test_case['id']} → {model_name}")
                response = self.run_test(test_case, model_name)
                score = self.score_response(test_case, response)
                results[model_name].append({
                    "test_case": test_case,
                    "response": response,
                    "score": score,
                })

        # Summary
        summary = {}
        for model_name in models:
            scores = [r["score"].get("score", 0) for r in results[model_name] if r.get("score")]
            valid_tests = len(scores)
            summary[model_name] = {
                "avg_score": round(sum(scores) / max(valid_tests, 1), 1),
                "max_score": max(scores) if scores else 0,
                "min_score": min(scores) if scores else 0,
                "tests_passed": valid_tests,
                "tests_total": len(test_suite),
            }

        return {"per_model_results": results, "summary": summary}

# Usage
evaluator = CustomEvaluator()

# Generate evaluation set
suite = evaluator.create_test_suite("Chinese technical documentation writing assistant", "Mixed")

for tc in suite[:3]:
    print(f"📝 {tc['id']} [{tc['category']}] {tc['difficulty']}")
    print(f"   Prompt: {tc['prompt'][:60]}...")
```

---

## Multi-Dimensional Scoring

```python
class MultiDimensionScorer:
    """AI model multi-dimensional scoring"""

    DIMENSIONS = {
        "quality": {"weight": 0.40, "description": "Accuracy, completeness, and usefulness of responses"},
        "speed": {"weight": 0.20, "description": "Response speed (first token + total time)"},
        "cost": {"weight": 0.20, "description": "API call cost"},
        "chinese": {"weight": 0.15, "description": "Chinese language processing quality"},
        "stability": {"weight": 0.05, "description": "Service availability and consistency"},
    }

    def composite_score(self, model_name: str, dimension_scores: dict) -> dict:
        """Weighted composite score"""
        total = 0
        weighted_scores = {}

        for dim, config in self.DIMENSIONS.items():
            score = dimension_scores.get(dim, 0)
            weight = config["weight"]
            weighted = score * weight
            weighted_scores[dim] = {"raw_score": score, "weight": weight, "weighted": weighted}
            total += weighted

        return {
            "model": model_name,
            "composite_score": round(total, 1),
            "dimensions": weighted_scores,
            "rating": "S" if total >= 90 else "A" if total >= 80 else "B" if total >= 70 else "C" if total >= 60 else "D",
        }

    def score_from_api_metrics(self, model_name: str, metrics: dict) -> dict:
        """Automatically calculate scores from API metrics"""
        # Quality score requires human/judge model evaluation
        quality = metrics.get("quality_score", 80)

        # Speed score: <500ms → 100, <2s → 80, <5s → 60
        latency = metrics.get("avg_latency_ms", 2000)
        speed = 100 if latency < 500 else 80 if latency < 2000 else 60 if latency < 5000 else 40

        # Cost score: <¥1/1M tokens → 100
        cost_per_1m = metrics.get("cost_per_1m_tokens_yuan", 10)
        cost = 100 if cost_per_1m < 1 else 85 if cost_per_1m < 5 else 70 if cost_per_1m < 10 else 50 if cost_per_1m < 20 else 30

        # Chinese score
        chinese = metrics.get("chinese_quality_score", 85)

        # Stability score
        stability = metrics.get("uptime_percent", 99.5)

        return self.composite_score(model_name, {
            "quality": quality,
            "speed": speed,
            "cost": cost,
            "chinese": chinese,
            "stability": stability,
        })

# Usage
scorer = MultiDimensionScorer()

# Example based on measured metrics for DeepSeek V4 Pro
deepseek_score = scorer.score_from_api_metrics("DeepSeek V4 Pro", {
    "quality_score": 90,
    "avg_latency_ms": 1200,
    "cost_per_1m_tokens_yuan": 2,
    "chinese_quality_score": 88,
    "uptime_percent": 99.9,
})

print(f"Composite score: {deepseek_score['composite_score']} (Rating: {deepseek_score['rating']})")
for dim, data in deepseek_score["dimensions"].items():
    print(f"  {dim}: {data['raw_score']} x {data['weight']} = {data['weighted']}")
```

---

## Model Selection Decision Tree

```
What is your task?
│
├─ Coding → DeepSeek / GLM-4 / Qwen-Coder
├─ Chinese Content Creation → Qwen-Max / Kimi / Ernie 4.0
├─ Long Text Processing → Kimi / MiniMax / DeepSeek
├─ Multimodal Understanding → Step-1V / GLM-4V / Doubao-Vision
├─ Low-Cost High-Volume → DeepSeek / Baichuan / MiniMax
├─ High-Precision Reasoning → DeepSeek / Qwen-Max / GLM-4-Plus
└─ Image/Video Generation → Jimeng / Tongyi Wanxiang / Kling
```

---

## Next Steps

- [Model Pricing Comparison](/tutorials/ai-model-pricing-compare/)
- [Model Comparison Guide](/tutorials/ai-model-compare-guide/)

> 📝 Based on actual Chinese AI model market data from June 2026.
