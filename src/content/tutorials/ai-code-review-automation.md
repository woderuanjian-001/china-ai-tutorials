---
title: "Automated Code Review with Chinese AI: GitHub CI/CD Integration, Security Scanning & Quality Gates Using DeepSeek"
description: "Build an automated code review system with Chinese AI models: GitHub/GitLab CI/CD integration, AI-powered code quality scanning, security vulnerability detection, and coding standard enforcement. Complete solution with GitHub Actions and DeepSeek."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Code Review", "CI/CD", "GitHub", "Security", "Automation", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will build an AI-powered automated code review pipeline:

- GitHub/GitLab PR automatic review
- AI code quality scanning
- Automatic security vulnerability detection
- Code standard quality gates

> Every PR triggers an AI auto-review that catches issues before developers even see them. Human reviewers only need to focus on architecture and business logic.

---

## GitHub Actions Integration

```yaml
# .github/workflows/ai-code-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install openai requests

      - name: AI Code Review
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: python scripts/ai_review.py

      - name: Post Review Comment
        if: always()
        run: python scripts/post_review.py
```

---

## AI Review Engine

```python
import os
import subprocess
import json
from openai import OpenAI

class AICodeReviewer:
    """AI automated code reviewer"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

    def get_pr_diff(self) -> str:
        """Get the PR's code diff"""
        result = subprocess.run(
            ["git", "diff", "origin/main...HEAD"],
            capture_output=True,
            text=True,
        )
        return result.stdout

    def review_diff(self, diff: str, language: str = "python") -> dict:
        """AI review of code changes"""
        if not diff.strip():
            return {"findings": [], "summary": "No code changes"}

        # Split large diffs into chunks
        chunks = self._split_diff(diff, max_chars=6000)

        all_findings = []
        for i, chunk in enumerate(chunks):
            print(f"Reviewing chunk {i+1}/{len(chunks)}...")
            findings = self._review_chunk(chunk, language)
            all_findings.extend(findings)

        # Deduplicate
        unique_findings = self._dedupe_findings(all_findings)

        # Generate review summary
        summary = self._generate_summary(unique_findings)

        return {
            "findings": unique_findings,
            "summary": summary,
            "total_issues": len(unique_findings),
        }

    def _review_chunk(self, diff_chunk: str, language: str) -> list[dict]:
        """Review a single code chunk"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a senior {language} code reviewer. Review the following code changes.

Output JSON array:
[
  {{
    "file": "File path",
    "line": Approximate line number,
    "severity": "critical/high/medium/low/info",
    "category": "bug/security/performance/style/maintainability",
    "title": "Brief issue description (max 15 words)",
    "description": "Detailed explanation",
    "suggestion": "Fix suggestion (with code example)",
    "rule": "Violated standard"
  }}
]

Review dimensions:
1. Potential bugs — logic errors, null pointers, edge cases
2. Security — SQL injection, XSS, secret leaks, insecure crypto
3. Performance — N+1 queries, memory leaks, unnecessary loops
4. Code style — naming, comments, function length
5. Maintainability — coupling, duplicate code, missing tests

Notes:
- Only report real issues; do not nitpick
- Mention clearly positive improvements if any
- Mark uncertain issues as info level""",
                },
                {"role": "user", "content": diff_chunk[:6000]},
            ],
            temperature=0.2,
            max_tokens=2048,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def _split_diff(self, diff: str, max_chars: int = 6000) -> list[str]:
        """Split large diffs into multiple chunks"""
        lines = diff.split("\n")
        chunks = []
        current = []

        for line in lines:
            current.append(line)
            if len("\n".join(current)) > max_chars:
                chunks.append("\n".join(current))
                current = []

        if current:
            chunks.append("\n".join(current))

        return chunks

    def _dedupe_findings(self, findings: list[dict]) -> list[dict]:
        """Deduplicate similar findings"""
        seen = set()
        unique = []

        for f in findings:
            key = f"{f.get('file', '')}:{f.get('line', '')}:{f.get('title', '')}"
            if key not in seen:
                seen.add(key)
                unique.append(f)

        return unique

    def _generate_summary(self, findings: list[dict]) -> str:
        """Generate review summary"""
        if not findings:
            return "No issues found — code quality is good."

        critical = len([f for f in findings if f["severity"] == "critical"])
        high = len([f for f in findings if f["severity"] == "high"])
        medium = len([f for f in findings if f["severity"] == "medium"])
        low = len([f for f in findings if f["severity"] == "low"])

        bugs = len([f for f in findings if f["category"] == "bug"])
        security = len([f for f in findings if f["category"] == "security"])
        perf = len([f for f in findings if f["category"] == "performance"])

        return f"""## AI Code Review Report

| Level | Count |
|------|------|
| Critical | {critical} |
| High | {high} |
| Medium | {medium} |
| Low | {low} |

**Issue Categories**: Bug: {bugs} | Security: {security} | Performance: {perf}

{'Critical issues found — recommend fixing before merging' if critical > 0 else 'Issues requiring attention found' if high > 0 else 'Code quality is good'}"""

    def approve_or_block(self, findings: list[dict]) -> dict:
        """Decide whether to block the merge"""
        critical = [f for f in findings if f["severity"] == "critical"]
        high = [f for f in findings if f["severity"] == "high"]

        if critical:
            return {
                "action": "block",
                "reason": f"Found {len(critical)} critical issue(s) requiring fixes",
            }
        elif high:
            return {
                "action": "request_changes",
                "reason": f"Found {len(high)} high-priority issue(s) — recommend fixing",
            }
        else:
            return {
                "action": "approve",
                "reason": "No blocking issues found",
            }

# Usage
reviewer = AICodeReviewer()
diff = reviewer.get_pr_diff()
result = reviewer.review_diff(diff)

print(result["summary"])

for finding in result["findings"]:
    emoji = {"critical": "CRIT", "high": "HIGH", "medium": "MED", "low": "LOW", "info": "INFO"}
    print(f"\n{emoji.get(finding['severity'], '?')} [{finding['category']}] {finding['title']}")
    print(f"   File: {finding['file']}:{finding['line']}")
    print(f"   Suggestion: {finding['suggestion'][:100]}")

decision = reviewer.approve_or_block(result["findings"])
print(f"\n{'APPROVED' if decision['action'] == 'approve' else 'BLOCKED'}: {decision['reason']}")
```

---

## Security Vulnerability Scanner

```python
class AISecurityScanner:
    """AI security vulnerability scanner"""

    SECURITY_RULES = [
        "hardcoded_secrets",
        "sql_injection",
        "xss_vulnerability",
        "path_traversal",
        "insecure_crypto",
        "missing_auth",
        "sensitive_logging",
    ]

    def scan_security(self, file_path: str) -> list[dict]:
        """Scan a single file for security issues"""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Security review of the following code. Check for:
{', '.join(self.SECURITY_RULES)}

Output JSON array:
[
  {{
    "rule": "Rule name",
    "line": Line number,
    "severity": "critical/high/medium",
    "code_snippet": "Problematic code (one line)",
    "explanation": "Why this is a security issue",
    "fix": "Fix code",
    "cwe": "CWE number"
  }}
]

Important:
- Hardcoded keys/tokens/passwords must be critical
- SQL string concatenation must be critical
- Insecure encryption algorithms must be high""",
                },
                {"role": "user", "content": content[:8000]},
            ],
            temperature=0.1,
            max_tokens=1500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def scan_project(self, project_dir: str) -> dict:
        """Scan an entire project"""
        import glob

        findings = {}
        patterns = ["**/*.py", "**/*.js", "**/*.ts", "**/*.java", "**/*.go"]

        for pattern in patterns:
            for file_path in glob.glob(f"{project_dir}/{pattern}", recursive=True):
                # Skip node_modules, venv, .git
                if any(skip in file_path for skip in ["node_modules", "venv", ".git", "__pycache__"]):
                    continue

                issues = self.scan_security(file_path)
                if issues:
                    findings[file_path] = issues

        return findings

# Usage
scanner = AISecurityScanner()
# findings = scanner.scan_project("./my-project")
# for file, issues in findings.items():
#     for issue in issues:
#         print(f"SECURITY: {file}:{issue['line']} — {issue['rule']}")
```

---

## Code Quality Gate

```python
class QualityGate:
    """Code quality gate — blocks merge if standards not met"""

    def __init__(self):
        self.client = client

    def check_all(self, review_result: dict, security_findings: dict, test_coverage: float) -> dict:
        """Comprehensive quality check"""
        gates = []

        # Gate 1: No critical issues
        critical_count = len([f for f in review_result.get("findings", []) if f["severity"] == "critical"])
        gates.append({
            "gate": "Critical Issues",
            "passed": critical_count == 0,
            "detail": f"Found {critical_count} critical issue(s)",
            "required": "0 critical issues",
        })

        # Gate 2: No high-severity security vulnerabilities
        high_sec = sum(
            len([i for i in issues if i["severity"] in ("critical", "high")])
            for issues in security_findings.values()
        )
        gates.append({
            "gate": "Security Vulnerabilities",
            "passed": high_sec == 0,
            "detail": f"Found {high_sec} high-severity vulnerability(s)",
            "required": "0 high-severity vulnerabilities",
        })

        # Gate 3: Test coverage
        gates.append({
            "gate": "Test Coverage",
            "passed": test_coverage >= 80,
            "detail": f"Current coverage {test_coverage}%",
            "required": ">= 80%",
        })

        all_passed = all(g["passed"] for g in gates)

        return {
            "passed": all_passed,
            "gates": gates,
            "verdict": "Passed quality gate" if all_passed else "Failed quality gate — please fix and retry",
        }

# Usage
gate = QualityGate()

# Simulated check
result = gate.check_all(
    review_result={"findings": [{"severity": "high"}]},
    security_findings={"app.py": [{"severity": "critical", "rule": "hardcoded_secrets"}]},
    test_coverage=85.5,
)

for g in result["gates"]:
    icon = "PASS" if g["passed"] else "FAIL"
    print(f"{icon} {g['gate']}: {g['detail']} (Required: {g['required']})")

print(f"\n{result['verdict']}")
```

---

## Review Result Formatting

```python
def format_review_comment(review_result: dict) -> str:
    """Format as GitHub PR comment"""

    comment = f"""## AI Code Review

{review_result.get('summary', '')}

---

### Detailed Findings

| Level | Category | File | Issue |
|------|------|------|------|
"""

    for f in review_result.get("findings", [])[:20]:
        emoji = {"critical": "CRIT", "high": "HIGH", "medium": "MED", "low": "LOW", "info": "INFO"}
        comment += f"| {emoji.get(f['severity'], '?')} | {f['category']} | `{f['file']}` | {f['title']} |\n"

    if len(review_result.get("findings", [])) > 20:
        comment += f"\n...and {len(review_result['findings']) - 20} more issue(s)\n"

    comment += f"""

---
<details>
<summary>View Details</summary>

"""
    for f in review_result.get("findings", [])[:10]:
        comment += f"""
### {f.get('title', '')}
- **File**: `{f.get('file', '')}:{f.get('line', '')}`
- **Level**: {f.get('severity', '')}
- **Description**: {f.get('description', '')}

**Fix Suggestion**:
```{f.get('language', 'python')}
{f.get('suggestion', '')}
```

---
"""

    comment += f"""
</details>

> Auto-generated by AI | {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""

    return comment
```

---

## Next Steps

- [AI Coding Tools Comparison](/tutorials/ai-coding-assistant-comparison/)
- [Enterprise AI Deployment](/tutorials/enterprise-ai-deployment-guide/)

> Based on DeepSeek + GitHub Actions, June 2026.
