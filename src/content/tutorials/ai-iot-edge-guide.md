---
title: "Chinese AI Models for IoT Edge Computing: On-Device Inference, Smart Device Orchestration & Real-Time Monitoring with Qwen"
description: "Build IoT edge computing systems with Chinese AI models: on-device inference deployment, intelligent device orchestration, real-time anomaly detection, and MQTT messaging. Complete edge AI solutions using Qwen, DeepSeek on Jetson/RK3588 with cloud-edge collaboration."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["IoT", "Edge Computing", "On-Device Inference", "MQTT", "Jetson", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build AI-powered IoT edge computing systems:

- On-device AI inference deployment (Jetson/RK3588)
- Intelligent device orchestration rules
- Real-time anomaly detection
- Edge + cloud collaborative architecture

> 🎯 Camera-based local recognition → edge device decision-making → cloud aggregation and analysis. Latency drops from 500ms to 50ms.

---

## Edge AI Inference Engine

```python
import numpy as np
import time
import json

class EdgeInferenceEngine:
    """Edge AI inference engine"""

    def __init__(self, model_path: str, device: str = "cuda"):
        """
        Initialize the edge inference engine
        device: "cuda" (Jetson), "npu" (RK3588), "cpu"
        """
        self.device = device
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the model"""
        if self.device == "cuda":
            # Jetson Nano/Orin — using TensorRT
            import tensorrt as trt
            print(f"🚀 Loading model onto Jetson GPU...")
            # TensorRT engine loading
            # with open(f"{self.model_path}.engine", "rb") as f:
            #     engine_data = f.read()
            # runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
            # self.model = runtime.deserialize_cuda_engine(engine_data)

        elif self.device == "npu":
            # RK3588 — using RKNN
            from rknn.api import RKNN
            self.model = RKNN()
            self.model.load_rknn(f"{self.model_path}.rknn")
            self.model.init_runtime()
            print(f"🚀 Loading model onto RK3588 NPU...")

        else:
            # CPU — ONNX Runtime
            import onnxruntime as ort
            self.model = ort.InferenceSession(
                f"{self.model_path}.onnx",
                providers=["CPUExecutionProvider"],
            )
            print(f"🚀 Loading model onto CPU...")

    def infer(self, input_data: np.ndarray) -> dict:
        """Run inference"""
        start_time = time.time()

        if self.device == "cuda":
            output = self._infer_tensorrt(input_data)
        elif self.device == "npu":
            output = self._infer_rknn(input_data)
        else:
            output = self._infer_onnx(input_data)

        latency = (time.time() - start_time) * 1000

        return {
            "result": output,
            "latency_ms": round(latency, 1),
            "device": self.device,
            "timestamp": time.time(),
        }

    def _infer_onnx(self, input_data: np.ndarray):
        """ONNX Runtime inference"""
        input_name = self.model.get_inputs()[0].name
        return self.model.run(None, {input_name: input_data})

    def _infer_tensorrt(self, input_data: np.ndarray):
        """TensorRT inference"""
        pass  # TensorRT inference logic

    def _infer_rknn(self, input_data: np.ndarray):
        """RKNN inference"""
        return self.model.inference(inputs=[input_data])

# Usage
engine = EdgeInferenceEngine("yolov8s", device="cpu")
# result = engine.infer(np.random.randn(1, 3, 640, 640).astype(np.float32))
# print(f"Inference latency: {result['latency_ms']:.1f}ms")
```

---

## MQTT Device Communication

```python
import paho.mqtt.client as mqtt
import json
import time

class IoTMQTTBridge:
    """MQTT message bus — connects all IoT devices"""

    def __init__(self, broker: str = "localhost", port: int = 1883):
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.broker = broker
        self.port = port
        self.devices = {}  # Connected devices
        self.handlers = {}  # Message handlers

    def start(self):
        """Start MQTT"""
        self.client.connect(self.broker, self.port, 60)
        self.client.loop_start()
        print(f"📡 MQTT connected to {self.broker}:{self.port}")

    def _on_connect(self, client, userdata, flags, rc):
        print(f"✅ MQTT connection successful (rc={rc})")
        # Subscribe to all device status and telemetry
        client.subscribe("iot/+/status")    # Device status
        client.subscribe("iot/+/telemetry") # Telemetry data
        client.subscribe("iot/+/alert")     # Alerts

    def _on_message(self, client, userdata, msg):
        """Process device messages"""
        topic_parts = msg.topic.split("/")
        device_id = topic_parts[1]
        msg_type = topic_parts[2]

        try:
            payload = json.loads(msg.payload.decode())
        except:
            payload = msg.payload.decode()

        # Dispatch based on message type
        if msg_type == "telemetry":
            self._handle_telemetry(device_id, payload)
        elif msg_type == "alert":
            self._handle_alert(device_id, payload)
        elif msg_type == "status":
            self._handle_status(device_id, payload)

    def _handle_telemetry(self, device_id: str, data: dict):
        """Process telemetry data → AI anomaly detection"""
        # Temperature anomaly detection
        if "temperature" in data:
            if data["temperature"] > 80:
                self._send_command(device_id, {"action": "emergency_stop"})
                self._publish_alert(device_id, f"Temperature too high: {data['temperature']}°C")

    def _handle_alert(self, device_id: str, data: dict):
        """Process device alerts"""
        print(f"🚨 [{device_id}] {data.get('message', 'Unknown alert')}")

    def _handle_status(self, device_id: str, data: dict):
        """Update device status"""
        self.devices[device_id] = {
            **self.devices.get(device_id, {}),
            "status": data.get("status", "unknown"),
            "last_seen": time.time(),
        }

    def _send_command(self, device_id: str, command: dict):
        """Send a command to a device"""
        self.client.publish(
            f"iot/{device_id}/command",
            json.dumps(command),
            qos=1,
        )

    def _publish_alert(self, device_id: str, message: str):
        """Publish an alert"""
        alert = {
            "device_id": device_id,
            "message": message,
            "timestamp": time.time(),
            "severity": "critical" if "Emergency" in message else "warning",
        }
        self.client.publish("iot/alerts", json.dumps(alert), qos=2)
        print(f"🚨 Alert: {message}")

# Usage
mqtt_bridge = IoTMQTTBridge(broker="192.168.1.100")
mqtt_bridge.start()
```

---

## Smart Orchestration Rule Engine

```python
class SmartRuleEngine:
    """Intelligent device orchestration rule engine"""

    def __init__(self):
        self.rules = []
        self.client = client

    def add_rule(self, name: str, condition: str, actions: list[dict]):
        """Add an orchestration rule"""
        self.rules.append({
            "name": name,
            "condition": condition,
            "actions": actions,
            "enabled": True,
        })

    def evaluate_rules(self, device_states: dict, sensor_data: dict) -> list[dict]:
        """Evaluate all rules and trigger actions"""
        triggered = []

        for rule in self.rules:
            if not rule["enabled"]:
                continue

            # Evaluate condition
            if self._evaluate_condition(rule["condition"], device_states, sensor_data):
                triggered.append({
                    "rule": rule["name"],
                    "actions": rule["actions"],
                    "timestamp": time.time(),
                })

        return triggered

    def _evaluate_condition(self, condition: str, states: dict, sensors: dict) -> bool:
        """Evaluate a rule condition"""
        # Use AI to understand natural language conditions
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Determine whether the following condition is met. Output true or false.

Condition: {condition}

Device states: {json.dumps(states, ensure_ascii=False)}
Sensor data: {json.dumps(sensors, ensure_ascii=False)}

Output only true or false.""",
                },
            ],
            temperature=0,
            max_tokens=5,
        )
        return response.choices[0].message.content.strip().lower() == "true"

    def ai_generate_rules(self, scenario: str) -> list[dict]:
        """AI auto-generates orchestration rules"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate device orchestration rules for the following IoT scenario.

Scenario: {scenario}

Output JSON array:
[
  {{
    "name": "Rule name",
    "condition": "Trigger condition (in Chinese)",
    "actions": [
      {{"device": "Device name", "action": "Action", "params": {{}}}}
    ],
    "priority": "High/Medium/Low",
    "explanation": "Rule explanation"
  }}
]

Rule types:
- Safety (temperature too high → shutdown)
- Energy saving (no person detected → turn off lights)
- Convenience (door opens → lights on)
- Alerting (anomaly → notification)""",
                },
            ],
            temperature=0.5,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
rule_engine = SmartRuleEngine()

# Manually add rules
rule_engine.add_rule(
    "High-temperature shutdown protection",
    "Any device temperature exceeds 80 degrees",
    [{"device": "all", "action": "emergency_stop"}],
)

rule_engine.add_rule(
    "Unoccupied energy saving",
    "Office infrared sensor detects no person for over 10 minutes",
    [{"device": "lights", "action": "off"}, {"device": "ac", "action": "eco_mode"}],
)

# AI auto-generates rules
rules = rule_engine.ai_generate_rules("Smart factory workshop safety monitoring")
for rule in rules:
    print(f"📋 {rule['name']}: {rule['condition']} → {rule['actions']}")
```

---

## Real-Time Anomaly Detection

```python
class RealtimeAnomalyDetector:
    """Real-time anomaly detector"""

    def __init__(self, window_size: int = 100, threshold: float = 3.0):
        self.window_size = window_size
        self.threshold = threshold
        self.history = {}  # device_id → data window
        self.client = client

    def check_anomaly(self, device_id: str, metric: str, value: float) -> dict:
        """Check whether the current value is anomalous"""
        key = f"{device_id}:{metric}"

        if key not in self.history:
            self.history[key] = []

        self.history[key].append(value)

        # Maintain window size
        if len(self.history[key]) > self.window_size:
            self.history[key] = self.history[key][-self.window_size:]

        # Need sufficient baseline data
        if len(self.history[key]) < 20:
            return {"is_anomaly": False, "reason": "Insufficient baseline data"}

        # Z-Score anomaly detection
        data = np.array(self.history[key])
        mean = np.mean(data)
        std = np.std(data)

        if std == 0:
            return {"is_anomaly": False}

        z_score = abs(value - mean) / std

        if z_score > self.threshold:
            return {
                "is_anomaly": True,
                "z_score": round(z_score, 2),
                "current_value": value,
                "mean": round(mean, 2),
                "std": round(std, 2),
                "deviation": f"+{round((value - mean) / mean * 100, 1)}%" if value > mean else f"{round((value - mean) / mean * 100, 1)}%",
            }

        return {"is_anomaly": False}

    def ai_explain_anomaly(self, device_id: str, metric: str, context: dict) -> str:
        """AI explains the anomaly cause"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the device anomaly.

Device: {device_id}
Metric: {metric}
Anomaly data: {json.dumps(context, ensure_ascii=False)}

Provide:
1. Likely physical cause
2. Recommended inspection steps
3. Urgency assessment""",
                },
            ],
            temperature=0.3,
            max_tokens=500,
        )
        return response.choices[0].message.content

# Usage
detector = RealtimeAnomalyDetector()

# Simulate temperature data
for temp in [25, 26, 25, 27, 26, 25, 26, 25, 26, 85]:  # 85 is the anomaly
    result = detector.check_anomaly("sensor_01", "temperature", temp)
    if result["is_anomaly"]:
        print(f"⚠️ Anomaly detected: Z-Score={result['z_score']}, Deviation={result['deviation']}")
```

---

## Edge + Cloud Collaborative Architecture

```
Edge Layer (Local inference, low latency)
┌─────────────────────────┐
│  Jetson Orin / RK3588   │
│  ┌──────┐  ┌──────────┐ │
│  │Vision│  │ Sensor   │ │
│  │  AI  │  │ Analytics│ │
│  └──┬───┘  └─────┬────┘ │
│     └──────┬──────┘      │
│          MQTT            │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │   4G/5G/WiFi   │
    └───────┬────────┘
            │
Cloud Layer (Big data analytics, model updates)
┌───────────┴─────────────┐
│      Cloud Platform     │
│  ┌──────┐ ┌──────────┐ │
│  │ Data │ │  Model   │ │
│  │ Lake │ │ Training │ │
│  └──┬───┘ └────┬─────┘ │
│     └──────┬───┘        │
│         Dashboard       │
└─────────────────────────┘
```

---

## Next Steps

- [AI Search Engine](/tutorials/ai-search-engine-guide/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> 📝 Based on Jetson/RK3588 + MQTT + DeepSeek, June 2026.
