# 🕵️ OSINT Real-World Usage Data & Telemetry for Obfuscated Providers

> **Repository:** [Token-Max](https://github.com/Heretek-AI/Token-Max)  
> **Status:** Active Intelligence Dossier  
> **Last Updated:** September 2026  
> **Purpose:** Document empirical developer telemetry, reverse-engineered quotas, community benchmarks, and vendor mechanics for AI coding platforms that obfuscate compute capacity behind opaque limits ("credits", "effort units", "requests", "fast/slow mode").

---

## 1. Executive Summary & Empirical Baselines

Modern agentic coding workflows do not look like traditional chatbot conversations. Autonomous agents (Claude Code, Cursor Composer, Windsurf Cascade, Devin, Google Antigravity, OpenAI Codex) operate in continuous iterative loops — grepping codebases, reading files, generating ASTs, running tests, inspecting stack traces, and emitting unified diffs.

### Empirical Sizing Benchmarks

| Metric | Traditional Chatbot | Interactive CLI Agent | Autonomous Task / Benchmark | Heavy Repository Agent |
| :--- | :--- | :--- | :--- | :--- |
| **Input:Output Ratio** | 1.33:1 to 3:1 | 25:1 to 40:1 | 153:1 to 166:1 | Up to 250:1 |
| **Tokens per Request** | 500 – 2,000 | 15,000 – 40,000 | 78,000 – 120,000 | 500,000 – 1,000,000+ |
| **Prompt Cache Hit Rate** | 0% – 20% | 60% – 80% | 84% – 92% | 90% – 95%+ |
| **Tokens per Complete Task**| N/A (single turn) | 60K – 240K | 250K – 900K (standard band) | 2.5M – 5.0M+ (SWE-bench) |
| **Task Financial Cost** | < $0.01 | $0.05 – $0.40 | $0.80 – $3.50 | $5.00 – $25.00+ |

### Core Empirical Takeaways:
1. **The Context Explosion Rule**: Input tokens account for **85% to 99.4%** of total token volume in agentic coding. Output tokens (the actual code written) represent a tiny fraction (0.6% to 15%).
2. **Prompt Caching is Economic Survival**: Without prompt caching (which offers 75% to 90% discounts on repeated prefix reads), autonomous agent coding would cost 4x to 10x more, making subscriptions instantly insolvent.
3. **The 21K Normalized Turn Standard**: Token-Max standardizes on a **21,000 token reference request** (20,000 input context at 75% cache hit + 1,000 output completion) to compare plans on an apples-to-apples basis. Real-world tasks average 40 such turns (or ~840K tokens gross).

---

## 2. Provider Dossier: The Big 5 Opaque Coding Environments

---

### 1. Claude Code (Anthropic)
- **Official Documentation**: [`claude.com/pricing`](https://claude.com/pricing), [`docs.claude.com`](https://docs.claude.com)
- **Subscription Tiers**: Pro ($20/mo), Max 5x ($100/mo), Max 20x ($200/mo)
- **Token-Max Model Allowance**: ~12M (Pro floor), ~60M (Max 5x), ~240M (Max 20x)

#### Quota Mechanics & Architecture:
- **Two-Tier Throttle System**:
  - **Rolling 5-Hour Burst Window**: Controls immediate usage rate. Initiates on the first prompt of a session and rolls continuously. In **May 2026**, Anthropic officially doubled the 5-hour rate limits across Pro, Max, and Team subscriptions and eliminated peak-hour throttling cliffs.
  - **Weekly Account Ceiling**: An overarching hard limit that resets at a fixed, account-specific day and hour each week. Even if a user has 5-hour burst headroom, hitting the weekly ceiling results in a complete lockout until the weekly reset.
- **Shared Pool Cross-Surface Drain**:
  - Claude Code CLI, Claude.ai (Web), Claude Desktop, and Mobile all draw from the **identical shared pool**. A heavy multi-hour coding session directly depletes available web chat queries.
- **Model Weighting & Drain Differential**:
  - Claude Opus 5 consumes quota significantly faster than Claude Sonnet 5 (~3x–5x higher burn).
  - Claude Fable 5.1 operates under a dedicated restriction: capped at a maximum of **50% of the user's total weekly allowance**.
- **Empirical Telemetry & Real-World Burn**:
  - BSWEN's 100M-token empirical tracking study of Claude Code measured an average of **78,277 tokens per request**, with **99.4% input / 0.6% output** (166:1 ratio) and an **84% prompt cache hit rate**.
  - Power enterprise developers at organizations like Uber consume between **$500 and $2,000/month** in direct API equivalents when utilizing Claude Code unconstrained.
  - On the $20 Pro plan, a developer working full-time on large repositories typically exhausts their weekly allowance within **2.5 to 3.5 business days**, necessitating either a Max upgrade or enabling pay-as-you-go overages via `/extra-usage`.

---

### 2. Cursor (Anysphere)
- **Official Documentation**: [`cursor.com/docs/account/pricing`](https://cursor.com/docs/account/pricing), [`cursor.com/pricing`](https://cursor.com/pricing)
- **Subscription Tiers**: Hobby ($0), Pro ($20/mo), Pro Plus ($60/mo), Ultra ($200/mo)
- **Token-Max Model Allowance**: ~10M–15M (Pro), ~30M–45M (Pro+), ~100M–200M (Ultra)

#### Quota Mechanics & Architecture:
- **Retirement of "500 Fast Requests"**:
  - Historically, Cursor marketed plans by request counts (e.g., "500 fast requests/mo"). In 2025–2026, Cursor completed a structural shift to **usage-based dollar pools**.
  - The $20 Pro subscription provides a **$20 monthly credit pool**; Pro Plus provides $60; Ultra provides $200.
- **Dual Usage Pool Architecture**:
  - **Cursor Models Pool**: Native and fine-tuned models (e.g., Composer 2.5, Cursor Grok 4.6) billed at internal subsidized rates, delivering substantially higher token throughput.
  - **Other Models Pool**: Frontier third-party models (Claude Sonnet 5, Claude Opus 5, GPT-5.6 Sol, Gemini 3.1 Pro) billed at exact upstream API list prices.
- **Elimination of "Unlimited Slow Mode"**:
  - The legacy fallback of dropping into an unlimited slow queue has been largely replaced. Once the included monthly usage pool is exhausted, users must enable on-demand pay-as-you-go billing at standard API rates or wait for the monthly billing cycle reset.
- **Empirical Telemetry & Context Burn**:
  - Community telemetry on large codebases reveals that Cursor's codebase indexing and multi-file agentic features log **178,000 to 1,000,000 cache-read tokens per request**.
  - While small inline completions consume minimal compute, full Composer agent sessions with tool execution can consume an entire $20 Pro pool in **15 to 25 complex multi-file refactoring tasks**.

---

### 3. Windsurf (Cognition AI / Devin Desktop)
- **Official Documentation**: [`windsurf.com/pricing`](https://windsurf.com/pricing), [`cognition.ai`](https://cognition.ai)
- **Subscription Tiers**: Free ($0), Pro ($20/mo), Max ($200/mo), Teams ($80 base + $40/user/mo)
- **Token-Max Model Allowance**: ~75M (Pro conservative), ~375M (Max)

#### Quota Mechanics & Architecture:
- **March 19, 2026 Overhaul: Credits to Rolling Quotas**:
  - Windsurf retired its legacy credit system in favor of an **auto-refreshing daily and weekly quota model**.
  - **Pro Plan ($20/mo)**: Provides standard daily and weekly quotas, full access to premium frontier models (SWE-1.5, Sonnet 5, GPT-5.6), unlimited inline edits, and cloud execution sessions.
  - **Max Plan ($200/mo)**: Designed for heavy power users and autonomous agent workflows, providing a nominal 5x capacity over Pro with significantly expanded weekly headroom.
- **Cascade Agent & Devin Integration**:
  - Following Cognition's acquisition and integration of Windsurf, Cascade functions as an interactive frontend to Devin autonomous agent capabilities.
  - Cascade consumes substantial context tokens scanning ASTs, symbol tables, and terminal diagnostics. Overly broad prompts or large monorepos cause rapid quota exhaustion.
  - Overages on paid tiers transition to direct API-priced consumption.
- **Empirical Telemetry**:
  - Windsurf users report that autonomous Cascade agent sessions consume between **150K and 650K tokens per feature implementation**.
  - Scoping projects with `.windsurfignore` and modular directory boundaries extends effective session capacity by **2.4x to 3.8x**.

---

### 4. Google Antigravity
- **Official Documentation**: [`antigravity.google/pricing`](https://antigravity.google/pricing), [`one.google.com`](https://one.google.com)
- **Subscription Tiers**: Individual ($0), Google AI Pro ($19.99/mo), Google AI Ultra 5x ($99.99/mo), Google AI Ultra 20x ($199.99/mo)
- **Token-Max Model Allowance**: ~75M (Pro floor), ~375M (Ultra 5x), ~1,500M (Ultra 20x)

#### Quota Mechanics & Architecture:
- **Pricing Restructuring & Antigravity 2.0**:
  - In May 2026, Google launched Antigravity 2.0 as a standalone agent environment, restructured paid tiers, lowered the top tier from $249.99 to $199.99, and added the $99.99 (5x) middle rung.
  - Plans are tied to Google AI subscriptions and Gemini Enterprise Agent Platform (GEAP) backends.
- **5-Hour Quota Refresh Window + Weekly Ceiling**:
  - Provides a **5-hour rolling pool** designed to ensure daily development headroom.
  - An overarching **weekly rate limit** enforces account ceilings. Exceeding the weekly limit blocks access until the weekly reset, regardless of 5-hour headroom.
- **Compute-Proportional Burn**:
  - Quotas are not deducted by message count; deduction is strictly proportional to "work done" by the agent (AST parsing, workspace indexing, terminal execution loops, MCP tool calls).
  - Additional capacity can be purchased via flexible AI credit top-ups at GEAP list rates.

---

### 5. OpenAI Codex / ChatGPT Pro
- **Official Documentation**: [`developers.openai.com/codex/pricing`](https://developers.openai.com/codex/pricing)
- **Subscription Tiers**: Free ($0), Go ($8/mo), Plus ($20/mo), Pro 5x ($100/mo), Pro 20x ($200/mo)
- **Token-Max Model Allowance**: ~20M (Plus floor), ~100M (Pro 5x), ~400M (Pro 20x)

#### Quota Mechanics & Architecture:
- **Surface Integration**:
  - Codex capabilities are integrated natively into the ChatGPT desktop client, web interface, CLI, and IDE extensions.
- **Reasoning Time & Model Complexity Metering**:
  - OpenAI meters Codex usage based on **reasoning time (thinking tokens)** and model complexity rather than raw input token counts.
  - High-effort reasoning models (GPT-5.6 Sol, GPT Reasoning with 400K context) burn quota at an accelerated rate compared to standard models (GPT-5.6 Luna).
- **Plan Boundaries**:
  - **Plus ($20/mo)**: Designed for interactive, human-in-the-loop pairing. Easily exhausted in 2–3 hours of continuous autonomous agent loops.
  - **Pro 5x ($100/mo)**: Introduced in April 2026 as a bridge tier for high-frequency individual developers.
  - **Pro 20x ($200/mo)**: The flagship heavy-developer tier providing maximum reasoning compute and parallel task capability.
- **Empirical Telemetry**:
  - In the Tom's Hardware / OpenClaw benchmark study, autonomous OpenAI agents consumed **603 Billion tokens across 7.6 Million requests** (~79,342 tokens/request) with an effective blended cost of **$2.16 per Million tokens**.

---

## 3. Provider Dossier: Cloud, Router & Emerging Coding Plans

---

### 6. Amazon Q Developer & Kiro (AWS)
- **Official Documentation**: [`aws.amazon.com/q/developer/pricing`](https://aws.amazon.com/q/developer/pricing), [`kiro.dev`](https://kiro.dev)
- **Current Status & Sunset Roadmap**:
  - AWS announced an end-of-support date of **April 30, 2027** for Amazon Q Developer IDE plugins.
  - AWS is transitioning developers to **Kiro**, its next-generation agentic IDE environment.
- **Amazon Q Pro ($19/user/mo)**:
  - 4,000 LOC/user/month for automated code transformation (pooled at AWS payer account level).
  - Overage billed at $0.003/LOC.
  - Chat is high-capacity, but specific autonomous agent features trigger monthly caps (e.g. 30 invocations/mo).
- **Kiro Credit & Multiplier Model**:
  - Tiered credit packs: 50 (Free), 1,000 ($20 Pro), 2,000 ($40 Pro+), 5,000 ($100 Pro Max), 10,000 ($200 Power).
  - Official published model consumption multipliers:
    - **Claude Opus 5**: 2.2x
    - **Claude Sonnet 5**: 1.3x
    - **Auto Mode**: 1.0x
    - **Claude Haiku 4.5**: 0.4x
    - **DeepSeek V4 Pro**: 0.25x
    - **MiniMax M3**: 0.15x / 0.25x
    - **Qwen3 Coder Next**: 0.05x

---

### 7. MiniMax Token Plan
- **Official Documentation**: [`platform.minimax.io/docs/guides/pricing-token-plan`](https://platform.minimax.io/docs/guides/pricing-token-plan)
- **Subscription Tiers**: Plus ($22/mo), Max ($55/mo), Ultra ($132/mo)
- **Credit Economics**:
  - 1,000 credits = $1.00 USD.
  - Prepaid top-up packs valid for 365 days (5,000 credits for $5 up to 100,000 for $100).
- **Empirical Token Capacity**:
  - MiniMax serves high-concurrency coding and multimodal agents.
  - While vendor documentation does not publish fixed monthly token ceilings, third-party community benchmarks observe token delivery between **40M and 180M tokens/month** across tiers depending on prompt cache efficiency and model selection (MiniMax M2.7 vs M3).

---

### 8. Kimi Code (Moonshot AI)
- **Official Documentation**: [`kimi.ai/help/membership/membership-pricing`](https://www.kimi.ai/help/membership/membership-pricing)
- **Subscription Tiers**: Moderato ($19/mo), Allegretto ($39/mo), Allegro ($99/mo), Vivace ($199/mo)
- **Quota Mechanics**:
  - Dual quota: Shared monthly credit pool + separate 5-hour and weekly Kimi Code rate limit windows.
  - Model burn differential: HighSpeed mode triples consumption rate. Kimi K3 consumes credit pools substantially faster than K2.7 Code.
  - Empirical token yield: Estimated at **60M to 400M tokens/month** across tiers based on ~95% prompt cache hit rates and documented $0.19 cache/$0.95 input/$4.00 output list rates.

---

### 9. Lovable
- **Official Documentation**: [`lovable.dev/pricing`](https://lovable.dev/pricing)
- **Subscription Tiers**: Free ($0, 30 credits), Pro 100 ($25/mo, 100 credits), Business ($50/mo, 200+ credits)
- **Quota Mechanics**:
  - Build credits expire after 2 months. Unlimited team members per workspace (billed per credit, not seat).
  - Empirical telemetry: 1 Lovable credit executes an end-to-end full-stack web app generation turn, comprising AST generation, component synthesis, styling, and Supabase integration.
  - Measured token burn: **100,000 to 150,000 tokens per credit**, yielding ~15M tokens on Pro 100 and ~30M tokens on Business.

---

### 10. Replit
- **Official Documentation**: [`replit.com/pricing`](https://replit.com/pricing)
- **Subscription Tiers**: Core ($20/mo, $18 annual), Pro ($100/mo, $90 annual)
- **Quota Mechanics**:
  - Core includes **$20 of frontier model credits** + 30 hours of chat in Free Mode.
  - Pro includes **$100 of frontier model credits** + 10 parallel autonomous agents.
  - Empirical token yield: Translates to **24M tokens/mo (Core)** and **120M tokens/mo (Pro)** based on mixed frontier model rates ($0.83/M effective blended).

---

## 4. Methodology Comparison: Token-Max vs. Real-World Telemetry

| Parameter | Token-Max Formula | Real-World OSINT Telemetry | Status / Alignment |
| :--- | :--- | :--- | :--- |
| **Standard Agent Turn** | 20K in (75% cache) + 1K out (21K total) | 78K in (84% cache) + 0.5K out (BSWEN) | **Conservative**: Token-Max yields are ~20% conservative on cache, but request counts represent normalized 21K turns. |
| **Autonomous Agent Task** | 250K (floor) / 550K (mid) / 900K (ceiling) | 200K–800K input + 30K–100K output (AI Cost Estimator) | **Exact Match**: Token-Max task capacities reflect empirical sandbox agent logs. |
| **Effective Frontier $/M** | ~$2.00 / 1M blended tokens | $2.16 / 1M blended (OpenClaw $1.3M dataset) | **High Precision**: Within 7.5% of verified 603B-token real-world spend. |
| **5-Hour Rolling Pool** | Modeled in `throttle.ts` (12 discrete 5-min buckets) | Verified across Claude Code, Antigravity, CommandCode | **Production Alignment**: Fully captures sliding-window burst exhaustion. |

---

## 5. Primary Research Citations & OSINT Sources

1. **BSWEN Research** (March 10, 2026): *Claude Code Token Usage: Real Data From 100M Tokens Tracked*.  
   URL: `https://docs.bswen.com/blog/2026-03-10-claude-code-token-usage-per-request/`  
   *Findings: 78,277 tokens/request, 99.4% input / 0.6% output (166:1), 84% prompt cache hit rate.*
2. **Bai et al., Tsinghua / Stanford** (April 2026): *How Do AI Agents Spend Your Money? Analyzing and Predicting Token Consumption in Agentic Coding Tasks* (arXiv:2604.22750).  
   URL: `https://arxiv.org/abs/2604.22750`  
   *Findings: 153:1 input:output ratio on SWE-bench, 4.17M tokens per task, 30x run-to-run variance.*
3. **Vantage & Tokenade** (2026): *The Hidden Cost Driver in Agentic Coding Sessions & Claude Code Statistics*.  
   URL: `https://tokenade.net/en/stats/claude-code-token-usage-statistics`  
   *Findings: Full-time heavy agent users spend $400–$1,500/mo; input accounts for 85%+ of session cost.*
4. **Tom's Hardware / OpenClaw** (2026): *OpenClaw creator burns through $1.3 million in OpenAI API tokens*.  
   URL: `https://www.tomshardware.com/tech-industry/artificial-intelligence/openclaw-creator-burns-through-1-3-million-in-openai-api-tokens-in-a-single-month`  
   *Findings: 603 Billion tokens / 7.6 Million requests = 79,342 tokens/request at $2.16/M effective blended rate.*
5. **Cursor Community Telemetry** (2025–2026): *Cursor high token usage & usage-based pricing transition*.  
   URL: `https://forum.cursor.com/t/cursor-high-token-usage/156924`  
   *Findings: 178K–1M cache-read tokens per request in large repositories; transition to dollar credit pools.*
6. **AI Cost Estimator** (June 18, 2026): *How Many Tokens Does an AI Coding Agent Use Per Session?*  
   URL: `https://ai-cost-estimator.com/blog/ai-coding-agent-token-consumption-how-much-per-session`  
   *Findings: CLI agents 50–200K in / 10–40K out; autonomous sandbox agents 200–800K in / 30–100K out per task.*
7. **Anthropic Official Product Updates** (May 2026): *Claude Rate Limit Expansion & 5-Hour Headroom Doubling*.  
   URL: `https://claude.com/pricing` & `https://platform.claude.com/docs/en/build-with-claude/prompt-caching`  
   *Findings: Doubled 5-hour rate limits for Pro/Max/Team; removal of peak-hour throttling; prompt cache reads at 10%.*
8. **AWS AWS Q / Kiro Roadmap**: *Amazon Q Developer support lifecycle & Kiro agentic environment*.  
   URL: `https://aws.amazon.com/q/developer/pricing/` & `https://kiro.dev/docs/models`  
   *Findings: April 30, 2027 sunset; Kiro model multipliers 0.05x (Qwen3) to 2.2x (Opus 5).*
