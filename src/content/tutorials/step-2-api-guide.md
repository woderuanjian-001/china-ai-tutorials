---
title: "Step-2 API In-Depth Guide: Trillion-Parameter MoE Model in Action"
description: "Complete Step-2 API tutorial from StepFun: comprehensive coverage of text, multimodal, and function calling. Includes complete calling code for Step-2-16K text model, Step-1V vision model, and Step-Audio speech model."
category: "API Tutorials"
date: 2026-06-27
tags: ["Step-2", "StepFun", "MoE", "Multimodal", "Function Calling", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will learn to use StepFun's trillion-parameter MoE large model:

- Step-2 text API calling
- Step-1V multimodal vision
- Step-Audio speech model
- Function Calling

> 🎯 StepFun is one of China's most mysterious AI companies. Step-2 is a trillion-parameter MoE model that performs exceptionally well across multiple Chinese benchmarks.

---

## Step-2 Text API

```python
from openai import OpenAI
import os

class Step2Client:
    """StepFun Step-2 API"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("STEP_API_KEY"),
            base_url="https://api.stepfun.com/v1",
        )

    def chat(
        self,
        prompt: str,
        model: str = "step-2-16k",
        system_prompt: str = None,
        temperature: float = 0.7,
    ) -> str:
        """Basic conversation"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=2048,
        )

        return response.choices[0].message.content

    def chat_stream(self, prompt: str, system_prompt: str = None):
        """Streaming conversation"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        stream = self.client.chat.completions.create(
            model="step-2-16k",
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end="", flush=True)
        print()

    def analyze_long_text(self, text: str, task: str) -> str:
        """Long-text analysis (16K context)"""
        response = self.client.chat.completions.create(
            model="step-2-16k",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a text analysis expert. Task: {task}",
                },
                {"role": "user", "content": text[:15000]},
            ],
            temperature=0.3,
            max_tokens=4096,
        )

        return response.choices[0].message.content

# Usage
step = Step2Client()

# Basic conversation
reply = step.chat(
    "Introduce StepFun's development history and core technologies",
    system_prompt="You are an expert knowledgeable about the AI industry",
)
print(reply)

# Long-text analysis
long_text = """[Insert a long article here]"""
analysis = step.analyze_long_text(long_text, "Summarize key viewpoints and extract critical data")
print(analysis)
```

---

## Step-1V Multimodal Vision

```python
class StepVision:
    """Step-1V vision model"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("STEP_API_KEY"),
            base_url="https://api.stepfun.com/v1",
        )

    def analyze_image(self, image_url: str, question: str = None) -> str:
        """Analyze an image"""
        response = self.client.chat.completions.create(
            model="step-1v-8k",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": question or "Please describe the content of this image in detail",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                },
            ],
            temperature=0.3,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    def compare_images(self, image_urls: list[str], question: str) -> str:
        """Compare two images"""
        content = [{"type": "text", "text": question}]
        for url in image_urls:
            content.append({
                "type": "image_url",
                "image_url": {"url": url},
            })

        response = self.client.chat.completions.create(
            model="step-1v-8k",
            messages=[{"role": "user", "content": content}],
            temperature=0.3,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    def ocr_image(self, image_url: str) -> str:
        """Image text recognition"""
        return self.analyze_image(
            image_url,
            question="Extract all text from this image, preserving the original format and order",
        )

# Usage
vision = StepVision()

# Image analysis
desc = vision.analyze_image(
    "https://example.com/chart.png",
    question="What data trends does this chart show?",
)
print(f"Chart analysis: {desc}")
```

---

## Function Calling

```python
import json

class StepFunctionCalling:
    """Step-2 Function Calling"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("STEP_API_KEY"),
            base_url="https://api.stepfun.com/v1",
        )

        # Define available functions
        self.functions = [
            {
                "type": "function",
                "function": {
                    "name": "search_database",
                    "description": "Search the product database",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search keyword"},
                            "category": {"type": "string", "enum": ["Electronics", "Clothing", "Food", "Books"]},
                            "max_price": {"type": "number"},
                            "sort_by": {"type": "string", "enum": ["price", "sales", "rating"]},
                        },
                        "required": ["query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "create_order",
                    "description": "Create an order",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "string"},
                            "quantity": {"type": "integer", "minimum": 1},
                            "address": {"type": "string"},
                        },
                        "required": ["product_id", "quantity", "address"],
                    },
                },
            },
        ]

    def agent_call(self, user_message: str, conversation_history: list = None) -> dict:
        """Agent conversation with function calling"""
        messages = conversation_history or []
        messages.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            model="step-2-16k",
            messages=messages,
            tools=self.functions,
            tool_choice="auto",
            temperature=0.3,
        )

        msg = response.choices[0].message

        # Check for function calls
        if msg.tool_calls:
            tool_call = msg.tool_calls[0]
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            # Execute function
            result = self._execute_function(function_name, arguments)

            # Return function result to model
            messages.append(msg)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

            second_response = self.client.chat.completions.create(
                model="step-2-16k",
                messages=messages,
            )

            return {
                "reply": second_response.choices[0].message.content,
                "function_called": function_name,
                "function_result": result,
            }

        return {"reply": msg.content, "function_called": None}

    def _execute_function(self, name: str, args: dict) -> str:
        """Simulate function call execution"""
        if name == "search_database":
            return f"Search results: found 5 items in {args.get('category', '')}, priced below {args.get('max_price', 'no limit')} yuan"
        elif name == "create_order":
            return f"Order created: product {args['product_id']} x{args['quantity']}, shipping to {args['address']}"
        return "Unknown operation"

# Usage
agent = StepFunctionCalling()

result = agent.agent_call("Find electronics under 500 yuan, sorted by rating")
print(f"Reply: {result['reply']}")
if result["function_called"]:
    print(f"Called: {result['function_called']}")
    print(f"Result: {result['function_result']}")
```

---

## Step-2 vs Other Models

| Dimension | Step-2-16K | DeepSeek-V3 | Qwen-Plus | GLM-4 |
|------|-----------|-------------|-----------|-------|
| Parameter Scale | ~1T MoE | 671B MoE | Unknown | Unknown |
| Context | 16K | 64K | 32K | 128K |
| Chinese Ability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Function Calling | ✅ | ✅ (Beta) | ✅ | ✅ |
| Multimodal | Step-1V | ❌ | ✅ | ✅ |
| Pricing | Medium | Very low | Medium | Medium |

---

## Model Selection Cheat Sheet

| Scenario | Recommended Model |
|------|---------|
| Conversation / Writing / Translation | step-2-16k |
| Image Understanding / OCR | step-1v-8k |
| Voice Interaction | step-audio |
| Function Calling / Agent | step-2-16k |
| Long Document Processing | step-2-16k |

---

## Next Steps

- [Zhipu GLM API Tutorial](/tutorials/glm-api-developer-guide/)
- [Qwen API Tutorial](/tutorials/qwen-api-developer-guide/)

> 📝 Based on StepFun Step series models, June 2026.
