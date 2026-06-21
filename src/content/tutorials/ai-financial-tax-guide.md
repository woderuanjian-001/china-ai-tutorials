---
title: "Chinese AI for Financial & Tax Automation: Smart Bookkeeping, Invoice OCR & Tax Calculation with DeepSeek"
description: "Build financial and tax automation tools with Chinese AI models: invoice OCR recognition, intelligent bookkeeping classification, tax calculation, and financial report generation. Complete code examples using iFlytek OCR, DeepSeek, and Qwen."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["Finance & Tax", "Invoices", "Bookkeeping", "OCR", "Tax", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will use AI to automate financial and tax work:

- Invoice/receipt OCR auto-recognition
- AI smart bookkeeping classification
- Tax calculation assistance
- Automated financial report generation

> 🎯 A godsend for finance staff: snap a photo of an invoice → AI auto-recognizes → smart classification and bookkeeping → generates reports. What takes a human 1 hour, AI does in 30 seconds.

---

## Invoice OCR Recognition

```python
import requests
import base64
import json
import os

class InvoiceOCR:
    """Invoice OCR recognition"""

    def __init__(self):
        # Using iFlytek OCR / Tencent Cloud OCR
        self.xunfei_app_id = os.getenv("XUNFEI_APP_ID")
        self.xunfei_api_key = os.getenv("XUNFEI_API_KEY")

    def recognize_invoice_xunfei(self, image_path: str) -> dict:
        """iFlytek OCR invoice recognition"""
        with open(image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()

        # iFlytek OCR API
        url = "https://api.xf-yun.com/v1/private/sf8e6aca1"
        headers = {
            "Content-Type": "application/json",
            "X-Appid": self.xunfei_app_id,
            "X-Api-Key": self.xunfei_api_key,
        }

        payload = {
            "header": {"app_id": self.xunfei_app_id},
            "parameter": {
                "sf8e6aca1": {
                    "category": "invoice",
                    "result": {"encoding": "utf8", "compress": "raw", "format": "json"},
                }
            },
            "payload": {
                "sf8e6aca1_data_1": {
                    "encoding": "jpg",
                    "image": image_base64,
                    "status": 3,
                }
            },
        }

        response = requests.post(url, headers=headers, json=payload)
        result = response.json()

        # Parse result
        text = result.get("payload", {}).get("result", {}).get("text", "")
        return self._parse_invoice_json(text)

    def _parse_invoice_json(self, text: str) -> dict:
        """Parse invoice JSON"""
        try:
            data = json.loads(text)
            return {
                "invoice_type": data.get("invoice_type", "Unknown"),
                "invoice_code": data.get("invoice_code", ""),
                "invoice_number": data.get("invoice_number", ""),
                "invoice_date": data.get("invoice_date", ""),
                "seller_name": data.get("seller_name", ""),
                "buyer_name": data.get("buyer_name", ""),
                "total_amount": data.get("total_amount", 0),
                "tax_amount": data.get("tax_amount", 0),
                "amount_in_words": data.get("amount_in_words", ""),
                "items": data.get("items", []),
            }
        except:
            return {"error": "Parsing failed", "raw": text}

    def ai_extract_invoice_info(self, text: str) -> dict:
        """AI extracts invoice info from unstructured text"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Extract structured info from invoice text, output JSON:
{
  "invoice_type": "增值税专用发票/增值税普通发票/电子发票",
  "seller": {"name": "", "tax_id": ""},
  "buyer": {"name": "", "tax_id": ""},
  "items": [
    {"name": "商品/服务名", "quantity": quantity, "unit_price": unit price, "amount": amount, "tax_rate": tax rate}
  ],
  "subtotal": subtotal amount,
  "total_tax": total tax,
  "total_amount": total including tax,
  "date": "Invoice date",
  "invoice_number": "Invoice number"
}""",
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
ocr = InvoiceOCR()
# result = ocr.recognize_invoice_xunfei("invoice.jpg")
# print(f"Invoice number: {result.get('invoice_number')}")
# print(f"Total including tax: {result.get('total_amount')} yuan")
```

---

## AI Smart Bookkeeping

```python
class AISmartBookkeeping:
    """AI smart bookkeeping"""

    CHART_OF_ACCOUNTS = [
        "库存现金", "银行存款", "应收账款", "预付账款",
        "原材料", "库存商品", "固定资产", "累计折旧",
        "应付账款", "预收账款", "应付职工薪酬", "应交税费",
        "实收资本", "资本公积", "未分配利润",
        "主营业务收入", "主营业务成本", "销售费用",
        "管理费用", "财务费用", "营业外收入", "营业外支出",
    ]

    def classify_transaction(self, description: str, amount: float, transaction_type: str) -> dict:
        """AI smart transaction classification"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a senior accountant. Select the correct journal entries for the following transaction.

Transaction description: {description}
Amount: {amount:.2f} yuan
Type: {transaction_type}

Available accounts: {', '.join(self.CHART_OF_ACCOUNTS)}

Output JSON:
{{
  "debit_account": "Debit account",
  "credit_account": "Credit account",
  "debit_amount": Debit amount,
  "credit_amount": Credit amount,
  "voucher_type": "Journal voucher type",
  "explanation": "Entry explanation (double-entry bookkeeping principle)",
  "tax_implication": "Tax implication notes"
}}

Rule: Debits and credits must balance (total debits = total credits).""",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def batch_bookkeeping(self, transactions: list[dict]) -> list[dict]:
        """Batch bookkeeping"""
        entries = []

        for i, tx in enumerate(transactions):
            entry = self.classify_transaction(
                tx.get("description", ""),
                tx.get("amount", 0),
                tx.get("type", "支出"),
            )
            entry["id"] = i + 1
            entry["date"] = tx.get("date", "")
            entries.append(entry)

            print(f"✅ [{i+1}/{len(transactions)}] {tx['description'][:30]}... "
                  f"Dr:{entry.get('debit_account', '?')} Cr:{entry.get('credit_account', '?')}")

        return entries

    def generate_voucher(self, entry: dict, voucher_no: str) -> str:
        """Generate journal voucher"""
        return f"""═══════════════════════════════
              JOURNAL VOUCHER
═══════════════════════════════
Voucher No: {voucher_no}
Date: {entry.get('date', '')}

Description: {entry.get('description', '')}
───────────────────────────────────
Account                 Debit       Credit
───────────────────────────────────
{entry.get('debit_account', ''):12s} {entry.get('debit_amount', 0):>10.2f}
{entry.get('credit_account', ''):12s}             {entry.get('credit_amount', 0):>10.2f}
───────────────────────────────────
Total:                  {entry.get('debit_amount', 0):>10.2f} {entry.get('credit_amount', 0):>10.2f}
═══════════════════════════════
"""

# Usage
bookkeeping = AISmartBookkeeping()

# Batch bookkeeping
transactions = [
    {"description": "支付3月办公室租金", "amount": 5000, "type": "支出", "date": "2026-03-15"},
    {"description": "销售A产品100件，单价200元", "amount": 20000, "type": "收入", "date": "2026-03-16"},
    {"description": "购买办公用品一批", "amount": 850, "type": "支出", "date": "2026-03-17"},
]

entries = bookkeeping.batch_bookkeeping(transactions)

for entry in entries:
    voucher = bookkeeping.generate_voucher(entry, f"记-2026-{entry['id']:04d}")
    print(voucher)
```

---

## Tax Calculation Assistant

```python
class AITaxCalculator:
    """AI tax calculator"""

    def calculate_vat(self, sales: float, purchases: float, vat_rate: float = 0.13) -> dict:
        """VAT calculation"""
        output_tax = sales * vat_rate
        input_tax = purchases * vat_rate
        payable = output_tax - input_tax

        return {
            "sales_amount": sales,
            "purchases_amount": purchases,
            "vat_rate": f"{vat_rate*100}%",
            "output_tax": round(output_tax, 2),
            "input_tax": round(input_tax, 2),
            "payable": round(payable, 2),
        }

    def tax_advisor(self, scenario: str) -> str:
        """AI tax advisory"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a tax consultant. Provide tax advice based on the user's scenario.

Scenario: {scenario}

Include:
1. Applicable tax types
2. Tax rates and calculation methods
3. Preferential policies (if applicable)
4. Compliance considerations
5. Tax planning suggestions

⚠️ Disclaimer: For reference only; consult a professional tax advisor for specific advice.""",
                },
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        return response.choices[0].message.content

    def check_tax_optimization(self, company_info: dict) -> list[dict]:
        """Tax optimization review"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Review this company's tax optimization opportunities.

Company info: {json.dumps(company_info, ensure_ascii=False)}

Output JSON:
[
  {{
    "category": "Tax type eligible for optimization",
    "current_situation": "Current situation",
    "optimization": "Optimization suggestion",
    "estimated_saving": "Estimated savings",
    "risk_level": "Risk level (low/medium/high)"
  }}
]""",
                },
            ],
            temperature=0.3,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
tax = AITaxCalculator()

vat = tax.calculate_vat(sales=100000, purchases=60000)
print(f"Output tax: {vat['output_tax']} yuan")
print(f"Input tax: {vat['input_tax']} yuan")
print(f"VAT payable: {vat['payable']} yuan")

advice = tax.tax_advisor("小微企业年收入200万，想了解税收优惠政策")
print(advice)
```

---

## Financial Report Generation

```python
class AIFinancialReport:
    """AI financial report generator"""

    def generate_income_statement(self, period_data: dict) -> str:
        """Generate income statement"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate an income statement based on the data (Markdown format).

Data: {json.dumps(period_data, ensure_ascii=False)}

Format:
# Income Statement
## {period_data.get('period', '')}

| Item | Current Period | Prior Period |
|------|---------|---------|
| I. Operating Revenue | | |
| Less: Cost of Revenue | | |
| Tax and Surcharges | | |
| Selling Expenses | | |
| Administrative Expenses | | |
| Finance Expenses | | |
| II. Operating Profit | | |
| Add: Non-operating Income | | |
| Less: Non-operating Expenses | | |
| III. Total Profit | | |
| Less: Income Tax Expense | | |
| IV. Net Profit | | |

Include analysis notes (3-5 key points)""",
                },
            ],
            temperature=0.1,
            max_tokens=2000,
        )
        return response.choices[0].message.content

    def analyze_financial_health(self, financial_data: dict) -> dict:
        """Financial health analysis"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the company's financial health, output JSON:

{json.dumps(financial_data, ensure_ascii=False)}

{{
  "overall_health": "healthy/fair/watch/danger",
  "key_ratios": {{
    "profit_margin": "Profit margin %",
    "debt_ratio": "Debt ratio %",
    "current_ratio": "Current ratio"
  }},
  "strengths": ["Strengths"],
  "weaknesses": ["Issues"],
  "recommendations": ["Recommendations"],
  "risk_alerts": ["Risk alerts"]
}}""",
                },
            ],
            temperature=0.3,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
report = AIFinancialReport()

period_data = {
    "period": "2026年第一季度",
    "revenue": 500000,
    "cost": 320000,
    "sales_expense": 50000,
    "admin_expense": 30000,
    "finance_expense": 5000,
}

print(report.generate_income_statement(period_data))
```

---

## Next Steps

- [AI Data Analysis NL2SQL](/tutorials/ai-data-analysis-nl2sql/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> ⚠️ This article is for reference only. For specific financial/tax matters, consult a professional accountant or tax advisor.
