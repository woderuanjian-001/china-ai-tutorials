---
title: "AI Healthcare with Chinese Models: Intelligent Triage, Medical Record Analysis & Health Management with DeepSeek"
description: "Build healthcare applications with Chinese AI models (DeepSeek, Qwen): intelligent preliminary triage, medical record structuring, health report interpretation, medication reminders. Includes medical AI compliance and safety guidelines."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Healthcare", "Health", "Consultation", "Medical Records", "AI in Medicine", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will use AI to build medical and health assistance applications:

- Intelligent preliminary symptom checking (symptoms to possible causes)
- Medical record and report structured extraction
- Health data trend analysis
- Medication reminders and management

> ⚠️ Important Notice: AI in healthcare is only an assistive tool and cannot replace professional medical diagnosis. All AI suggestions must be reviewed by a doctor.

---

## Intelligent Symptom Checker

```python
class AISymptomChecker:
    """AI symptom checker (reference only, not diagnosis)"""

    DISCLAIMER = "⚠️ This tool is AI-assisted reference only and does not constitute medical diagnosis. Please seek medical attention if you feel unwell."

    def __init__(self):
        self.client = client

    def symptom_analysis(self, symptoms: str, duration: str = "", age: str = "", gender: str = "") -> dict:
        """Symptom analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an AI health assistant (not a doctor). Provide reference information based on the user's described symptoms.

{f"Age: {age}" if age else ""}
{f"Gender: {gender}" if gender else ""}
Symptoms: {symptoms}
{f"Duration: {duration}" if duration else ""}

Output JSON:
{{
  "possible_causes": ["Possible cause 1 (probability High/Medium/Low)", "Possible cause 2"],
  "urgency": "Emergency/See a Doctor/Observable",
  "suggested_department": "Recommended department for appointment",
  "self_care_tips": ["Self-care suggestions (not medical advice)"],
  "when_to_see_doctor": ["Danger signs requiring immediate medical attention"],
  "questions_to_ask_doctor": ["3 questions to ask your doctor"]
}}

Important rules:
- Must state "For reference only, please consult a doctor"
- Do not give definitive diagnoses
- If danger signs are present, must emphasize seeking immediate medical attention""",
                },
                {"role": "user", "content": f"Symptoms: {symptoms}\nDuration: {duration}"},
            ],
            temperature=0.3,
            max_tokens=1024,
        )

        try:
            return {**json.loads(response.choices[0].message.content), "disclaimer": self.DISCLAIMER}
        except:
            return {"error": "Analysis failed", "disclaimer": self.DISCLAIMER}

    def emergency_check(self, symptoms: str) -> bool:
        """Emergency symptom detection"""
        emergency_keywords = [
            "chest pain", "difficulty breathing", "severe bleeding", "unconsciousness", "stroke",
            "severe headache", "persistent vomiting", "persistent high fever", "convulsions", "poisoning",
        ]

        for keyword in emergency_keywords:
            if keyword in symptoms:
                return True
        return False

# Usage
checker = AISymptomChecker()

if checker.emergency_check("chest pain difficulty breathing"):
    print("🚨 Emergency symptoms detected! Call emergency services immediately!")
else:
    result = checker.symptom_analysis(
        "headache and fever, temperature 38°C, sore throat",
        duration="2 days",
        age="30",
        gender="Male",
    )
    print(f"\nPossible causes: {result.get('possible_causes', [])}")
    print(f"Urgency: {result.get('urgency', 'Unknown')}")
    print(f"Suggested department: {result.get('suggested_department', 'Unknown')}")
    print(f"\n{result['disclaimer']}")
```

---

## Medical Record Structured Extraction

```python
class MedicalRecordExtractor:
    """Medical record and report AI structured extraction"""

    def extract_medical_report(self, text: str) -> dict:
        """Extract structured information from medical reports"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Extract key information from medical reports. Output JSON:
{
  "patient_info": {"name": "", "age": "", "gender": ""},
  "diagnosis": ["Diagnosis 1", "Diagnosis 2"],
  "test_results": [
    {"item": "Test item", "value": "Result value", "unit": "Unit", "reference": "Reference range", "is_abnormal": true}
  ],
  "medications": [
    {"name": "Medication name", "dosage": "Dosage", "frequency": "Frequency", "duration": "Course"}
  ],
  "doctor_notes": "Doctor's notes",
  "follow_up": "Follow-up recommendations"
}""",
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=2048,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"error": "Extraction failed"}

    def explain_report(self, report: dict) -> str:
        """Explain medical report in plain language"""
        simplified = json.dumps(report, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Explain medical reports in simple, easy-to-understand language. Requirements:
- Explain what abnormal indicators mean
- Describe the degree of deviation from normal values
- Give lifestyle suggestions (not medical advice)
- Emphasize "For reference only, please consult a doctor"
- Use a warm tone, do not create panic""",
                },
                {"role": "user", "content": simplified},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content

# Usage
extractor = MedicalRecordExtractor()

report_text = """
Patient: Zhang San, Male, 35 years old.
Diagnosis: Upper respiratory tract infection
Blood test: WBC 11.2x10^9/L (reference 4.0-10.0), Neutrophils 78% (reference 50-70%)
Prescription: Amoxicillin 0.5g three times daily for 5 days
"""

record = extractor.extract_medical_report(report_text)
print(f"Diagnosis: {record.get('diagnosis', [])}")
for test in record.get("test_results", []):
    status = "⚠️ Abnormal" if test.get("is_abnormal") else "✅ Normal"
    print(f"  {test['item']}: {test['value']} {test['unit']} {status}")

# Plain language explanation
explanation = extractor.explain_report(record)
print(f"\nExplanation:\n{explanation}")
```

---

## Health Management

```python
class HealthManager:
    """AI health management assistant"""

    def analyze_trends(self, health_data: list[dict], metric: str) -> str:
        """Analyze health data trends"""
        data_json = json.dumps(health_data, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the trend for "{metric}". Data:
{data_json}

Output:
1. Trend judgment (Rising/Falling/Stable)
2. Whether within healthy range
3. Magnitude of change (Mild/Moderate/Significant)
4. Lifestyle suggestions

For reference only, not medical advice.""",
                },
                {"role": "user", "content": "Please analyze the trend"},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content

    def medication_reminder(self, medications: list[dict]) -> str:
        """Medication management"""
        med_list = json.dumps(medications, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a daily medication reminder schedule based on the medication plan.
{med_list}

Generate a Monday-to-Sunday medication schedule including:
- Specific time for each medication
- Before/after meal instructions
- Drug interaction warnings
- What to do if a dose is missed""",
                },
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content

    def diet_advice(self, condition: str, allergies: list[str] = None) -> str:
        """Dietary advice"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""For "{condition}" {'Allergies: ' + ', '.join(allergies) if allergies else ''}
Provide dietary advice:
- Recommended foods
- Foods to avoid
- Sample three-meal daily plan
- Nutritional supplement suggestions
For reference only. Please consult a nutritionist for specifics.""",
                },
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content

# Usage
health = HealthManager()

# Trend analysis
blood_pressure_data = [
    {"date": "2026-06-15", "systolic": 135, "diastolic": 85},
    {"date": "2026-06-16", "systolic": 128, "diastolic": 82},
    {"date": "2026-06-17", "systolic": 132, "diastolic": 84},
]
print(health.analyze_trends(blood_pressure_data, "Blood Pressure"))

# Medication reminder
meds = [
    {"name": "Amoxicillin", "dosage": "0.5g", "frequency": "Three times daily", "timing": "After meals"},
]
print(health.medication_reminder(meds))
```

---

## Medical AI Compliance Checklist

```
✅ Must Do:
- Attach "For reference only, please consult a doctor" disclaimer to all output
- Immediately guide users to seek medical attention for emergency symptoms
- Comply with Internet Medical Treatment Management Regulations requirements
- Encrypt user health data at rest

❌ Must Avoid:
- Giving definitive diagnostic conclusions
- Replacing a doctor's prescribing authority
- Handling diagnosis requests for serious diseases
- Storing health data without user authorization
```

---

## Next Steps

- [AI Security Best Practices](/tutorials/china-ai-security-best-practices/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> ⚠️ The content of this article is for reference and educational purposes only and does not constitute medical advice. For health concerns, please consult a licensed physician.
