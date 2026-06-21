---
title: "Marketing Content Generation with Chinese AI: Copywriting, AIGC Posters, Short Video Scripts & SEO Optimization Using DeepSeek and Qwen"
description: "Build a marketing content factory with Chinese AI models: viral copy generation, AIGC marketing posters, short video scripts, SEO article optimization, and Xiaohongshu/Douyin content creation. Multi-platform adaptation with DeepSeek, Qwen, and Kimi."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Marketing", "Copywriting", "Poster", "Short Video", "SEO", "Beginner"]
level: "Beginner"
---

## What Problem Does This Tutorial Solve?

You will use AI to build a marketing content production line:

- Multi-platform viral copywriting (Xiaohongshu/Douyin/WeChat Official Accounts)
- AIGC marketing poster generation
- Short video script auto-writing
- SEO article optimization

> 🎯 One product selling point → AI automatically generates adapted copy for 5 platforms + posters + short video scripts. One person becomes an entire marketing department.

---

## Multi-Platform Copywriting Generator

```python
class MultiPlatformCopywriter:
    """Multi-platform marketing copy generation"""

    PLATFORM_STYLES = {
        "Xiaohongshu": {
            "tone": "Recommendation-style sharing, genuine and warm, with emojis",
            "structure": "Headline + Body + Hashtags",
            "max_length": 1000,
            "must_include": ["emojis", "hashtags #", "user experience"],
        },
        "Douyin": {
            "tone": "Lively and fun, conversational, with rhythm",
            "structure": "Hook (first 3 seconds) + Body + Engagement CTA",
            "max_length": 500,
            "must_include": ["engagement prompt", "rhythmic short sentences"],
        },
        "WeChat Official Account": {
            "tone": "Professional and in-depth, substantial content, narrative style",
            "structure": "Introduction + Segmented Discussion + Summary + CTA",
            "max_length": 2000,
            "must_include": ["data support", "section headers", "follow CTA"],
        },
        "Zhihu": {
            "tone": "Professional and rational, deep analysis, logical",
            "structure": "Conclusion First + Argumentation + Cases + Summary",
            "max_length": 3000,
            "must_include": ["data citations", "technical terminology", "objective analysis"],
        },
    }

    def __init__(self):
        self.client = client

    def generate_copy(
        self,
        product: str,
        features: list[str],
        target_audience: str,
        platform: str,
    ) -> str:
        """Generate copy for a specific platform"""
        style = self.PLATFORM_STYLES.get(platform, self.PLATFORM_STYLES["WeChat Official Account"])

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a senior {platform} marketing copywriting expert.

Product: {product}
Selling points: {', '.join(features)}
Target audience: {target_audience}

Copy requirements:
- Tone: {style['tone']}
- Structure: {style['structure']}
- Word count: No more than {style['max_length']}
- Must include: {', '.join(style['must_include'])}

Writing tips:
1. Opening must be compelling
2. Highlight core product selling points (don't just list them)
3. Use scenario-based descriptions the audience can relate to
4. End with a clear call to action""",
                },
            ],
            temperature=0.8,
            max_tokens=1500,
        )
        return response.choices[0].message.content

    def generate_all_platforms(self, product: str, features: list[str], audience: str) -> dict:
        """One-click generation of copy for all platforms"""
        results = {}
        for platform in self.PLATFORM_STYLES:
            print(f"✍️ Generating {platform} copy...")
            results[platform] = self.generate_copy(product, features, audience, platform)
        return results

    def generate_headlines(self, product: str, angle: str = "General", count: int = 10) -> list[str]:
        """Batch generate headlines"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate {count} viral headlines for the following product.

Product: {product}
Angle: {angle}

Output JSON array: ["Headline 1", "Headline 2", ...]

Headline types to cover:
- Number-based ("3 Ways to...")
- Question-based ("Why does your... always...")
- Comparison-based ("Stop... and try this instead...")
- Fear-based ("If you don't... you will...")
- Benefit-based ("Learn this trick, boost... by 10x")
- Story-based ("From 0 to... how I did it")""",
                },
            ],
            temperature=0.9,
            max_tokens=800,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
copywriter = MultiPlatformCopywriter()

# Generate Xiaohongshu copy
xiaohongshu_copy = copywriter.generate_copy(
    product="AI Smart Study Lamp",
    features=["Eye protection mode", "AI posture reminder", "Study time tracking", "Parent remote viewing"],
    target_audience="Parents of elementary school students, concerned about children's eyesight and study habits",
    platform="Xiaohongshu",
)
print(xiaohongshu_copy[:300])

# Generate headlines
headlines = copywriter.generate_headlines("AI Smart Study Lamp", "Parent perspective")
for i, h in enumerate(headlines[:5]):
    print(f"  {i+1}. {h}")
```

---

## AIGC Marketing Posters

```python
class AIGCPosterGenerator:
    """AI marketing poster generation"""

    def __init__(self):
        self.client = client

    def generate_poster_prompt(self, product: str, style: str, occasion: str) -> dict:
        """Generate poster design prompt"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design a marketing poster for the following product.

Product: {product}
Design style: {style}
Usage scenario: {occasion}

Output JSON:
{{
  "image_prompt": "English prompt for AI image generation (detailed scene description)",
  "image_prompt_cn": "Chinese version prompt",
  "headline": "Main poster headline (within 10 characters)",
  "subtitle": "Subtitle (within 15 characters)",
  "cta": "Call to action button text",
  "color_scheme": ["Primary color", "Secondary color", "Accent color"],
  "layout": "Layout description",
  "font_style": "Font style suggestion",
  "visual_elements": ["Key visual elements"],
  "mood": "Overall mood"
}}""",
                },
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def prompt_to_image(self, prompt: str, provider: str = "jimeng") -> str:
        """Convert prompt to image"""
        if provider == "jimeng":
            # Jimeng AI (ByteDance)
            import volcenginesdkarkruntime
            client = volcenginesdkarkruntime.Ark(api_key=os.getenv("VOLCENGINE_API_KEY"))
            response = client.images.generate(
                model="doubao-seedream-3-0",
                prompt=prompt,
                size="1024x1024",
            )
            return response.data[0].url

        elif provider == "tongyi":
            # Tongyi Wanxiang (Alibaba)
            import dashscope
            response = dashscope.ImageSynthesis.call(
                model="wanx-v1",
                prompt=prompt,
                n=1,
                size="1024*1024",
            )
            return response.output.results[0].url

        return ""

# Usage
poster_gen = AIGCPosterGenerator()

poster = poster_gen.generate_poster_prompt(
    product="AI Smart Study Lamp",
    style="Minimalist tech feel, warm tones, family scene",
    occasion="618 Shopping Festival",
)

print(f"Headline: {poster.get('headline')}")
print(f"Subtitle: {poster.get('subtitle')}")
print(f"Color scheme: {poster.get('color_scheme')}")
print(f"Image Prompt: {poster.get('image_prompt', '')[:200]}")

# image_url = poster_gen.prompt_to_image(poster['image_prompt'])
```

---

## Short Video Script Generation

```python
class ShortVideoScriptWriter:
    """Short video script generation"""

    def __init__(self):
        self.client = client

    def generate_script(
        self,
        product: str,
        video_type: str = "Product Review",
        duration: int = 60,
    ) -> dict:
        """Generate short video script"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Write a {duration}-second {video_type} short video script.

Product: {product}

Output JSON:
{{
  "title": "Video title (click-enticing)",
  "hook": "Opening 3-second hook (one sentence to grab attention)",
  "scenes": [
    {{
      "time": "00:00-00:05",
      "visual": "Visual description",
      "audio": "Voiceover/narration",
      "text_overlay": "Subtitle text",
      "transition": "Transition effect"
    }}
  ],
  "bgm_suggestion": "Background music suggestion",
  "hashtags": ["Recommended hashtags"],
  "estimated_engagement": "Estimated engagement rate description"
}}

Pacing requirements:
- Switch visuals every 3-5 seconds
- First 3 seconds must have a strong hook
- Middle section should have a climax/twist
- End with engagement CTA (like/follow/comment)""",
                },
            ],
            temperature=0.8,
            max_tokens=1500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_live_stream_script(self, product: str, duration_minutes: int = 30) -> dict:
        """Generate live stream script"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Write a {duration_minutes}-minute live stream script.

Product: {product}

Output JSON:
{{
  "flow": [
    {{
      "phase": "Phase name (Opening Warm-Up/Product Introduction/Demo/Promotion Hard Sell/Closing)",
      "duration": "Duration (minutes)",
      "script": "Host script",
      "key_actions": ["Key actions"],
      "props": ["Props needed"]
    }}
  ],
  "talking_points": ["Key selling point scripts"],
  "objection_handling": [{{"objection": "Common objection", "response": "Response script"}}],
  "closing_technique": "Hard sell technique"
}}""",
                },
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
script_writer = ShortVideoScriptWriter()

# 60-second product review short video
script = script_writer.generate_script(
    product="AI Smart Study Lamp",
    video_type="Product Review",
    duration=60,
)

print(f"Title: {script.get('title')}")
print(f"Hook: {script.get('hook')}")

for scene in script.get("scenes", []):
    print(f"  {scene['time']} | {scene['visual']} | {scene['audio'][:30]}")

# 30-minute live stream script
live_script = script_writer.generate_live_stream_script("AI Smart Study Lamp", 30)
for phase in live_script.get("flow", []):
    print(f"\n📺 {phase['phase']} ({phase['duration']} min)")
    print(f"   {phase['script'][:100]}")
```

---

## SEO Article Optimization

```python
class SEOOptimizer:
    """AI SEO content optimization"""

    def optimize_article(self, title: str, content: str, target_keywords: list[str]) -> dict:
        """Optimize article SEO"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Optimize the SEO of the following article.

Original title: {title}
Target keywords: {', '.join(target_keywords)}

Article content:
{content[:4000]}

Output JSON:
{{
  "optimized_title": "Optimized title (includes keywords, within 60 characters)",
  "meta_description": "Meta description (within 150 characters, includes keywords)",
  "h2_suggestions": ["Suggested H2 section headers"],
  "keyword_placement": {{
    "current_density": "Current keyword density",
    "suggested_additions": ["Positions where keywords should be added"]
  }},
  "internal_links": ["Suggested internal links"],
  "featured_snippet_optimization": "Featured snippet optimization suggestions",
  "readability_score": "Readability assessment",
  "improvements": ["Specific improvement suggestions"]
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def analyze_competitor_content(self, my_content: str, competitor_content: str) -> dict:
        """Analyze competitor content gaps"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Compare and analyze content gaps between two articles.

My content: {my_content[:3000]}

Competitor content: {competitor_content[:3000]}

Output JSON:
{{
  "content_gaps": ["Content competitor has that I'm missing"],
  "my_advantages": ["What I do better than the competitor"],
  "keyword_coverage": {{"mine": ["My keywords"], "theirs": ["Competitor keywords"], "missing": ["Keywords I'm missing"]}},
  "structure_comparison": "Structure comparison",
  "action_items": ["Improvement checklist (priority ordered)"]
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
seo = SEOOptimizer()

article = """
AI study lamps are changing how children learn. This lamp not only illuminates but also detects posture.
It uses AI algorithms to analyze children's eye habits and alerts when poor posture is detected.
Parents can view their child's study duration and focus reports through a mobile app.
"""

result = seo.optimize_article(
    title="Is the AI study lamp any good? Is it worth buying?",
    content=article,
    target_keywords=["AI study lamp", "smart eye protection lamp", "student desk lamp recommendation", "posture correction lamp"],
)

print(f"Optimized title: {result.get('optimized_title')}")
print(f"Meta description: {result.get('meta_description')}")
for imp in result.get("improvements", []):
    print(f"  📝 {imp}")
```

---

## Marketing Content Calendar

```python
class ContentCalendar:
    """AI marketing content calendar"""

    def generate_monthly_plan(self, product: str, month: str, events: list[str]) -> list[dict]:
        """Generate monthly content calendar"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Create a content marketing calendar for {product} for {month}.

Monthly hot topics: {', '.join(events)}

Output JSON array (2-3 pieces of content per week):
[
  {{
    "date": "Date",
    "platform": "Platform",
    "content_type": "Image+Text/Short Video/Livestream/Article",
    "topic": "Content topic",
    "hook": "Hook",
    "hashtags": ["Hashtags"],
    "goal": "Goal (Exposure/Conversion/Engagement)"
  }}
]

Pacing:
- Publish Monday/Wednesday/Friday
- Light interaction content on weekends
- Must chase trending events on the day they happen""",
                },
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
calendar = ContentCalendar()

plan = calendar.generate_monthly_plan(
    product="AI Smart Study Lamp",
    month="June 2026",
    events=["Summer break begins", "618 aftermath sale", "Final exam week"],
)

for item in plan:
    print(f"📅 {item.get('date')} | {item.get('platform')} | {item.get('content_type')}")
    print(f"   {item.get('topic')}")
```

---

## Next Steps

- [AI Video Editing](/tutorials/ai-video-editing-guide/)
- [AI Image Generation](/tutorials/ai-image-generation-china-guide/)

> 📝 Based on DeepSeek + Jimeng/Tongyi Wanxiang, June 2026.
