---
title: "Smart Agriculture with Chinese AI: Pest Recognition, Yield Prediction & Intelligent Irrigation Using DeepSeek Vision"
description: "Build smart agriculture systems with Chinese AI models: crop pest and disease image recognition, yield prediction, soil analysis, intelligent irrigation decisions, and AI-powered agricultural product grading. Complete solution with IoT sensors and DeepSeek vision capabilities."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Agriculture", "Pests", "Yield Prediction", "Irrigation", "IoT", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will use AI to empower agriculture:

- Crop pest and disease image recognition
- Yield prediction
- Intelligent irrigation decisions
- Automated agricultural product grading

> Take a photo of a leaf with your phone -> AI immediately identifies the pest/disease -> provides a treatment plan. AI that even farmers can use.

---

## Pest and Disease Recognition

```python
import base64
import os

class CropDiseaseDetector:
    """AI-powered crop pest and disease recognition"""

    DISEASE_KNOWLEDGE = {
        "Rice": ["Rice blast", "Sheath blight", "Bacterial leaf blight", "Brown planthopper", "Rice stem borer"],
        "Wheat": ["Fusarium head blight", "Rust", "Powdery mildew", "Aphids", "Wheat midge"],
        "Corn": ["Corn borer", "Northern leaf blight", "Gray leaf spot", "Aphids"],
        "Tomato": ["Late blight", "Early blight", "Leaf mold", "Whitefly"],
        "Apple": ["Ring rot", "Anthracnose", "Fruit borer", "Red spider mite"],
    }

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

    def diagnose_from_image(self, image_path: str, crop_type: str = "Unknown") -> dict:
        """Diagnose pests and diseases from an image"""
        with open(image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()

        # Use multimodal model for recognition
        # Note: DeepSeek text-only models do not support images; use Qwen-VL/GLM-4V etc. for production deployment
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an agricultural plant protection expert. Diagnose pests and diseases based on image descriptions.

Crop type: {crop_type}

Output JSON:
{{
  "diagnosis": {{
    "disease_name": "Pest or disease name",
    "confidence": "Confidence level (High/Medium/Low)",
    "symptoms": ["Observed symptoms"],
    "severity": "Mild/Moderate/Severe",
    "affected_area_percent": "Estimated percentage of affected area"
  }},
  "treatment": {{
    "chemical": "Chemical control plan (product name + concentration + dosage)",
    "biological": "Biological control plan",
    "cultural": "Cultural control measures",
    "application_method": "Application method",
    "safety_interval_days": "Pre-harvest interval (days)"
  }},
  "prevention": ["Preventive measures"],
  "urgent_action": "Whether immediate treatment is needed",
  "yield_impact": "Estimated yield impact"
}}

Notes:
- Use generic names registered in China for pesticides
- Treatment plans must specify concentration and dosage
- Mark the pre-harvest interval (days before harvest to stop pesticide use)""",
                },
                {"role": "user", "content": f"Please diagnose based on the following information. Leaves show yellow-brown spots with irregular edges, white mold layer on the underside. Recent weather has been rainy and humid."},
            ],
            temperature=0.2,
            max_tokens=1500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"error": "Diagnosis failed"}

    def text_diagnose(self, symptoms_desc: str, crop_type: str, recent_weather: str = "") -> dict:
        """Diagnose based on text description (no image needed)"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an agricultural plant protection expert. Diagnose pests and diseases based on symptom descriptions.

Crop: {crop_type}
Symptoms: {symptoms_desc}
Recent weather: {recent_weather}

Output JSON:
{{
  "possible_diseases": [
    {{
      "name": "Pest or disease name (with scientific name)",
      "probability": "Likelihood (High/Medium/Low)",
      "matching_symptoms": ["Matching symptoms"],
      "distinguishing_features": "Distinguishing characteristics",
      "image_reference": "Features to confirm by taking photos"
    }}
  ],
  "most_likely": "Most likely pest or disease",
  "immediate_action": "Immediate measures to take",
  "need_expert": true/false
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

# Usage
detector = CropDiseaseDetector()

diagnosis = detector.text_diagnose(
    symptoms_desc="Leaves show water-soaked spots that gradually expand into brown necrotic lesions with yellow halos. White mold appears on lesions under high humidity.",
    crop_type="Tomato",
    recent_weather="5 consecutive days of rain, temperature 25-30°C, humidity above 90%",
)

print(f"Most likely disease: {diagnosis.get('most_likely')}")
for disease in diagnosis.get("possible_diseases", []):
    print(f"{disease['name']} — Likelihood: {disease['probability']}")
    print(f"   Distinguishing features: {disease.get('distinguishing_features')}")
```

---

## Yield Prediction

```python
class YieldPredictor:
    """AI yield prediction"""

    def predict_yield(self, crop: str, field_data: dict, weather_forecast: dict) -> dict:
        """Predict crop yield"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Predict crop yield.

Crop: {crop}
Field data: {json.dumps(field_data, ensure_ascii=False)}
Weather forecast: {json.dumps(weather_forecast, ensure_ascii=False)}

Output JSON:
{{
  "yield_prediction": {{
    "per_mu_kg": "Estimated yield per mu (kg)",
    "total_ton": "Estimated total yield (tons)",
    "confidence_range": "Confidence interval (e.g., ±15%)",
    "compared_to_last_year": "Compared to last year (+X%)",
    "compared_to_avg": "Compared to 5-year average"
  }},
  "key_factors": [
    {{
      "factor": "Factor",
      "impact": "Positive/Negative",
      "magnitude": "Impact level (Large/Medium/Small)",
      "explanation": "Explanation"
    }}
  ],
  "risks": ["Yield risk factors"],
  "optimal_harvest_date": "Optimal harvest date",
  "quality_prediction": "Quality prediction (Excellent/Good/Fair/Poor)"
}}

Consider:
- Fertilizer amount, irrigation volume, planting density
- Accumulated temperature, sunlight, rainfall
- Soil fertility indicators""",
                },
            ],
            temperature=0.2,
            max_tokens=1200,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
predictor = YieldPredictor()

field = {
    "area_mu": 50,  # 50 mu
    "variety": "Longjing 31",
    "planting_date": "2026-05-15",
    "fertilizer_kg_per_mu": 25,
    "irrigation_times": 8,
    "soil_organic_matter": "2.8%",
    "previous_year_yield_kg_per_mu": 580,
}

weather = {
    "next_30_days": "Alternating sun and rain, temperature 20-32°C, 2 moderate rain events expected",
    "accumulated_temp": "Sufficient",
    "frost_risk": "Low",
}

prediction = predictor.predict_yield("Rice", field, weather)
print(f"Predicted yield per mu: {prediction.get('yield_prediction', {}).get('per_mu_kg')} kg/mu")
print(f"Total yield: {prediction.get('yield_prediction', {}).get('total_ton')} tons")

for factor in prediction.get("key_factors", []):
    emoji = "+" if factor["impact"] == "Positive" else "-"
    print(f"  {emoji} {factor['factor']}: {factor['explanation']}")
```

---

## Intelligent Irrigation Decisions

```python
class SmartIrrigation:
    """AI intelligent irrigation"""

    def decide_irrigation(
        self,
        crop: str,
        soil_moisture: float,
        weather_forecast: str,
        growth_stage: str,
    ) -> dict:
        """Decide whether and how much to irrigate"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Make an irrigation decision.

Crop: {crop}
Soil moisture: {soil_moisture}%
Weather forecast: {weather_forecast}
Growth stage: {growth_stage}

Output JSON:
{{
  "irrigate": true/false,
  "amount_mm": Irrigation amount (mm),
  "duration_minutes": Irrigation duration,
  "best_time": "Optimal irrigation time",
  "method": "Drip/Sprinkler/Flood",
  "reason": "Decision rationale",
  "next_check_hours": Interval until next check (hours),
  "water_saving_tip": "Water-saving suggestion"
}}

Optimal moisture by crop and stage:
- Rice tillering stage: 80-90%
- Wheat grain filling: 65-75%
- Corn tasseling: 70-80%
- Tomato fruiting: 65-75%
- Cotton boll stage: 60-70%""",
                },
            ],
            temperature=0.1,
            max_tokens=600,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def plan_weekly_irrigation(self, crop: str, weather_week: list[dict], growth_stage: str) -> list[dict]:
        """Create a weekly irrigation plan"""
        weather_text = json.dumps(weather_week, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Create a weekly irrigation plan.

Crop: {crop}
Weekly weather: {weather_text}
Growth stage: {growth_stage}

Output JSON array (one entry per day):
[
  {{
    "date": "Date",
    "irrigate": true/false,
    "amount_mm": Irrigation amount,
    "best_time": "Best time window",
    "note": "Notes"
  }}
]

Principles:
- No irrigation on rainy days
- Irrigate morning or evening on hot days
- Adjust water volume based on growth stage""",
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
irrigation = SmartIrrigation()

decision = irrigation.decide_irrigation(
    crop="Corn",
    soil_moisture=55,
    weather_forecast="Sunny turning partly cloudy tomorrow, high of 35°C, thunderstorms the day after",
    growth_stage="Tasseling",
)

print(f"Irrigate: {'Yes, needed' if decision.get('irrigate') else 'No, not needed'}")
print(f"Irrigation amount: {decision.get('amount_mm')}mm")
print(f"Best time: {decision.get('best_time')}")
print(f"Reason: {decision.get('reason')}")
```

---

## AI Agricultural Product Grading

```python
class ProduceGrader:
    """AI agricultural product grading"""

    GRADE_STANDARDS = {
        "Apple": {
            "Premium": "Diameter >= 80mm, well-shaped, color coverage >= 90%, no blemishes",
            "Grade 1": "Diameter >= 70mm, fairly well-shaped, color coverage >= 70%, minor blemishes < 5%",
            "Grade 2": "Diameter >= 60mm, color coverage >= 50%, blemishes < 15%",
        },
        "Tomato": {
            "Premium": "Well-shaped, uniform color, single fruit >= 200g, no cracking",
            "Grade 1": "Fairly well-shaped, mostly uniform color, single fruit >= 150g",
            "Grade 2": "Basically normal shape, single fruit >= 100g",
        },
    }

    def grade_batch(self, product: str, samples: list[dict]) -> dict:
        """Grade a batch of agricultural products"""
        samples_text = json.dumps(samples, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Grade {product} products.

Sample data: {samples_text}

Grading standards:
{json.dumps(self.GRADE_STANDARDS.get(product, {}), ensure_ascii=False)}

Output JSON:
{{
  "grade_distribution": {{
    "Premium": {{"count": quantity, "percentage": share}},
    "Grade 1": {{"count": quantity, "percentage": share}},
    "Grade 2": {{"count": quantity, "percentage": share}},
    "Substandard": {{"count": quantity, "percentage": share}}
  }},
  "overall_quality": "Overall quality assessment",
  "price_suggestion": {{
    "Premium": "Suggested price (CNY/kg)",
    "Grade 1": "Suggested price (CNY/kg)",
    "Grade 2": "Suggested price (CNY/kg)"
  }},
  "issues": ["Quality issues found"],
  "improvement_suggestions": ["Planting/harvesting/storage recommendations"]
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
grader = ProduceGrader()

samples = [
    {"weight_g": 250, "diameter_mm": 85, "color_score": 9, "defects": "None"},
    {"weight_g": 200, "diameter_mm": 75, "color_score": 7, "defects": "1 minor scratch"},
    {"weight_g": 180, "diameter_mm": 70, "color_score": 6, "defects": "2 sunburn spots"},
    {"weight_g": 300, "diameter_mm": 90, "color_score": 10, "defects": "None"},
]

result = grader.grade_batch("Apple", samples)
print("Grading results:")
for grade, data in result.get("grade_distribution", {}).items():
    print(f"  {grade}: {data['count']} pcs ({data['percentage']})")

print(f"\nPrice suggestions:")
for grade, price in result.get("price_suggestion", {}).items():
    print(f"  {grade}: {price}")
```

---

## Common Sensors for Agricultural AI

```
+------------------------------------------+
|       Smart Farm Sensor Network          |
+-------------------+----------------------+
| Soil Moisture     | Capacitive / TDR     |
| Soil Temperature  | DS18B20              |
| Air Temp/Humidity | SHT30 / DHT22        |
| Light Intensity   | BH1750               |
| CO2 Concentration | MH-Z19               |
| Rainfall          | Tipping bucket gauge |
| Wind Speed/Dir    | Ultrasonic anemometer|
| Leaf Wetness      | Leaf wetness sensor  |
| Camera            | Pest ID / Growth monitoring |
+-------------------+----------------------+
Data transmission: LoRa / 4G Cat.1 -> Cloud Platform -> AI Analysis
```

---

## Next Steps

- [AI IoT Edge Computing](/tutorials/ai-iot-edge-guide/)
- [AI Medical Health](/tutorials/ai-medical-healthcare-guide/)

> Based on DeepSeek + IoT Sensors + Vision AI, June 2026.
