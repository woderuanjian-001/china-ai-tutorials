---
title: "LangChain Integration Guide: DeepSeek + Qwen Complete Toolchain"
description: "Full tutorial on integrating Chinese AI models with LangChain: DeepSeek/Qwen + Agent + Memory + Retrieval Chains + Streaming. Includes 8 runnable examples with complete Python code."
category: "Hands-On Tutorials"
date: 2026-06-24
tags: ["LangChain", "DeepSeek", "Qwen", "Agent", "Memory", "Python", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will learn to deeply integrate Chinese AI models with LangChain:

- OpenAI-compatible access method
- Chat Model + Prompt templates
- Chain composition (Sequential + Router)
- Agent tool calling
- Conversation Memory
- Streaming output

> 🎯 LangChain is the world's most popular LLM application framework. This tutorial teaches you to drive DeepSeek/Qwen with it.

---

## Step 1: LangChain Installation and Setup

```bash
pip install langchain langchain-community langchain-deepseek langchain-core openai python-dotenv
```

```python
import os
from langchain_deepseek import ChatDeepSeek
from langchain_community.chat_models import ChatTongyi  # Official Qwen integration
from langchain_openai import ChatOpenAI  # Compatibility access
from langchain.prompts import ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage

# --- Method 1: Official DeepSeek integration ---
deepseek_official = ChatDeepSeek(
    model="deepseek-chat",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    temperature=0.7,
)

# --- Method 2: OpenAI-compatible (universal, works for all Chinese models) ---
deepseek = ChatOpenAI(
    model="deepseek-v4-pro",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
    temperature=0.7,
)

qwen = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

glm = ChatOpenAI(
    model="glm-4",
    api_key=os.getenv("ZAI_API_KEY"),
    base_url="https://open.bigmodel.cn/api/paas/v4/",
)
```

---

## Step 2: Chat Prompt Templates

```python
from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
)

# System prompt
system_template = """You are a {role}, specializing in helping developers in the {business} domain.
Response style: {style}
Code example language: {lang}"""

system_prompt = SystemMessagePromptTemplate.from_template(system_template)

# Human prompt
human_template = "{question}"
human_prompt = HumanMessagePromptTemplate.from_template(human_template)

# Assemble
chat_prompt = ChatPromptTemplate.from_messages([system_prompt, human_prompt])

# Usage
prompt = chat_prompt.format_messages(
    role="senior backend engineer",
    business="e-commerce",
    style="concise and direct + code examples",
    lang="Python",
    question="如何设计一个高并发的订单系统？",
)

response = deepseek.invoke(prompt)
print(response.content)
```

---

## Step 3: Chain Composition

### Sequential Chain

```python
from langchain.chains import LLMChain, SequentialChain

# Chain 1: Generate code
code_prompt = ChatPromptTemplate.from_template(
    "Write a {function} function in {language}, requirements: {requirements}"
)
code_chain = LLMChain(llm=deepseek, prompt=code_prompt, output_key="code")

# Chain 2: Review code
review_prompt = ChatPromptTemplate.from_template(
    "Review the following {language} code and point out 3 areas for improvement:\n```\n{code}\n```"
)
review_chain = LLMChain(llm=deepseek, prompt=review_prompt, output_key="review")

# Chain 3: Generate tests
test_prompt = ChatPromptTemplate.from_template(
    "Write unit tests (pytest) for the following code:\n```\n{code}\n```\nReview comments: {review}"
)
test_chain = LLMChain(llm=deepseek, prompt=test_prompt, output_key="tests")

# Compose
pipeline = SequentialChain(
    chains=[code_chain, review_chain, test_chain],
    input_variables=["language", "function", "requirements"],
    output_variables=["code", "review", "tests"],
)

result = pipeline({
    "language": "Python",
    "function": "binary search",
    "requirements": "supports generics, returns index, -1 if not found",
})

print(f"Code:\n{result['code'][:300]}...\n")
print(f"Review:\n{result['review'][:200]}...\n")
print(f"Tests:\n{result['tests'][:300]}...")
```

### Router Chain -- Auto-select model based on input

```python
from langchain.chains.router import MultiPromptChain
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser

# Define specialized prompt templates
coding_template = """You are a coding expert. Answer with code examples.
Question: {input}"""

math_template = """You are a math expert. Answer with formulas and derivations.
Question: {input}"""

general_template = """You are a general assistant. Answer concisely in Chinese.
Question: {input}"""

prompt_infos = [
    {"name": "coding", "description": "Programming and code-related questions", "prompt_template": coding_template},
    {"name": "math", "description": "Math and logic problems", "prompt_template": math_template},
    {"name": "general", "description": "General knowledge questions", "prompt_template": general_template},
]

# Create router chain
chain = MultiPromptChain.from_prompts(
    llm=deepseek,
    prompt_infos=prompt_infos,
)

print(chain.invoke({"input": "如何用Python反转链表？"}))
print(chain.invoke({"input": "证明根号2是无理数"}))
print(chain.invoke({"input": "今天天气怎么样？"}))
```

---

## Step 4: Conversation Memory

```python
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.chains import ConversationChain

# Full memory -- remembers entire conversation history
memory_full = ConversationBufferMemory(return_messages=True)
conversation = ConversationChain(
    llm=deepseek,
    memory=memory_full,
)

print(conversation.predict(input="我叫小明，我是一个Python开发者"))
print(conversation.predict(input="我刚才说我叫什么名字？"))
print(conversation.predict(input="根据我的职业，推荐3个学习方向"))

# Summary memory -- auto-compresses long conversations
memory_summary = ConversationSummaryMemory(
    llm=deepseek,
    max_token_limit=200,
    return_messages=True,
)

conversation_summary = ConversationChain(
    llm=deepseek,
    memory=memory_summary,
)
```

---

## Step 5: Agent Tool Calling

```python
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import Tool, StructuredTool
from langchain_community.tools import DuckDuckGoSearchRun
import json

# Define tools
search = DuckDuckGoSearchRun()

def calculate(expression: str) -> str:
    """Safely evaluate mathematical expressions"""
    try:
        import math
        result = eval(expression, {"__builtins__": {}}, {"math": math})
        return f"Result: {result}"
    except Exception as e:
        return f"Calculation error: {e}"

def get_weather(city: str) -> str:
    """Get weather (simulated)"""
    return f"{city} is sunny turning cloudy, 18-26°C, southeast wind level 3"

tools = [
    Tool(name="Search", func=search.run, description="Search the internet for real-time information"),
    StructuredTool.from_function(func=calculate, name="Calculate", description="Perform mathematical calculations"),
    StructuredTool.from_function(func=get_weather, name="Weather", description="Query city weather"),
]

# Create Agent
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an AI assistant. Use tools to complete tasks."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(deepseek, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Usage
executor.invoke({"input": "北京天气怎么样？计算25°C对应的华氏度"})
```

---

## Step 6: Streaming Output

```python
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

# Streaming LLM
stream_llm = ChatOpenAI(
    model="deepseek-v4-pro",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()],
    temperature=0.7,
)

stream_llm.invoke("写一首关于编程的七言绝句")
```

---

## Step 7: Multi-Model Switching Wrapper

```python
from enum import Enum
from typing import Optional

class ModelProvider(Enum):
    DEEPSEEK = "deepseek"
    QWEN = "qwen"
    GLM = "glm"
    MOONSHOT = "moonshot"

class ChineseModelHub:
    """Unified LangChain interface for managing multiple Chinese AI models"""

    _configs = {
        ModelProvider.DEEPSEEK: {
            "base_url": "https://api.deepseek.com/v1",
            "model": "deepseek-v4-pro",
            "env_key": "DEEPSEEK_API_KEY",
        },
        ModelProvider.QWEN: {
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "model": "qwen-plus",
            "env_key": "DASHSCOPE_API_KEY",
        },
        ModelProvider.GLM: {
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
            "model": "glm-4",
            "env_key": "ZAI_API_KEY",
        },
        ModelProvider.MOONSHOT: {
            "base_url": "https://api.moonshot.cn/v1",
            "model": "moonshot-v1-8k",
            "env_key": "MOONSHOT_API_KEY",
        },
    }

    def __init__(self, provider: ModelProvider):
        config = self._configs[provider]
        api_key = os.getenv(config["env_key"])
        if not api_key:
            raise ValueError(f"Please set environment variable {config['env_key']}")

        self.llm = ChatOpenAI(
            model=config["model"],
            api_key=api_key,
            base_url=config["base_url"],
            temperature=0.7,
        )

    def get_chain(self, template: str):
        """Create a simple Q&A chain"""
        prompt = ChatPromptTemplate.from_template(template)
        return prompt | self.llm

# Usage
hub = ChineseModelHub(ModelProvider.DEEPSEEK)
chain = hub.get_chain("Translate to English: {text}")
result = chain.invoke({"text": "人工智能正在改变世界"})
print(result.content)
```

---

## Step 8: Complete Application -- AI Code Review Assistant

```python
class AICodeReviewer:
    """Code review assistant built with LangChain + DeepSeek"""

    def __init__(self, model="deepseek"):
        if model == "deepseek":
            self.llm = ChatOpenAI(
                model="deepseek-v4-pro",
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url="https://api.deepseek.com/v1",
            )
        elif model == "qwen":
            self.llm = ChatOpenAI(
                model="qwen-plus",
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )

    def review(self, code: str, language: str = "Python") -> dict:
        """Comprehensive code review"""
        dimensions = ["Security", "Performance", "Readability", "Error Handling"]

        results = {}
        for dim in dimensions:
            prompt = ChatPromptTemplate.from_messages([
                ("system", f"You are a {dim} review expert. Review the code from the {dim} perspective only."),
                ("human", "Review the {dimension} issues in this {lang} code:\n```{lang}\n{code}\n```"),
            ])

            chain = prompt | self.llm
            response = chain.invoke({
                "lang": language,
                "code": code,
                "dimension": dim,
            })
            results[dim] = response.content

        # Comprehensive report
        summary_prompt = f"""Generate a comprehensive report based on the dimensional reviews below.
Security: {results['Security'][:500]}
Performance: {results['Performance'][:500]}
Readability: {results['Readability'][:500]}
Error Handling: {results['Error Handling'][:500]}"""

        summary = self.llm.invoke(summary_prompt)

        return {
            "dimensions": results,
            "summary": summary.content,
        }

# Usage
reviewer = AICodeReviewer()
code = """
def process_data(data):
    result = []
    for i in range(len(data)):
        val = data[i]
        result.append(val * 2)
    return result
"""

report = reviewer.review(code)
print(report["summary"])
```

---

## FAQ

### Q: Why not use LangChain's official ChatDeepSeek?

**A**: `ChatOpenAI`'s OpenAI-compatible interface is more universal -- switch models by just changing `base_url`, and it has more complete features (supports thinking, JSON mode, etc.).

### Q: LangChain is too heavy. Any lightweight alternatives?

**A**: For simple projects, use the OpenAI SDK directly. For complex projects, LangChain's orchestration capabilities justify the complexity. You can also use LlamaIndex as an alternative.

---

## Next Steps

- [AI Agent Hands-On](/tutorials/ai-agent-chinese-models-guide/)
- [RAG Hands-On Tutorial](/tutorials/rag-chinese-ai-models-guide/)

> 📝 Based on LangChain 0.3.x + DeepSeek/Qwen, tested June 2026.
