---
title: "DeepSeek Function Calling in Action: Building an AI Weather Assistant"
description: "Build an AI weather assistant with Function Calling from scratch. Understand the complete tool invocation workflow: defining tools, handling calls, returning results, and generating final responses."
category: "DeepSeek"
date: 2026-06-21
tags: ["DeepSeek", "Function Calling", "Python", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build a **complete AI weather assistant** from scratch that can:

- Understand natural language queries from users
- Automatically invoke weather APIs to fetch real-time data
- Generate friendly responses based on the data

> This tutorial is your first step toward understanding AI Agents. Function Calling is the cornerstone of AI application development.

## What Is Function Calling?

Function Calling enables AI to **use external tools**. Here is the workflow:

```
User: "What's the weather like in Beijing today?"
        ↓
AI determines: I need to call the get_weather function
        ↓
AI returns function call request: {name: "get_weather", args: {city: "Beijing"}}
        ↓
Your code executes the function → retrieves weather data
        ↓
Return the result to the AI
        ↓
AI: "Beijing is sunny today, 22°C, great for outdoor activities."
```

## Step 1: Define the Tool

```python
import os, json
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

# Define the get_weather tool
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Query the weather information for a specified city on the current day",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City name, in either Chinese or English"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["city"]
        }
    }
}]
```

## Step 2: Mock the Weather Query Function

```python
def get_weather(city: str, unit: str = "celsius") -> dict:
    """Mock weather query (use a real API in production)"""
    weather_data = {
        "Beijing": {"temp": 22, "condition": "Sunny", "humidity": 45},
        "Shanghai": {"temp": 28, "condition": "Cloudy", "humidity": 65},
        "Tokyo": {"temp": 25, "condition": "Light Rain", "humidity": 70},
        "Hangzhou": {"temp": 30, "condition": "Sunny", "humidity": 55},
    }

    data = weather_data.get(city, {"temp": 20, "condition": "Unknown", "humidity": 50})
    if unit == "fahrenheit":
        data["temp"] = data["temp"] * 9 / 5 + 32

    data["city"] = city
    data["unit"] = unit
    return data
```

## Step 3: Build the Complete Assistant

```python
def chat_with_weather_assistant(user_query: str) -> str:
    messages = [{"role": "user", "content": user_query}]

    # First call: AI decides whether a tool is needed
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        extra_body={"thinking_mode": "thinking"},
    )

    msg = response.choices[0].message

    # If the AI does not need a tool, return the content directly
    if not msg.tool_calls:
        return msg.content

    # Process each tool call
    for tool_call in msg.tool_calls:
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        print(f"Tool invoked: {func_name}")
        print(f"Arguments: {func_args}")

        # Execute the function
        if func_name == "get_weather":
            result = get_weather(**func_args)

        # Return the execution result to the AI
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        })

    # Second call: AI generates the final response based on tool results
    final_response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=messages,
    )

    return final_response.choices[0].message.content


# Test
print(chat_with_weather_assistant("What's the weather like in Beijing today?"))
print(chat_with_weather_assistant("Which city is hotter, Shanghai or Hangzhou?"))
```

## Full Workflow Walkthrough

### Input: "Which city is hotter, Shanghai or Hangzhou?"

```
1st API call:
  → AI returns: need to call get_weather("Shanghai") and get_weather("Hangzhou")

Code executes get_weather → retrieves weather data for both cities

2nd API call (with weather data):
  → AI returns: "Hangzhou (30°C) is 2 degrees hotter than Shanghai (28°C).
             Shanghai has higher humidity (65% vs 55%), so it may feel similar.
             Neither city has rain today — great for going out."
```

<div class="callout callout-tip">
<strong>Key Insight</strong>: The AI not only compared temperatures, but also factored in humidity and weather conditions when giving advice. This is the value of Function Calling — the AI gains access to real data and no longer fabricates answers.
</div>

## Advanced: Defining Multiple Tools

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Query weather information",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Query the latest news",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string"},
                    "count": {"type": "integer", "default": 3}
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    }
]
```

## Frequently Asked Questions (FAQ)

### Q: When should I use Function Calling?

**A**: Use it when the AI needs access to real-time data (weather, stocks, news), needs to perform actions (send emails, create files), or needs to invoke your business logic.

### Q: How detailed should tool definitions be?

**A**: The more detailed, the better. The `description` field for each parameter directly affects whether the AI can invoke the function correctly. Use natural language to describe what each parameter should be.

## Next Steps

- [DeepSeek API Getting Started Guide](/tutorials/deepseek-api-beginner-guide/)
- [China AI Model Ultimate Comparison](/tutorials/china-ai-model-comparison-2026/)

> Tutorial version note: Based on DeepSeek V4 API, verified working as of June 2026.
