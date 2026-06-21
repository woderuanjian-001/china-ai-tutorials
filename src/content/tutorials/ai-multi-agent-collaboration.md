---
title: "Multi-Agent Collaboration with Chinese AI Models: Task Decomposition, Role Assignment & Message Passing Using DeepSeek"
description: "Build multi-agent collaboration systems with Chinese AI models: automatic task decomposition, role-based orchestration, inter-agent message passing, and result arbitration mechanisms. Complete AutoGen-style implementation powered by DeepSeek and Qwen."
category: "Advanced Models"
date: 2026-06-27
tags: ["Agent", "Multi-Agent", "Collaboration", "Orchestration", "AutoGen", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build a multi-AI-agent collaboration system:

- Automatic task decomposition and assignment
- Multi-role agent orchestration
- Inter-agent message passing
- Result arbitration and consensus mechanisms

> 🎯 "Build me an e-commerce system" → Architect Agent designs the plan → Backend Agent writes the code → Frontend Agent builds the UI → Test Agent writes test cases → Reviewer ensures quality.

---

## Agent Base Framework

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
import uuid

@dataclass
class Message:
    """Inter-agent message"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender: str = ""
    receiver: str = ""
    content: str = ""
    msg_type: str = "text"  # text / request / response / error
    metadata: dict = field(default_factory=dict)

class BaseAgent(ABC):
    """Base agent class"""

    def __init__(self, name: str, role: str, model: str = "deepseek-v4-pro"):
        self.name = name
        self.role = role
        self.model = model
        self.inbox: list[Message] = []
        self.outbox: list[Message] = []
        self.client = client

    def receive(self, msg: Message):
        """Receive a message"""
        self.inbox.append(msg)

    def send(self, receiver: str, content: str, msg_type: str = "text") -> Message:
        """Send a message"""
        msg = Message(
            sender=self.name,
            receiver=receiver,
            content=content,
            msg_type=msg_type,
        )
        self.outbox.append(msg)
        return msg

    @abstractmethod
    def think_and_act(self) -> list[Message]:
        """Think and produce actions"""
        pass

    def _call_ai(self, system_prompt: str, user_input: str, temperature: float = 0.3) -> str:
        """Call the AI model"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input},
            ],
            temperature=temperature,
            max_tokens=2000,
        )
        return response.choices[0].message.content

class ArchitectAgent(BaseAgent):
    """Architect Agent — responsible for task decomposition and solution design"""

    def __init__(self):
        super().__init__(name="Architect", role="System Architecture Design")

    def think_and_act(self) -> list[Message]:
        messages = []

        for msg in self.inbox:
            if msg.msg_type == "request" and "design" in msg.content.lower():
                # Analyze requirements and generate a design plan
                design = self._call_ai(
                    f"""You are a senior system architect. Decompose the following requirements into executable tasks.

Output JSON:
{{
  "architecture": "Architecture overview (1 paragraph)",
  "components": [
    {{
      "name": "Component name",
      "description": "Functional description",
      "tech_stack": "Recommended tech stack",
      "dependencies": ["Dependent components"],
      "assigned_to": "Assigned role (Backend/Frontend/Database/Testing)",
      "estimated_hours": estimated effort in hours
    }}
  ],
  "data_flow": "Data flow description",
  "api_endpoints": ["API endpoint list"],
  "risks": ["Technical risks"],
  "implementation_order": ["Implementation order (topological sort)"]
}}""",
                    msg.content,
                    temperature=0.3,
                )

                try:
                    plan = json.loads(design)
                    # Distribute tasks to corresponding roles
                    for component in plan.get("components", []):
                        assignee = component.get("assigned_to", "Backend")
                        task = f"Implement {component['name']}: {component['description']}"
                        messages.append(Message(
                            sender=self.name,
                            receiver=assignee,
                            content=task,
                            msg_type="task",
                            metadata={"component": component},
                        ))
                except:
                    pass

        self.inbox.clear()
        return messages

class DeveloperAgent(BaseAgent):
    """Developer Agent — responsible for code implementation"""

    def __init__(self, specialty: str = "Backend"):
        super().__init__(name=f"{specialty} Developer", role=f"{specialty} Development")
        self.specialty = specialty

    def think_and_act(self) -> list[Message]:
        messages = []

        for msg in self.inbox:
            if msg.msg_type == "task":
                code = self._call_ai(
                    f"""You are a {self.specialty} developer. Write code based on the task requirements.

Output JSON:
{{
  "files": [
    {{
      "path": "File path",
      "language": "Language",
      "code": "Complete code",
      "description": "File description"
    }}
  ],
  "tests": ["Test cases"],
  "notes": "Implementation notes"
}}

Requirements:
- Code must be complete and runnable
- Include necessary error handling
- Comments in English""",
                    msg.content,
                    temperature=0.3,
                )

                # After implementation, send to code review
                try:
                    impl = json.loads(code)
                    messages.append(Message(
                        sender=self.name,
                        receiver="Code Reviewer",
                        content=json.dumps(impl, ensure_ascii=False),
                        msg_type="review_request",
                        metadata={"task": msg.content},
                    ))
                except:
                    pass

        self.inbox.clear()
        return messages

class ReviewerAgent(BaseAgent):
    """Code Reviewer Agent — responsible for quality assurance"""

    def __init__(self):
        super().__init__(name="Code Reviewer", role="Code Review")

    def think_and_act(self) -> list[Message]:
        messages = []

        for msg in self.inbox:
            if msg.msg_type == "review_request":
                review = self._call_ai(
                    f"""You are a senior code review expert. Review the following code.

Output JSON:
{{
  "verdict": "Approved/Needs Revision/Rejected",
  "issues": [
    {{
      "severity": "critical/high/medium/low",
      "file": "File name",
      "line": "Approximate location",
      "problem": "Problem description",
      "suggestion": "Suggested fix"
    }}
  ],
  "score": 0-100,
  "summary": "Review summary"
}}

Review dimensions: Bugs / Security / Performance / Readability / Maintainability""",
                    msg.content,
                    temperature=0.2,
                )

                try:
                    result = json.loads(review)
                    if result["verdict"] == "Approved":
                        messages.append(Message(
                            sender=self.name,
                            receiver="Orchestrator",
                            content=f"✅ {msg.metadata.get('task', '')} review passed",
                            msg_type="status",
                            metadata={"review": result},
                        ))
                    else:
                        # Send back for revision
                        messages.append(Message(
                            sender=self.name,
                            receiver=msg.sender,
                            content=f"❌ Revision needed: {json.dumps(result['issues'], ensure_ascii=False)}",
                            msg_type="revision_request",
                            metadata={"review": result},
                        ))
                except:
                    pass

        self.inbox.clear()
        return messages
```

---

## Multi-Agent Orchestrator

```python
class AgentOrchestrator:
    """Agent Orchestrator — manages the entire multi-agent system"""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {}
        self.message_queue: list[Message] = []
        self.execution_log: list[dict] = []

    def register_agent(self, agent: BaseAgent):
        """Register an agent"""
        self.agents[agent.name] = agent

    def submit_task(self, task: str, priority: str = "normal") -> str:
        """Submit a task — entry point"""
        task_id = str(uuid.uuid4())[:8]

        # 1. Task analysis
        analysis = self._analyze_task(task)

        # 2. Assign to Architect
        architect_msg = Message(
            sender="Orchestrator",
            receiver="Architect",
            content=f"Design {task}",
            msg_type="request",
            metadata={"task_id": task_id, "analysis": analysis},
        )
        self.agents["Architect"].receive(architect_msg)

        return task_id

    def _analyze_task(self, task: str) -> dict:
        """Analyze task complexity and required roles"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the following task and determine required roles.

Task: {task}

Output JSON:
{{
  "complexity": "Simple/Medium/Complex",
  "required_roles": ["Required roles"],
  "estimated_rounds": estimated interaction rounds,
  "success_criteria": ["Success criteria"]
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"complexity": "Medium", "required_roles": []}

    def run_round(self) -> bool:
        """Run one collaboration round — each agent processes messages once"""
        had_work = False

        for name, agent in self.agents.items():
            if agent.inbox:
                messages = agent.think_and_act()
                for msg in messages:
                    # Route the message
                    if msg.receiver in self.agents:
                        self.agents[msg.receiver].receive(msg)
                    self.message_queue.append(msg)
                    self.execution_log.append({
                        "from": msg.sender,
                        "to": msg.receiver,
                        "type": msg.msg_type,
                        "content": msg.content[:100],
                    })
                had_work = True

        return had_work

    def run_until_complete(self, max_rounds: int = 10) -> dict:
        """Run until the task is complete or times out"""
        for round_num in range(max_rounds):
            print(f"\n{'='*50}")
            print(f"🔄 Round {round_num + 1}")
            print(f"{'='*50}")

            had_work = self.run_round()
            if not had_work:
                print("✅ All agents have completed their work")
                break

            # Print this round's messages
            for log_entry in self.execution_log[-5:]:
                print(f"  {log_entry['from']} → {log_entry['to']}: {log_entry['content']}")

        return {
            "rounds": round_num + 1,
            "total_messages": len(self.message_queue),
            "execution_log": self.execution_log,
        }

# Usage
orchestrator = AgentOrchestrator()

# Register the agent team
orchestrator.register_agent(ArchitectAgent())
orchestrator.register_agent(DeveloperAgent("Backend"))
orchestrator.register_agent(DeveloperAgent("Frontend"))
orchestrator.register_agent(DeveloperAgent("Database"))
orchestrator.register_agent(ReviewerAgent())

# Submit a task
task_id = orchestrator.submit_task("Design a simple user registration and login system that supports phone number + OTP login")

# Run the collaboration
result = orchestrator.run_until_complete(max_rounds=5)

print(f"\n📊 Collaboration stats:")
print(f"  Total rounds: {result['rounds']}")
print(f"  Total messages: {result['total_messages']}")
```

---

## Debate and Arbitration Mechanism

```python
class DebatePanel:
    """Multi-agent debate — let multiple agents debate to reach consensus"""

    def debate(self, topic: str, perspectives: list[str], rounds: int = 3) -> dict:
        """Multi-perspective debate"""
        debate_log = []

        # Initialize each perspective's position
        positions = {}
        for perspective in perspectives:
            response = client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {
                        "role": "system",
                        "content": f"""From the "{perspective}" perspective, present your viewpoint on the following topic.

Topic: {topic}

Output JSON:
{{
  "perspective": "{perspective}",
  "position": "Stance (support/oppose/neutral + reasoning)",
  "key_arguments": ["Core arguments"],
  "evidence": ["Supporting evidence"],
  "confidence": 0-100
}}""",
                    },
                ],
                temperature=0.5,
                max_tokens=800,
            )
            try:
                positions[perspective] = json.loads(response.choices[0].message.content)
            except:
                positions[perspective] = {}

        debate_log.append({"phase": "Position statements", "positions": positions})

        # Multi-round debate
        for round_num in range(rounds):
            responses = {}
            for perspective in perspectives:
                # Each agent responds after seeing other agents' views
                others = {k: v for k, v in positions.items() if k != perspective}
                response = client.chat.completions.create(
                    model="deepseek-v4-pro",
                    messages=[
                        {
                            "role": "system",
                            "content": f"""Debate Round {round_num+1}.

Your perspective: {perspective}
Your position: {json.dumps(positions[perspective], ensure_ascii=False)}
Other perspectives: {json.dumps(others, ensure_ascii=False)}

Respond to the opposing views. Output JSON:
{{
  "perspective": "{perspective}",
  "rebuttals": [
    {{"target": "Which view this responds to", "response": "Response content"}}
  ],
  "concessions": ["Opposing points you agree with"],
  "updated_position": "Updated stance",
  "confidence": Updated confidence 0-100
}}""",
                        },
                    ],
                    temperature=0.4,
                    max_tokens=800,
                )
                try:
                    responses[perspective] = json.loads(response.choices[0].message.content)
                except:
                    pass

            debate_log.append({"phase": f"Round {round_num+1} debate", "responses": responses})

        # Arbitration — synthesize all perspectives
        summary = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""As a neutral arbitrator, synthesize the following debate to reach a final conclusion.

Topic: {topic}
Debate record: {json.dumps(debate_log, ensure_ascii=False)[:6000]}

Output JSON:
{{
  "conclusion": "Final conclusion",
  "consensus_level": "High/Medium/Low",
  "majority_view": "Majority opinion",
  "minority_view": "Minority opinion (worth considering)",
  "key_agreements": ["Points of agreement"],
  "key_disagreements": ["Remaining points of disagreement"],
  "recommendation": "Final recommendation"
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        try:
            return {
                "debate_log": debate_log,
                "arbitration": json.loads(summary.choices[0].message.content),
            }
        except:
            return {"error": "Debate failed"}

# Usage
debate = DebatePanel()

result = debate.debate(
    topic="Should AI-generated content be labeled as 'AI-generated'?",
    perspectives=["Content Creator", "Technology Developer", "General User", "Regulatory Body"],
    rounds=2,
)

arb = result.get("arbitration", {})
print(f"Conclusion: {arb.get('conclusion')}")
print(f"Consensus level: {arb.get('consensus_level')}")
print(f"Recommendation: {arb.get('recommendation')}")
```

---

## Multi-Agent Collaboration Patterns

```
Pattern 1: Pipeline
Task → Agent A → Agent B → Agent C → Result
Best for: Linear tasks with clear steps

Pattern 2: Debate
Task → Agent A ─┐
      → Agent B ─┤→ Arbitration → Result
      → Agent C ─┘
Best for: Decisions requiring multi-perspective analysis

Pattern 3: Hierarchy
      Manager Agent
      /    |    \
   AgentA  AgentB  AgentC
Best for: Complex task decomposition and coordination

Pattern 4: Swarm
Agent A ⇄ Agent B
   ⇅        ⇅
Agent C ⇄ Agent D
Best for: Open-ended exploration and creative generation
```

---

## Next Steps

- [AI Agent Basics](/tutorials/ai-agent-basics-guide/)
- [LangChain Integration](/tutorials/langchain-chinese-ai-integration/)

> 📝 Based on DeepSeek + AutoGen style, June 2026.
