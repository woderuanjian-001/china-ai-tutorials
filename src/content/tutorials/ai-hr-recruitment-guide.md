---
title: "HR & Recruitment with Chinese AI: Intelligent Resume Screening, Interview Assessment & Employee Retention Prediction Using DeepSeek"
description: "Build intelligent HR systems with Chinese AI models: automated resume parsing and matching, AI-assisted interview evaluation, employee turnover risk prediction, and personalized training recommendations. Complete Python code examples using DeepSeek and Qwen."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["HR", "Resume", "Interview", "Recruitment", "Training", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will use AI to boost HR efficiency:

- Automated resume parsing and job matching
- AI-assisted interview evaluation
- Employee turnover risk prediction
- Personalized training recommendations

> 🎯 Receive 500 resumes → AI screens them in 5 minutes → HR only needs to review the top 20 → 10x recruitment efficiency gain.

---

## Intelligent Resume Parsing and Matching

```python
class ResumeParser:
    """AI resume parsing and job matching"""

    def __init__(self):
        self.client = client

    def parse_resume(self, resume_text: str) -> dict:
        """Parse a resume into structured data"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Parse the following resume into structured JSON.

Resume:
{resume_text[:6000]}

Output JSON:
{{
  "basic_info": {{
    "name": "Name (if identifiable)",
    "years_of_experience": years of experience,
    "current_company": "Current company",
    "current_position": "Current position",
    "education": "Highest degree",
    "school": "Graduated institution"
  }},
  "skills": ["Skill list (with proficiency: Expert/Proficient/Familiar)"],
  "work_experience": [
    {{
      "company": "Company",
      "position": "Position",
      "duration": "Duration",
      "achievements": ["Key achievements"],
      "technologies": ["Technologies used"]
    }}
  ],
  "projects": [
    {{
      "name": "Project name",
      "description": "Summary",
      "role": "Role",
      "outcomes": ["Outcomes"]
    }}
  ],
  "strengths": ["Strengths"],
  "red_flags": ["Concerns requiring attention (e.g. frequent job hopping)"],
  "language_skills": {{"Chinese": "Level", "English": "Level"}}
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def match_to_job(self, resume: dict, job_description: str) -> dict:
        """Match a resume to a job description"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Evaluate the fit between a candidate and a job position.

Candidate resume: {json.dumps(resume, ensure_ascii=False)}
Job description: {job_description}

Output JSON:
{{
  "overall_match_score": 0-100,
  "dimension_scores": {{
    "skills_match": {{"score": 0-100, "comment": "Assessment"}},
    "experience_match": {{"score": 0-100, "comment": "Assessment"}},
    "education_match": {{"score": 0-100, "comment": "Assessment"}},
    "culture_fit": {{"score": 0-100, "comment": "Assessment"}},
    "salary_expectation_fit": {{"score": 0-100, "comment": "Assessment"}}
  }},
  "matched_requirements": ["Requirements met"],
  "gaps": ["Requirements not met"],
  "interview_questions": ["Key questions to probe during the interview"],
  "recommendation": "Strongly Recommend/Recommend/Hold/Not Recommended",
  "salary_suggestion": "Suggested salary range (based on market data)"
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

    def batch_screen(self, resumes: list[str], job_desc: str, top_k: int = 20) -> list[dict]:
        """Batch resume screening"""
        results = []

        for i, resume_text in enumerate(resumes):
            print(f"📄 Parsing resume {i+1}/{len(resumes)}...")
            parsed = self.parse_resume(resume_text)
            if parsed:
                match = self.match_to_job(parsed, job_desc)
                results.append({
                    "resume_index": i,
                    "parsed": parsed,
                    "match": match,
                })

        # Sort by match score
        results.sort(key=lambda x: x.get("match", {}).get("overall_match_score", 0), reverse=True)

        return results[:top_k]

# Usage
parser = ResumeParser()

resume = """
Zhang San | 5 years of Python backend development experience
Currently at XX Tech as a Senior Backend Engineer
Expert in Python/Django/FastAPI, proficient in MySQL/Redis/K8s
Led the development of the company's core trading system, handling 1M+ orders per day
Graduated from Zhejiang University, Computer Science, Master's degree
"""

job = """
Hiring: Senior Python Engineer
Requirements: 3+ years Python development experience, familiar with Django/FastAPI
Proficient in MySQL/PostgreSQL, K8s experience preferred
High-concurrency system design experience preferred
"""

parsed = parser.parse_resume(resume)
match = parser.match_to_job(parsed, job)

print(f"Match score: {match.get('overall_match_score')}/100")
print(f"Recommendation: {match.get('recommendation')}")
print(f"Skills match: {match.get('dimension_scores', {}).get('skills_match', {}).get('comment')}")

for q in match.get("interview_questions", []):
    print(f"  Interview question: {q}")
```

---

## AI-Assisted Interview Evaluation

```python
class InterviewAssistant:
    """AI interview assistant"""

    def generate_questions(self, resume: dict, job_desc: str, difficulty: str = "Medium") -> list[dict]:
        """Generate interview questions based on resume and job description"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design interview questions for the following candidate.

Candidate: {json.dumps(resume, ensure_ascii=False)}
Position: {job_desc}
Difficulty: {difficulty}

Output JSON array:
[
  {{
    "category": "Technical Ability/Project Experience/Behavioral/Situational",
    "question": "Question content",
    "expected_answer_points": ["Expected answer points"],
    "evaluation_criteria": "Scoring criteria",
    "difficulty": "Easy/Medium/Hard",
    "time_minutes": suggested answer time
  }}
]

Cover: Technical depth, architecture design, problem solving, teamwork, career planning""",
                },
            ],
            temperature=0.6,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def evaluate_answer(self, question: str, answer: str, criteria: str) -> dict:
        """Evaluate an interview answer"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Evaluate the interview answer.

Question: {question}
Candidate answer: {answer}
Scoring criteria: {criteria}

Output JSON:
{{
  "score": 1-5,
  "strengths": ["Highlights in the answer"],
  "weaknesses": ["Weaknesses in the answer"],
  "completeness": "Completeness assessment",
  "depth": "Depth assessment",
  "communication": "Clarity of expression",
  "follow_up_question": "Suggested follow-up question"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=600,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def summarize_interview(self, candidate_name: str, interview_notes: list[dict]) -> dict:
        """Summarize the interview"""
        notes_text = json.dumps(interview_notes, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Summarize the interview evaluation.

Candidate: {candidate_name}
Interview notes: {notes_text}

Output JSON:
{{
  "overall_rating": "Excellent/Good/Average/Unsatisfactory",
  "score": 0-100,
  "technical_skills": "Technical ability assessment",
  "soft_skills": "Soft skills assessment",
  "highlights": ["Highlights"],
  "concerns": ["Concerns"],
  "hire_recommendation": "Recommend Hire/Recommend Follow-Up/Not Recommended",
  "negotiation_strategy": "Salary negotiation strategy",
  "onboarding_plan": "Onboarding development plan"
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
interviewer = InterviewAssistant()

questions = interviewer.generate_questions(parsed, job, "Medium")
for q in questions[:5]:
    print(f"📋 [{q['category']}] {q['question']}")
    print(f"   Expected points: {', '.join(q.get('expected_answer_points', []))}")

# Simulate evaluating an answer
eval_result = interviewer.evaluate_answer(
    "How would you handle database bottlenecks under high concurrency?",
    "I would use read/write separation, database sharding, Redis caching for hot data, and MQ asynchronous processing for non-real-time requests. In a previous project, I used ShardingSphere for sharding, which improved QPS from 3,000 to 50,000.",
    "Assess high-concurrency system design experience and practical implementation ability",
)
print(f"Score: {eval_result.get('score')}/5")
```

---

## Employee Turnover Prediction

```python
class TurnoverPredictor:
    """AI employee turnover risk prediction"""

    def predict_risk(self, employee: dict, department_stats: dict) -> dict:
        """Predict turnover risk for an individual employee"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Assess employee turnover risk.

Employee info: {json.dumps(employee, ensure_ascii=False)}
Department stats: {json.dumps(department_stats, ensure_ascii=False)}

Output JSON:
{{
  "turnover_risk": "High/Medium/Low",
  "risk_score": 0-100,
  "risk_factors": [
    {{
      "factor": "Risk factor",
      "impact": "Impact level (High/Medium/Low)",
      "detail": "Specific explanation"
    }}
  ],
  "protective_factors": ["Retention factors"],
  "suggested_actions": [
    {{
      "action": "Recommended action",
      "urgency": "Urgency",
      "expected_effect": "Expected outcome",
      "responsible": "Suggested owner"
    }}
  ],
  "predicted_timeline": "Estimated departure window",
  "replacement_difficulty": "Replacement difficulty (Hard/Medium/Easy)"
}}

Risk factors: pay competitiveness, promotion prospects, job satisfaction, commute time, overtime frequency, supervisor relationship, recent performance""",
                },
            ],
            temperature=0.3,
            max_tokens=1200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def department_health_report(self, employees: list[dict]) -> dict:
        """Department health report"""
        emp_text = json.dumps(employees, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze overall department health.

Employee data: {emp_text}

Output JSON:
{{
  "overall_health_score": 0-100,
  "high_risk_count": number of high-risk employees,
  "top_risk_factors": ["Top 5 most prevalent turnover risk factors"],
  "department_morale": "Morale assessment",
  "compensation_analysis": "Compensation competitiveness analysis",
  "retention_recommendations": ["Department-level retention strategies"],
  "succession_planning": "Succession planning recommendations for key positions"
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

# Usage
predictor = TurnoverPredictor()

employee = {
    "name": "Li Si",
    "position": "Senior Frontend Engineer",
    "tenure_years": 2.5,
    "salary_vs_market": "15% below market",
    "last_promotion": "18 months ago",
    "recent_performance": "B+",
    "overtime_hours_per_week": 15,
    "commute_minutes": 90,
    "satisfaction_survey": "Below average",
}

risk = predictor.predict_risk(employee, {"avg_tenure": 3.2, "turnover_rate": "18%", "avg_raise": "5%"})

print(f"Turnover risk: {risk.get('turnover_risk')} (Score: {risk.get('risk_score')}/100)")

for factor in risk.get("risk_factors", []):
    print(f"  ⚠️ {factor['factor']}: {factor['detail']}")

for action in risk.get("suggested_actions", []):
    print(f"  🔧 {action['action']} (Urgency: {action['urgency']})")
```

---

## Personalized Training Recommendations

```python
class TrainingRecommender:
    """AI training recommender"""

    def recommend_training_plan(self, employee: dict, career_goal: str, skill_gaps: list[str]) -> dict:
        """Generate a personalized training plan"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Create a personalized training plan.

Employee: {json.dumps(employee, ensure_ascii=False)}
Career goal: {career_goal}
Skill gaps: {', '.join(skill_gaps)}

Output JSON:
{{
  "training_plan": [
    {{
      "skill": "Skill to train",
      "priority": "High/Medium/Low",
      "resources": [
        {{"type": "Online Course/Book/Practice Project/Mentoring", "name": "Resource name", "platform": "Platform", "duration_hours": estimated hours}}
      ],
      "timeline": "Recommended completion time",
      "milestone": "Milestone goal"
    }}
  ],
  "total_learning_hours": total hours,
  "estimated_completion": "Estimated completion date",
  "career_path_projection": "Career path after completing training",
  "roi_analysis": "Learning investment ROI analysis"
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

# Usage
trainer = TrainingRecommender()

plan = trainer.recommend_training_plan(
    employee={"position": "Mid-level Backend", "skills": ["Python", "Django", "MySQL"]},
    career_goal="Promote to Senior Engineer within one year → Become an architect within three years",
    skill_gaps=["System design", "K8s containerization", "High concurrency", "Technical management"],
)

for item in plan.get("training_plan", []):
    print(f"\n📚 {item['skill']} (Priority: {item['priority']})")
    for resource in item.get("resources", []):
        print(f"  [{resource['type']}] {resource['name']} — {resource['platform']} ({resource['duration_hours']} hrs)")
```

---

## Next Steps

- [AI Product Manager](/tutorials/ai-product-manager-guide/)
- [AI Financial and Tax Management](/tutorials/ai-financial-tax-guide/)

> 📝 Based on DeepSeek + HR SaaS, June 2026.
