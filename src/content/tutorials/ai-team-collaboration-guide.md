---
title: "Chinese AI Team Collaboration: Meeting Minutes, Project Planning & Knowledge Management with DeepSeek/Qwen/Kimi"
description: "Build team collaboration tools with Chinese AI models: intelligent meeting minutes generation, AI project planning and decomposition, team knowledge base management, and code collaboration enhancement. Includes Feishu/DingTalk integration solutions."
category: "Hands-On Tutorials"
date: 2026-06-28
tags: ["Collaboration", "Meeting Minutes", "Project Management", "Knowledge Base", "Productivity", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will use AI to boost team collaboration efficiency:

- Intelligent meeting minutes generation
- AI project planning and task decomposition
- Team knowledge base management
- Code collaboration enhancement

> 🎯 A 1-hour meeting → AI auto-generates minutes → 3-minute review and publish. Everyone is aligned, no one misses key points. AI is a team productivity amplifier.

---

## Intelligent Meeting Minutes

```python
class MeetingMinutesAI:
    """AI meeting minutes assistant"""

    def __init__(self):
        self.client = client

    def generate_minutes(self, transcript: str, participants: list[str], meeting_info: dict) -> dict:
        """Generate structured minutes from meeting recording/transcript"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Organize the meeting content into structured minutes.

Meeting info: {json.dumps(meeting_info, ensure_ascii=False)}
Participants: {json.dumps(participants, ensure_ascii=False)}
Meeting transcript: {transcript[:12000]}

Output JSON:
{{
  "meeting_title": "Meeting title",
  "date": "Date",
  "duration": "Duration",
  "participants": ["Participants"],
  "summary": "3-5 sentence summary",
  "key_discussions": [
    {{
      "topic": "Topic",
      "discussion": "Key discussion points",
      "conclusion": "Conclusion",
      "dissenting_views": ["Dissenting opinions"]
    }}
  ],
  "decisions_made": [
    {{"decision": "Decision content", "proposer": "Proposer", "consensus": "Unanimous/Majority/Divided"}}
  ],
  "action_items": [
    {{
      "task": "Action item",
      "assignee": "Owner",
      "deadline": "Due date",
      "dependencies": ["Dependencies"],
      "priority": "High/Medium/Low"
    }}
  ],
  "open_questions": ["Open questions for discussion"],
  "next_meeting": "Next meeting suggestion",
  "mood": "Meeting atmosphere (Positive/Neutral/Tense)"
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

    def extract_action_items(self, transcript: str, existing_tasks: list[dict]) -> dict:
        """Extract action items from discussion and deduplicate with existing tasks"""
        tasks_text = json.dumps(existing_tasks, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Extract action items from the conversation, deduplicating with existing tasks.

Conversation: {transcript[:8000]}
Existing tasks: {tasks_text}

Output JSON:
{{
  "new_tasks": [
    {{"task": "New task", "assignee": "Implied owner", "deadline": "Implied deadline", "source_quote": "Original quote as evidence"}}
  ],
  "duplicate_of_existing": [{{"new": "Newly mentioned", "existing": "Existing task ID"}}],
  "updated_tasks": [{{"id": "Existing task ID", "update": "Updated information"}}]
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
minutes_ai = MeetingMinutesAI()

transcript = """
Zhang San: Let's confirm the Q3 product roadmap. I think the core focus should be shipping the AI module.
Li Si: Agreed. But we need to pay down some tech debt first, otherwise stacking new features on top will cause issues.
Wang Wu: I suggest a two-week tech debt sprint, then start on the AI features in August.
Zhang San: OK, Li Si you prioritize the tech debt, Wang Wu you work on the technical proposal for the AI module. Let's sync again next Monday.
Li Si: Sounds good. Also, the testing team is understaffed — we need to hire.
Zhang San: I'll push HR on that. Wang Wu, how long do you need for the AI proposal?
Wang Wu: Give me a week — I'll have a first draft by next Wednesday.
"""

result = minutes_ai.generate_minutes(
    transcript,
    participants=["Zhang San (PM)", "Li Si (Tech Lead)", "Wang Wu (AI Lead)"],
    meeting_info={"type": "Q3 Product Planning Meeting", "date": "2026-06-28", "time": "14:00-14:45"},
)

print(f"Meeting summary: {result.get('summary')}")
print("\nDecisions:")
for d in result.get("decisions_made", []):
    print(f"  ✅ {d['decision']} ({d['consensus']})")

print("\nAction Items:")
for action in result.get("action_items", []):
    print(f"  📋 {action['task']} → {action['assignee']} (Due: {action['deadline']})")
```

---

## AI Project Planning

```python
class ProjectPlannerAI:
    """AI project planning assistant"""

    def breakdown_project(self, goal: str, constraints: dict, team: list[dict]) -> dict:
        """Decompose project goal into executable tasks"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Decompose the project goal into executable tasks.

Goal: {goal}
Constraints: {json.dumps(constraints, ensure_ascii=False)}
Team: {json.dumps(team, ensure_ascii=False)}

Output JSON:
{{
  "project_name": "Project name",
  "phases": [
    {{
      "phase": Phase number,
      "name": "Phase name",
      "goal": "Phase goal",
      "tasks": [
        {{
          "id": "TASK-001",
          "title": "Task name",
          "description": "Task description",
          "estimated_hours": Estimated effort,
          "assignee": "Suggested assignee",
          "priority": "P0/P1/P2/P3",
          "dependencies": ["Dependent task IDs"],
          "acceptance_criteria": ["Acceptance criteria"],
          "risks": ["Risk points"]
        }}
      ],
      "milestone": "Phase milestone",
      "review_checkpoint": "Review checkpoint"
    }}
  ],
  "critical_path": ["Tasks on the critical path"],
  "total_estimated_weeks": Total estimated weeks,
  "risk_register": [
    {{"risk": "Risk", "probability": "High/Medium/Low", "impact": "High/Medium/Low", "mitigation": "Mitigation measures"}}
  ],
  "resource_conflicts": ["Resource conflicts"],
  "communication_plan": "Communication plan"
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=2500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_weekly_report(self, completed_tasks: list[dict], planned_tasks: list[dict], blockers: list[dict]) -> str:
        """Generate weekly project report"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate this week's project report.

Completed: {json.dumps(completed_tasks, ensure_ascii=False)}
Planned: {json.dumps(planned_tasks, ensure_ascii=False)}
Blockers: {json.dumps(blockers, ensure_ascii=False)}

Generate structure:
1. This week's accomplishments (by module)
2. Next week's plan
3. Risks and blockers
4. Items requiring assistance
5. Overall progress (percentage + trend)

Professional but friendly tone.""",
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content

# Usage
planner = ProjectPlannerAI()

team = [
    {"name": "Zhang San", "role": "Backend", "availability": "100%"},
    {"name": "Li Si", "role": "Frontend", "availability": "80%"},
    {"name": "Wang Wu", "role": "AI/ML", "availability": "100%"},
    {"name": "Zhao Liu", "role": "QA", "availability": "50%"},
]

plan = planner.breakdown_project(
    "Launch an AI customer service system within 2 months, supporting text and voice interaction",
    {"deadline": "2026-08-28", "budget": "Unlimited", "must_have": ["Text chat", "Knowledge base", "Escalate to human"], "nice_to_have": ["Voice", "Multi-language"]},
    team,
)

print(f"Project: {plan.get('project_name')}")
for phase in plan.get("phases", []):
    print(f"\n📅 Phase {phase['phase']}: {phase['name']}")
    print(f"   Goal: {phase['goal']}")
    for task in phase.get("tasks", []):
        print(f"   [{task['priority']}] {task['title']} → {task['assignee']} ({task['estimated_hours']}h)")

print(f"\nCritical path: {' → '.join(plan.get('critical_path', []))}")
print(f"Total estimate: {plan.get('total_estimated_weeks')} weeks")
```

---

## Team Knowledge Base

```python
class TeamKnowledgeBase:
    """AI team knowledge base management"""

    def __init__(self):
        self.client = client

    def answer_from_docs(self, question: str, relevant_docs: list[dict]) -> dict:
        """Answer questions from team documentation"""
        docs_text = json.dumps(relevant_docs, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Answer questions based on team documentation.

Question: {question}
Relevant docs: {docs_text[:8000]}

Output JSON:
{{
  "answer": "Answer content",
  "confidence": "Confidence level",
  "sources": [{{"doc": "Document name", "section": "Relevant section", "relevance": "Relevance"}}],
  "if_uncertain": "If uncertain, suggest who to ask / what to look up",
  "related_topics": ["Related topic suggestions"],
  "doc_gaps": ["Missing information in the knowledge base"]
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=800,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"answer": "Unable to find an answer in the documentation"}

    def summarize_document(self, content: str, doc_type: str) -> dict:
        """Summarize a document"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Summarize the following team document.

Document type: {doc_type}
Content: {content[:10000]}

Output JSON:
{{
  "title": "Document title",
  "one_liner": "One-sentence description",
  "key_points": ["Key points"],
  "target_audience": "Target audience",
  "actions_required": ["What actions the reader needs to take"],
  "tags": ["Tags"],
  "related_docs": ["Suggested related document topics"],
  "freshness": "Content freshness (Evergreen/Quarterly Update/Monthly Update/Outdated)"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=800,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
kb = TeamKnowledgeBase()

docs = [
    {"name": "Backend API Specification", "content": "All APIs use RESTful style, base path /api/v1/, authentication via JWT Bearer Token..."},
    {"name": "Deployment Process", "content": "Release process: Dev branch → PR → Code Review → Merge master → CI auto-build → Staging verification → Production release..."},
]

answer = kb.answer_from_docs("What is the authentication method for the backend API?", docs)
print(f"Answer: {answer.get('answer')}")
print(f"Sources: {answer.get('sources')}")
```

---

## Code Collaboration Enhancement

```python
class CodeCollaborationAI:
    """AI code collaboration assistant"""

    def generate_pr_description(self, branch: str, commits: list[dict], diff_summary: str) -> dict:
        """Generate PR description"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a Pull Request description.

Branch: {branch}
Commits: {json.dumps(commits, ensure_ascii=False)}
Change summary: {diff_summary}

Output JSON:
{{
  "title": "PR title (following conventional commits)",
  "description": "PR description (including background, changes, testing, screenshots)",
  "type": "feat/fix/refactor/docs/test/chore",
  "breaking_changes": ["Breaking changes"],
  "reviewers_suggestion": ["Suggested reviewers"],
  "test_plan": ["Test plan"],
  "risk_assessment": "Risk assessment",
  "checklist": ["PR checklist items"]
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

    def explain_code_diff(self, diff_content: str) -> str:
        """Explain code changes in plain language"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Explain the following code changes in plain language so non-technical people can understand.

Code changes:
{diff_content[:8000]}

Output:
1. What changed (one sentence)
2. Why the change was made
3. Impact on users
4. Things to watch out for""",
                },
            ],
            temperature=0.3,
            max_tokens=600,
        )
        return response.choices[0].message.content

# Usage
collab_ai = CodeCollaborationAI()

pr = collab_ai.generate_pr_description(
    "feat/ai-customer-service",
    [
        {"hash": "a1b2c3d", "message": "feat: Add customer service chat API"},
        {"hash": "e4f5g6h", "message": "feat: Integrate DeepSeek model"},
        {"hash": "i7j8k9l", "message": "test: Add integration tests"},
    ],
    "Added 3 files, modified 2 files. Main additions: customer service chat endpoint, AI model invocation layer, WebSocket support.",
)

print(f"PR title: {pr.get('title')}")
print(f"Type: {pr.get('type')}")
print(f"Risk: {pr.get('risk_assessment')}")
```

---

## Team AI Tool Integrations

| Tool | AI Capability | Integration Method |
|------|-------------|-------------------|
| Feishu (Lark) | Meeting minutes, document summary | Feishu Bot + Webhook |
| DingTalk | Smart approval, message digest | DingTalk Bot + API |
| WeCom | Auto-reply, schedule management | WeCom Bot |
| Notion | Doc AI, database analysis | Notion API + AI |
| Feishu Docs | AI continuation, translation, summary | Built-in AI features |
| GitLab/GitHub | PR description, code review | CI/CD + API |

---

## Next Steps

- [AI DevOps Automation](/tutorials/ai-devops-automation/)
- [AI Code Review Automation](/tutorials/ai-code-review-automation/)

> 📝 Based on DeepSeek + Feishu/DingTalk integration, June 2026.
