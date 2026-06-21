---
title: "LangChain Chinese AI Deep Integration: DeepSeek/Qwen/Kimi Full-Stack Tutorial"
description: "Complete guide to integrating Chinese AI models with LangChain: ChatModel/Embedding/Tool/Agent full-stack tutorial covering DeepSeek, Qwen, Kimi, and GLM. Includes RAG, Memory, and Callback systems."
category: "Advanced Models"
date: 2026-06-20
tags: ["LangChain", "Agent", "RAG", "Memory", "Chain", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will deeply integrate all major Chinese AI models using the LangChain framework:

- Unified ChatModel wrapper (DeepSeek/Qwen/Kimi/GLM)
- RAG (Retrieval-Augmented Generation)
- Agent tool calling
- Conversation Memory
- Callback system monitoring

> 🎯 LangChain is the world's most popular LLM application framework. Master it to wrap Chinese models and call any domestic AI with a single codebase.

---

## Unified ChatModel Wrapper

```python
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from openai import OpenAI
import os
from typing import Any, Optional, Iterator

class ChineseAIChatModel(BaseChatModel):
    """Unified Chinese AI ChatModel"""

    providers = {
        "deepseek": {
            "base_url": "https://api.deepseek.com/v1",
            "default_model": "deepseek-v4-pro",
            "env_key": "DEEPSEEK_API_KEY",
        },
        "qwen": {
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "default_model": "qwen-plus",
            "env_key": "DASHSCOPE_API_KEY",
        },
        "kimi": {
            "base_url": "https://api.moonshot.cn/v1",
            "default_model": "moonshot-v1-auto",
            "env_key": "MOONSHOT_API_KEY",
        },
        "glm": {
            "base_url": "https://open.bigmodel.cn/api/paas/v4",
            "default_model": "glm-4-flash",
            "env_key": "ZHIPU_API_KEY",
        },
    }

    def __init__(self, provider: str = "deepseek", model: str = None, **kwargs):
        super().__init__(**kwargs)
        config = self.providers[provider]
        self._client = OpenAI(
            api_key=os.getenv(config["env_key"]),
            base_url=config["base_url"],
        )
        self._model = model or config["default_model"]
        self._provider = provider

    def _generate(
        self,
        messages: list,
        stop: Optional[list[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Call the API to generate a response"""
        openai_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                openai_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                openai_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                openai_messages.append({"role": "assistant", "content": msg.content})

        response = self._client.chat.completions.create(
            model=self._model,
            messages=openai_messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 2048),
            stop=stop,
        )

        message = AIMessage(content=response.choices[0].message.content)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])

    def _stream(
        self,
        messages: list,
        stop: Optional[list[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> Iterator[ChatGeneration]:
        """Streaming generation"""
        openai_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                openai_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                openai_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                openai_messages.append({"role": "assistant", "content": msg.content})

        stream = self._client.chat.completions.create(
            model=self._model,
            messages=openai_messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 2048),
            stop=stop,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield ChatGeneration(
                    message=AIMessage(content=chunk.choices[0].delta.content)
                )

    @property
    def _llm_type(self) -> str:
        return f"chinese-ai-{self._provider}"

# Usage
deepseek = ChineseAIChatModel(provider="deepseek")
qwen = ChineseAIChatModel(provider="qwen", model="qwen-turbo")

# Unified invocation
response = deepseek.invoke([HumanMessage(content="用中文介绍 LangChain")])
print(f"DeepSeek: {response.content[:100]}...")
```

---

## RAG (Retrieval-Augmented Generation)

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import DashScopeEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

class ChineseRAG:
    """RAG system powered by Chinese AI"""

    def __init__(self, provider: str = "deepseek"):
        self.llm = ChineseAIChatModel(provider=provider)
        self.embeddings = DashScopeEmbeddings(
            model="text-embedding-v3",
            dashscope_api_key=os.getenv("DASHSCOPE_API_KEY"),
        )
        self.vectorstore = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""],
        )

    def ingest_documents(self, documents: list[str]):
        """Ingest documents into the vector store"""
        splits = self.text_splitter.split_text("\n\n".join(documents))
        self.vectorstore = Chroma.from_texts(
            texts=splits,
            embedding=self.embeddings,
            collection_name="chinese_docs",
        )
        print(f"✅ Indexed {len(splits)} text chunks")

    def query(self, question: str, k: int = 4) -> str:
        """RAG query"""
        if not self.vectorstore:
            return "Please ingest documents first"

        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": k},
        )

        prompt = ChatPromptTemplate.from_template("""Answer the question based on the context below.
If the answer cannot be found in the context, say "Unable to answer based on available information."

Context:
{context}

Question: {question}

Answer:""")

        chain = (
            {"context": retriever | self._format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        return chain.invoke(question)

    def _format_docs(self, docs) -> str:
        return "\n\n".join(doc.page_content for doc in docs)

# Usage
rag = ChineseRAG(provider="deepseek")
rag.ingest_documents([
    "Python 3.12 introduced more detailed error messages.",
    "Python's GIL (Global Interpreter Lock) limits multi-threading performance.",
    "Python 3.13 began supporting an experimental no-GIL mode.",
])

answer = rag.query("Python GIL 有什么限制？")
print(f"RAG Answer: {answer}")
```

---

## Agent Tool Calling

```python
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import requests

# Define tools
@tool
def search_web(query: str) -> str:
    """Search the internet for real-time information"""
    # Use a search API here
    return f"Search results: information related to {query}..."

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression"""
    try:
        result = eval(expression)
        return f"{expression} = {result}"
    except:
        return "Calculation error"

@tool
def get_weather(city: str) -> str:
    """Get the weather for a city"""
    # Use a weather API
    return f"{city} is cloudy today, 22-28°C"

class ChineseAIAgent:
    """Chinese AI Agent"""

    def __init__(self, provider: str = "deepseek"):
        self.llm = ChineseAIChatModel(provider=provider)
        self.tools = [search_web, calculate, get_weather]

        # Use OpenAI tools agent (compatibility mode)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant. Use tools to answer questions. Respond in Chinese."),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_openai_tools_agent(self.llm, self.tools, prompt)
        self.executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
        )

    def run(self, task: str) -> str:
        return self.executor.invoke({"input": task})["output"]

# Usage
agent = ChineseAIAgent(provider="deepseek")
result = agent.run("深圳今天天气怎么样？计算 156 * 89 + 234")
print(f"Agent: {result}")
```

---

## Conversation Memory

```python
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.chains import ConversationChain

class ChineseAIConversation:
    """Conversational AI with memory"""

    def __init__(self, provider: str = "deepseek", memory_type: str = "buffer"):
        self.llm = ChineseAIChatModel(provider=provider)

        if memory_type == "buffer":
            self.memory = ConversationBufferMemory(
                return_messages=True,
                memory_key="chat_history",
            )
        elif memory_type == "summary":
            self.memory = ConversationSummaryMemory(
                llm=self.llm,
                return_messages=True,
                memory_key="chat_history",
            )

        self.conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            verbose=False,
        )

    def chat(self, message: str) -> str:
        response = self.conversation.predict(input=message)
        return response

    def get_history(self) -> list:
        return self.memory.load_memory_variables({}).get("chat_history", [])

# Usage
conv = ChineseAIConversation(provider="deepseek")
print(conv.chat("我叫小明，我喜欢Python"))
print(conv.chat("我叫什么名字？"))  # Should remember
print(conv.chat("我之前说我喜欢什么？"))  # Should remember
```

---

## Callback System Monitoring

```python
from langchain.callbacks import StdOutCallbackHandler
from langchain_core.callbacks import BaseCallbackHandler
import time

class ChineseAIMonitor(BaseCallbackHandler):
    """AI call monitoring"""

    def __init__(self):
        self.call_count = 0
        self.total_tokens = 0
        self.start_time = None

    def on_llm_start(self, serialized, prompts, **kwargs):
        self.call_count += 1
        self.start_time = time.time()
        print(f"🚀 [Call #{self.call_count}] Sending {len(prompts)} prompt(s)")

    def on_llm_end(self, response, **kwargs):
        elapsed = time.time() - self.start_time
        tokens = response.llm_output.get("token_usage", {}).get("total_tokens", 0)
        self.total_tokens += tokens
        print(f"✅ [Done] {elapsed:.2f}s elapsed | Total tokens: {self.total_tokens}")

    def on_llm_error(self, error, **kwargs):
        print(f"❌ [Error] {error}")

    def on_tool_start(self, serialized, input_str, **kwargs):
        print(f"🔧 [Tool] {serialized.get('name', 'unknown')} → {input_str}")

# Usage
monitor = ChineseAIMonitor()
llm = ChineseAIChatModel(
    provider="deepseek",
    callbacks=[monitor],
)
# response = llm.invoke([HumanMessage(content="解释什么是回调函数")])
```

---

## Real-World: Multi-Model Router

```python
class MultiModelRouter:
    """Intelligently route tasks to different Chinese AI models"""

    def __init__(self):
        self.models = {
            "deepseek": ChineseAIChatModel(provider="deepseek"),
            "qwen": ChineseAIChatModel(provider="qwen"),
            "kimi": ChineseAIChatModel(provider="kimi"),
        }
        self.router_llm = client  # Use DeepSeek for routing decisions

    def route_and_execute(self, task: str) -> str:
        """Intelligent routing"""
        # 1. AI determines task type
        response = self.router_llm.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Analyze the user's task and select the most suitable AI model:

- deepseek: programming, math, logical reasoning
- qwen: Chinese writing, translation, knowledge Q&A
- kimi: long documents, 128K context

Output only the model name (deepseek/qwen/kimi)""",
                },
                {"role": "user", "content": task},
            ],
            temperature=0.1,
            max_tokens=10,
        )

        selected = response.choices[0].message.content.strip()
        print(f"🔀 Routed to: {selected}")

        # 2. Execute with the selected model
        return self.models.get(selected, self.models["deepseek"]).invoke(
            [HumanMessage(content=task)]
        ).content

# Usage
router = MultiModelRouter()
print(router.route_and_execute("用Python写一个快速排序算法"))
print(router.route_and_execute("总结这篇3000字的论文"))
```

---

## Next Steps

- [RAG Getting Started Tutorial](/tutorials/rag-chinese-ai-models-guide/)
- [AI Agent Development](/tutorials/qwen-agent-bailian-guide/)

> 📝 Based on LangChain 0.3+ + Chinese AI models, June 2026.
