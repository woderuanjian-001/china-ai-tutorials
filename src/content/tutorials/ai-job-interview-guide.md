---
title: "AI Job Interview Prep with Chinese Models: Mock Interviews & Resume Analysis with DeepSeek"
description: "Build job interview tools with Chinese AI models (DeepSeek, Qwen): AI mock interviewer, intelligent resume analysis, interview question generation, self-introduction optimization. Includes complete full-stack code."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Interview", "Job Search", "Resume", "Mock Interview", "AI", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will build a complete job interview workflow tool with AI:

- AI mock interviewer (personalized question generation)
- Intelligent resume analysis and optimization suggestions
- Self-introduction generation and refinement
- Interview technique feedback

> 🎯 Use AI mock interviews = 100 extra practice rounds before the real thing. Eliminate nervousness and prepare with precision.

---

## AI Mock Interviewer

```python
class AIInterviewer:
    """AI mock interviewer"""

    def __init__(self):
        self.client = client

    def generate_questions(
        self,
        position: str,
        resume: str = "",
        difficulty: str = "Medium",
    ) -> list[dict]:
        """Generate interview questions based on the position and resume"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a senior interviewer for a {position} role. Generate interview questions.

Position: {position}
{f"Candidate resume:\n{resume}" if resume else ""}
Difficulty: {difficulty}

Generate a JSON array:
[
  {{
    "id": 1,
    "category": "Technical Fundamentals/Project Experience/System Design/Behavioral/Algorithm",
    "question": "Question",
    "expected_answer_points": ["Point 1", "Point 2"],
    "difficulty": "Easy/Medium/Hard",
    "time": estimated answer time (minutes),
    "follow_up": "Follow-up question (if any)"
  }}
]

Requirements:
- Technical roles: focus on technical depth and project experience
- Non-technical roles: focus on soft skills and business understanding
- Questions should be differentiating (able to distinguish candidate levels)
- Include behavioral questions (STAR method)""",
                },
                {"role": "user", "content": f"Please generate 8 interview questions for the {position} role"},
            ],
            temperature=0.8,
            max_tokens=4096,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def evaluate_answer(
        self,
        question: str,
        answer: str,
        expected_points: list[str],
    ) -> dict:
        """Evaluate an interview answer"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an interviewer. Evaluate the candidate's answer.

Question: {question}
Expected answer points: {expected_points}

Output JSON:
{{
  "score": 0-100,
  "strengths": ["Strengths"],
  "weaknesses": ["Weaknesses"],
  "covered_points": ["Points covered"],
  "missed_points": ["Points missed"],
  "improved_answer": "Optimized sample answer",
  "feedback": "Overall assessment (within 50 words)"
}}

Scoring criteria:
- 90+: Excellent, exceeds expectations
- 75-89: Good, meets requirements
- 60-74: Passable, barely adequate
- <60: Unsatisfactory, needs significant improvement""",
                },
                {"role": "user", "content": answer},
            ],
            temperature=0.3,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"score": 0, "feedback": "Evaluation failed"}

    def full_interview(self, position: str, resume: str = "") -> dict:
        """Complete mock interview workflow"""
        questions = self.generate_questions(position, resume)

        print(f"🤖 AI Interviewer: Welcome to the {position} interview")
        print(f"   {len(questions)} questions total. Please answer them one by one.\n")

        results = []
        total_score = 0

        for i, q in enumerate(questions):
            print(f"\n{'='*50}")
            print(f"Question {i+1} ({q['category']})")
            print(f"📝 {q['question']}")
            print(f"⏱️ Suggested answer time: {q['time']} min")

            answer = input("\nYour answer: ")

            # AI evaluation
            evaluation = self.evaluate_answer(
                q["question"],
                answer,
                q.get("expected_answer_points", []),
            )

            results.append({
                **q,
                "your_answer": answer,
                "evaluation": evaluation,
            })

            total_score += evaluation["score"]
            print(f"\n📊 Score: {evaluation['score']}/100")
            print(f"💬 {evaluation['feedback']}")

            # Follow-up
            if q.get("follow_up"):
                print(f"\n🔍 Follow-up: {q['follow_up']}")
                follow_answer = input("Your answer: ")
                results[-1]["follow_up_answer"] = follow_answer

        avg_score = total_score / len(questions) if questions else 0

        return {
            "position": position,
            "questions_count": len(questions),
            "average_score": avg_score,
            "results": results,
            "overall_assessment": self._generate_overall(results, avg_score),
        }

    def _generate_overall(self, results: list, avg_score: float) -> str:
        """Generate overall assessment"""
        summary = json.dumps(
            [{"category": r["category"], "score": r["evaluation"]["score"]}
             for r in results],
            ensure_ascii=False,
        )

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Synthesize the interview results and provide overall assessment and recommendations:
- Average score: {avg_score:.1f}
- Per-question scores: {summary}

Please provide:
1. Overall assessment (3-5 sentences)
2. Top 2 areas needing the most improvement
3. Next-step learning suggestions""",
                },
            ],
            temperature=0.5,
            max_tokens=500,
        )
        return response.choices[0].message.content

# Usage
interviewer = AIInterviewer()

# Generate interview questions
questions = interviewer.generate_questions(
    "Python Backend Development Engineer",
    "3 years of Python experience, proficient in Django/Flask, microservices experience",
    "Medium",
)
for q in questions:
    print(f"[{q['category']}] {q['question']}")

# Run a full mock interview
# result = interviewer.full_interview("Python Backend Development Engineer")
```

---

## Resume Analysis

```python
class ResumeAnalyzer:
    """AI resume analyzer"""

    def analyze(self, resume_text: str, target_position: str = "") -> dict:
        """Analyze a resume"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a senior HR professional + technical expert. Analyze this resume.

{f"Target position: {target_position}" if target_position else ""}

Output JSON:
{{
  "overall_score": 0-100,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "match_score": 0-100 (match with target position),
  "missing_skills": ["Missing skills"],
  "format_issues": ["Formatting issues"],
  "keywords_optimization": ["Keywords to add"],
  "rewrite_suggestions": ["Revision suggestions"],
  "improved_resume": "Optimized resume text"
}}""",
                },
                {"role": "user", "content": resume_text},
            ],
            temperature=0.3,
            max_tokens=4096,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"overall_score": 0}

    def generate_self_intro(self, resume: str, position: str) -> str:
        """Generate a self-introduction"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate an interview self-introduction based on the resume (1-minute version).

Position: {position}

Requirements:
- Length: roughly 200 characters (1 minute)
- Structure: Who I am → Core competencies → Key achievements → Why I'm a fit
- Tone: Confident but not boastful, professional with a human touch
- Include specific data and results""",
                },
                {"role": "user", "content": f"Resume:\n{resume}"},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return response.choices[0].message.content

# Usage
analyzer = ResumeAnalyzer()

resume = """
Zhang San
3 years of Python backend development experience
Skills: Python, Django, Flask, MySQL, Redis, Docker
Project: E-commerce system with 100K+ DAU
Education: XX University, Computer Science, Bachelor's degree
"""

analysis = analyzer.analyze(resume, "Senior Python Development Engineer")
print(f"Overall score: {analysis['overall_score']}")
print(f"Match score: {analysis.get('match_score', 'N/A')}")
print(f"Strengths: {analysis['strengths']}")
print(f"Weaknesses: {analysis['weaknesses']}")
print(f"Missing skills: {analysis.get('missing_skills', [])}")

# Generate self-introduction
intro = analyzer.generate_self_intro(resume, "Senior Python Development Engineer")
print(f"\nSelf-introduction:\n{intro}")
```

---

## Full Interview Workflow API

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AI Job Interview Platform")
interviewer = AIInterviewer()
analyzer = ResumeAnalyzer()

@app.post("/api/resume/analyze")
async def analyze_resume(resume: str, position: str = ""):
    return analyzer.analyze(resume, position)

@app.post("/api/interview/questions")
async def get_questions(position: str, resume: str = "", difficulty: str = "Medium"):
    return interviewer.generate_questions(position, resume, difficulty)

@app.post("/api/interview/evaluate")
async def evaluate_answer(question: str, answer: str, expected_points: list[str] = []):
    return interviewer.evaluate_answer(question, answer, expected_points)

@app.post("/api/interview/self-intro")
async def get_self_intro(resume: str, position: str):
    return {"intro": analyzer.generate_self_intro(resume, position)}
```

---

## Next Steps

- [AI Automation Workflows](/tutorials/ai-powered-automation-guide/)
- [AI Startup Guide](/tutorials/ai-startup-guide-zero-cost/)

> 📝 Based on DeepSeek, June 2026.
