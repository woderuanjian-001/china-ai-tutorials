---
title: "E-Commerce Optimization with Chinese AI: Product Description Generation, Review Analysis & Smart Pricing Using DeepSeek and Qwen"
description: "Optimize the full e-commerce pipeline with Chinese AI models: automated product description generation, user review sentiment analysis, competitive smart pricing, customer service intent recognition and routing, and personalized recommendation scripts. Multi-platform support for Taobao, JD.com, and Pinduoduo using Chinese LLMs."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["E-Commerce", "Products", "Review Analysis", "Pricing", "Customer Service", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will equip your e-commerce operations with AI:

- Auto-generate product titles and descriptions
- Mine user reviews for sentiment and opinions
- Smart competitive pricing
- Customer service intent recognition and auto-routing

> 🎯 Launch a new product → AI auto-writes the title / description / selling points → analyzes competitor pricing → monitors review feedback → auto-replies to FAQs. One person manages an entire store.

---

## Product Description Auto-Generation

```python
class ProductContentGenerator:
    """AI product content generation"""

    PLATFORM_RULES = {
        "Taobao": {"title_max_chars": 60, "style": "Highlight selling points and promotional info"},
        "JD.com": {"title_max_chars": 50, "style": "Brand + spec + model, professional and standardized"},
        "Pinduoduo": {"title_max_chars": 64, "style": "Price-sensitive, emphasize value-for-money and deals"},
        "Douyin": {"title_max_chars": 40, "style": "Conversational, scenario-driven, spark interest"},
    }

    def __init__(self):
        self.client = client

    def generate_title(self, product: dict, platform: str = "Taobao", keywords: list[str] = None) -> str:
        """Generate product title"""
        rules = self.PLATFORM_RULES.get(platform, self.PLATFORM_RULES["Taobao"])
        keywords_str = ", ".join(keywords or [])

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a product title for {platform}.

Product: {json.dumps(product, ensure_ascii=False)}
SEO keywords: {keywords_str}
Platform rules: {rules['style']}
Character limit: within {rules['title_max_chars']} characters

Required format:
1. Place core keywords in the first half of the title
2. Highlight differentiating selling points
3. {rules['style']}
4. Don't stuff meaningless adjectives""",
                },
            ],
            temperature=0.8,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()

    def generate_description(self, product: dict, tone: str = "Professional and sincere") -> str:
        """Generate product detail description"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Write a product detail page copy for the following item. Style: {tone}.

Product: {json.dumps(product, ensure_ascii=False)}

Copy structure:
1. Pain point introduction (what problem the user faces)
2. Product solution
3. Core selling points (3-5, each with detailed explanation)
4. Technical specs
5. Usage scenarios
6. User testimonials (simulate 2)
7. After-sales guarantee
8. Call to action

Requirements: natural and readable, scenario-based, human touch, no false exaggeration""",
                },
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        return response.choices[0].message.content

    def generate_multi_platform(self, product: dict, keywords: list[str]) -> dict:
        """One-click multi-platform content generation"""
        results = {}
        for platform in self.PLATFORM_RULES:
            results[platform] = {
                "title": self.generate_title(product, platform, keywords),
                "description": self.generate_description(product),
            }
        return results

# Usage
gen = ProductContentGenerator()

product = {
    "name": "Portable Handheld Mini Fan",
    "brand": "CoolSir",
    "features": ["USB rechargeable", "3 fan speeds", "Ultra-quiet", "2000mAh battery 12h runtime", "Foldable", "Only 120g"],
    "price": 49.9,
    "target_user": "Students/Office workers/Outdoor",
}

title = gen.generate_title(product, "Taobao", ["handheld fan", "quiet", "portable", "long battery"])
print(f"Title: {title}")

desc = gen.generate_description(product, "Lively and upbeat")
print(f"First 200 chars of description: {desc[:200]}...")
```

---

## Review Sentiment Analysis

```python
class ReviewAnalyzer:
    """AI product review analysis"""

    def analyze_reviews(self, reviews: list[dict]) -> dict:
        """Analyze a collection of reviews"""
        reviews_text = json.dumps(reviews, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the following product reviews.

Reviews: {reviews_text[:8000]}

Output JSON:
{{
  "sentiment_distribution": {{
    "positive": {{"count": positive count, "percentage": percentage}},
    "neutral": {{"count": neutral count, "percentage": percentage}},
    "negative": {{"count": negative count, "percentage": percentage}}
  }},
  "overall_sentiment": "Overall sentiment trend",
  "top_praises": [
    {{"aspect": "Praised aspect", "count": mention count, "example": "representative review"}}
  ],
  "top_complaints": [
    {{"aspect": "Complaint aspect", "count": mention count, "severity": "severity level", "example": "representative review"}}
  ],
  "urgent_issues": ["Issues requiring immediate attention"],
  "product_improvement_suggestions": ["Product improvement suggestions"],
  "customer_service_insights": ["Customer service improvement suggestions"],
  "review_summary": "One-sentence summary of customer sentiment"
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

    def generate_reply(self, review: str, rating: int, sentiment: str) -> str:
        """AI auto-generates replies"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a reply to the following review.

Review: {review}
Rating: {rating} stars
Sentiment: {sentiment}

Reply requirements:
- Positive (4-5 stars): Express thanks + delight + guide repurchase
- Neutral (3 stars): Express thanks + understanding + improvement promise + compensation
- Negative (1-2 stars): Sincere apology + problem confirmation + solution + contact info

Tone: Genuine, not templated, human touch.
Length: 50-100 words.""",
                },
            ],
            temperature=0.6,
            max_tokens=300,
        )
        return response.choices[0].message.content

# Usage
analyzer = ReviewAnalyzer()

reviews = [
    {"rating": 5, "text": "Great airflow, very quiet, can use during class without being noticed. Battery lasts all day!"},
    {"rating": 4, "text": "Pretty good, but the white color gets dirty easily. Three speeds are adequate."},
    {"rating": 2, "text": "Stopped charging after just one week of use. Customer service won't respond either, very disappointed."},
    {"rating": 5, "text": "Second purchase, bought one for my bestie too. She says it works great."},
    {"rating": 3, "text": "Just okay, wind power not as strong as expected. It blows air but nothing special."},
]

analysis = analyzer.analyze_reviews(reviews)
print(f"Positive rating: {analysis.get('sentiment_distribution', {}).get('positive', {}).get('percentage')}")

print("\n👍 What users love most:")
for praise in analysis.get("top_praises", []):
    print(f"  {praise['aspect']}: mentioned {praise['count']} times — {praise['example']}")

print("\n👎 User complaints:")
for complaint in analysis.get("top_complaints", []):
    print(f"  {complaint['aspect']}: {complaint['severity']} — {complaint['example']}")

# Generate reply to negative review
reply = analyzer.generate_reply("Stopped charging after a week of use", 2, "negative")
print(f"\nAuto-reply: {reply}")
```

---

## Smart Pricing

```python
class SmartPricing:
    """AI smart pricing"""

    def suggest_price(self, product: dict, competitors: list[dict], cost: dict) -> dict:
        """AI pricing recommendations"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Provide pricing recommendations for this product.

My product: {json.dumps(product, ensure_ascii=False)}
Cost: {json.dumps(cost, ensure_ascii=False)}
Competitor prices: {json.dumps(competitors, ensure_ascii=False)}

Output JSON:
{{
  "recommended_price": recommended selling price,
  "price_range": {{"min": minimum, "max": maximum}},
  "gross_margin_percent": gross margin percentage,
  "pricing_strategy": "Pricing strategy (penetration/skimming/market-following/value-based)",
  "psychological_price": "Psychological pricing (e.g. ending in 9.9)",
  "promotion_price": "Promotional price suggestion",
  "bundle_price": "Bundle package price suggestion",
  "competitive_analysis": "Price competitiveness analysis",
  "price_sensitivity": "User price sensitivity (high/medium/low)",
  "expected_conversion_rate": "Estimated conversion rate",
  "risks": ["Pricing risks"]
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

    def dynamic_pricing(self, product: dict, inventory: int, demand_score: float, time_factor: str) -> dict:
        """Dynamic pricing (adjusts based on inventory/demand/time)"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Dynamic pricing recommendation.

Product: {product.get('name')} | Current price: {product.get('price')}
Current inventory: {inventory}
Demand intensity: {demand_score}/100
Time factor: {time_factor}

Output JSON:
{{
  "action": "increase/decrease/maintain",
  "new_price": new price,
  "change_percent": "percentage change",
  "reason": "reason for adjustment",
  "expected_effect": "Expected effect (sales volume + profit change)",
  "optimal_duration_hours": "Recommended duration in hours"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
pricing = SmartPricing()

price_suggestion = pricing.suggest_price(
    product={"name": "Portable Handheld Mini Fan", "features": ["Ultra-quiet", "Long battery life", "Foldable"], "brand_awareness": "New brand"},
    competitors=[
        {"brand": "Competitor A", "price": 39.9, "sales_volume": "100k+", "rating": 4.7},
        {"brand": "Competitor B", "price": 59.9, "sales_volume": "50k+", "rating": 4.8},
        {"brand": "Competitor C", "price": 29.9, "sales_volume": "200k+", "rating": 4.3},
    ],
    cost={"product_cost": 18, "shipping": 5, "platform_fee_percent": 5, "ad_cost_per_order": 8},
)

print(f"Recommended price: ¥{price_suggestion.get('recommended_price')}")
print(f"Gross margin: {price_suggestion.get('gross_margin_percent')}%")
print(f"Pricing strategy: {price_suggestion.get('pricing_strategy')}")
print(f"Psychological price: ¥{price_suggestion.get('psychological_price')}")
```

---

## Customer Service Intent Recognition and Routing

```python
class CustomerServiceAI:
    """AI customer service intent recognition and routing"""

    INTENT_CATEGORIES = {
        "Returns/Refunds": {"priority": "high", "sla_minutes": 30, "assign_to": "After-sales team"},
        "Shipping Inquiry": {"priority": "medium", "sla_minutes": 60, "assign_to": "Logistics team"},
        "Product Quality": {"priority": "high", "sla_minutes": 30, "assign_to": "QC team"},
        "Usage Instructions": {"priority": "low", "sla_minutes": 120, "assign_to": "AI auto-reply"},
        "Price Inquiry": {"priority": "low", "sla_minutes": 120, "assign_to": "AI auto-reply"},
        "Complaint": {"priority": "critical", "sla_minutes": 15, "assign_to": "Support supervisor"},
        "Order Fulfillment": {"priority": "medium", "sla_minutes": 60, "assign_to": "Warehouse team"},
    }

    def classify_intent(self, message: str, history: list[str] = None) -> dict:
        """Recognize customer intent"""
        history_text = "\n".join(history[-5:]) if history else "None"

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Recognize customer intent and decide routing.

Customer message: {message}
Conversation history: {history_text}

Available intent categories: {', '.join(self.INTENT_CATEGORIES.keys())}

Output JSON:
{{
  "intent": "Intent category",
  "confidence": 0-100,
  "sentiment": "positive/neutral/negative/angry",
  "urgency": "urgent/normal/not urgent",
  "can_ai_handle": true/false,
  "suggested_response": "AI suggested reply (if auto-handling is possible)",
  "escalation_reason": "Reason for escalation (if human handling is needed)",
  "required_info": ["Information to collect from the customer"]
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"intent": "unknown", "can_ai_handle": False}

    def route_customer(self, intent_result: dict) -> dict:
        """Route based on intent"""
        intent = intent_result.get("intent", "unknown")
        category = self.INTENT_CATEGORIES.get(intent, {"priority": "low", "sla_minutes": 240, "assign_to": "General team"})

        if intent_result.get("can_ai_handle"):
            return {
                "route": "AI",
                "response": intent_result.get("suggested_response", ""),
                "action": "auto_reply",
            }
        elif intent_result.get("urgency") == "urgent":
            return {
                "route": "Human",
                "assign_to": category["assign_to"],
                "priority": "critical",
                "sla_minutes": 15,
                "action": "immediate_escalation",
            }
        else:
            return {
                "route": "Human",
                "assign_to": category["assign_to"],
                "priority": category["priority"],
                "sla_minutes": category["sla_minutes"],
                "action": "queue",
            }

# Usage
cs = CustomerServiceAI()

# Simulate customer messages
messages = [
    "You shipped one item short! I ordered 3 but only received 2.",
    "How do I clean this fan? Can I rinse it with water?",
    "Where is my package? It's been 3 days and it still hasn't arrived.",
]

for msg in messages:
    intent = cs.classify_intent(msg)
    route = cs.route_customer(intent)

    print(f"\n💬 {msg}")
    print(f"   Intent: {intent.get('intent')} | Sentiment: {intent.get('sentiment')}")
    print(f"   Route: {route['route']} → {route.get('assign_to', 'N/A')}")
    print(f"   Action: {route['action']}")
```

---

## E-Commerce AI Toolchain Overview

```
Product Listing → Review Monitoring → Pricing Adjustment → Customer Service
     │                │                   │                  │
     ▼                ▼                   ▼                  ▼
  AI Title      AI Sentiment        AI Competitive      AI Intent
  AI Detail      Analysis           Pricing            Routing
  AI Main       AI Reply           AI Dynamic          AI Auto
  Image            │                Pricing             Reply
     │                │                   │                  │
     └────────────────┴───────────────────┴──────────────────┘
                                      ▼
                          E-Commerce Operations Dashboard
```

---

## Next Steps

- [AI Marketing Content](/tutorials/ai-marketing-content-guide/)
- [AI Recommendation Systems](/tutorials/ai-personalization-recommendation/)

> 📝 Based on DeepSeek + e-commerce operations scenarios, June 2026.
