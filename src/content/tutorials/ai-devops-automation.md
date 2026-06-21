---
title: "AI DevOps Automation with Chinese Models: Intelligent Ops, Log Analysis, Alert Noise Reduction & Self-Healing Using DeepSeek"
description: "Build intelligent DevOps systems with Chinese AI models: log anomaly detection, intelligent alert noise reduction, root cause analysis, and automated remediation suggestions. Complete solution with Prometheus, DeepSeek, and DingTalk/Feishu notifications."
category: "Practical Tutorials"
date: 2026-06-20
tags: ["DevOps", "Operations", "Logs", "Alerts", "Automation", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will build an AI-driven intelligent operations system:

- Intelligent log analysis and anomaly detection
- Alert noise reduction (100 alerts → 3 key insights)
- Automated root cause analysis
- AI auto-remediation suggestions

> 🎯 3 AM system alert → AI auto-analyzes root cause → executes remediation → only notifies you when it can't handle it.

---

## Intelligent Log Analysis

```python
import re
from datetime import datetime
from collections import defaultdict

class AILogAnalyzer:
    """AI intelligent log analysis"""

    def __init__(self):
        self.client = client

    def parse_log_batch(self, logs: list[str]) -> dict:
        """Batch log analysis"""
        logs_text = "\n".join(logs[-500:])  # Latest 500 entries

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the following server logs. Identify anomalies and patterns.

Log content:
{logs_text[:8000]}

Output JSON:
{{
  "summary": "Log summary (2 sentences)",
  "error_count": error count,
  "warning_count": warning count,
  "anomalies": [
    {{
      "timestamp": "Time",
      "level": "ERROR/WARN",
      "message": "Original log message",
      "root_cause": "AI-inferred root cause",
      "affected_component": "Affected service/component",
      "suggested_action": "Suggested action",
      "urgency": "critical/high/medium/low"
    }}
  ],
  "patterns": ["Anomaly patterns detected"],
  "new_errors": ["New error types (not seen before)"],
  "trend": "Trend assessment (deteriorating/improving/stable)"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=2000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"error": "Analysis failed"}

    def detect_anomaly_in_logs(self, recent_logs: str, baseline: str) -> dict:
        """Compare against baseline to detect anomalies"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Compare current logs against historical baseline to identify anomalies.

## Historical baseline (normal state)
{baseline[:3000]}

## Current logs
{recent_logs[:3000]}

Output JSON:
{{
  "is_anomalous": true/false,
  "deviation_score": 0-100,
  "new_error_types": ["Newly appeared error types"],
  "volume_change": "Change in log volume (e.g. '+300%')",
  "key_differences": ["Key differences from baseline"]
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
analyzer = AILogAnalyzer()

sample_logs = [
    "[2026-06-20 02:13:45] ERROR api-gateway: Connection timeout to user-service (10.0.1.5:8080)",
    "[2026-06-20 02:13:46] ERROR api-gateway: Circuit breaker opened for user-service",
    "[2026-06-20 02:13:50] WARN user-service: High memory usage detected (92%)",
    "[2026-06-20 02:14:00] ERROR user-service: OOM killer triggered",
    "[2026-06-20 02:14:01] INFO user-service: Service restarting...",
]

result = analyzer.parse_log_batch(sample_logs)
print(f"Error count: {result.get('error_count', '?')}")

for anomaly in result.get("anomalies", []):
    print(f"🚨 [{anomaly['urgency']}] {anomaly['root_cause']}")
    print(f"   Suggested: {anomaly['suggested_action']}")
```

---

## Intelligent Alert Noise Reduction

```python
class AlertSilencer:
    """Intelligent alert noise reduction — 100 alerts into 3 key insights"""

    def __init__(self):
        self.client = client
        self.alert_window = []  # Alerts within the time window

    def add_alert(self, alert: dict):
        """Add alert to window"""
        self.alert_window.append({
            **alert,
            "received_at": datetime.now().isoformat(),
        })

        # Keep only the last 5 minutes of alerts
        cutoff = datetime.now().timestamp() - 300
        self.alert_window = [
            a for a in self.alert_window
            if datetime.fromisoformat(a["received_at"]).timestamp() > cutoff
        ]

    def deduplicate_and_summarize(self) -> dict:
        """AI noise reduction: dedup + merge + summarize"""
        if not self.alert_window:
            return {"summary": "No active alerts"}

        alerts_text = json.dumps(self.alert_window[-100:], ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an SRE expert. Perform noise reduction analysis on these alerts.

Alert list: {alerts_text}

Output JSON:
{{
  "original_count": original alert count,
  "deduplicated_count": count after deduplication,
  "clusters": [
    {{
      "root_cause": "Root cause description (one sentence)",
      "symptoms": ["Related alert symptoms"],
      "affected_services": ["Affected services"],
      "severity": "critical/warning/info",
      "recommended_action": "Recommended handling approach",
      "eta": "Estimated time to repair",
      "auto_fixable": true/false
    }}
  ],
  "summary_for_oncall": "Summary for on-call engineer (under 100 words)",
  "should_wake_up_oncall": true/false
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=1500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"summary": "Analysis failed"}

    def should_alert_oncall(self, summary: dict) -> bool:
        """Determine whether to notify on-call staff"""
        return summary.get("should_wake_up_oncall", False)

# Usage
silencer = AlertSilencer()

# Simulate a flood of alerts
for i in range(20):
    silencer.add_alert({
        "source": "api-gateway",
        "message": f"Connection timeout to user-service (attempt {i+1})",
        "severity": "critical",
    })

for i in range(15):
    silencer.add_alert({
        "source": "user-service",
        "message": "High memory usage",
        "severity": "warning",
    })

result = silencer.deduplicate_and_summarize()
print(f"Original alerts: {result.get('original_count')} → After noise reduction: {result.get('deduplicated_count')}")

for cluster in result.get("clusters", []):
    print(f"\n🔍 Root cause: {cluster['root_cause']}")
    print(f"   Severity: {cluster['severity']}")
    print(f"   Recommended: {cluster['recommended_action']}")

if result.get("should_wake_up_oncall"):
    print("\n🚨 On-call staff needs to be notified!")
```

---

## Root Cause Analysis

```python
class RootCauseAnalyzer:
    """AI root cause analysis"""

    def analyze_incident(self, incident: dict) -> dict:
        """Analyze incident root cause"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the root cause of the incident.

Incident info: {json.dumps(incident, ensure_ascii=False)}

Output JSON:
{{
  "incident_summary": "Incident overview",
  "timeline": ["Event timeline"],
  "root_cause": {{
    "category": "code bug/config error/resource exhaustion/network failure/dependency service/human error",
    "description": "Detailed root cause description",
    "confidence": "high/medium/low"
  }},
  "impact": {{
    "users_affected": "Estimated number of affected users",
    "duration": "Duration",
    "data_loss": true/false,
    "revenue_impact": "Revenue impact"
  }},
  "fix_steps": ["Remediation steps (ordered)"],
  "prevention": ["How to prevent recurrence"],
  "similar_incidents": ["Historically similar incidents"],
  "postmortem_draft": "Incident postmortem draft"
}}""",
                },
            ],
            temperature=0.2,
            max_tokens=2000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def analyze_from_metrics(self, metrics: dict) -> dict:
        """Analyze from monitoring metrics"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the following monitoring metrics to identify anomalies.

Metrics data:
{json.dumps(metrics, ensure_ascii=False)[:6000]}

Output JSON:
{{
  "anomalous_metrics": ["Anomalous metric names and values"],
  "correlation": "Relationships between metrics",
  "likely_cause": "Most likely cause",
  "services_to_check": ["Services to check first"],
  "recovery_suggestions": ["Recovery suggestions"]
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
rca = RootCauseAnalyzer()

incident = {
    "time": "2026-06-20 02:13",
    "service": "api-gateway",
    "symptoms": [
        "API 响应时间从 50ms 飙升到 5000ms",
        "user-service 健康检查失败",
        "数据库连接池耗尽",
    ],
    "metrics": {
        "cpu": "95%",
        "memory": "92%",
        "db_connections": "200/200 (满)",
        "error_rate": "45%",
    },
    "recent_changes": ["2小时前部署了 v2.3.1"],
}

analysis = rca.analyze_incident(incident)
print(f"Root cause category: {analysis.get('root_cause', {}).get('category')}")
print(f"Root cause: {analysis.get('root_cause', {}).get('description')}")

for step in analysis.get("fix_steps", []):
    print(f"  🔧 {step}")
```

---

## Auto-Remediation Engine

```python
class AutoRemediator:
    """AI auto-remediation engine"""

    SAFE_ACTIONS = [
        "restart_service",
        "scale_up_pods",
        "clear_cache",
        "rollback_deployment",
        "adjust_circuit_breaker",
    ]

    DANGEROUS_ACTIONS = [
        "drop_database",
        "delete_data",
        "modify_production_config",
    ]

    def __init__(self, auto_approve_safe: bool = False):
        self.auto_approve_safe = auto_approve_safe
        self.client = client

    def suggest_fix(self, alert: dict, context: dict) -> dict:
        """AI suggests a fix plan"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Provide a remediation plan for the following incident.

Alert: {json.dumps(alert, ensure_ascii=False)}
Context: {json.dumps(context, ensure_ascii=False)[:3000]}

Output JSON:
{{
  "diagnosis": "Incident diagnosis",
  "fixes": [
    {{
      "action": "Action name",
      "command": "Specific command or API call",
      "risk_level": "safe/medium/dangerous",
      "expected_effect": "Expected effect",
      "rollback": "How to roll back",
      "estimated_time": "Estimated time"
    }}
  ],
  "recommended_fix": "Recommended approach (pick the safest and most effective)",
  "manual_intervention_required": true/false
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

    def execute_fix(self, fix_plan: dict) -> dict:
        """Execute remediation (only safe actions can run automatically)"""
        results = []

        for fix in fix_plan.get("fixes", []):
            if fix["risk_level"] == "safe" and self.auto_approve_safe:
                # Auto-execute safe actions
                result = self._execute_action(fix)
                results.append({
                    "action": fix["action"],
                    "status": "executed" if result else "failed",
                    "auto": True,
                })
            elif fix["risk_level"] == "dangerous":
                results.append({
                    "action": fix["action"],
                    "status": "blocked",
                    "reason": "Dangerous action requires manual approval",
                })
            else:
                results.append({
                    "action": fix["action"],
                    "status": "pending_approval",
                    "reason": "Requires manual confirmation",
                })

        return {"results": results}

    def _execute_action(self, fix: dict) -> bool:
        """Execute a specific action"""
        action = fix.get("action", "")
        print(f"🔧 Auto-executing: {action}")

        if action == "restart_service":
            # kubectl rollout restart deployment/xxx
            pass
        elif action == "scale_up_pods":
            # kubectl scale deployment/xxx --replicas=5
            pass
        elif action == "rollback_deployment":
            # kubectl rollout undo deployment/xxx
            pass

        return True

# Usage
remediator = AutoRemediator(auto_approve_safe=True)

alert = {
    "service": "user-service",
    "error": "OOMKilled",
    "memory_usage": "98%",
}

context = {
    "namespace": "production",
    "recent_deployment": "v2.3.1 (2小时前)",
    "current_replicas": 3,
}

fix_plan = remediator.suggest_fix(alert, context)
print(f"Diagnosis: {fix_plan.get('diagnosis')}")
print(f"Recommended fix: {fix_plan.get('recommended_fix')}")

if not fix_plan.get("manual_intervention_required"):
    result = remediator.execute_fix(fix_plan)
    for r in result["results"]:
        print(f"  {'✅' if r['status'] == 'executed' else '⏸️'} {r['action']}: {r['status']}")
```

---

## Notification Integration (DingTalk / Feishu)

```python
import requests

class AlertNotifier:
    """Alert notifications — DingTalk / Feishu / WeCom"""

    def __init__(self):
        self.client = client

    def send_dingtalk(self, webhook_url: str, alert_summary: dict) -> bool:
        """Send DingTalk notification"""
        markdown_text = self._format_dingtalk_markdown(alert_summary)

        response = requests.post(webhook_url, json={
            "msgtype": "markdown",
            "markdown": {
                "title": f"🚨 {alert_summary.get('severity', 'Alert')} - {alert_summary.get('title', 'System Alert')}",
                "text": markdown_text,
            },
        })

        return response.status_code == 200

    def _format_dingtalk_markdown(self, summary: dict) -> str:
        """Format DingTalk Markdown"""
        return f"""## 🚨 AI Intelligent Alert

**Time**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Level**: {summary.get('severity', '?')}
**Status**: {summary.get('status', '?')}

---

### 📊 Overview
{summary.get('summary', 'None')}

### 🔍 AI Root Cause Analysis
{summary.get('root_cause', 'Analyzing...')}

### 🔧 Recommended Action
{summary.get('recommended_action', 'Pending confirmation')}

### 📈 Impact Scope
- Affected services: {', '.join(summary.get('affected_services', ['Unknown']))}
- Estimated recovery: {summary.get('eta', 'Unknown')}

---
> 🤖 AI Ops Assistant auto-analysis | [View Details]({summary.get('dashboard_url', '#')})
"""

    def send_feishu(self, webhook_url: str, alert_summary: dict) -> bool:
        """Send Feishu notification"""
        response = requests.post(webhook_url, json={
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": f"🚨 {alert_summary.get('title', 'System Alert')}"},
                    "template": "red" if alert_summary.get('severity') == 'critical' else "yellow",
                },
                "elements": [
                    {"tag": "div", "text": {"tag": "lark_md", "content": alert_summary.get('summary', '')}},
                    {"tag": "div", "text": {"tag": "lark_md", "content": f"**AI Analysis**: {alert_summary.get('root_cause', '')}"}},
                    {"tag": "div", "text": {"tag": "lark_md", "content": f"**Recommendation**: {alert_summary.get('recommended_action', '')}"}},
                    {
                        "tag": "action",
                        "actions": [
                            {"tag": "button", "text": {"tag": "plain_text", "content": "Confirm Handling"}, "type": "primary"},
                            {"tag": "button", "text": {"tag": "plain_text", "content": "View Details"}, "type": "default"},
                        ],
                    },
                ],
            },
        })
        return response.status_code == 200

# Usage
notifier = AlertNotifier()

alert_data = {
    "title": "user-service OOM",
    "severity": "critical",
    "summary": "user-service 因内存耗尽被 OOM Killer 终止，3个Pod全部重启。根因疑似 v2.3.1 引入内存泄漏。",
    "root_cause": "v2.3.1 中新增的缓存层未设置过期时间，导致内存持续增长。",
    "recommended_action": "1. 回滚到 v2.3.0 2. 增加内存限制到 4GB 3. 修复缓存过期逻辑",
    "affected_services": ["api-gateway", "user-service"],
    "eta": "15分钟",
}

# notifier.send_dingtalk("https://oapi.dingtalk.com/robot/send?access_token=xxx", alert_data)
# notifier.send_feishu("https://open.feishu.cn/open-apis/bot/v2/hook/xxx", alert_data)
```

---

## Next Steps

- [AI Code Review Automation](/tutorials/ai-code-review-automation/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> 📝 Based on DeepSeek + Prometheus + DingTalk/Feishu, June 2026.
