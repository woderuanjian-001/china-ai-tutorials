---
title: "Prompt Engineering Hands-On: Best Prompt Techniques for Chinese AI Models"
description: "Complete prompt engineering guide for Chinese AI models: optimal prompt templates for DeepSeek/Kimi/Qwen/GLM, System Prompt design, few-shot prompting, 15 anti-hallucination rules."
category: "Hands-On Tutorials"
date: 2026-06-26
tags: ["Prompt Engineering", "Prompt", "DeepSeek", "Kimi", "Qwen", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will gain a dedicated prompt engineering system for Chinese AI models:

- Optimal prompt strategies for DeepSeek / Kimi / Qwen / GLM
- System Prompt design templates
- Few-shot prompting examples
- Chain-of-Thought (CoT) best practices
- 15 anti-hallucination rules

> 🎯 With the same model, a good prompt can boost accuracy from 60% to 90%.

---

## The Universal Golden Prompt Formula

```
[Role] -> [Task] -> [Specific Requirements] -> [Output Format] -> [Examples] -> [Constraints]

Role: You are a {role}
Task: Please {verb} {task}
Specific Requirements: 1... 2... 3...
Output Format: Output in {format}
Examples: Refer to the following format...
Constraints: Do NOT {prohibited behavior}
```

---

## Best Prompts for DeepSeek

DeepSeek V4-Pro characteristics: extremely strong instruction following, does not need over-engineered prompts.

### Good Prompt

```markdown
你是一个资深 Python 后端工程师。
请审查以下代码的安全性和性能问题。
对每个问题给出：问题描述 → 影响程度 → 修复建议。
只关注安全和性能，不要提代码风格建议。

代码：
```python
def login(username, password):
    query = f"SELECT * FROM users WHERE name='{username}' AND pwd='{password}'"
    cursor.execute(query)
    return cursor.fetchone()
```
```

### Bad Prompt

```markdown
帮我看看这段代码
```

### DeepSeek-Specific Optimizations

```python
# DeepSeek V4-Pro is particularly sensitive to thinking-mode instructions
system_prompt = """你是一个代码审查专家。

审查流程：
1. 先分析代码的整体结构
2. 然后逐行找出问题
3. 最后给出优先级排序的修复建议

重要：如果代码使用了 SQL 拼接，必须在第一个分析中就指出这是安全漏洞。"""

# DeepSeek is especially friendly to markdown-formatted output
# Just specify the format directly, no extra examples needed
```

---

## Best Prompts for Kimi

Kimi K2 characteristics: 2-million-character ultra-long context, excels at deep analysis and multi-turn conversations.

### Kimi Long-Document Prompt

```markdown
你是一个法学教授。

请阅读以下100页合同，然后：
1. 列出所有违约责任条款（附条款编号）
2. 分析每条条款的法律风险等级（高/中/低）
3. 对高风险条款给出修改建议
4. 生成一份"风险摘要"（不超过500字）

注意：不要复述合同内容，直接分析。
如果某个条款违反了《民法典》，必须明确指出具体法条。

[Paste full contract here]
```

### Kimi Multi-Turn Conversation

```python
# Kimi has exceptional context retention for long conversations
# Round 1
"请分析这份技术方案的可行性..."

# Round 2 (Kimi remembers everything from round 1)
"基于你之前的分析，第三点中的风险怎么规避？"

# Round 3
"对比第一轮中的方案A和方案B，哪个更适合创业公司？"
```

---

## Best Prompts for Qwen

Qwen characteristics: strong structured output capability, ideal for tasks requiring fixed-format output.

### Qwen Structured Prompt

```markdown
你是一个数据分析师。分析以下销售数据。

严格按以下 JSON 格式输出，不要输出任何其他文字：

{
  "总销售额": number,
  "同比增长": "percentage",
  "最高月份": {"月份": "string", "销售额": number},
  "趋势": "上升/下降/持平",
  "建议": ["string", "string", "string"],
  "风险点": ["string"]
}

数据：
[Paste data]
```

### Qwen Multilingual Prompt

```markdown
你是一个专业翻译。将以下中文翻译成英文。

要求：
1. 保持原文的专业语气
2. 技术术语使用标准译法
3. 中文专有名词保留不翻译，加括号标注英文解释
4. 输出格式：一段中文 → 一段英文，交替排列
```

---

## Best Prompts for GLM

GLM characteristics: strong Function Calling, ideal for Agent development scenarios.

### GLM Function Calling Prompt

```python
# GLM is particularly sensitive to tool purpose descriptions
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "搜索公司内部知识库。当用户询问产品信息、公司政策、业务流程时必须使用此工具。不要凭记忆回答这类问题。",  # ← Key
            "parameters": {...}
        }
    }
]

# Explicitly specify when to call tools in GLM's system prompt
system = """你是一个数据查询助手。

规则：
- 涉及事实性问题：必须先调用 search_database
- 涉及推理/分析：基于工具返回的数据进行分析
- 永远不要在没有数据的情况下给出数字"""
```

---

## Few-Shot Prompting Template

```python
def create_few_shot_prompt(task: str, examples: list[dict]) -> str:
    """Standardized Few-shot Prompt"""

    prompt = f"Task: {task}\n\nExamples:\n"

    for i, ex in enumerate(examples, 1):
        prompt += f"""--- Example {i} ---
Input: {ex['input']}
Output: {ex['output']}
"""

    prompt += f"\nNow process:\nInput: {{user_input}}\nOutput:"

    return prompt

# Usage
examples = [
    {
        "input": "商品有质量问题，要退货",
        "output": """{
  "intent": "after_sales",
  "sentiment": "negative",
  "urgency": "high",
  "action": "initiate_return"
}""",
    },
    {
        "input": "物流到哪了？已经3天了",
        "output": """{
  "intent": "order_status",
  "sentiment": "neutral",
  "urgency": "medium",
  "action": "track_shipping"
}""",
    },
    {
        "input": "这个产品真好用，五星好评",
        "output": """{
  "intent": "feedback",
  "sentiment": "positive",
  "urgency": "low",
  "action": "record_feedback"
}""",
    },
]

prompt = create_few_shot_prompt(
    "将用户消息分类为客服意图",
    examples,
)
print(prompt)
```

---

## Chain-of-Thought (CoT) in Practice

### Zero-Shot CoT

```python
# One-line trigger: add to the end of the prompt
trigger = "请一步一步思考，逐步推理。"

# Or a more detailed trigger
trigger_detail = """请按以下步骤分析：
第1步：理解问题的关键信息
第2步：列出已知条件和未知量
第3步：逐步推导
第4步：检查验证
第5步：给出最终答案

现在开始："""
```

### Auto-CoT (Let the model generate its own reasoning chain)

```python
auto_cot_prompt = """请解决以下数学问题。

首先，写出你的推理步骤。
然后，用 <answer></answer> 标签包裹你的最终答案。

问题：一个水箱，A管3小时注满，B管4小时排空。
先开A管1小时后关闭，再同时开B管。问：从关闭A管开始，多久水箱被排空？"""
```

---

## 15 Anti-Hallucination Rules

| # | Rule | Example |
|---|------|---------|
| 1 | **Command "say I don't know if you don't know"** | "如果你不确定，直接说'我不确定'" |
| 2 | **Require source citations** | "每个事实必须标注出处" |
| 3 | **Limit answer scope** | "只回答XX相关问题，其他说'不在我的知识范围'" |
| 4 | **Require fact vs opinion distinction** | "标注[事实]/[推断]/[不确定]" |
| 5 | **Ban fabricated data** | "不要编造任何数字、日期、人名" |
| 6 | **Use temperature=0** | Reduce randomness when factual accuracy is needed |
| 7 | **Provide knowledge base** | "基于以下知识回答：{你的知识库}" |
| 8 | **Set verification steps** | "回答前，先自我检查是否有矛盾" |
| 9 | **Use structured output** | JSON format reduces room for improvisation |
| 10 | **Set confidence thresholds** | "不确定的回答标注[待核实]" |
| 11 | **Reject vague requests** | "如果问题不明确，先澄清再回答" |
| 12 | **Ban explanatory hallucinations** | "不要为了显得专业而编造解释" |
| 13 | **Use RAG** | Force answers to be based on documents, not memory |
| 14 | **Cross-verification** | "如果两个来源矛盾，同时呈现并说明" |
| 15 | **Limit reasoning chain length** | "推理不超过10步，超过则标注可能不准确" |

---

## Prompt Templates by Scenario

### Code Review

```markdown
审查以下代码。按以下维度评分（1-10）：

1. 安全性：SQL注入/XSS/权限...
2. 性能：N+1查询/死循环/内存泄漏...
3. 可读性：命名/注释/复杂度...
4. 错误处理：try-catch/边界条件...

格式：
| 维度 | 评分 | 问题 |
|------|------|------|
| 安全 | 3/10 | ... |

总评：[一段话总结]
```

### Customer Service

```markdown
你是{公司}的客服代表"小{名}"。
客户叫{客户名}，是{vip/新用户/老用户}。

回复要求：
- 开头先表达理解（共情但不能虚伪）
- 给出具体解决方案（1-2-3步骤）
- 结束时确认客户是否满意
- 如果解决不了，明确告知并给出替代方案

禁止：
- 不能说"这是公司规定"
- 不能推卸责任给其他部门
- 不能用过于正式/官方腔
```

### Technical Documentation

```markdown
写一份{项目}的技术文档。

结构：
## 概述（1-2句话说明这是什么）
## 快速开始（5分钟能跑起来的最小示例）
## API 参考（每个接口的入参/出参/示例）
## 常见问题（FAQ格式）
## 注意事项（踩坑经验）

要求：面向中级开发者，代码示例优先，用通俗中文。
```

---

## FAQ

### Q: Is a longer prompt always better?

**A**: No. Longer prompts consume more tokens and the model may ignore later instructions. Place critical instructions at the very beginning and very end.

### Q: Can prompts be reused across different models?

**A**: Good prompts transfer reasonably well across models. But each model has unique preferences: DeepSeek likes concise instructions, Kimi likes contextual detail, Qwen likes structured requirements.

---

## Next Steps

- [DeepSeek API Getting Started](/tutorials/deepseek-api-beginner-guide/)
- [DeepSeek R1 Reasoning Guide](/tutorials/deepseek-r1-reasoning-guide/)

> 📝 Based on empirical testing of DeepSeek/Kimi/Qwen/GLM, June 2026.
