---
title: "Data Privacy for Chinese AI Models: De-identification, Differential Privacy & Federated Learning with DeepSeek/Qwen"
description: "Build data privacy protection systems with Chinese AI models: automatic sensitive data identification and masking, differential privacy injection, federated learning frameworks, and automated privacy compliance auditing. Includes PIPL and GDPR compliance solutions."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Privacy", "De-identification", "Federated Learning", "Compliance", "Security", "Expert"]
level: "Expert"
---

## What This Tutorial Solves

You will use AI to protect data privacy:

- Automatic sensitive data identification and masking
- Differential privacy protection
- Federated learning framework
- Privacy compliance auditing

> 🎯 User data "John Doe, +1-555-0123, 123 Main St, New York..." → AI auto-masking → "John***, +1-555-****, ***, New York". PIPL-compliant.

---

## Sensitive Data Identification and Masking

```python
class DataMasker:
    """AI sensitive data identification and masking"""

    SENSITIVE_TYPES = {
        "Name": {"pattern": "Full name", "method": "mask", "rule": "Keep last name, replace given name with *"},
        "Phone": {"pattern": "1[3-9]\\d{9}", "method": "mask", "rule": "Keep first 3 and last 4 digits"},
        "ID Card": {"pattern": "\\d{17}[\\dXx]", "method": "mask", "rule": "Keep first 6 and last 4 digits"},
        "Bank Card": {"pattern": "\\d{16,19}", "method": "mask", "rule": "Keep last 4 digits"},
        "Email": {"pattern": "[\\w.-]+@[\\w.-]+", "method": "mask", "rule": "Keep first character and domain"},
        "Address": {"pattern": "Province/City/District/Road/Number", "method": "generalize", "rule": "Keep only to district level"},
        "License Plate": {"pattern": "[京津沪渝...][A-Z][A-Z0-9]{5}", "method": "mask", "rule": "Keep first 2 characters"},
    }

    def __init__(self):
        self.client = client

    def detect_and_mask(self, text: str) -> dict:
        """AI identification and masking"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Identify sensitive information in the following text and apply masking.

Original text: {text}

Output JSON:
{{
  "masked_text": "Masked text",
  "detected_items": [
    {{
      "type": "Sensitive info type",
      "original": "Original value (partial)",
      "masked": "Masked value",
      "position": "Position in text",
      "risk_level": "high risk/medium risk/low risk"
    }}
  ],
  "risk_summary": "Overall risk assessment",
  "compliance_notes": "Compliance notes"
}}

Applicable regulations:
- Personal Information Protection Law (PIPL)
- Data Security Law (DSL)
- GDPR (if EU users are involved)""",
                },
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"masked_text": text}

    def batch_mask_file(self, file_path: str, output_path: str) -> dict:
        """Batch file masking"""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Process large files in chunks
        chunks = [content[i:i+4000] for i in range(0, len(content), 4000)]
        masked_chunks = []
        stats = {"total_items": 0, "by_type": {}}

        for i, chunk in enumerate(chunks):
            result = self.detect_and_mask(chunk)
            masked_chunks.append(result.get("masked_text", chunk))

            for item in result.get("detected_items", []):
                stats["total_items"] += 1
                item_type = item["type"]
                stats["by_type"][item_type] = stats["by_type"].get(item_type, 0) + 1

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("".join(masked_chunks))

        return {"output_path": output_path, "stats": stats}

# Usage
masker = DataMasker()

text = """
Customer John Doe, phone +1-555-0123, ID AB123456,
address 123 Main Street Apt 5B New York NY 10001,
bank card 6222021234567890123, email johndoe@example.com.
"""

result = masker.detect_and_mask(text)
print(f"After masking: {result.get('masked_text')}")

print("\nDetected sensitive information:")
for item in result.get("detected_items", []):
    print(f"  {item['type']}: {item['original']} → {item['masked']} [{item['risk_level']}]")
```

---

## Differential Privacy

```python
import numpy as np

class DifferentialPrivacy:
    """Differential privacy protection"""

    def __init__(self, epsilon: float = 1.0):
        """
        epsilon: Privacy budget (smaller = more private, but less accurate)
        Common values: 0.1-10
        """
        self.epsilon = epsilon

    def laplace_mechanism(self, value: float, sensitivity: float) -> float:
        """Laplace mechanism — add noise to numeric values"""
        scale = sensitivity / self.epsilon
        noise = np.random.laplace(0, scale)
        return value + noise

    def gaussian_mechanism(self, value: float, sensitivity: float, delta: float = 1e-5) -> float:
        """Gaussian mechanism"""
        sigma = np.sqrt(2 * np.log(1.25 / delta)) * sensitivity / self.epsilon
        noise = np.random.normal(0, sigma)
        return value + noise

    def private_count(self, true_count: int) -> int:
        """Differentially private count"""
        noisy = self.laplace_mechanism(true_count, sensitivity=1)
        return max(0, int(round(noisy)))

    def private_mean(self, values: list[float], lower_bound: float, upper_bound: float) -> float:
        """Differentially private mean"""
        n = len(values)
        sensitivity = (upper_bound - lower_bound) / n
        true_mean = sum(values) / n
        return self.laplace_mechanism(true_mean, sensitivity)

    def ai_privacy_audit(self, query_log: list[dict]) -> dict:
        """AI audits whether differential privacy has been compromised"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Audit the following query log for differential privacy breaches.

Query log: {json.dumps(query_log, ensure_ascii=False)}
Current epsilon: {self.epsilon}

Output JSON:
{{
  "privacy_leaked": true/false,
  "risk_level": "safe/low risk/medium risk/high risk/leaked",
  "vulnerable_queries": ["Queries that may leak privacy"],
  "privacy_budget_remaining": "Remaining privacy budget",
  "recommendation": "Recommendation (continue/adjust epsilon/stop queries)"
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
dp = DifferentialPrivacy(epsilon=1.0)

# Differentially private count — number of patients with a disease
true_count = 1523
private_count = dp.private_count(true_count)
print(f"True count: {true_count}, DP count: {private_count} (error: {private_count - true_count})")

# Differentially private mean — average income
incomes = [8000, 12000, 9500, 15000, 11000]
private_avg = dp.private_mean(incomes, lower_bound=0, upper_bound=50000)
true_avg = sum(incomes) / len(incomes)
print(f"True mean: {true_avg:.0f}, DP mean: {private_avg:.0f}")
```

---

## Federated Learning

```python
class FederatedLearning:
    """Federated learning — distributed training where data never leaves its source"""

    def __init__(self):
        self.client = client

    def federated_averaging(self, client_models: list[dict]) -> dict:
        """Federated averaging aggregation"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Perform federated averaging aggregation.

Client model updates: {json.dumps(client_models, ensure_ascii=False)[:6000]}

Output JSON:
{{
  "global_model_update": "Aggregated global model parameters",
  "aggregation_weights": {{"client_id": weight}},
  "convergence_status": "converging/converged/diverging",
  "anomalous_clients": ["Anomalous clients (possible poisoning attack)"],
  "recommendation": "Next steps"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=2000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def detect_poisoning_attack(self, client_updates: list[dict]) -> dict:
        """Detect federated learning poisoning attacks"""
        updates_text = json.dumps(client_updates, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Detect poisoning attacks in federated learning.

Client updates: {updates_text}

Output JSON:
{{
  "attack_detected": true/false,
  "suspicious_clients": [
    {{"client_id": "Suspicious client", "reason": "Reason for suspicion", "confidence": "Confidence"}}
  ],
  "attack_type": "label flipping/backdoor attack/model replacement/no attack",
  "defense_strategy": "Defense strategy",
  "clean_aggregation_possible": true/false
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

    def design_federated_protocol(self, scenario: dict) -> dict:
        """AI designs a federated learning protocol"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design a federated learning protocol.

Scenario: {json.dumps(scenario, ensure_ascii=False)}

Output JSON:
{{
  "architecture": "Federated architecture (horizontal/vertical/transfer)",
  "aggregation_method": "Aggregation algorithm (FedAvg/FedProx/Scaffold etc.)",
  "privacy_mechanism": "Privacy protection method (DP/SMPC/HE)",
  "communication_rounds": "Recommended communication rounds",
  "client_selection": "Client selection strategy",
  "heterogeneity_handling": "Data heterogeneity handling approach",
  "security_measures": ["Security protection measures"]
}}""",
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
fl = FederatedLearning()

protocol = fl.design_federated_protocol({
    "task": "Joint training of disease prediction model across multiple hospitals' medical data",
    "num_clients": 10,
    "data_per_client": "1000-10000 records per client (varying)",
    "data_distribution": "Non-IID (Non-Independent and Identically Distributed)",
    "privacy_requirement": "Strict (medical data)",
    "communication_bandwidth": "Limited",
})

print(f"Architecture: {protocol.get('architecture')}")
print(f"Aggregation method: {protocol.get('aggregation_method')}")
print(f"Privacy mechanism: {protocol.get('privacy_mechanism')}")
```

---

## Privacy Compliance Auditing

```python
class PrivacyAuditor:
    """AI privacy compliance auditing"""

    REGULATIONS = {
        "PIPL": {
            "key_requirements": ["Notice and consent", "Purpose limitation", "Data minimization", "Data subject rights", "Cross-border transfer rules"],
            "penalties": "Up to RMB 50 million or 5% of prior year revenue",
        },
        "GDPR": {
            "key_requirements": ["Lawful basis", "Data minimization", "Right to erasure", "Data portability", "DPIA"],
            "penalties": "Up to EUR 20 million or 4% of global annual revenue",
        },
    }

    def audit_system(self, system_description: str, data_flows: list[dict], regulation: str = "PIPL") -> dict:
        """AI privacy compliance audit"""
        flows_text = json.dumps(data_flows, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Conduct a privacy compliance audit per {regulation}.

System description: {system_description}
Data flows: {flows_text}
Regulatory requirements: {json.dumps(self.REGULATIONS.get(regulation, {}), ensure_ascii=False)}

Output JSON:
{{
  "overall_compliance": "compliant/partially compliant/non-compliant",
  "compliance_score": 0-100,
  "findings": [
    {{
      "requirement": "Regulatory requirement",
      "status": "compliant/needs improvement/non-compliant",
      "detail": "Finding details",
      "risk_level": "high/medium/low",
      "remediation": "Remediation suggestion"
    }}
  ],
  "critical_issues": ["Critical violations (must fix immediately)"],
  "remediation_plan": "Remediation plan (prioritized)",
  "estimated_fine_if_breach": "Estimated penalty if in breach"
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

    def generate_privacy_policy(self, app_info: dict) -> str:
        """AI generates privacy policy"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a privacy policy for the following application.

App info: {json.dumps(app_info, ensure_ascii=False)}

Requirements:
1. Compliant with the Personal Information Protection Law (PIPL)
2. Use plain, easy-to-understand language — avoid legal jargon
3. Include: information collected, purpose of use, third-party sharing, user rights, contact information
4. If sensitive permissions are involved (location/camera/contacts etc.), explain them separately""",
                },
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content

# Usage
auditor = PrivacyAuditor()

data_flows = [
    {"from": "User registration page", "to": "User database", "data": "Phone number, password hash", "encrypted": True, "consent": "Popup consent obtained"},
    {"from": "User browsing history", "to": "Recommendation engine", "data": "Browsed product IDs, dwell time", "encrypted": False, "consent": "Buried in privacy policy"},
    {"from": "User database", "to": "Third-party analytics", "data": "Anonymized user profiles", "encrypted": False, "consent": "Not separately disclosed"},
]

audit = auditor.audit_system("E-commerce app user data management system", data_flows, "PIPL")
print(f"Compliance status: {audit.get('overall_compliance')} (score: {audit.get('compliance_score')}/100)")

for finding in audit.get("findings", []):
    icon = "✅" if finding["status"] == "compliant" else "⚠️" if finding["status"] == "needs improvement" else "❌"
    print(f"  {icon} {finding['requirement']}: {finding['detail']}")
```

---

## Privacy Protection Technology Selection

| Technology | Protection Strength | Data Usability | Performance Overhead | Applicable Scenarios |
|------|---------|-----------|---------|---------|
| Data masking | Medium | High | Low | Testing/demo |
| Differential privacy | High | Medium | Low | Statistical analysis |
| Federated learning | High | High | Medium | Joint modeling |
| Secure multi-party computation | Very high | High | Very high | Finance/healthcare |
| Homomorphic encryption | Very high | High | Very high | Sensitive computation |
| K-anonymity | Medium | High | Low | Data publishing |

---

## Next Steps

- [AI Security: Attack and Defense](/tutorials/ai-security-attack-defense/)
- [AI Legal Compliance](/tutorials/ai-legal-compliance-guide/)

> 📝 Based on PIPL + Differential Privacy + Federated Learning, June 2026.
