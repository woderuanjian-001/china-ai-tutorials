---
title: "Automation Workflows with Chinese AI Models: Email Processing, Report Generation & More with DeepSeek"
description: "Build automation workflows with Chinese AI models (DeepSeek, Qwen): auto email replies, report generation, social media ops, code review automation. Includes Python scripts + n8n/Zapier integration."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Automation", "Workflow", "Email", "Reports", "n8n", "Python", "Hands-On"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will use AI to replace repetitive work:

- Automatic email classification and replies
- Scheduled business report generation
- Automatic social media content creation
- GitHub Issues auto-classification
- Conversation log auto-analysis

> 🎯 These automation solutions can save 2-3 hours per day. That's 60 hours per month = 7.5 workdays.

---

## Part 1: Automatic Email Classification and Replies

```python
import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from openai import OpenAI
import os, json, time

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1",
)

class EmailAutomation:
    """AI email processing bot"""

    CATEGORIES = {
        "Customer Inquiry": "Questions about product features, pricing, and usage",
        "Business Collaboration": "Partnerships, channels, business discussions",
        "Technical Support": "Bug reports, technical issues, deployment problems",
        "Complaints & Feedback": "Dissatisfaction, complaints, refund requests",
        "Spam": "Advertisements, promotions, irrelevant content",
        "Other": "Doesn't match any of the above",
    }

    def classify_email(self, subject: str, body: str) -> dict:
        """AI email classification"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an email classification assistant. Classify the email into the following categories:
{json.dumps(self.CATEGORIES, ensure_ascii=False, indent=2)}

Output JSON: {{"category": "category", "priority": "high/medium/low", "needs_reply": true/false}}""",
                },
                {"role": "user", "content": f"Subject: {subject}\n\nBody: {body[:2000]}"},
            ],
            temperature=0.1,
            max_tokens=200,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"category": "Other", "priority": "low", "needs_reply": False}

    def generate_reply(self, subject: str, body: str, category: str) -> str:
        """AI generates reply draft"""
        templates = {
            "Customer Inquiry": "Provide a professional, enthusiastic response to the customer's product inquiry.",
            "Business Collaboration": "Thank the sender for their interest, ask them to provide detailed requirements.",
            "Technical Support": "First acknowledge the user's issue, provide troubleshooting steps or escalate to the tech team.",
            "Complaints & Feedback": "Start with a sincere apology, show that you take it seriously, commit to a resolution timeline.",
        }

        tone = templates.get(category, "Provide an appropriate response based on the email content.")

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional email assistant. {tone} Keep the reply concise, no more than 300 words.",
                },
                {"role": "user", "content": f"Reply to the following email:\n\nSubject: {subject}\nBody: {body}"},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        return response.choices[0].message.content

    def process_unread_emails(self):
        """Process all unread emails"""
        # 1. Connect to mail server
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
        mail.select("inbox")

        # 2. Search for unread emails
        _, messages = mail.search(None, "UNSEEN")

        results = []
        for num in messages[0].split():
            _, msg_data = mail.fetch(num, "(RFC822)")
            email_body = msg_data[0][1]
            message = email.message_from_bytes(email_body)

            subject = message["subject"] or ""
            body = ""

            # Extract body text
            if message.is_multipart():
                for part in message.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode()
                        break
            else:
                body = message.get_payload(decode=True).decode()

            # 3. AI classification
            category = self.classify_email(subject, body)

            # 4. AI generates reply
            reply = ""
            if category["needs_reply"]:
                reply = self.generate_reply(subject, body, category["category"])

            results.append({
                "subject": subject,
                "category": category,
                "reply_draft": reply,
            })

            print(f"📧 {subject[:50]}... → {category['category']} ({category['priority']})")

        mail.logout()
        return results

# Usage
bot = EmailAutomation()
# results = bot.process_unread_emails()
# Review AI-generated replies before manually sending
```

---

## Part 2: Scheduled Business Reports

```python
import schedule
from datetime import datetime, timedelta

class AIReportGenerator:
    """AI-powered scheduled reports"""

    def __init__(self):
        self.client = client

    def generate_daily_report(self, data: list[dict]) -> str:
        """Generate a daily report"""
        today = datetime.now().strftime("%Y-%m-%d")

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a data analyst. Generate a concise daily report based on the data. Format: 📊 Key Metrics → 📈 Trends → ⚠️ Anomaly Alerts.",
                },
                {
                    "role": "user",
                    "content": f"Date: {today}\nRaw data:\n{json.dumps(data, ensure_ascii=False)}\n\nPlease generate a daily report.",
                },
            ],
            temperature=0.3,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    def detect_anomaly(self, metric: str, current: float, history: list[float]) -> str:
        """Anomaly detection"""
        if not history:
            return ""

        avg = sum(history) / len(history)
        change = (current - avg) / avg * 100

        if abs(change) > 20:
            response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a data analyst. Analyze possible reasons for the metric anomaly.",
                    },
                    {
                        "role": "user",
                        "content": f"""{metric} anomaly:
Current: {current}
Historical average: {avg:.1f}
Change: {change:+.1f}%

Please analyze 3 possible reasons.""",
                    },
                ],
                temperature=0.3,
                max_tokens=300,
            )

            return f"⚠️ {metric} anomaly ({change:+.1f}%)\n{response.choices[0].message.content}"

        return ""

    def weekly_summary(self, daily_reports: list[str]) -> str:
        """Generate a weekly report"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a business analyst. Generate a weekly summary based on the daily reports.",
                },
                {
                    "role": "user",
                    "content": f"This week's daily reports:\n{'---\n'.join(daily_reports)}\n\nPlease generate this week's summary.",
                },
            ],
            temperature=0.3,
            max_tokens=1500,
        )

        return response.choices[0].message.content

# Scheduled tasks
generator = AIReportGenerator()

def daily_report_job():
    """Execute every day at 9:00"""
    print(f"📊 Generating {datetime.now().strftime('%Y-%m-%d')} daily report...")
    data = fetch_today_data()  # Your data fetching function
    report = generator.generate_daily_report(data)
    send_to_slack(report)  # Send to Slack/Feishu

# Register scheduled tasks
schedule.every().day.at("09:00").do(daily_report_job)
schedule.every().monday.at("10:00").do(weekly_report_job)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## Part 3: Automatic Social Media Content Generation

```python
class SocialMediaAI:
    """Social media operations assistant"""

    def generate_post(self, topic: str, platform: str = "WeChat Official Account") -> dict:
        """Generate a social media post"""

        platform_config = {
            "WeChat Official Account": {"max_length": 2000, "style": "Professional, in-depth, suitable for long-form reading"},
            "Xiaohongshu (RED)": {"max_length": 1000, "style": "Lively, conversational, with emojis, suitable for lifestyle recommendations"},
            "Zhihu": {"max_length": 3000, "style": "Rigorous, logically clear, data-backed"},
            "Twitter/X": {"max_length": 280, "style": "Concise and punchy, with hashtags"},
        }

        config = platform_config.get(platform, platform_config["WeChat Official Account"])

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a {platform} content creator. Style: {config['style']}. Length: no more than {config['max_length']} characters.",
                },
                {
                    "role": "user",
                    "content": f"Please create a {platform} post about「{topic}」. Include: an engaging title, body text, and a call-to-action.",
                },
            ],
            temperature=0.8,  # Higher temperature for creative writing
            max_tokens=config["max_length"] // 2,
        )

        content = response.choices[0].message.content

        # Extract the title (first line is usually the title)
        lines = content.split("\n")
        title = lines[0] if lines else ""

        return {
            "platform": platform,
            "title": title.strip("# "),
            "content": content,
            "length": len(content),
        }

    def generate_hashtags(self, topic: str, count: int = 5) -> list[str]:
        """Generate hashtags"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate {count} trending hashtags for「{topic}」. Output only the hashtags, one per line, starting with #.",
                },
            ],
            temperature=0.7,
            max_tokens=100,
        )

        tags = response.choices[0].message.content.strip().split("\n")
        return [t.strip() for t in tags if t.strip()]

    def repurpose_content(self, long_content: str, target_platform: str) -> str:
        """Content repurposing — adapt one piece of content for different platforms"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a content adaptation expert. Rewrite the following content to fit {target_platform}'s publishing style while keeping the core message intact.",
                },
                {"role": "user", "content": long_content},
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content

# Usage
smm = SocialMediaAI()

# One piece of content → multi-platform publishing
topic = "2026 China AI Development Trends"
wx_post = smm.generate_post(topic, "WeChat Official Account")
red_post = smm.repurpose_content(wx_post["content"], "Xiaohongshu (RED)")
twitter_post = smm.repurpose_content(wx_post["content"], "Twitter/X")

print(f"WeChat: {len(wx_post['content'])} chars")
print(f"RED: {len(red_post)} chars")
print(f"Twitter: {len(twitter_post)} chars")
```

---

## Part 4: GitHub Issues Auto-Classification

```python
import requests

class GitHubIssueClassifier:
    """GitHub Issue auto-classification"""

    def __init__(self, owner: str, repo: str):
        self.owner = owner
        self.repo = repo
        self.github_token = os.getenv("GITHUB_TOKEN")

    def get_new_issues(self) -> list[dict]:
        """Get unlabeled issues"""
        url = f"https://api.github.com/repos/{self.owner}/{self.repo}/issues"
        params = {"state": "open", "labels": "none", "per_page": 100}

        r = requests.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {self.github_token}"},
        )
        return r.json()

    def classify_issue(self, title: str, body: str) -> dict:
        """AI classifies the issue"""
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """You are an Issue classification assistant. Classify and output JSON:
{
  "type": "bug/feature/docs/question",
  "priority": "critical/high/medium/low",
  "area": "Frontend/Backend/Docs/CI-CD/Other",
  "suggested_label": "Appropriate label",
  "complexity": "Simple/Medium/Complex"
}""",
                },
                {
                    "role": "user",
                    "content": f"Issue title: {title}\n\nIssue description: {body[:2000]}",
                },
            ],
            temperature=0.1,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {
                "type": "question",
                "priority": "medium",
                "area": "Other",
            }

    def auto_label_issues(self):
        """Automatically label new issues"""
        issues = self.get_new_issues()

        for issue in issues:
            classification = self.classify_issue(issue["title"], issue["body"] or "")

            # Add labels
            labels = [classification["type"], f"priority:{classification['priority']}"]

            url = f"https://api.github.com/repos/{self.owner}/{self.repo}/issues/{issue['number']}/labels"
            requests.post(
                url,
                json={"labels": labels},
                headers={"Authorization": f"Bearer {self.github_token}"},
            )

            print(f"#{issue['number']} → {labels}")
            time.sleep(1)  # Avoid API rate limiting

# Usage
# classifier = GitHubIssueClassifier("your-org", "your-repo")
# classifier.auto_label_issues()
```

---

## Part 5: n8n Low-Code Automation

n8n is an open-source automation platform that lets you orchestrate AI workflows visually.

```json
// n8n workflow — auto-generate and email daily reports
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 9 * * *"}]
        }
      }
    },
    {
      "name": "Fetch Data",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM daily_stats WHERE date = CURRENT_DATE"
      }
    },
    {
      "name": "AI Generate Report",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.deepseek.com/v1/chat/completions",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Authorization", "value": "Bearer {{$env.DEEPSEEK_API_KEY}}"}
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "model", "value": "deepseek-v4-pro"},
            {"name": "messages", "value": "..."},
            {"name": "temperature", "value": 0.3}
          ]
        }
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "fromEmail": "ai@company.com",
        "toEmail": "team@company.com",
        "subject": "Daily Data Report",
        "text": "{{$json.choices[0].message.content}}"
      }
    }
  ]
}
```

---

## Automation ROI Calculation

| Automation Task | Manual Time/Day | AI Time/Day | Saved | Monthly Savings |
|-----------|-----------|-----------|------|--------|
| Email Classification | 30 min | 1 min | 29 min | ~10 hours |
| Daily Report Generation | 20 min | 30 sec | 20 min | ~7 hours |
| Social Media Ops | 60 min | 5 min | 55 min | ~18 hours |
| Issue Classification | 15 min | 1 min | 14 min | ~5 hours |
| **Total** | **125 min** | **8 min** | **117 min** | **~40 hours** |

> 40 hours = a full work week! AI automation can save you an entire full-time employee's worth of time each month.

---

## Next Steps

- [AI Customer Service Bot](/tutorials/ai-customer-service-bot-guide/)
- [AI Agent in Practice](/tutorials/ai-agent-chinese-models-guide/)

> 📝 Based on DeepSeek + Python + n8n, tested June 2026.
