---
title: "Chinese AI Models for Education: Auto Question Generation, Grading & Analytics with DeepSeek"
description: "Build education applications with Chinese AI models (DeepSeek, Qwen): auto question generation (MCQ/essay/coding), smart grading, learning analytics, personalized recommendations. Includes complete teacher and student portal code."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Education", "Question Bank", "Grading", "AI Education", "Question Generation", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will use AI to build education applications:

- Auto question generation (multiple choice / essay / coding)
- Smart grading and scoring
- Student error analysis
- Personalized learning recommendations

> 🎯 AI in education is one of the most active AI application tracks in China. Auto question generation + grading = 10x teacher efficiency improvement.

---

## Smart Question Generation System

```python
class QuestionGenerator:
    """AI auto question generation"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

    def generate_choice_questions(
        self, topic: str, count: int = 5, difficulty: str = "中等"
    ) -> list[dict]:
        """Generate multiple choice questions"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an expert exam question writer. Generate {count} multiple-choice questions about 「{topic}」.

JSON format output:
[
  {{
    "id": 1,
    "type": "单选题",
    "question": "Question",
    "options": ["A.Option1", "B.Option2", "C.Option3", "D.Option4"],
    "answer": "B",
    "explanation": "Explanation",
    "knowledge_point": "Knowledge point",
    "difficulty": "{difficulty}"
  }}
]

Requirements:
- Difficulty: {difficulty}
- Options should be plausible distractors, not obviously wrong
- Explanations must be thorough and detailed""",
                },
                {"role": "user", "content": f"请出 {count} 道关于 {topic} 的选择题"},
            ],
            temperature=0.8,
            max_tokens=4096,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def generate_essay_questions(
        self, topic: str, count: int = 3
    ) -> list[dict]:
        """Generate essay questions"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate {count} essay questions about 「{topic}」.
JSON: [{{"id":1,"question":"Question","reference_answer":"Reference answer (detailed)","scoring_points":["Scoring point 1","Scoring point 2"],"score":10}}]""",
                },
                {"role": "user", "content": f"请出 {count} 道问答题"},
            ],
            temperature=0.8,
            max_tokens=2048,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def generate_coding_questions(
        self, language: str, difficulty: str = "中等"
    ) -> list[dict]:
        """Generate coding questions"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate 3 {language} coding questions (difficulty: {difficulty}).

JSON format:
[
  {{
    "id": 1,
    "title": "Question title",
    "description": "Question description (including input/output requirements)",
    "examples": [{{"input": "Sample input", "output": "Sample output"}}],
    "test_cases": [{{"input": "Test input", "expected": "Expected output"}}],
    "solution": "Reference solution code",
    "difficulty": "{difficulty}",
    "knowledge_points": ["Knowledge point 1", "Knowledge point 2"]
  }}
]""",
                },
                {"role": "user", "content": f"生成 {language} 编程题"},
            ],
            temperature=0.7,
            max_tokens=4096,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
gen = QuestionGenerator()

# Generate multiple choice questions
questions = gen.generate_choice_questions("Python 面向对象编程", count=5)
for q in questions:
    print(f"{q['id']}. {q['question']}")
    for opt in q['options']:
        print(f"   {opt}")
    print(f"   Answer: {q['answer']}\n")

# Generate coding questions
code_qs = gen.generate_coding_questions("Python", "困难")
for cq in code_qs:
    print(f"📝 {cq['title']}")
    print(f"   {cq['description'][:100]}...")
```

---

## Smart Grading System

```python
class EssayGrader:
    """AI auto essay question grading"""

    def grade(self, question: str, reference_answer: str, student_answer: str, max_score: int = 10) -> dict:
        """AI scoring"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a strict exam grader. Score the student's answer against the reference answer.

Question: {question}
Reference answer: {reference_answer}
Max score: {max_score}

Output JSON:
{{
  "score": 8,
  "feedback": "Overall assessment",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "suggestion": "Improvement suggestions"
}}

Scoring criteria:
- Completely correct: full marks
- Partially correct: deduct accordingly
- Completely off-topic: 0 points
- Encourage independent understanding (exact match with reference not required)""",
                },
                {"role": "user", "content": f"学生答案: {student_answer}\n\n请评分。"},
            ],
            temperature=0.1,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"score": 0, "feedback": "Grading failed"}

class CodeGrader:
    """Auto code grading"""

    def grade(self, question: dict, student_code: str) -> dict:
        """Evaluate code"""
        # First, run test cases
        test_results = self._run_tests(student_code, question["test_cases"])

        # AI code review
        review = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Code review. Problem: {question['title']}

Review dimensions:
1. Correctness (does it meet requirements)
2. Code style
3. Efficiency (time/space complexity)
4. Maintainability

Output JSON:
{{"correctness": "correct/partially correct/incorrect", "score": 0-100, "issues": ["Issues"], "suggestions": ["Suggestions"], "better_solution": "Better approach"}}""",
                },
                {"role": "user", "content": student_code},
            ],
            temperature=0.1,
        )

        review_data = json.loads(review.choices[0].message.content)

        return {
            "test_results": test_results,
            "ai_review": review_data,
            "final_score": int(review_data["score"] * 0.6 + test_results["pass_rate"] * 40),
        }

    def _run_tests(self, code: str, test_cases: list) -> dict:
        """Run test cases"""
        passed = 0
        for tc in test_cases:
            try:
                # Execute code in isolated environment
                namespace = {}
                exec(code, namespace)
                result = str(namespace.get("solution", lambda x: x)(tc["input"]))
                if result.strip() == str(tc["expected"]).strip():
                    passed += 1
            except:
                pass

        return {
            "total": len(test_cases),
            "passed": passed,
            "pass_rate": passed / len(test_cases) * 100 if test_cases else 0,
        }

# Usage
grader = EssayGrader()
result = grader.grade(
    "什么是多态？举例说明",
    "多态是指同一个方法在不同对象中表现出不同行为...",
    "多态就是多种形态，比如动物叫的方法不同",
    max_score=10,
)
print(f"Score: {result['score']}/{10}")
print(f"Feedback: {result['feedback']}")
```

---

## Error Analysis

```python
class ErrorAnalyzer:
    """Error analysis — identify weak knowledge areas"""

    def analyze(self, wrong_questions: list[dict]) -> dict:
        """Analyze incorrect answers to pinpoint weak areas"""
        # Summarize error information
        summary = json.dumps(
            [
                {
                    "topic": q["knowledge_point"],
                    "type": q.get("type", "unknown"),
                    "my_answer": q.get("student_answer", ""),
                    "correct_answer": q.get("answer", ""),
                }
                for q in wrong_questions
            ],
            ensure_ascii=False,
        )

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """You are a learning analytics expert. Analyze incorrect answers, output JSON:
{
  "weak_points": [{"topic": "Weak knowledge area", "error_count": error count, "reason": "Root cause analysis"}],
  "learning_advice": "Learning advice (under 200 words)",
  "recommended_exercises": ["Recommended practice topic 1", "Topic 2"],
  "overall_assessment": "Overall assessment"
}""",
                },
                {"role": "user", "content": summary},
            ],
            temperature=0.3,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"weak_points": [], "learning_advice": "Analysis failed"}

# Usage
analyzer = ErrorAnalyzer()
wrong_qs = [
    {"knowledge_point": "闭包", "type": "选择题", "student_answer": "A", "answer": "C"},
    {"knowledge_point": "闭包", "type": "编程题", "student_answer": "错误代码", "answer": "正确代码"},
    {"knowledge_point": "装饰器", "type": "选择题", "student_answer": "B", "answer": "D"},
]
analysis = analyzer.analyze(wrong_qs)
print(f"Weak points: {analysis['weak_points']}")
print(f"Learning advice: {analysis['learning_advice']}")
```

---

## Complete Education Application Architecture

```
Teacher Portal: Create questions → Assign homework → AI grading → View analytics
Student Portal: Receive assignments → Answer → View scores → Error notebook → Targeted practice
AI Layer: Question engine + Grading engine + Analytics engine + Recommendation engine
```

---

## Next Steps

- [AI Customer Service Bot](/tutorials/ai-customer-service-bot-guide/)
- [AI Agents in Practice](/tutorials/ai-agent-chinese-models-guide/)

> 📝 Based on DeepSeek/GLM, June 2026.
