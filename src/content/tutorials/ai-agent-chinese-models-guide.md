---
title: "AI Agent in Action: Building Autonomous Agents with Chinese Models"
description: "Build AI Agents from scratch: DeepSeek/Qwen + Function Calling + Multi-Tool Orchestration. Complete Python code with web search, code execution, file operations, and multi-agent collaboration."
category: "Hands-On Tutorials"
date: 2026-06-24
tags: ["Agent", "Function Calling", "DeepSeek", "Qwen", "Automation", "Advanced", "Python"]
level: "Expert"
---

## What Problem Does This Tutorial Solve?

You will build an autonomous AI Agent from scratch:

- Agent core loop (Perceive -> Think -> Execute)
- Multi-tool calling (search, code execution, file operations)
- Planning and reflection (Plan-and-Solve + Self-Reflection)
- Multi-agent collaboration
- Support for DeepSeek / Qwen / GLM models

> AI Agents are the dominant paradigm for AI applications in 2026. This tutorial builds a complete Agent using Chinese models — all code is runnable.

---

## What Is an AI Agent?

An Agent is an AI program capable of **autonomous decision-making and tool use**:

```
User Goal -> Agent Core Loop:
  1. Think (What should I do?)
  2. Act (Call tools)
  3. Observe (What did the tool return?)
  4. Reflect (Is the goal achieved?)
  5. If not achieved -> Go back to step 1
```

Difference from regular conversational AI: Agents can autonomously execute multi-step tasks without human guidance at every step.

---

## Step 1: Tool Definitions

```python
import json, os, requests, subprocess
from openai import OpenAI
from typing import Callable

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

# Define tools available to the Agent
def web_search(query: str) -> str:
    """Web search (simulated)"""
    # In production, use SerpAPI / Brave Search API
    return f"Search results: Found 3 related items about '{query}'..."

def execute_python(code: str) -> str:
    """Safely execute Python code"""
    try:
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout or result.stderr
    except Exception as e:
        return f"Execution error: {e}"

def read_file(path: str) -> str:
    """Read a file"""
    try:
        with open(path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Read failed: {e}"

def write_file(path: str, content: str) -> str:
    """Write a file"""
    try:
        with open(path, "w") as f:
            f.write(content)
        return f"File written: {path}"
    except Exception as e:
        return f"Write failed: {e}"

# Tool registry
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the internet for information. Use when real-time information is needed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search keywords"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_python",
            "description": "Execute Python code and return the result. Use for computation and data processing.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code to execute"}
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read file contents",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Create or overwrite a file",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"},
                    "content": {"type": "string", "description": "File content"}
                },
                "required": ["path", "content"]
            }
        }
    }
]

# Tool execution mapping
TOOL_EXECUTORS: dict[str, Callable] = {
    "web_search": web_search,
    "execute_python": execute_python,
    "read_file": read_file,
    "write_file": write_file,
}
```

---

## Step 2: Agent Core Loop

```python
class SimpleAgent:
    def __init__(self, system_prompt: str = None):
        self.system_prompt = system_prompt or """You are an AI assistant Agent. You can use tools to complete tasks.

Rules:
1. Analyze user requirements and break them down into executable steps
2. Use tools to obtain information or perform operations
3. Adjust plans based on tool results
4. When the goal is achieved, summarize results for the user
5. If a tool call fails, try an alternative approach"""
        self.messages = [{"role": "system", "content": self.system_prompt}]
        self.max_iterations = 10  # Prevent infinite loops

    def run(self, task: str) -> str:
        """Execute a task"""
        self.messages.append({"role": "user", "content": task})

        for iteration in range(self.max_iterations):
            print(f"\n{'='*50}")
            print(f"Iteration {iteration + 1}")

            # 1. AI thinks
            response = client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=self.messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
            )

            msg = response.choices[0].message

            # 2. If no tool calls -> task complete
            if not msg.tool_calls:
                print(f"Agent complete: {msg.content[:200]}...")
                return msg.content

            # 3. Execute tool calls
            self.messages.append(msg)

            for tool_call in msg.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                print(f"{func_name}({func_args})")

                executor = TOOL_EXECUTORS.get(func_name)
                if executor:
                    result = executor(**func_args)
                else:
                    result = f"Unknown tool: {func_name}"

                print(f"Result: {str(result)[:200]}...")

                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result),
                })

        return "Task reached maximum iterations; may require human intervention."

# Test
agent = SimpleAgent()
result = agent.run("Look up today's weather in Beijing and Shanghai, calculate the temperature difference between the two cities, and save the results to weather_report.txt")
print(f"\nFinal result: {result}")
```

---

## Step 3: Plan-and-Solve Agent

```python
class PlanAndSolveAgent(SimpleAgent):
    """An agent that plans first, then executes"""

    def run(self, task: str) -> str:
        # Phase 1: Planning
        plan_prompt = f"""Create an execution plan for the following task:

Task: {task}

Please list detailed steps, one per line. Format:
1. [Step description]
2. [Step description]
..."""

        plan_response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[{"role": "user", "content": plan_prompt}],
            temperature=0.3,
        )

        plan = plan_response.choices[0].message.content
        print(f"Execution Plan:\n{plan}\n")

        # Phase 2: Execute according to plan
        full_task = f"""Task: {task}

Execution Plan:
{plan}

Please follow the plan step by step and use tools to complete each operation."""
        return super().run(full_task)

# Test
agent = PlanAndSolveAgent()
result = agent.run(
    "Analyze the data in data.csv, calculate the mean and median of sales, and generate a Markdown analysis report"
)
```

---

## Step 4: Self-Reflection Agent

```python
class ReflectiveAgent(SimpleAgent):
    """An agent with self-reflection capability"""

    def run(self, task: str) -> str:
        # Round 1: Execute the task
        result = super().run(task)

        # Round 2: Self-reflection
        reflection_prompt = f"""Please reflect on your previous answer:

Original task: {task}
Your answer: {result}

Please check:
1. Is the task fully completed?
2. Are there any errors or inaccuracies?
3. Could it be done better?

If there are issues, please provide a revised answer. If perfect, say "The answer is complete and needs no revision." """

        self.messages.append({"role": "user", "content": reflection_prompt})

        reflection = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=self.messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
        )

        final = reflection.choices[0].message
        if "needs no revision" in (final.content or ""):
            return result
        else:
            return final.content

# Test
agent = ReflectiveAgent()
result = agent.run("Write a bubble sort in Python and test its correctness")
```

---

## Step 5: Multi-Agent Collaboration

```python
class MultiAgentSystem:
    """Multiple specialized agents collaborating to complete a task"""

    def __init__(self):
        self.researcher = SimpleAgent(
            "You are a Researcher Agent. Your job is to search for and collect information. Return raw data and facts."
        )
        self.analyst = SimpleAgent(
            "You are an Analyst Agent. Based on data provided by the researcher, perform analysis and provide insights."
        )
        self.writer = SimpleAgent(
            "You are a Writer Agent. Transform the analyst's insights into structured documentation."
        )

    def run(self, task: str) -> str:
        print("=" * 60)
        print("Researcher starting work...")
        research = self.researcher.run(f"Search for and collect information and data about '{task}'")

        print("\nAnalyst starting work...")
        analysis = self.analyst.run(
            f"Based on the following research data, perform analysis and provide insights:\n{research}"
        )

        print("\nWriter starting work...")
        report = self.writer.run(
            f"Based on the following analysis, write a structured report:\nGoal: {task}\nAnalysis: {analysis}"
        )

        return report

# Test
mas = MultiAgentSystem()
report = mas.run("China's AI industry market size and development trends in 2026")
print(f"\n{'='*60}")
print(report)
```

---

## Step 6: Switching Between Different Models

```python
class MultiModelAgent:
    """An agent supporting multiple Chinese AI models"""

    def __init__(self, model: str = "deepseek"):
        if model == "deepseek":
            self.client = OpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url="https://api.deepseek.com/v1",
            )
            self.model_name = "deepseek-v4-pro"
        elif model == "qwen":
            self.client = OpenAI(
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )
            self.model_name = "qwen-plus"
        elif model == "glm":
            self.client = OpenAI(
                api_key=os.getenv("ZAI_API_KEY"),
                base_url="https://open.bigmodel.cn/api/paas/v4/",
            )
            self.model_name = "glm-4"
        else:
            raise ValueError(f"Unsupported model: {model}")

        self.messages = [{"role": "system", "content": "You are an AI Agent."}]
        self.max_iterations = 8

    def run(self, task: str) -> str:
        self.messages.append({"role": "user", "content": task})

        for i in range(self.max_iterations):
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=self.messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
            )

            msg = response.choices[0].message

            if not msg.tool_calls:
                return msg.content

            self.messages.append(msg)

            for tc in msg.tool_calls:
                func = TOOL_EXECUTORS.get(tc.function.name)
                if func:
                    args = json.loads(tc.function.arguments)
                    result = func(**args)
                    self.messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": str(result),
                    })

        return "Exceeded maximum iterations"


# Use different models
for model in ["deepseek", "qwen", "glm"]:
    print(f"\n--- Using {model} ---")
    agent = MultiModelAgent(model=model)
    result = agent.run('Calculate the sum from 1 to 100, then square the result')
    print(result[:200])
```

---

## Complete Example: AI Data Analyst

```python
class DataAnalystAgent(MultiModelAgent):
    """A specialized data analysis agent"""

    def __init__(self, model="deepseek"):
        super().__init__(model)
        self.messages[0] = {
            "role": "system",
            "content": """You are an AI Data Analyst. Workflow:
1. Read data files
2. Analyze data with Python
3. Generate visualizations (matplotlib)
4. Write an analysis report
5. Save the report to a file"""
        }

# Usage
analyst = DataAnalystAgent(model="deepseek")
report = analyst.run("""
Analyze the following sales data to identify:
1. The month with the highest sales
2. Growth trends
3. Three recommendations for improvement

Data is in sales_2026.csv
""")
```

---

## Agent Development Best Practices

| Practice | Description |
|------|------|
| Limit iterations | Set max_iterations to prevent infinite loops |
| Tool timeouts | Every tool call should have a timeout |
| Error recovery | Allow the Agent to handle tool failures on its own |
| Logging | Record every step's thinking and actions |
| Tool permissions | Dangerous operations (delete/execute) require confirmation |
| Cost control | Set max_tokens limits |

---

## Frequently Asked Questions

### Q: Will the Agent go out of control?

**A**: You can effectively control it by limiting iterations, using a tool permission allowlist, and setting max_tokens.

### Q: Is multi-agent collaboration better than a single agent?

**A**: For complex tasks requiring diverse expertise, multi-agent performs better; for simple tasks, a single agent is faster.

---

## Next Steps

- [Function Calling in Action](/tutorials/deepseek-function-calling-guide/)
- [RAG Hands-On Tutorial](/tutorials/rag-chinese-ai-models-guide/)

> Based on Agent architecture + DeepSeek/Qwen/GLM, tested June 2026.
