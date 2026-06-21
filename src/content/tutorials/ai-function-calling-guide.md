---
title: "Chinese AI Function Calling: Tool Definitions, Multi-Function Orchestration & Streaming with DeepSeek/Qwen/GLM"
description: "Master AI function calling with Chinese AI models: OpenAI-compatible tool_choice configuration, multi-function auto-orchestration, streaming function calls, and error fallback strategies. Includes DeepSeek/Qwen/GLM tool calling best practices."
category: "API Tutorials"
date: 2026-06-20
tags: ["Function Calling", "Tools", "OpenAI", "API", "Orchestration", "Expert"]
level: "Expert"
---

## What Problem Does This Tutorial Solve?

You will fully master AI function calling:

- Defining and registering tool functions
- Multi-function auto-orchestration
- Streaming function calls
- Error handling and fallback strategies

> 🎯 "Check the weather for Hangzhou tomorrow. If it rains, book me an indoor badminton court." — The AI automatically calls in sequence: check weather → judge rain → search courts → book. That's the power of function calling.

---

## Function Definition and Registration

```python
from openai import OpenAI
import json

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

class FunctionRegistry:
    """Function registration center"""

    def __init__(self):
        self.tools = []
        self.function_map = {}  # function_name → actual function

    def register(self, func: callable, description: str, parameters: dict):
        """Register a tool function"""
        tool_def = {
            "type": "function",
            "function": {
                "name": func.__name__,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": parameters,
                    "required": list(parameters.keys()),
                    "additionalProperties": False,
                },
            },
        }
        self.tools.append(tool_def)
        self.function_map[func.__name__] = func
        return self

    def call_function(self, name: str, arguments: dict):
        """Execute a registered function"""
        func = self.function_map.get(name)
        if not func:
            return {"error": f"Function {name} not found"}
        try:
            result = func(**arguments)
            return result
        except Exception as e:
            return {"error": str(e)}

# --- Define actual functions ---

def get_weather(city: str, date: str = "today") -> dict:
    """Get weather information (simulated)"""
    # In production, call a real weather API
    weather_data = {
        "Hangzhou": {"today": {"weather": "Overcast turning to light rain", "temp_min": 22, "temp_max": 28, "humidity": 80, "wind": "NE wind level 3"}},
        "Beijing": {"today": {"weather": "Clear", "temp_min": 18, "temp_max": 32, "humidity": 35, "wind": "S wind level 2"}},
        "Default": {"today": {"weather": "Partly cloudy", "temp_min": 20, "temp_max": 30, "humidity": 60, "wind": "Light breeze"}},
    }
    city_data = weather_data.get(city, weather_data["Default"])
    return city_data.get(date, city_data["today"])

def search_venues(city: str, venue_type: str, date: str) -> list[dict]:
    """Search for venues (simulated)"""
    venues = {
        "Hangzhou": {
            "Badminton": [
                {"name": "West Lake Sports Center", "address": "Xihu District, Tiyuchang Road", "price_per_hour": 60, "available_slots": ["10:00-12:00", "14:00-16:00"]},
                {"name": "Binjiang Sports Complex", "address": "Binjiang District, Jiangnan Avenue", "price_per_hour": 80, "available_slots": ["09:00-11:00", "15:00-17:00"]},
            ]
        }
    }
    city_venues = venues.get(city, {}).get(venue_type, [])
    return city_venues

def book_venue(venue_name: str, date: str, time_slot: str, contact_phone: str) -> dict:
    """Book a venue (simulated)"""
    # In production, call a venue booking API
    booking_id = f"BK-{hash(venue_name + date + time_slot) % 10000:04d}"
    return {
        "booking_id": booking_id,
        "venue": venue_name,
        "date": date,
        "time_slot": time_slot,
        "status": "Confirmed",
        "contact_phone": contact_phone,
    }

# Register all functions
registry = FunctionRegistry()
registry.register(
    get_weather,
    "Query weather conditions for a specified city and date",
    {
        "city": {"type": "string", "description": "City name, e.g. 'Hangzhou', 'Beijing'"},
        "date": {"type": "string", "description": "Date, e.g. 'today', 'tomorrow', '2026-06-20'"},
    },
).register(
    search_venues,
    "Search for sports venues by city and type",
    {
        "city": {"type": "string", "description": "City name"},
        "venue_type": {"type": "string", "description": "Venue type, e.g. 'Badminton', 'Basketball', 'Swimming'"},
        "date": {"type": "string", "description": "Date"},
    },
).register(
    book_venue,
    "Book a venue",
    {
        "venue_name": {"type": "string", "description": "Venue name"},
        "date": {"type": "string", "description": "Booking date"},
        "time_slot": {"type": "string", "description": "Time slot"},
        "contact_phone": {"type": "string", "description": "Contact phone number"},
    },
)

print(f"Registered {len(registry.tools)} tool functions")
```

---

## Multi-Function Orchestration

```python
class FunctionCallingOrchestrator:
    """AI function calling orchestrator"""

    def __init__(self, registry: FunctionRegistry):
        self.registry = registry
        self.client = client

    def run(self, user_message: str, max_rounds: int = 5) -> dict:
        """Execute a function calling conversation"""
        messages = [
            {
                "role": "system",
                "content": "You are an intelligent assistant that can call functions to help users. Based on user needs, select appropriate functions and call them in the correct order.",
            },
            {"role": "user", "content": user_message},
        ]

        function_calls_log = []

        for round_num in range(max_rounds):
            response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=messages,
                tools=self.registry.tools,
                tool_choice="auto",  # Let AI auto-decide whether to call functions
            )

            message = response.choices[0].message

            # If AI does not need to call any function, return the final reply
            if not message.tool_calls:
                return {
                    "final_answer": message.content,
                    "function_calls": function_calls_log,
                    "rounds": round_num + 1,
                }

            # Process function calls
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in message.tool_calls
                ],
            })

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)

                print(f"🔧 Calling function: {func_name}({arguments})")

                result = self.registry.call_function(func_name, arguments)

                function_calls_log.append({
                    "function": func_name,
                    "arguments": arguments,
                    "result": result,
                })

                # Return function result to the AI
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, ensure_ascii=False),
                })

        return {
            "final_answer": "Max rounds reached; task may be incomplete",
            "function_calls": function_calls_log,
            "rounds": max_rounds,
        }

    def parallel_calls(self, user_message: str) -> dict:
        """Parallel function calling — call multiple independent functions simultaneously"""
        messages = [
            {
                "role": "system",
                "content": "You can call multiple independent functions simultaneously to speed up the task. Independent queries should be executed in parallel.",
            },
            {"role": "user", "content": user_message},
        ]

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=messages,
            tools=self.registry.tools,
            tool_choice="auto",
        )

        message = response.choices[0].message
        results = []

        if message.tool_calls:
            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)
                result = self.registry.call_function(func_name, arguments)
                results.append({"function": func_name, "arguments": arguments, "result": result})

        return {"parallel_calls": len(results), "results": results}

# Usage
orchestrator = FunctionCallingOrchestrator(registry)

# Full orchestration: check weather → judge → search → book
result = orchestrator.run("Check the weather for Hangzhou tomorrow. If it rains, book me an indoor badminton court. My phone is 13800138000")

print(f"\nFinal answer: {result['final_answer']}")
print(f"Total rounds: {result['rounds']}")
print("Function call chain:")
for call in result["function_calls"]:
    print(f"  → {call['function']}({call['arguments']})")
```

---

## Streaming Function Calls

```python
class StreamingFunctionCalling:
    """Streaming function calling"""

    def stream_with_tools(self, messages: list[dict]):
        """Streaming output + function calling"""
        stream = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=messages,
            tools=registry.tools,
            tool_choice="auto",
            stream=True,
        )

        # Accumulate function call arguments
        tool_calls_buffer = {}
        content_buffer = []

        for chunk in stream:
            delta = chunk.choices[0].delta

            # Normal text stream
            if delta.content:
                content_buffer.append(delta.content)
                print(delta.content, end="", flush=True)

            # Function call stream (arrives in chunks)
            if delta.tool_calls:
                for tc_delta in delta.tool_calls:
                    idx = tc_delta.index

                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {
                            "id": tc_delta.id or "",
                            "function_name": "",
                            "arguments": "",
                        }

                    if tc_delta.id:
                        tool_calls_buffer[idx]["id"] = tc_delta.id
                    if tc_delta.function and tc_delta.function.name:
                        tool_calls_buffer[idx]["function_name"] += tc_delta.function.name
                    if tc_delta.function and tc_delta.function.arguments:
                        tool_calls_buffer[idx]["arguments"] += tc_delta.function.arguments

        return {
            "content": "".join(content_buffer),
            "tool_calls": list(tool_calls_buffer.values()),
        }

    def handle_stream_tool_calls(self, messages: list[dict], max_rounds: int = 5) -> str:
        """Complete streaming function call handling"""
        for _ in range(max_rounds):
            result = self.stream_with_tools(messages)

            # If no function calls, return the text
            if not result["tool_calls"]:
                return result["content"]

            # Process function calls
            messages.append({
                "role": "assistant",
                "content": result["content"] or None,
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["function_name"], "arguments": tc["arguments"]},
                    }
                    for tc in result["tool_calls"]
                ],
            })

            for tc in result["tool_calls"]:
                args = json.loads(tc["arguments"])
                func_result = registry.call_function(tc["function_name"], args)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(func_result, ensure_ascii=False),
                })

        return "Max rounds reached"

# Usage
streaming = StreamingFunctionCalling()
```

---

## Function Calling Error Handling

```python
class RobustFunctionCalling:
    """Robust function calling — handle various edge cases"""

    def __init__(self, registry: FunctionRegistry):
        self.registry = registry

    def safe_call(self, func_name: str, arguments: str, max_retries: int = 3) -> dict:
        """Safe function calling — auto retry + error recovery"""
        for attempt in range(max_retries):
            try:
                # 1. Parse arguments
                try:
                    args_dict = json.loads(arguments) if isinstance(arguments, str) else arguments
                except json.JSONDecodeError:
                    # Let the AI regenerate parameters
                    fixed = self._ai_fix_arguments(func_name, arguments)
                    if fixed:
                        args_dict = fixed
                    else:
                        return {"error": "Parameter format error, unable to repair"}

                # 2. Validate arguments
                validation = self._validate_args(func_name, args_dict)
                if not validation["valid"]:
                    # Let the AI fix parameters
                    args_dict = self._ai_fix_validation(func_name, args_dict, validation["issues"])

                # 3. Execute function
                result = self.registry.call_function(func_name, args_dict)

                # 4. Validate result
                if isinstance(result, dict) and "error" in result:
                    raise Exception(result["error"])

                return result

            except Exception as e:
                if attempt == max_retries - 1:
                    return {"error": f"Function {func_name} call failed (retried {max_retries} times): {str(e)}"}
                print(f"⚠️ Attempt {attempt+1} failed: {e}, retrying...")

    def _ai_fix_arguments(self, func_name: str, broken_args: str) -> dict:
        """Let the AI fix malformed parameters"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Fix the JSON arguments for the following function call.

Function name: {func_name}
Broken arguments: {broken_args}

Output the fixed valid JSON object directly, with no additional explanation.""",
                },
            ],
            temperature=0,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return None

    def _validate_args(self, func_name: str, args: dict) -> dict:
        """Validate function parameters"""
        # Look up the function's parameter definition
        tool_def = next((t for t in self.registry.tools if t["function"]["name"] == func_name), None)
        if not tool_def:
            return {"valid": False, "issues": ["Function not found"]}

        issues = []
        required = tool_def["function"]["parameters"].get("required", [])
        properties = tool_def["function"]["parameters"].get("properties", {})

        for param in required:
            if param not in args:
                issues.append(f"Missing required parameter: {param}")

        for param, value in args.items():
            if param in properties:
                expected_type = properties[param].get("type")
                actual_type = type(value).__name__
                # Simplified type checking
                type_map = {"string": str, "number": (int, float), "integer": int, "boolean": bool}
                expected = type_map.get(expected_type)
                if expected and not isinstance(value, expected):
                    issues.append(f"Parameter {param} type error: expected {expected_type}, got {actual_type}")

        return {"valid": len(issues) == 0, "issues": issues}

    def _ai_fix_validation(self, func_name: str, args: dict, issues: list[str]) -> dict:
        """Let the AI fix parameters that failed validation"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Fix the parameter issues for the function call.

Function: {func_name}
Current parameters: {json.dumps(args, ensure_ascii=False)}
Issues: {json.dumps(issues, ensure_ascii=False)}

Output the fixed valid JSON object directly.""",
                },
            ],
            temperature=0,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return args

# Usage
robust = RobustFunctionCalling(registry)
result = robust.safe_call("get_weather", '{"city": "Hangzhou"}')
print(f"Safe call result: {result}")
```

---

## Function Calling Comparison Across Models

| Feature | DeepSeek | Qwen | GLM | Kimi |
|------|----------|------|-----|------|
| tool_choice: auto | ✅ | ✅ | ✅ | ✅ |
| tool_choice: required | ✅ | ✅ | ✅ | ✅ |
| Parallel calls | ✅ | ✅ | ✅ | ✅ |
| Streaming + functions | ✅ | ✅ | Partial | ✅ |
| strict mode | No | No | No | No |

---

## Next Steps

- [Advanced Prompt Engineering](/tutorials/ai-prompt-engineering-advanced/)
- [Model Deployment Optimization](/tutorials/ai-model-deployment-optimization/)

> 📝 Based on OpenAI Function Calling compatible protocol + DeepSeek, June 2026.
