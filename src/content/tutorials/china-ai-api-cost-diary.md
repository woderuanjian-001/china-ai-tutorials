---
title: "中国 AI API 花费日记：$17.61 vs OpenAI $340，28 天实测"
description: "用 DeepSeek V4、Qwen 3、Kimi K2、Qwen-VL-Max、Doubao TTS 构建法律文档 Q&A 工具的 28 天花费日记。逐日记账，包括一个 $6.20 的 bug 事故——以及同样的 bug 在 OpenAI 上要花 $130。"
category: "Cost Analysis"
date: 2026-06-25
tags: ["成本", "DeepSeek", "Qwen", "Kimi", "TTS", "对比", "创业", "日记", "真实花费"]
image: "/images/og-china-ai-api-cost-diary.png"
level: "Advanced"

---

> 📌 **Disclosure**：部分链接为 affiliate 链接，我们可能从中获得佣金，您无需额外付费。本文为 28 天完整实验记录（2026 年 6 月 10 日 – 7 月 7 日），于实验结束后整理发布。API 价格可能变动，请以官方最新定价为准。

## 这篇教程解决什么问题？

你在 Twitter 上看到过这种截图：某独立开发者晒出 API 账单，一天的生产流量只花了 31 美分。你滚动过去了，然后又滚回来看。31 美分。

你上个月的 OpenAI 账单是 $340。同样的工作量。

**这到底是真的还是营销？**

这篇文章用一个真实产品——为小型律师事务所构建的文档 Q&A 工具——完整记录了 28 天里每一分钱的 API 花费。不是理论计算，不是跑分测试，而是：

- 逐日账单（每天记录花了多少钱、花在哪里）
- 一个真实的 rate limit bug 导致的 $6.20 浪费事故（以及为什么同样的 bug 在 OpenAI 上要花 $130）
- 最终账单：**$17.61 vs OpenAI $340.20，差距 19 倍**
- 「真正的坑」分析——不是模型质量，而是支付方式

读完这篇文章，你会知道中国 AI API 到底省不省钱、省钱的前提是什么、以及怎么避免踩坑。

---

I almost didn't believe the tweet.

Someone on my feed — a dev I vaguely know, builds indie SaaS stuff — posted a screenshot of their API bill. Thirty-one cents. For a full day of production traffic. Processing thousands of documents. I scrolled past it, then scrolled back. Thirty-one cents.

My last OpenAI bill had been $340. Same month, roughly same workload.

So I did what any skeptical engineer does. I decided to burn a month proving this person wrong. I'd build a real thing, use real Chinese AI APIs in production, track every single cent, and expose the catch. Because there's always a catch. Right?

There was a catch. Just not the one I expected.

## The Project

I'd been sitting on an idea for months: a document Q&A tool for small law firms. You upload contracts, pleadings, discovery docs — the tool extracts text, lets you ask questions in plain English, and reads answers back to you. Not rocket science. The kind of thing that's trivial to prototype but expensive to run at scale, because every document needs text extraction, every question needs an LLM call, and the TTS feature eats tokens like candy.

Three model types needed:

- **Text LLM** for extraction and Q&A (the heavy lifter)
- **Vision model** for scanning handwritten notes and poorly scanned PDFs
- **TTS** for the audio playback feature

I planned to use the OpenAI-compatible API endpoints that DeepSeek, Qwen, and others expose. Same SDK, same request format, different base URL. Model switching is a one-line change. That part turned out to be genuinely easy.

Here's the pricing I was working with, all per million tokens unless noted:

| Model | Input | Output |
|-------|-------|--------|
| DeepSeek V4 | $0.14 | $0.28 |
| Qwen 3 | $0.10 | $0.30 |
| Kimi K2 | $0.12 | $0.35 |
| GPT-5 | $5.00 | $15.00 |
| Claude Sonnet 4 | $3.00 | $15.00 |

| Vision/TTS | Per 1K calls/chars |
|------------|-------------------|
| Qwen-VL-Max | $0.40 / 1K calls |
| GPT-5 Vision | $7.50 / 1K calls |
| Doubao TTS | $0.02 / 1K chars |
| OpenAI TTS | $15.00 / 1K chars |

Read those again. The TTS gap alone is 750x.

I know. I didn't believe it either.

## Week 1: "This Can't Be Real"

> **Day 1 — June 10**
> Spent the evening wiring up the basic pipeline. DeepSeek V4 for text extraction, Qwen-VL-Max for OCR on scanned pages, Doubao TTS for audio output. Used the OpenAI SDK with a swapped base URL. Three lines of config changed. That's it. Everything responded. I kept refreshing the billing dashboard expecting to see something — anything — show up.
> Cost so far: $0.00.

> **Day 2 — June 11**
> Processed my first real batch: 47 sample contracts from a friend's law firm. Average doc is about 3,000 tokens of input, 400 tokens of extracted output. Plus 12 scanned pages that needed Qwen-VL.
>
> DeepSeek V4: 141K input tokens × $0.14/M + 18.8K output × $0.28/M = $0.0197 + $0.0053 = **$0.025**
> Qwen-VL-Max: 12 calls × $0.40/1K = **$0.0048**
> Doubao TTS: 8K chars × $0.02/1K = **$0.00016**
>
> Total: $0.03.
>
> Three cents. I spent more on the coffee I drank while writing this entry.

> **Day 3 — June 12**
> Okay, I need to talk about the elephant. I did the math on what this same batch would've cost with OpenAI. Same 47 documents, same workload.
>
> GPT-5 extraction: 141K × $5.00/M + 18.8K × $15.00/M = $0.705 + $0.282 = **$0.99**
> GPT-5 Vision: 12 × $7.50/1K = **$0.09**
> OpenAI TTS: 8K × $15/1K = **$0.12**
>
> Total: $1.20.
>
> So $0.03 vs $1.20. A 40x difference. On 47 documents.
>
> I'm not sure whether to be happy or suspicious.

> **Day 5 — June 14**
> Scaled up testing. Ran 200 documents through the pipeline — mix of clean PDFs and garbage-quality scans. Threw in some Kimi K2 for comparison on the Q&A side, since its long-context handling is supposedly better for legal docs.
>
> Kimi K2 Q&A: 180K input × $0.12/M + 45K output × $0.35/M = $0.0216 + $0.0158 = **$0.037**
> DeepSeek V4 extraction: 600K input × $0.14/M + 80K output × $0.28/M = $0.084 + $0.0224 = **$0.106**
> Qwen-VL-Max: 45 calls × $0.40/1K = **$0.018**
> Doubao TTS: 22K chars × $0.02/1K = **$0.00044**
>
> Day 5 total: $0.16.
>
> Had GPT-5 handled this? $6.40. With Claude Sonnet 4? $4.80.
>
> I've started screenshotting the billing dashboard. Partly for this diary, partly because I still think something's broken and the real bill will show up later.

> **Day 7 — June 16**
> End of Week 1. Ran some optimization tests — tried Qwen 3 for extraction since its input price is the cheapest at $0.10/M. Quality was... fine? Maybe 90% as good as DeepSeek V4 on clean text. For messy scans, DeepSeek still wins. Decision: Qwen 3 for clean PDFs, DeepSeek V4 for everything else, Kimi K2 for long-context Q&A where the doc exceeds 60K tokens.
>
> Week 1 total spend: **$0.41**.
> Projected OpenAI equivalent: **$18.70**.

## Week 2: Real Users, Real Traffic

I soft-launched the tool to three law firms. Free trial, no marketing, just a Calendly link and a demo. Two of them signed up immediately. The third wanted a custom integration with their case management system, which meant more API calls.

> **Day 8 — June 17**
> First real users. 340 documents processed today across two firms. A mix of contracts, deposition transcripts, and discovery requests. The deposition transcripts are long — 15K to 25K tokens each — so those went to Kimi K2.
>
> DeepSeek V4: 420K in × $0.14/M + 90K out × $0.28/M = $0.059 + $0.025 = **$0.084**
> Kimi K2: 1.8M in × $0.12/M + 120K out × $0.35/M = $0.216 + $0.042 = **$0.258**
> Qwen 3 (clean docs): 280K in × $0.10/M + 50K out × $0.30/M = $0.028 + $0.015 = **$0.043**
> Qwen-VL-Max: 68 calls × $0.40/1K = **$0.027**
> Doubao TTS: 45K chars × $0.02/1K = **$0.0009**
>
> Total: $0.41.
>
> OpenAI equivalent: ~$24.60.
>
> A partner at one of the firms emailed me: "This is faster than what we pay $400/month for." I almost forwarded her the API bill.

> **Day 10 — June 19**
> Third firm onboarded. Their case management integration means we're ingesting documents automatically — about 150/day on top of the manual uploads. Traffic is climbing.
>
> Today's volume: 520 documents. Discovered something interesting — Qwen 3 handles boilerplate contract language perfectly fine. No reason to waste DeepSeek tokens on standard NDAs and engagement letters. Routed all standard docs to Qwen 3, saved about 30% on text costs.
>
> Today's spend: **$0.58**. OpenAI equivalent: **~$34**.

> **Day 12 — June 21**
> A weird thing happened. One of the firms uploaded a 200-page lease agreement — single document, roughly 180K tokens. Kimi K2 chewed through it in about four seconds and produced a clean summary plus answered six follow-up questions. Total cost for that one document: $0.022.
>
> I looked up what it would cost to run the same thing through Claude Sonnet 4's 200K context window. Input alone: 180K × $3.00/M = $0.54. Plus output. Plus the six Q&A round-trips. Probably $0.80–$1.00 for the single document.
>
> Kimi did it for two cents.
>
> I'm starting to understand why the tweet said what it said.

> **Day 14 — June 23**
> Week 2 total: **$3.72**.
> Cumulative spend: **$4.13**.
> Projected OpenAI equivalent: **~$185**.
>
> The gap is widening as traffic grows. Fixed per-token costs compound. At this volume, I'd be burning through my OpenAI budget in four days. With Chinese APIs, I haven't hit a single dollar of concern.

## Week 3: The Incident

Here's where things got interesting. And by interesting I mean I almost had a heart attack.

> **Day 15 — June 24**
> Normal day. 480 documents. $0.52. Moving on.

> **Day 16 — June 25**
> Also normal. $0.48.

### Day 17：$7.80 的惊吓

> **Day 17 — June 26**
> Woke up to a billing alert. I'd set a threshold notification at $2.00/day — generous, given my daily average was hovering around $0.50. The alert said I'd hit $2.00. By 9 AM.
>
> Checked the dashboard. By noon: $4.10. By 3 PM: $7.80.
>
> My heart rate was genuinely elevated. Seven dollars is nothing in absolute terms, but a 15x spike from baseline means something is very wrong.

> **Day 17 (continued) — June 26, 11 PM**
> Found it. The case management integration for firm #3 had a bug. When the API returned a rate limit error (429), my retry logic — which I'd copy-pasted from an old OpenAI project — was retrying with exponential backoff. Except I'd forgotten to cap the retry count. And the rate limit was triggering because the integration was polling for new documents every 30 seconds, each poll triggering a Qwen 3 call to classify whether a document needed processing.
>
> So every 30 seconds, the system made a classification call, hit a rate limit, retried four times, and then made the actual processing call. Each "new document check" was generating 5 API calls instead of 1.
>
> The classification calls themselves were tiny — maybe 200 tokens each — but at 5x volume, 480 documents became 2,400 API calls. And the retries on the Q&A side were even worse: long-context Kimi K2 calls, each 50K–80K tokens, retried up to four times.
>
> Estimated wasted spend: **$6.20** out of the day's $7.80.
>
> Fix: added a max retry count of 2, added a circuit breaker, and switched the document classification poll to a webhook-based approach instead of polling.
>
> The funny part? Even with this screw-up, my total daily cost was $7.80. The same bug with OpenAI would've been $130+.

### 修复与反思

> **Day 18 — June 27**
> Fix deployed. Back to normal. $0.51 today. The $6.20 I wasted yesterday still stings — not because of the money, but because it was a dumb mistake. But I keep doing the mental math: that same dumb mistake with GPT-5 would've been a genuine problem. A $130 day. With Chinese APIs, it was a rounding error.
>
> This is the real advantage nobody talks about. It's not just that the APIs are cheaper. It's that cheaper APIs make you more willing to experiment. I can test a new prompt strategy on 500 documents without flinching. I can A/B test three models on the same workload. The cost of curiosity approaches zero.

### 廉价实验：TTS 新功能

> **Day 19 — June 28**
> Started experimenting with Doubao TTS for a new feature — generating audio summaries of document sets. Ran 120K characters through it today.
>
> Cost: 120K × $0.02/1K = **$0.0024**.
>
> Less than a quarter of a cent.
>
> OpenAI TTS for the same: 120K × $15/1K = **$1.80**.
>
> I'm building features I would've cut from the roadmap if I were on OpenAI pricing. That's not a small thing.

> **Day 21 — June 30**
> Week 3 total (including the incident): **$11.94**.
> Cumulative spend: **$16.07**.
> Projected OpenAI equivalent: **~$420**.

## Week 4: Settling In

> **Day 22 — July 1**
> New month. Added two more firms through word of mouth. Daily volume is now around 600–700 documents. Settled into a routing strategy that feels right:
>
> - Qwen 3: clean PDFs, standard contracts, boilerplate (cheapest input)
> - DeepSeek V4: messy scans, complex extraction, anything Qwen 3 fumbles
> - Kimi K2: long-context Q&A (>60K tokens), multi-document analysis
> - Qwen-VL-Max: handwritten notes, stamps, signatures
> - Doubao TTS: all audio output
>
> Today's spend: **$0.71**.

> **Day 24 — July 3**
> Hit an interesting edge case. One firm uploaded a batch of old court filings — scanned on what must've been a fax machine from 1997. Qwen-VL-Max struggled. Switched to running them through twice: once for raw OCR, once for cleanup. Doubled the vision cost for those docs, but we're talking $0.0008 per page instead of $0.0004. I can afford to run OCR twice.

> **Day 25 — July 4**
> Holiday in the US. Traffic dropped to 200 documents. $0.22. Enjoyed the irony of American independence day being my cheapest day.

> **Day 28 — July 7**
> Final day of the diary. 650 documents. Clean day, no incidents.
>
> DeepSeek V4: 980K in × $0.14/M + 180K out × $0.28/M = $0.137 + $0.050 = **$0.187**
> Qwen 3: 1.2M in × $0.10/M + 200K out × $0.30/M = $0.120 + $0.060 = **$0.180**
> Kimi K2: 2.1M in × $0.12/M + 150K out × $0.35/M = $0.252 + $0.053 = **$0.305**
> Qwen-VL-Max: 95 calls × $0.40/1K = **$0.038**
> Doubao TTS: 85K chars × $0.02/1K = **$0.0017**
>
> Total: **$0.71**.
> OpenAI equivalent: **~$42.50**.

## The Final Bill

Twenty-eight days. Five law firms. Roughly 11,400 documents processed. Here's what it cost:

| Component | Calls/Volume | Cost |
|-----------|-------------|------|
| DeepSeek V4 (extraction + complex Q&A) | ~28M input / 4.2M output tokens | $5.04 |
| Qwen 3 (standard doc processing) | ~22M input / 3.5M output tokens | $3.25 |
| Kimi K2 (long-context Q&A) | ~18M input / 1.1M output tokens | $2.54 |
| Qwen-VL-Max (OCR / vision) | ~1,400 calls | $0.56 |
| Doubao TTS (audio output) | ~980K chars | $0.02 |
| **Rate limit incident (Day 17)** | wasted retries | $6.20 |
| **Total** | | **$17.61** |

Now the same workload, priced with US APIs:

| Component | Cost |
|-----------|------|
| GPT-5 (all text tasks) | ~$185.00 |
| GPT-5 Vision (OCR / vision) | ~$10.50 |
| OpenAI TTS (audio output) | ~$14.70 |
| **Rate limit incident equivalent** | ~$130.00 |
| **Total with OpenAI** | **~$340.20** |

That's a **19x difference**. Or to put it another way: my entire month of Chinese API spending — including the $6.20 I wasted on a dumb bug — would've lasted about 1.5 days on OpenAI pricing.

With Claude Sonnet 4, the math is slightly better but still brutal:

| Component | Cost |
|-----------|------|
| Claude Sonnet 4 (all text tasks) | ~$111.00 |
| GPT-5 Vision (no Claude equivalent used) | ~$10.50 |
| OpenAI TTS | ~$14.70 |
| **Total with Anthropic + OpenAI** | **~$136.20** |

Still **7.7x more expensive** than the all-Chinese stack.

## The Real Catch

Here's the thing I was looking for all along. The catch. And there is one — just not where I expected.

The models are cheap. The API compatibility is seamless. The quality, for my use case, was more than good enough. DeepSeek V4's extraction accuracy was on par with GPT-4-class models. Kimi K2's long-context handling is genuinely excellent for legal documents. Qwen-VL-Max handled OCR better than I'd assumed.

**The catch is payment.**

Most Chinese AI API providers expect payment via Chinese bank cards or domestic payment methods (WeChat Pay, Alipay). If you're a developer outside China, this is a genuine friction point. Here's what I found:

- **DeepSeek**: Accepts international credit cards through their platform, but the process can be finicky. Some cards get declined.
- **Qwen (Alibaba Cloud Bailian)**: The best option for overseas developers. Alibaba's cloud platform accepts international credit cards, and the onboarding flow has English documentation. This was my primary payment path.
- **Kimi (Moonshot)**: Domestic payment methods primarily. I used a third-party payment proxy, which adds a ~5% fee. Even with that markup, the costs were negligible.
- **Doubao (ByteDance)**: Similar domestic payment focus. Same proxy approach.

The third-party payment proxies are a real thing — services that handle the Chinese payment side for you and bill your international card. They charge 3–8% on top. On a $17.61 monthly bill, that's an extra dollar. On a $340 OpenAI bill, the markup doesn't exist but the base cost is 19x higher. Do that math.

There's also the question of latency. API calls to servers in China add 100–300ms of round-trip time if you're calling from the US or Europe. For batch processing — which is most of what my tool does — this is irrelevant. For real-time chat interfaces, it's noticeable but not deal-breaking. I set up a simple caching layer for repeated queries and the user experience is fine.

## What I'd Tell You

If you're building anything that processes documents at volume — and most AI products eventually do — you should at least test Chinese APIs. Not because they're a moral choice or a geopolitical statement, but because the pricing changes what's possible.

I built an audio summary feature because TTS cost $0.002 instead of $1.80 per batch. I A/B tested three different models on the same workload because each test cost pennies. I recovered from a rate limit bug that would've been a budget emergency on OpenAI.

The models aren't better than GPT-5 or Claude Sonnet 4. For complex reasoning, creative writing, or nuanced code generation, the Western models still have an edge. But for the 80% of API calls in a typical SaaS product — extraction, classification, summarization, Q&A on provided documents, OCR, TTS — the Chinese models are more than sufficient, and they cost less than a rounding error.

My advice:

1. **Start with Alibaba Cloud Bailian** if you're outside China. International credit cards work, docs are in English, and you get access to Qwen 3, Qwen-VL-Max, and other models in one platform.
2. **Use DeepSeek V4 as your default text model.** Switch to Qwen 3 for high-volume, low-complexity tasks where the $0.10/M input price matters. Use Kimi K2 when context length is the priority.
3. **Set up billing alerts immediately.** I learned this the hard way. Cheap APIs can still rack up costs if your code is broken.
4. **Don't overthink the payment situation.** A 5% proxy fee on a $20 bill is a dollar. A 0% fee on a $340 bill is still $340.
5. **Test quality on your actual data, not benchmarks.** I was skeptical that Qwen 3 would handle legal jargon. It did. Benchmarks said it would. But seeing it work on real contracts from real firms was the only thing that convinced me.

I started this month trying to debunk a tweet. I ended it running a profitable micro-SaaS on infrastructure that costs less than my Spotify subscription. The tweet was right. And I'm still a little suspicious.

But my billing dashboard says $17.61, and the tool works, and five law firms are using it, and I'm not going back.

---

*This article reflects pricing as of June 2026. API prices change frequently — always verify current rates on provider platforms before making decisions.*

---

> 🔗 **相关阅读**：[中国 AI 模型价格对比 2026](/tutorials/china-ai-model-pricing-comparison/) | [DeepSeek API 定价详解](/tutorials/deepseek-api-pricing-explained/) | [DeepSeek V4 替代 GPT-5 30 天真实体验](/tutorials/deepseek-v4-30-day-review/) | [Kling API 开发者指南](/tutorials/kling-api-developer-guide/)
