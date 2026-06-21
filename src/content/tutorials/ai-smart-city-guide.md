---
title: "Chinese AI for Smart Cities: Traffic Prediction, Public Safety & Environmental Monitoring with DeepSeek/Qwen"
description: "Build smart city applications with Chinese AI models: real-time traffic flow prediction, public safety incident detection, environmental quality monitoring, and intelligent urban governance dispatch. Includes urban big data and DeepSeek complete solution."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Smart City", "Traffic", "Public Safety", "Environment", "Governance", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will use AI to empower city management:

- Traffic flow prediction and signal light optimization
- Public safety incident intelligent detection
- Environmental quality monitoring and early warning
- Urban governance intelligent dispatch

> 🎯 During morning rush hour, congestion begins on a certain road segment → AI predicts it 10 minutes in advance → automatically adjusts signal timing → congestion reduced by 30%.

---

## Traffic Flow Prediction

```python
class TrafficPredictor:
    """AI traffic flow prediction and optimization"""

    def __init__(self):
        self.client = client

    def predict_congestion(self, road_segments: list[dict], time_slots: int = 24) -> dict:
        """Predict congestion conditions for each road segment over the next 24 hours"""
        segments_text = json.dumps(road_segments, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Predict traffic flow for the next {time_slots} hours.

Segment data: {segments_text}

Output JSON:
{{
  "predictions": [
    {{
      "segment_id": "Segment ID",
      "hourly_forecast": [
        {{"hour": "08:00-09:00", "congestion_level": "Free-flow/Slow/Congested/Severely Congested", "avg_speed_kmh": Estimated speed, "confidence": "High/Medium/Low"}}
      ],
      "peak_hour": "Most congested time window",
      "suggested_detour": "Recommended detour route"
    }}
  ],
  "city_wide_summary": "City-wide traffic overview",
  "high_risk_areas": ["High-risk congestion zones"],
  "signal_timing_suggestions": ["Signal timing adjustment recommendations"]
}}

Factors to consider: historical data, weekday/weekend, weather, nearby events, school commute times""",
                },
            ],
            temperature=0.2,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def optimize_signal_timing(self, intersection: dict, traffic_flow: dict) -> dict:
        """Optimize traffic signal timing plan"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Optimize intersection signal timing plan.

Intersection info: {json.dumps(intersection, ensure_ascii=False)}
Directional traffic flow: {json.dumps(traffic_flow, ensure_ascii=False)}

Output JSON:
{{
  "current_cycle_seconds": Current cycle duration,
  "optimized_cycle_seconds": Optimized cycle duration,
  "phase_timing": [
    {{
      "phase": "Phase (direction)",
      "green_seconds": Green light duration,
      "yellow_seconds": Yellow light duration,
      "reason": "Justification for adjustment"
    }}
  ],
  "expected_improvement": "Expected improvement (wait time reduced by X%)",
  "pedestrian_consideration": "Pedestrian crossing considerations"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
traffic = TrafficPredictor()

segments = [
    {"id": "S001", "name": "Zhongshan Road (Renmin Ave - Jiefang Rd)", "current_speed": 35, "capacity": 60, "accident_risk": "Low"},
    {"id": "S002", "name": "Renmin Avenue (Zhongshan Rd - Jianshe Rd)", "current_speed": 15, "capacity": 60, "accident_risk": "Medium"},
]

prediction = traffic.predict_congestion(segments)
print(f"City-wide overview: {prediction.get('city_wide_summary')}")

for area in prediction.get("high_risk_areas", []):
    print(f"⚠️ High risk: {area}")
```

---

## Public Safety Detection

```python
class PublicSafetyMonitor:
    """AI public safety incident monitoring"""

    def analyze_social_media(self, posts: list[dict], city: str) -> dict:
        """Detect public safety events from social media"""
        posts_text = json.dumps(posts, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Detect public safety events in {city} from social media posts.

Posts: {posts_text[:8000]}

Output JSON:
{{
  "detected_events": [
    {{
      "type": "Fire/Traffic Accident/Mass Incident/Natural Disaster/Public Health/Other",
      "location": "Inferred location",
      "time": "Inferred time",
      "severity": "Severe/Moderate/Minor",
      "confidence": "Confidence level",
      "related_posts": ["Related post IDs"],
      "suggested_response": "Recommended response measures"
    }}
  ],
  "trending_concerns": ["Public safety concerns trending among citizens"],
  "false_alarm_risk": ["Events potentially being false alarms"],
  "overall_safety_level": "Overall safety level (Safe/Caution/Warning/Danger)"
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

    def emergency_response_plan(self, incident: dict) -> dict:
        """Generate emergency response plan"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate an emergency response plan for the following incident.

Incident: {json.dumps(incident, ensure_ascii=False)}

Output JSON:
{{
  "incident_level": "Level I (Extraordinarily Severe)/Level II (Severe)/Level III (Major)/Level IV (General)",
  "immediate_actions": ["Immediate actions to take (by priority)"],
  "departments_to_notify": ["Departments that need to be notified"],
  "evacuation_needed": true/false,
  "evacuation_plan": "Evacuation plan (if needed)",
  "resource_requirements": ["Required resources (ambulances, fire engines, police, etc.)"],
  "public_communication": "Public announcement template",
  "estimated_duration": "Estimated response duration",
  "recovery_plan": "Recovery plan"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
safety = PublicSafetyMonitor()

posts = [
    {"id": 1, "text": "There's so much smoke over near Zhongshan Road! Looks like something is on fire", "location": "Zhongshan Road", "time": "14:30"},
    {"id": 2, "text": "I can hear fire trucks, is there a fire on Zhongshan Road?", "location": "Near Zhongshan Road", "time": "14:32"},
]

events = safety.analyze_social_media(posts, "Hangzhou")
for event in events.get("detected_events", []):
    print(f"🚨 {event['type']} @ {event['location']} — Severity: {event['severity']}")
```

---

## Environmental Monitoring & Early Warning

```python
class EnvironmentMonitor:
    """AI environmental quality monitoring"""

    AQI_LEVELS = {
        (0, 50): ("Good", "Green", "Normal activities are fine"),
        (51, 100): ("Moderate", "Yellow", "Very few sensitive individuals should reduce outdoor activity"),
        (101, 150): ("Unhealthy for Sensitive Groups", "Orange", "Sensitive groups should reduce outdoor activity"),
        (151, 200): ("Unhealthy", "Red", "Reduce outdoor activity"),
        (201, 300): ("Very Unhealthy", "Purple", "Stop outdoor activity"),
        (301, 500): ("Hazardous", "Maroon", "Avoid all outdoor activity"),
    }

    def predict_aqi(self, current_data: dict, weather_forecast: dict, emission_sources: list[dict]) -> dict:
        """Predict air quality"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Predict air quality for the next 48 hours.

Current data: {json.dumps(current_data, ensure_ascii=False)}
Weather forecast: {json.dumps(weather_forecast, ensure_ascii=False)}
Emission sources: {json.dumps(emission_sources, ensure_ascii=False)}

Output JSON:
{{
  "hourly_aqi_forecast": [
    {{"hour": "Time", "aqi": Predicted AQI, "primary_pollutant": "Primary pollutant", "level": "Level"}}
  ],
  "peak_pollution_time": "Time of worst pollution",
  "health_advisory": "Health advisory",
  "emission_control_suggestions": ["Emission reduction suggestions"],
  "source_contribution": {{"Industry": "X%", "Traffic": "Y%", "Dust": "Z%"}}
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=1200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def analyze_water_quality(self, water_data: dict) -> dict:
        """Water quality analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze water quality data.

Water quality data: {json.dumps(water_data, ensure_ascii=False)}

Output JSON:
{{
  "quality_grade": "Class I/Class II/Class III/Class IV/Class V/Below Class V",
  "exceeded_indicators": ["Indicators exceeding standards and multiples"],
  "possible_sources": ["Possible pollution sources"],
  "treatment_suggestion": "Treatment recommendations",
  "drinkable": true/false,
  "ecological_impact": "Ecological impact assessment"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=600,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
env = EnvironmentMonitor()

aqi_pred = env.predict_aqi(
    current_data={"aqi": 120, "pm25": 85, "pm10": 110, "o3": 60, "no2": 40},
    weather_forecast={"wind": "Northeast wind 2 levels", "rain": "None", "temperature": "28-35°C"},
    emission_sources=[{"type": "Industry", "contribution": "40%"}, {"type": "Traffic", "contribution": "35%"}],
)

print(f"Peak pollution: {aqi_pred.get('peak_pollution_time')}")
print(f"Health advisory: {aqi_pred.get('health_advisory')}")
```

---

## Urban Governance Intelligent Dispatch

```python
class CityGovernanceDispatcher:
    """AI urban governance incident intelligent dispatch"""

    CATEGORIES = {
        "Road Damage": {"assign_to": "Municipal Engineering", "sla_hours": 48, "priority": "Medium"},
        "Streetlight Failure": {"assign_to": "Streetlight Management", "sla_hours": 24, "priority": "Medium"},
        "Garbage Accumulation": {"assign_to": "Sanitation Department", "sla_hours": 4, "priority": "High"},
        "Noise Disturbance": {"assign_to": "Urban Management Enforcement", "sla_hours": 2, "priority": "High"},
        "Illegal Street Vending": {"assign_to": "Urban Management Enforcement", "sla_hours": 4, "priority": "Medium"},
        "Fallen Trees": {"assign_to": "Landscaping Department", "sla_hours": 6, "priority": "High"},
        "Missing Manhole Cover": {"assign_to": "Municipal Engineering", "sla_hours": 2, "priority": "Urgent"},
        "Water Pipe Burst": {"assign_to": "Water Authority", "sla_hours": 2, "priority": "Urgent"},
    }

    def classify_and_dispatch(self, report: dict) -> dict:
        """AI classification and dispatch"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Classify and dispatch citizen-reported incidents.

Report content: {json.dumps(report, ensure_ascii=False)}
Existing categories: {json.dumps(self.CATEGORIES, ensure_ascii=False)}

Output JSON:
{{
  "category": "Incident category",
  "sub_category": "Subcategory",
  "urgency": "Urgent/High/Medium/Low",
  "assign_to": "Responsible department",
  "sla_hours": Resolution time limit (hours),
  "estimated_cost": "Estimated processing cost",
  "required_resources": ["Required resources"],
  "duplicate_check": "Is this a duplicate report (Yes/No/Suspected)",
  "duplicate_of": "Duplicate incident ID (if any)",
  "auto_reply": "Auto-reply template for the citizen"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=600,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_daily_report(self, events: list[dict], date: str) -> str:
        """Generate daily urban governance report"""
        events_text = json.dumps(events, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate the {date} urban governance daily report.

Incident data: {events_text}

Report contents:
1. Overall summary (total incidents, resolved, in progress, response rate)
2. Breakdown by category
3. Hotspot areas
4. Prominent issues
5. Response efficiency analysis
6. Key focus areas for tomorrow""",
                },
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        return response.choices[0].message.content

# Usage
dispatcher = CityGovernanceDispatcher()

report = {
    "citizen": "Mr. Zhang",
    "location": "Southeast corner of Zhongshan Rd & Renmin Ave intersection",
    "description": "There is a large pothole on the road, approximately 50cm in diameter and 20cm deep. Passing vehicles are swerving to avoid it — very dangerous.",
    "time": "2026-06-27 08:30",
    "photos": ["2 photos attached"],
}

dispatch = dispatcher.classify_and_dispatch(report)
print(f"Category: {dispatch.get('category')}")
print(f"Assigned to: {dispatch.get('assign_to')}")
print(f"Deadline: {dispatch.get('sla_hours')} hours")
print(f"Reply: {dispatch.get('auto_reply')}")
```

---

## Smart City Architecture

```
         ┌──────────────────────────────┐
         │    Urban Big Data Platform    │
         │  IoT Sensors + Cameras + 12345│
         └──────────────┬───────────────┘
                        ▼
    ┌───────────────────────────────────────┐
    │           AI City Brain               │
    │  ┌─────────┬─────────┬─────────┐     │
    │  │Traffic   │Safety    │Environ  │     │
    │  │Prediction│Detection │Monitor  │     │
    │  └────┬────┘└────┬────┘└────┬────┘     │
    │       └──────────┼──────────┘          │
    │                  ▼                     │
    │     Urban Governance Dispatch         │
    └──────────────────┬────────────────────┘
                       ▼
         ┌──────────────────────────────┐
         │  Response Dept Coordination   │
         │  Municipal + Sanitation +     │
         │  Urban Mgmt + Traffic         │
         └──────────────────────────────┘
```

---

## Next Steps

- [AI IoT Edge Computing](/tutorials/ai-iot-edge-guide/)
- [AI Energy Management](/tutorials/ai-energy-management/)

> 📝 Based on DeepSeek + Urban Big Data, June 2026.
