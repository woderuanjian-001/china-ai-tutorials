---
title: "Chinese AI Prompt Engineering Advanced: Chain-of-Thought, Few-Shot & Structured Outputs with DeepSeek/Qwen/GLM"
description: "Master advanced prompt engineering techniques with Chinese AI models: Chain-of-Thought reasoning, Few-Shot example design, role-playing best practices, structured prompt templates, and multi-turn dialogue strategies. Includes China LLM optimization techniques."
category: "API Tutorials"
date: 2026-06-20
tags: ["Prompt Engineering", "Prompt", "Chain-of-Thought", "Techniques", "Optimization", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will master advanced prompt engineering techniques:

- Chain-of-Thought reasoning
- Few-Shot example design
- Role-playing and system prompt design
- Structured prompt templates
- Multi-turn dialogue strategies

> 🎯 Same model, different prompts → output quality can vary by 10x. Learn prompt engineering and transform from an AI user into an AI master.

---

## Chain-of-Thought Reasoning

```python
class ChainOfThought:
    """Chain-of-Thought prompting techniques"""

    def __init__(self):
        self.client = client

    def zero_shot_cot(self, question: str) -> dict:
        """Zero-shot Chain-of-Thought — add "Let's think step by step" """
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Please answer the following question. Before giving the final answer, think through the reasoning process step by step.

Question: {question}

Please answer in the following format:
Reasoning Process:
(Step-by-step reasoning)

Final Answer:
(Give the answer)""",
                },
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        return {"response": response.choices[0].message.content}

    def auto_cot(self, question: str) -> dict:
        """Auto Chain-of-Thought — let the model design its own reasoning steps"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a meticulous AI assistant. When facing the following question, you need to:

1. Decompose the problem — break complex problems into sub-problems
2. Analyze individually — reason through each sub-problem independently
3. Synthesize conclusions — combine all sub-conclusions into a final answer
4. Self-verify — check your reasoning for flaws

Question: {question}

Output JSON:
{{
  "decomposition": ["Sub-problem 1", "Sub-problem 2"],
  "step_by_step": [
    {{"step": step number, "reasoning": "Reasoning process", "conclusion": "Conclusion for this step"}}
  ],
  "final_answer": "Final answer",
  "confidence": 0-100,
  "self_check": "Self-verification (possible flaws or uncertainties)"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"final_answer": response.choices[0].message.content}

    def tree_of_thoughts(self, question: str, branches: int = 3) -> dict:
        """Tree of Thoughts — explore multiple reasoning paths simultaneously"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Use the Tree of Thoughts method to solve the following problem.

Question: {question}

Explore {branches} different reasoning paths, then evaluate each path and select the best one.

Output JSON:
{{
  "branches": [
    {{
      "id": "Path A/B/C",
      "approach": "Approach description",
      "reasoning_chain": ["Reasoning steps"],
      "outcome": "Outcome of this path",
      "pros": ["Advantages"],
      "cons": ["Disadvantages"],
      "confidence": 0-100
    }}
  ],
  "evaluation": "Path comparison evaluation",
  "best_path": "Selected best path",
  "final_answer": "Final answer",
  "alternative_valid": "Whether other valid answers exist"
}}""",
                },
            ],
            temperature=0.5,  # Slightly higher for more diversity
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
cot = ChainOfThought()

# Zero-shot Chain-of-Thought
result = cot.zero_shot_cot("A pool has two inlet pipes. Pipe A alone fills the pool in 3 hours, Pipe B alone in 6 hours. If both are opened simultaneously, how long will it take?")
print(f"COT answer: {result['response'][:300]}")

# Auto Chain-of-Thought
auto = cot.auto_cot("You have a 12-liter bucket and a 7-liter bucket. How do you measure exactly 6 liters of water?")
for step in auto.get("step_by_step", []):
    print(f"Step {step['step']}: {step['conclusion']}")
print(f"Final: {auto.get('final_answer')}")

# Tree of Thoughts
tot = cot.tree_of_thoughts("Xiao Ming is 2 years older than Xiao Hong. In 5 years, the sum of their ages will be 30. How old is Xiao Ming now?", branches=3)
print(f"\nBest path: {tot.get('best_path')}")
print(f"Final answer: {tot.get('final_answer')}")
```

---

## Few-Shot Example Design

```python
class FewShotDesigner:
    """Few-Shot example designer"""

    def __init__(self):
        self.client = client

    def design_examples(self, task: str, task_description: str, output_format: str) -> dict:
        """AI automatically designs optimal Few-Shot examples"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design optimal Few-Shot examples for the following task.

Task: {task}
Task description: {task_description}
Expected output format: {output_format}

Design principles:
1. Examples cover different difficulty levels
2. Include edge cases
3. Examples should be diverse from each other
4. Arrange from simple to complex

Output JSON:
{{
  "examples": [
    {{
      "id": 1,
      "difficulty": "Easy/Medium/Hard",
      "input": "Example input",
      "output": "Expected output",
      "why_this_example": "Why this example was chosen"
    }}
  ],
  "example_count_recommendation": "Recommended number of examples and reasoning",
  "anti_examples": ["Counter-examples (what NOT to use)"],
  "template": "Final Few-Shot template (ready to copy and use)"
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def dynamic_few_shot(self, user_query: str, example_pool: list[dict], k: int = 3) -> list[dict]:
        """Dynamically select the most relevant Few-Shot examples"""
        pool_text = json.dumps(example_pool, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Select {k} examples from the pool that are most relevant to the user query.

User query: {user_query}
Example pool: {pool_text}

Selection principles:
- Highest semantic relevance
- Difficulty matching
- Complementary examples

Output JSON array:
[{{
  "selected_id": "Selected example ID",
  "relevance_score": 0-100,
  "selection_reason": "Reason for selection"
}}]""",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )
        try:
            selected_ids = [s["selected_id"] for s in json.loads(response.choices[0].message.content)]
            return [e for e in example_pool if e.get("id") in selected_ids]
        except:
            return example_pool[:k]

# Usage
fewshot = FewShotDesigner()

result = fewshot.design_examples(
    task="Chinese Sentiment Analysis",
    task_description="Analyze the sentiment polarity of user reviews (Positive/Negative/Neutral) and extract keywords",
    output_format='{"sentiment": "Positive/Negative/Neutral", "keywords": ["word1"], "intensity": "Strong/Medium/Weak"}',
)

print(f"Recommended example count: {result.get('example_count_recommendation')}")
for ex in result.get("examples", []):
    print(f"  Example {ex['id']} [{ex['difficulty']}]: {ex['input'][:40]}...")
print(f"\nTemplate:\n{result.get('template', '')[:300]}")
```

---

## Structured Prompt Templates

```python
class PromptTemplate:
    """Structured prompt template engine"""

    # Proven high-efficiency template structure
    ROLE_PLAY_TEMPLATE = """# Role
You are {role}. {role_description}

# Context
{context}

# Task
{task}

# Requirements
{requirements}

# Output Format
{output_format}

# Constraints
{constraints}

# Examples
{examples}

Now begin:"""

    def __init__(self):
        self.client = client

    def build_prompt(self, params: dict) -> str:
        """Build a structured prompt"""
        return self.ROLE_PLAY_TEMPLATE.format(
            role=params.get("role", "AI Assistant"),
            role_description=params.get("role_description", ""),
            context=params.get("context", ""),
            task=params.get("task", ""),
            requirements=params.get("requirements", ""),
            output_format=params.get("output_format", "Plain text"),
            constraints=params.get("constraints", "No special restrictions"),
            examples=params.get("examples", "None"),
        )

    def optimize_prompt(self, original_prompt: str, task_description: str, current_performance: str) -> dict:
        """AI automatically optimizes prompts"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Optimize the following prompt to improve AI output quality.

Original Prompt:
---
{original_prompt}
---

Task description: {task_description}
Current performance: {current_performance}

Output JSON:
{{
  "analysis": "Analysis of issues in the original prompt",
  "optimized_prompt": "Optimized prompt (full content)",
  "changes": [
    {{
      "what": "What was changed",
      "why": "Why this change was made",
      "expected_improvement": "Expected improvement"
    }}
  ],
  "prompt_score_before": original score (0-100),
  "prompt_score_after": estimated score after optimization (0-100),
  "general_tips": ["General optimization tips"]
}}

Optimization dimensions:
1. Clarity — Are the instructions explicit?
2. Structure — Is the information organized hierarchically?
3. Constraints — Are the restrictions effective?
4. Example quality — Are the examples representative?
5. Output control — Is the output format clearly specified?""",
                },
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def batch_test_prompt(self, prompt: str, test_cases: list[str]) -> dict:
        """Batch test prompt performance"""
        results = []
        for case in test_cases:
            response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": case},
                ],
                temperature=0.1,
                max_tokens=500,
            )
            results.append({"input": case, "output": response.choices[0].message.content})

        return {"total": len(test_cases), "results": results}

# Usage
template = PromptTemplate()

# Method 1: Use the template directly
prompt = template.build_prompt({
    "role": "Code Review Expert",
    "role_description": "A senior Python engineer with 10 years of experience, focused on code quality and security",
    "task": "Review the following code snippet and identify all potential issues",
    "requirements": "1. Security vulnerabilities first 2. Performance issues second 3. Code style last",
    "output_format": '{"issues": [{"type": "Type", "severity": "Severity", "description": "Description"}]}',
    "constraints": "Do not modify the code, only point out issues. Include fix suggestion for each issue.",
})

print(f"Built prompt:\n{prompt[:500]}...")

# Method 2: AI optimizes the prompt
optimization = template.optimize_prompt(
    "You are an assistant, help me analyze the data",
    "Business data analysis, needs to produce a professional analysis report",
    "Output is too vague, analysis is not deep enough, lacks data support",
)
print(f"\nScore before optimization: {optimization.get('prompt_score_before')} → after: {optimization.get('prompt_score_after')}")
print(f"Optimized prompt:\n{optimization.get('optimized_prompt', '')[:400]}")
```

---

## Multi-Turn Dialogue Strategies

```python
class ConversationStrategy:
    """Multi-turn dialogue optimization strategies"""

    def __init__(self):
        self.client = client

    def progressive_disclosure(self, complex_task: str) -> dict:
        """Progressive disclosure — reveal information to the AI in batches"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design a progressive disclosure dialogue strategy.

Complex task: {complex_task}

Output JSON:
{{
  "rounds": [
    {{
      "round": round number,
      "reveal": "What information to reveal in this round",
      "hide": "What information to hide in this round",
      "expected_ai_response": "Expected AI response",
      "user_next_action": "Based on the AI's response, what the user should do next"
    }}
  ],
  "strategy_rationale": "Rationale for the strategy",
  "risk_of_overload": "What would happen if all information were given at once",
  "total_rounds_estimate": estimated number of rounds
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def context_window_management(self, conversation: list[dict], max_tokens: int = 8000) -> dict:
        """Context window management — when to summarize/compress history"""
        conv_text = json.dumps(conversation, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the conversation history and suggest a context window management strategy.

Conversation history: {conv_text[:6000]}
Remaining token budget: {max_tokens}

Output JSON:
{{
  "current_tokens_estimate": estimated current token count,
  "should_summarize": true/false,
  "summarization_strategy": "Summarization strategy (key info retention / full compression / selective deletion)",
  "key_info_to_keep": ["Key information that must be retained"],
  "safe_to_drop": ["Content that can be dropped"],
  "suggested_summary": "Suggested summary text"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"should_summarize": False}

# Usage
conv_strategy = ConversationStrategy()

strategy = conv_strategy.progressive_disclosure("Need AI help designing a complete e-commerce system architecture, from requirements analysis to tech selection to database design")
for r in strategy.get("rounds", []):
    print(f"Round {r['round']}: Reveal {r['reveal'][:50]}...")
    print(f"  Expected AI response: {r.get('expected_ai_response', '')[:60]}...")
```

---

## Chinese Model Prompt Optimization Cheat Sheet

| Model | Characteristics | Prompt Tips |
|------|----------------|--------------|
| **DeepSeek** | Strong logic, good instruction following | Detailed system prompts, explicit output formats |
| **Qwen (Tongyi Qianwen)** | Strong Chinese, creative | Chinese prompts work better than English |
| **GLM (Zhipu)** | Strong structured output | JSON Schema output format specification works well |
| **Kimi (Moonshot)** | Excellent long-text processing | Context can hold more examples |
| **Step-2 (StepFun)** | Multimodal understanding | Detailed image descriptions needed |

### Universal Golden Rules

1. **System Prompt > User Prompt** — Put important constraints in the system message
2. **Positive framing > Negative framing** — "Please output JSON" is better than "Don't output non-JSON"
3. **Specific > Vague** — "5-8 suggestions" is better than "a few suggestions"
4. **Structure before content** — Use `#` sections first, then fill in content
5. **Match temperature to task** — Reasoning 0.1, Creative writing 0.7, Code 0.2

---

## Next Steps

- [Function Calling Guide](/tutorials/ai-function-calling-guide/)
- [Model Evaluation Guide](/tutorials/ai-model-evaluation/)

> 📝 Based on DeepSeek + Chinese model best practices, June 2026.
