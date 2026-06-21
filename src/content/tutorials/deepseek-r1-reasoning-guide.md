---
title: "DeepSeek R1 Deep Reasoning Guide: Chain-of-Thought, Math Proofs & Code Debugging"
description: "DeepSeek R1 reasoning model in-depth tutorial: Chain-of-Thought (CoT) prompting, mathematical proofs, code debugging, logical reasoning. Includes hands-on comparison of DeepSeek V4-Pro thinking mode vs standalone R1 model."
category: "DeepSeek"
date: 2026-06-20
tags: ["DeepSeek", "R1", "Reasoning", "CoT", "Mathematics", "Debugging", "Advanced"]
level: "Advanced"
---

## What This Tutorial Covers

You will master the deep reasoning capabilities of DeepSeek R1:

- Differences between R1 reasoning model and general-purpose models
- Chain-of-Thought (CoT) prompting techniques
- Mathematical proofs and formula derivations
- Code debugging and bug analysis
- Logical reasoning and decision analysis
- Best practices for Thinking mode

> 🎯 DeepSeek R1 uses reinforcement learning to train reasoning abilities, achieving OpenAI o1-level performance in mathematics, programming, and logical reasoning — at only 1/10th the cost.

---

## R1 Reasoning Model vs. General-Purpose Model

| Dimension | DeepSeek V4-Pro | DeepSeek R1 |
|------|----------------|-------------|
| Positioning | General conversation / coding | Deep reasoning |
| Reasoning method | Optional thinking mode | Mandatory step-by-step reasoning |
| Speed | Fast | Slow (10-60s of thinking) |
| Use cases | Daily conversation, quick coding | Math proofs, complex debugging |
| Price | Standard | Slightly higher (longer output) |
| API model name | `deepseek-v4-pro` | `deepseek-r1` |

---

## Step 1: Basic Thinking Mode

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

def think_deep(prompt: str) -> dict:
    """Reasoning call with deep thinking enabled"""
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,  # Use low temperature for reasoning tasks
        max_tokens=8192,
        extra_body={"thinking_mode": "thinking"},
    )

    msg = response.choices[0].message

    # Thinking content is in the reasoning_content field
    return {
        "thinking": getattr(msg, "reasoning_content", ""),
        "answer": msg.content,
        "tokens": response.usage.total_tokens,
    }

# Test
result = think_deep("Prove: √2 is irrational")
print(f"Thinking process: {result['thinking'][:300]}...")
print(f"\nAnswer: {result['answer']}")
print(f"Token consumption: {result['tokens']}")
```

---

## Step 2: Mathematical Proofs in Practice

### Example 1: Number Theory Proof

```python
prompt = """Prove that for any positive integer n, n³ - n is divisible by 6.

Requirements:
1. Use mathematical induction
2. Explain each step of the derivation
3. Provide a rigorous conclusion"""
```

**R1 Output (simplified):**

```
Thinking process:
1. Factor the expression: n³ - n = n(n² - 1) = n(n-1)(n+1)
2. This is the product of three consecutive integers
3. Among three consecutive integers, at least one is even → divisible by 2
4. Among three consecutive integers, one must be a multiple of 3 → divisible by 3
5. Divisible by both 2 and 3 → divisible by 6

Conclusion: For any positive integer n, n³-n is divisible by 6. QED.
```

### Example 2: Probability Problem

```python
prompt = """A die is rolled 3 times. Calculate the following probabilities:
1. Probability of rolling at least one 6
2. Probability that the sum of three rolls equals 10
3. Probability that all three rolls show different numbers

Calculate step by step and provide exact fractional answers."""

result = think_deep(prompt)
print(result["answer"])
```

---

## Step 3: Code Debugging in Practice

### Bug Analysis

```python
buggy_code = """
def find_missing_number(arr):
    n = len(arr)
    expected_sum = n * (n + 1) // 2
    actual_sum = sum(arr)
    return expected_sum - actual_sum

# Test
print(find_missing_number([0, 1, 3]))  # Expected output: 2
print(find_missing_number([1, 2, 4, 5, 6]))  # Expected output: 3
"""

prompt = f"""This code has a bug. Please:
1. Find where the bug is
2. Explain why the error occurs
3. Provide the corrected code
4. Write test cases to verify the fix

Code:
```python
{buggy_code}
```"""

result = think_deep(prompt)
print(result["answer"])
```

**R1's Analysis:**

```
Bug Analysis:
1. Issue: When the array contains 0 (e.g., [0,1,3]), n=3, expected_sum=6, actual_sum=4, returns 2 ✓
   But when the array starts at 1 (e.g., [1,2,4,5,6]), n=5, expected_sum=15, actual_sum=18, returns -3 ✗

2. Root cause: The algorithm assumes the array contains the full range from 0 to n,
   but the actual array can start at any number.
   Correct logic: missing number = (sum from min to max) - actual sum

3. Fix:
def find_missing_number(arr):
    min_val = min(arr)
    max_val = max(arr)
    expected_sum = (min_val + max_val) * (max_val - min_val + 1) // 2
    actual_sum = sum(arr)
    return expected_sum - actual_sum
```

---

## Step 4: Logical Reasoning

### Syllogism Reasoning

```python
prompt = """Analyze the validity of the following syllogism:

Premise 1: All AI models require large amounts of data for training
Premise 2: GPT-5 is an AI model
Premise 3: GPT-5 uses reinforcement learning

Questions:
1. What conclusion can be drawn from premises 1 and 2? Is this reasoning valid?
2. Does premise 3 affect the above reasoning?
3. If premise 1 is changed to "Some AI models require large amounts of data for training", does the reasoning still hold?

Please formalize using predicate logic and analyze."""

result = think_deep(prompt)
print(result["answer"])
```

---

## Step 5: Algorithm Design Comparison

```python
prompt = """Design an algorithm: given an array of 100,000 integers, find the K-th largest element.

Please provide three different solutions and compare them:
1. Sorting method
2. Heap (priority queue) method
3. QuickSelect method

For each solution:
- Provide a complete Python implementation
- Analyze time complexity
- Analyze space complexity
- Describe applicable scenarios"""

result = think_deep(prompt)
print(result["answer"])
```

---

## Step 6: Standalone R1 Model Call

```python
# Using the standalone DeepSeek R1 model
def r1_reasoning(prompt: str) -> str:
    """Use R1 model for rigorous reasoning"""
    response = client.chat.completions.create(
        model="deepseek-r1",  # Standalone R1 model
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,  # Recommended 0 for R1 reasoning
        max_tokens=16384,
    )

    return response.choices[0].message.content

# R1 Test
question = """There are 12 identical-looking balls. 11 have the same weight,
and 1 has a different weight (you don't know whether it's heavier or lighter).
Using a balance scale only 3 times, how do you find the ball with the different weight?

Please provide a detailed branching decision tree."""

result = r1_reasoning(question)
print(result)
```

---

## Step 7: Chain-of-Thought Prompting Techniques

### Zero-shot CoT

```python
# Add one simple phrase to trigger chain-of-thought
prompt = """A pool has two inlet pipes and one outlet pipe.
Inlet A fills the pool in 3 hours, inlet B fills it in 5 hours, and outlet C drains it in 4 hours.
If all three are opened simultaneously, how long will it take to fill the pool?

Think step by step."""  # ← Key: triggers CoT

result = think_deep(prompt)
```

### Few-shot CoT

```python
few_shot_prompt = """Example 1:
Question: Xiao Ming has 5 apples. He gives 2 to Xiao Hong, then buys 3 more. How many are left?
Thinking: Xiao Ming starts with 5 → after giving 2 to Xiao Hong: 5-2=3 → after buying 3: 3+3=6
Answer: 6 apples

Example 2:
Question: In a class of 40 students, 25 like math and 30 like English. At least how many students like both?
Thinking: Number who like both = (math lovers + English lovers) - total students
(because those exceeding the total must like both)
→ 25+30-40 = 15
Answer: At least 15 students like both subjects

Now answer:
Question: A pool is filled by an inlet in 2 hours and drained by an outlet in 3 hours. With both open, how long to fill?

Follow the format above: think first, then give the answer."""

result = think_deep(few_shot_prompt)
print(result["answer"])
```

---

## Step 8: Reasoning vs. Normal Mode Comparison

```python
import time

def benchmark_reasoning(prompt: str):
    """Compare performance with thinking enabled vs. disabled"""

    # Normal mode
    start = time.time()
    normal = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=2048,
    )
    normal_time = time.time() - start

    # Thinking mode
    start = time.time()
    thinking = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=8192,
        extra_body={"thinking_mode": "thinking"},
    )
    thinking_time = time.time() - start

    print(f"Normal mode: {normal_time:.1f}s, {normal.usage.total_tokens} tokens")
    print(f"Normal answer: {normal.choices[0].message.content[:200]}...")

    print(f"\nThinking: {thinking_time:.1f}s, {thinking.usage.total_tokens} tokens")
    print(f"Thinking answer: {thinking.choices[0].message.content[:200]}...")

# Test
benchmark_reasoning("Compute 1³+2³+3³+...+100³, and prove your result")
```

---

## Thinking Mode Best Practices

| Scenario | Recommendation | Reason |
|------|------|------|
| Math proofs | thinking + temperature=0 | Reasoning requires precision |
| Code debugging | thinking + full error info | AI needs full context |
| Daily conversation | Disable thinking | No deep reasoning needed, faster |
| Creative writing | Disable thinking | Reasoning mode over-analyzes |
| Complex decisions | thinking + multi-turn dialogue | Analyze all factors step by step |

---

## FAQ

### Q: What's the difference between R1 and V4-Pro+thinking?

**A**: The standalone R1 model is stronger on math competition problems, while V4-Pro+thinking is more balanced for everyday coding and general reasoning. For most development work, V4-Pro+thinking is sufficient.

### Q: Does thinking mode cost more?

**A**: Yes. The thinking process also counts toward token consumption. A single complex reasoning task may consume 4,000-8,000 tokens. But compared to the cost of a wrong decision, it's worth it.

### Q: When should I use R1?

**A**: Math competitions, formal proofs, and scenarios requiring strict reasoning where speed is not critical.

---

## Next Steps

- [DeepSeek API Beginner Guide](/tutorials/deepseek-api-beginner-guide/)
- [DeepSeek vs ChatGPT Coding Showdown](/tutorials/deepseek-vs-chatgpt-coding-comparison/)

> 📝 Based on DeepSeek V4-Pro + R1 tested in June 2026.
