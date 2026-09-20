# 📑 SOURCE.md — Primary Evidence, Stated Usage Limits & Source Index

> **Purpose:** This document is the comprehensive, audit-ready index of primary documentation sources, stated quota limits, and token derivation evidence for all **33 coding services and model providers** tracked by [Token-Max](https://github.com/Heretek-AI/Token-Max).

> **Audit Date:** September 2026 | **Scope:** 33 Services · 414 Normalized Usage Limits · 107 Unit Tests | **Enforced by:** `npm run validate-data`


---

## Verification Standards & Metadata Schema

Every tier in Token-Max is classified with explicit provenance in `estimateMeta`:

- **Source Types:** `official` (direct vendor pricing/quota page), `derived` (mathematically inverted from official at-cost rates or credit ratios), `research` (published benchmarks, SWE-bench tracking, BSWEN 100M token study), `community` (forum telemetry, reverse engineering).

- **Confidence Levels:** `high` (explicitly published token ceilings/tables), `medium` (official credit multipliers/at-cost API rates), `low` (opaque window/quota caps, research estimates).

- **Stacking Policies:** `allowed` (explicitly permitted), `silent` (account sharing banned but multiple paid accounts unaddressed), `prohibited` (terms explicitly ban multiple accounts or proxying).


---

## 1. Coding IDEs & Autonomous Agents (14 Services)

### Aider (`aider`)

- **Primary Pricing & Docs:** [https://aider.chat](https://aider.chat)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Depends on API provider chosen
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free / BYOK** | Free ($0) | **toolCost**: 100% Free Open Source Software<br/>**rateLimits**: Determined by your chosen API provider<br/>**byok**: Bring Your Own Key | Claude Sonnet 5, GPT-6 Astra, DeepSeek V4.1 Flash, All OpenRouter models | **Direct BYOK API billing (0% tool markup)**<br/>Floor: `20M` | [RESEARCH (low)](https://aider.chat) |

**Key Gotchas & Constraints:**
- No hosted cloud backend — you pay the LLM API provider directly
- Large repo git-map indexing consumes significant context on startup
- Requires local Python environment and git repo

---

### Amazon Q Developer (`amazon-q`)

- **Primary Pricing & Docs:** [https://aws.amazon.com/q/developer/pricing/](https://aws.amazon.com/q/developer/pricing/)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Opt-out available (Free); automatic opt-out (Pro)
- **IP Indemnity:** True
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | Free ($0) | **agenticRequests**: 50 agentic requests/mo (chat + agentic coding)<br/>**transformation**: Java/.NET transformation 1,000 LOC/mo per user | Latest Claude models via AWS | **50 agentic requests/mo (~1.1M tokens on the standard request basis)**<br/>Floor: `1.05M` | [DERIVED (high)](https://aws.amazon.com/q/developer/pricing/)<br/>*Basis: standard 20K-in/1K-out agent request*<br/>*"Free tier: 50 agentic requests per month"* |
| **Pro** | $19/mo | **billing**: $19/user/mo, activates on first agentic usage (pro-rata)<br/>**requests**: Higher agentic request limits (not numerically published)<br/>**transformation**: 4,000 LOC/mo pooled with $0.003/LOC overage | Latest Claude models via AWS | **Higher request pool (~21M floor / ~105M midpoint / ~210M ceiling scenarios)**<br/>Floor: `21M` | Mid: `105M` | Opt: `210M` | [RESEARCH (low)](https://aws.amazon.com/q/developer/pricing/)<br/>*Basis: standard 20K-in/1K-out agent request*<br/>*"Pro: higher agentic request limits (not numerically published)"* |

**Key Gotchas & Constraints:**
- Pro request cap is not numerically published - token estimate is research-derived
- AWS announced April 30, 2027 end-of-support for Amazon Q Developer IDE plugins; transitioning to Kiro as the successor agentic environment
- Subscription activates only on first agentic action or code completion
- Transformation overage billed at $0.003/LOC at payer-account level
- Data collection: opt-out available on Free; automatically opted out on Pro
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

### Augment Code (`augment-code`)

- **Primary Pricing & Docs:** [https://www.augmentcode.com/pricing](https://www.augmentcode.com/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** No AI training on any plan
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Terms ban sharing credentials across users ("unique usernames and passwords cannot be shared or used by more than one individual Authorized User") but do not address multiple paid accounts."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard** | $20/mo | **billing**: $20/mo flat per team (no per-seat charge), up to 50 seats<br/>**usage**: $20 of usage included/mo (LLM + Context Engine + compute)<br/>**llmFee**: Provider list price + flat 40% service fee on LLM usage<br/>**topUps**: PAYG top-ups valid 12 months | Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, Cosmos | **$20 pool with 40% fee (~7.1M tokens baseline; 1.49M Opus 5 to 205.05M Gemini Flash)**<br/>Floor: `7.1M` | [DERIVED (medium)](https://www.augmentcode.com/pricing)<br/>*Basis: $14.28 net credit ($20 / 1.4) across list-price models*<br/>*"flat 40% fee on LLM usage; $20 of usage included per month"* |
| **Business** | $100/mo | **billing**: $100/mo flat per team, up to 50 seats<br/>**usage**: $100 of usage included/mo | Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, Cosmos | **$100 pool (~35.7M tokens baseline; 7.48M Opus 5 to 1025.66M Gemini Flash)**<br/>Floor: `35.7M` | [DERIVED (medium)](https://www.augmentcode.com/pricing)<br/>*Basis: $71.43 net credit ($100 / 1.4) across list-price models*<br/>*"$100 of usage included per month with the flat 40% LLM fee"* |
| **Enterprise** | Enterprise | **billing**: Custom usage + top-ups; unlimited seats<br/>**security**: SSO/OIDC/SCIM | Cosmos, API models | **Custom usage contract**<br/>Floor: `0M` | [RESEARCH (low)](https://www.augmentcode.com/pricing) |

**Key Gotchas & Constraints:**
- Flat 40% service fee on LLM usage means Standard ($20) provides $14.28 net compute, and Business ($100) provides $71.43 net compute; compute infrastructure is billed at cost (no fee)
- Multi-model catalog spans Claude Opus 5 (1.49M/7.48M), GPT-5.6 Sol (5.61M/28.04M), DeepSeek V4-Pro (43.23M/216.22M), Gemini 3.8 Flash (205.05M/1025.66M), and Cosmos
- Restructured from seat-based message plans to flat team pricing with dollar usage pools
- Top-up tokens valid 12 months

---

### Claude Code (`claude-code`)

- **Primary Pricing & Docs:** [https://claude.com/pricing](https://claude.com/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Model training opt-out available on individual plans
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Consumer terms: "You may not share your Account login information... or make your Account available to anyone else"; multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pro** | $20/mo<br/>($200/yr) | **rollingCap**: Shared 5-hour rolling session limit (>=5x Free tier)<br/>**weeklyAllocation**: Weekly caps on top of the 5-hour window<br/>**overage**: Opt-in usage credits billed at standard API rates, with optional monthly spend cap | Claude Opus 5, Claude Sonnet 5, Claude Haiku 4.5 | **Shared 5h rolling cap (~12M agentic tokens/mo)**<br/>Floor: `12M` | [RESEARCH (low)](https://claude.com/pricing) |
| **Max5x** | $100/mo | **rollingCap**: 5x Pro usage per 5-hour session<br/>**weeklyAllocation**: Weekly sliding window scales with 5x multiplier<br/>**overage**: Usage credits at API rates (Fable draws weekly limits at 50%) | Claude Opus 5, Claude Fable 5.1, Claude Sonnet 5, Claude Haiku 4.5 | **5x Pro rolling limit (~60M agentic tokens/mo)**<br/>Floor: `60M` | [RESEARCH (low)](https://claude.com/pricing) |
| **Max20x** | $200/mo | **rollingCap**: 20x Pro usage per 5-hour session<br/>**weeklyAllocation**: Weekly sliding window scales with 20x multiplier<br/>**overage**: Usage credits at API rates | Claude Opus 5, Claude Fable 5.1, Claude Sonnet 5, Claude Haiku 4.5 | **20x Pro rolling limit (~240M agentic tokens/mo)**<br/>Floor: `240M` | [RESEARCH (low)](https://claude.com/pricing) |

**Key Gotchas & Constraints:**
- Usage is quota-based per rolling 5-hour session plus weekly caps, deliberately NOT token- or message-metered
- In May 2026, Anthropic officially doubled the 5-hour rolling rate limits for Pro, Max, and Team plans and removed peak-hour throttling cliffs
- After limits, work continues only if you opt into usage credits billed at standard API rates (with optional monthly spend cap)
- Claude Code shares the same usage pool as Claude.ai chat, desktop and mobile
- On Pro, Claude Fable 5.1 runs via usage credits only; on Max it consumes 50% of weekly limits
- Cache TTL is 1 hour on subscriptions but drops to 5 minutes while drawing usage credits
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

### Cursor (`cursor`)

- **Primary Pricing & Docs:** [https://cursor.com/docs/account/pricing](https://cursor.com/docs/account/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Opt-out available in Privacy Mode
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Terms of Service contain no account-sharing or multi-account clause; only resale/lease/lending of the Service is prohibited."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hobby** | Free ($0) | **agentRequests**: Limited Agent requests<br/>**composer**: Access to Composer | Cursor Grok 4.5, Claude Haiku 4.5 | **Limited Agent requests (~0.5M tokens/mo)**<br/>Floor: `0.5M` | [RESEARCH (low)](https://cursor.com/docs/account/pricing) |
| **Pro** | $20/mo<br/>($192/yr) | **agentRequests**: Extended Agent limits<br/>**usagePools**: Cursor Models pool + Other Models pool (third-party at API rate), monthly reset<br/>**onDemand**: Extra usage on-demand at API rates, billed in arrears | Cursor Grok 4.6, Composer 2.5, Claude Fable 5.1<br/>*(+6 more)* | **Pro Cursor-Models + Other-Models pools (~10M tokens/mo modeled)**<br/>Floor: `10M` | [RESEARCH (low)](https://cursor.com/docs/account/pricing) |
| **Pro Plus** | $60/mo<br/>($576/yr) | **agentRequests**: Larger usage pools<br/>**usagePools**: Same two pools as Pro, expanded | Cursor Grok 4.6, Composer 2.5, Claude Fable 5.1<br/>*(+4 more)* | **Official 3x Pro limits (~30M tokens/mo)**<br/>Floor: `30M` | [RESEARCH (low)](https://cursor.com/docs/account/pricing) |
| **Ultra** | $200/mo<br/>($1920/yr) | **agentRequests**: Largest usage pools<br/>**usagePools**: Same two pools, maximum size | Cursor Grok 4.6, Composer 2.5, Claude Fable 5.1<br/>*(+3 more)* | **Official 20x Pro limits (~200M tokens/mo)**<br/>Floor: `200M` | [RESEARCH (low)](https://cursor.com/docs/account/pricing) |

**Key Gotchas & Constraints:**
- Pricing uses two usage pools (Cursor Models vs Other Models at API rates) resetting monthly - not request counts
- On-demand usage after pool exhaustion is billed in arrears at API rates
- Max Mode and fast-request tiers exist only for grandfathered legacy subscriptions
- Teams adds a Cursor token rate ($0.25/M tokens) on third-party models
- India-only Start plan (Rs 649) limits users to the Cursor Models pool only
- Teams Standard ($40/user) and Premium ($120/user) plans are sold separately and are not modeled as tiers here
- Subscriptions are only sold directly via cursor.com; resellers are unauthorized and may be suspended
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

### GitHub Copilot (`github-copilot`)

- **Primary Pricing & Docs:** [https://github.com/features/copilot/plans](https://github.com/features/copilot/plans)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Opt-out available (individual); excluded on Business/Enterprise
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"GitHub ToS: "Your login may only be used by one person - i.e., a single login may not be shared by multiple people"; multiple paid accounts are not addressed (one free account per person)."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **completions**: 2,000 completions/mo<br/>**aiCredits**: Limited allowance (auto model selection only)<br/>**agents**: Limited | Auto model selection only | **Limited free allowance (~0.4M tokens/mo)**<br/>Floor: `0.4M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |
| **Pro** | $10/mo | **completions**: Unlimited completions on paid tiers<br/>**aiCredits**: 1,000 base + 500 flex = 1,500 GitHub AI credits/mo | Claude Sonnet 5, Claude Haiku 4.5, GPT-5.4<br/>*(+5 more)* | **1,000 base AI credits/mo (~4.8M tokens; up to 1,500 with Flex)**<br/>Floor: `4.8M` | Mid: `7.1M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |
| **Pro+** | $39/mo | **completions**: Unlimited completions<br/>**aiCredits**: 3,900 base + 3,100 flex = 7,000 GitHub AI credits/mo<br/>**agents**: Delegate to Claude/Codex agents | Claude Opus 5, Claude Fable 5.1, Claude Sonnet 5<br/>*(+4 more)* | **3,900 base AI credits/mo (~18.6M tokens; up to 7,000 with Flex)**<br/>Floor: `18.6M` | Mid: `33M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |
| **Max** | $100/mo | **completions**: Unlimited completions<br/>**aiCredits**: 10,000 base + 10,000 flex = 20,000 GitHub AI credits/mo | Claude Opus 5, Claude Fable 5.1, GPT-6 Astra<br/>*(+2 more)* | **10,000 base AI credits/mo (~47.6M tokens; up to 20,000 with Flex)**<br/>Floor: `47.6M` | Mid: `95M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |
| **Business** | $19/mo | **aiCredits**: 1,900 AI credits/user/mo (org-level billing)<br/>**policy**: Org policy control, no model training on org content | All premium models (per-user allowance) | **1,900 AI credits/user/mo (~9M tokens/user)**<br/>Floor: `9M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |
| **Enterprise** | $39/mo | **aiCredits**: 3,900 AI credits/user/mo (org pool)<br/>**overage**: $0.01 per credit | All premium models (org pool) | **3,900 AI credits/user/mo pooled (~19M tokens/user)**<br/>Floor: `19M` | [RESEARCH (low)](https://github.com/features/copilot/plans) |

**Key Gotchas & Constraints:**
- Premium requests were replaced by GitHub AI Credits: 1 credit = $0.01, monthly reset with a variable 'Flex' allotment on top of base credits
- Opus 5, Fable 5/5.1 and GPT-5.4 nano are Pro+/Max only; Free/Student tiers only get auto model selection
- o3-mini, o1 and GPT-4.1 were retired from Copilot in Oct 2025-2026; Opus 4.5/4.6, Sonnet 4.5 and Gemini 3.1 Pro retired Sep 1 2026
- Premium models cost multiple credits per request; task cost varies with model and complexity
- Use of interaction data to train models can be opted out on individual plans; never on Business/Enterprise

---

### Google Antigravity (`google-antigravity`)

- **Primary Pricing & Docs:** [https://antigravity.google/pricing](https://antigravity.google/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Interactions used for ML improvement with in-settings opt-out; deletion on request via antigravity-support@google.com
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Google consumer terms and Generative AI Additional Terms reviewed; no multi-account or account-sharing clause found. Third-party tooling against Antigravity OAuth is banned."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Individual** | Free ($0) | **quota**: Meaningful weekly quota, refreshed weekly (no 5-hour refresh)<br/>**rateLimit**: Basic weekly rate limits per model<br/>**tabCompletions**: Unlimited<br/>**commandRequests**: Unlimited<br/>**creditOverage**: Not available (Pro/Ultra only) | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash<br/>*(+4 more)* | **Weekly-refresh baseline quota (~6.3M tokens/mo)**<br/>Floor: `6.25M` | Mid: `13.75M` | Opt: `22.5M` | [RESEARCH (low)](https://antigravity.google/pricing)<br/>*Basis: Google Antigravity free quota (25 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Google AI Pro** | $19.99/mo | **quota**: High quota, refreshed every 5 hours until weekly limit reached<br/>**rateLimit**: Higher weekly rate limit per model<br/>**tabCompletions**: Unlimited<br/>**creditOverage**: AI credits consumed at standard Gemini Enterprise Agent Platform pricing ('Never' or 'Always' toggle) | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash<br/>*(+4 more)* | **5-hour refresh quota with weekly caps (~75M tokens/mo)**<br/>Floor: `75.0M` | Mid: `165.0M` | Opt: `270.0M` | [RESEARCH (low)](https://antigravity.google/pricing)<br/>*Basis: Google Antigravity Pro quota (300 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Google AI Ultra 5x** | $99.99/mo | **quota**: Highest quota, refreshed every 5 hours until weekly limit reached<br/>**rateLimit**: Highest weekly rate limit per model<br/>**tabCompletions**: Unlimited<br/>**creditOverage**: AI credits consumed at standard GEAP consumption pricing | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash<br/>*(+4 more)* | **Official 5x Google AI Pro limits (~375M tokens/mo)**<br/>Floor: `375.0M` | Mid: `825.0M` | Opt: `1350.0M` | [DERIVED (low)](https://one.google.com/about/google-ai-plans/)<br/>*Basis: Google AI Pro research estimate (75M floor x 250K-900K task band)*<br/>*"Google AI Ultra 5x: 5x higher usage limits than Google AI Pro"* |
| **Google AI Ultra 20x** | $199.99/mo | **quota**: Highest quota, refreshed every 5 hours until weekly limit reached<br/>**rateLimit**: Highest weekly rate limit per model<br/>**tabCompletions**: Unlimited<br/>**creditOverage**: AI credits consumed at standard GEAP consumption pricing | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash<br/>*(+4 more)* | **Official 20x Google AI Pro limits (~1.5B tokens/mo)**<br/>Floor: `1500.0M` | Mid: `3300.0M` | Opt: `5400.0M` | [DERIVED (low)](https://one.google.com/about/google-ai-plans/)<br/>*Basis: Google AI Pro research estimate (75M floor x 250K-900K task band)*<br/>*"Google AI Ultra 20x: 20x higher usage limits than Google AI Pro"* |
| **Organization (Google Cloud)** | Enterprise | **billing**: Consumption-based pricing via Gemini Enterprise Agent Platform<br/>**governance**: Google Cloud Terms of Service; Cloud project integration<br/>**exclusion**: Claude and GPT-OSS reasoning models not available | Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash, Gemini 3.1 Pro | **Pay-per-use at actual GEAP consumption rates - no fixed monthly token bundle**<br/>Floor: `0M` | [RESEARCH (low)](https://antigravity.google/pricing) |

**Key Gotchas & Constraints:**
- Quotas are NOT token- or task-metered: rate limits are 'correlated with the amount of work done by the agent', so harder tasks consume allowance faster
- No official task or token counts are published; estimatedTokenBudget figures are research estimates and low confidence
- Pro/Ultra use a 5-hour refresh until the weekly cap is hit; free tier refreshes weekly only
- AI-credit overage is billed at standard Gemini Enterprise Agent Platform consumption pricing once baseline quota is exhausted
- Using third-party software/tools against Antigravity OAuth (e.g. OpenClaw) breaches the ToS and can lead to account suspension
- No BYOK or bring-your-own-endpoint support, even on paid tiers
- Google Cloud/Enterprise usage is governed by Google Cloud terms instead of the consumer terms
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

### Kiro (`kiro`)

- **Primary Pricing & Docs:** [https://kiro.dev/pricing/](https://kiro.dev/pricing/)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Not published on pricing page
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"FAQ: "subscriptions and usage limits are calculated per individual user"; sharing is not permitted, multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **credits**: 50 credits/mo<br/>**models**: Rate-limited Sonnet-class + open-weight models | Claude Sonnet 4.5, Qwen3 Coder Next, DeepSeek V3.2, MiniMax M2.1 | **50 credits/mo (~1M tokens)**<br/>Floor: `1M` | [RESEARCH (low)](https://kiro.dev/pricing/) |
| **Pro** | $20/mo | **credits**: 1,000 credits/mo<br/>**overage**: Add-on credit packs available | Claude Sonnet 5, Claude Opus 5, Auto mode<br/>*(+3 more)* | **1,000 credits/mo (~20M tokens on Sonnet 5)**<br/>Floor: `20M` | [RESEARCH (low)](https://kiro.dev/pricing/) |
| **Pro+** | $40/mo | **credits**: 2,000 credits/mo<br/>**overage**: Add-on credit packs available | Claude Sonnet 5, Claude Opus 5, Auto mode<br/>*(+3 more)* | **2,000 credits/mo (~40M tokens on Sonnet 5)**<br/>Floor: `40M` | [RESEARCH (low)](https://kiro.dev/pricing/) |
| **Pro Max** | $100/mo | **credits**: 5,000 credits/mo<br/>**overage**: Add-on credit packs available | Claude Sonnet 5, Claude Opus 5, Auto mode, Open-weight models | **5,000 credits/mo (~100M tokens on Sonnet 5)**<br/>Floor: `100M` | [RESEARCH (low)](https://kiro.dev/pricing/) |
| **Power** | $200/mo | **credits**: 10,000 credits/mo<br/>**overage**: Add-on credit packs available | Claude Sonnet 5, Claude Opus 5, Auto mode, Open-weight models | **10,000 credits/mo (~200M tokens on Sonnet 5)**<br/>Floor: `200M` | [RESEARCH (low)](https://kiro.dev/pricing/) |

**Key Gotchas & Constraints:**
- Credits reset monthly at billing-cycle start, not rolling 5-hour windows
- Credits are consumed fractionally per request; complex spec-driven tasks burn many credits
- Not all premium models are available in every country/region
- AWS owns Kiro - usage governed under AWS terms

---

### Lovable (`lovable`)

- **Primary Pricing & Docs:** [https://lovable.dev/pricing](https://lovable.dev/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Excluded by default on Business+; opt-out available on Free/Pro
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Terms ban sharing credentials; workspaces support unlimited members and are priced by credits, not seats - multiple paid subscriptions on one account are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **buildCredits**: 5 daily build credits (cap 30/mo)<br/>**grants**: 20 credits/mo Cloud grant + 4 credits/mo AI grant | Lovable Agent | **30 build credits + monthly grants (~3M tokens/mo)**<br/>Floor: `3M` | [RESEARCH (low)](https://lovable.dev/pricing) |
| **Pro 100** | $25/mo | **buildCredits**: 100 credits/mo (annual $21/mo)<br/>**dailyFloor**: 5 daily build credits + 20 Cloud + 4 AI grants stack on top<br/>**rollover**: Monthly credits roll over (expire 2 months later on monthly billing) | Lovable Agent | **100+ credits/mo (~15M tokens)**<br/>Floor: `15M` | [RESEARCH (low)](https://lovable.dev/pricing) |
| **Business** | $50/mo | **buildCredits**: 100 credits tier at $50/mo (annual $42) - scales with tier<br/>**privacy**: Workspace data excluded from AI model training by default | Lovable Agent | **Business minimum tier (~40M tokens/mo at 200+ cr tiers typical)**<br/>Floor: `40M` | [RESEARCH (low)](https://lovable.dev/pricing) |

**Key Gotchas & Constraints:**
- Credits are a unified balance covering app builds, hosting (Cloud) and AI gateway usage of deployed apps
- Free-tier credits do NOT roll over; Pro credits expire 2 months after issue on monthly plans
- Daily 5 build credits are a floor, not a bonus: monthly credits also include daily research
- Higher credit tiers scale steeply: 200 cr $50, 400 cr $100, 800 cr $200 ... 10,000 cr $2,250

---

### Meta Muse Code (`meta-muse-code`)

- **Primary Pricing & Docs:** [https://developer.meta.com/ai/products/muse-code](https://developer.meta.com/ai/products/muse-code)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Depends on the selected models and API tier; Muse Code keys are limited to Muse Code and training terms are not uniform across models
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Everyday** | $5/mo | **prompts**: 10-50 prompts / 5h (official) | Muse Spark 1.3, Llama 4 Scout | **Light usage tier (~5M tokens/mo)**<br/>Floor: `5M` | [RESEARCH (low)](https://developer.meta.com/ai/products/muse-code) |
| **High** | $15/mo | **prompts**: 5x Everyday usage (official) | Muse Spark 1.3, Llama 4 Scout, Llama 4 Maverick | **5x Everyday usage (~25M tokens/mo, official multiplier)**<br/>Floor: `25M` | [RESEARCH (low)](https://developer.meta.com/ai/products/muse-code) |
| **Power** | $50/mo | **prompts**: 20x Everyday usage (official) | Muse Spark 1.3, Llama 4 Maverick | **20x Everyday usage (~100M tokens/mo, official multiplier)**<br/>Floor: `100M` | [RESEARCH (low)](https://developer.meta.com/ai/products/muse-code) |

**Key Gotchas & Constraints:**
- Muse Code subscription keys work only with Muse Code, not the general Model API
- Training terms depend on which models you select; the Contributor/Standard choice changes them
- Regional availability restrictions apply

---

### OpenAI Codex (ChatGPT) (`openai-codex`)

- **Primary Pricing & Docs:** [https://openai.com/chatgpt/pricing/](https://openai.com/chatgpt/pricing/)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Used for training; opt-out available
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Terms ban sharing account credentials; multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **codex**: Limited Codex access | GPT-5.6 Luna | **Limited Codex (~0.75M tokens/mo)**<br/>Floor: `0.75M` | Mid: `1.65M` | Opt: `2.7M` | [RESEARCH (low)](https://openai.com/chatgpt/pricing/)<br/>*Basis: OpenAI Codex free quota (3 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Go** | $8/mo | **codex**: Limited Codex access; limited GPT-5.6 Terra<br/>**bonus**: More uploads/voice/deep research, longer memory; may include ads | GPT-5.6 Luna, GPT-5.6 Terra | **Light coding assistance (~4.3M tokens/mo)**<br/>Floor: `4.25M` | Mid: `9.35M` | Opt: `15.3M` | [RESEARCH (low)](https://openai.com/chatgpt/pricing/)<br/>*Basis: OpenAI Codex Go quota (17 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Plus** | $20/mo | **codex**: Expanded Codex usage<br/>**context**: GPT Reasoning 256K | GPT-6 Astra, GPT-5.6 Sol, GPT-5.6 Terra | **Expanded Codex (~20M tokens/mo)**<br/>Floor: `20.0M` | Mid: `44.0M` | Opt: `72.0M` | [RESEARCH (low)](https://openai.com/chatgpt/pricing/)<br/>*Basis: OpenAI Codex Plus quota (80 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Pro (5x)** | $100/mo | **codex**: 5x Plus usage; high-volume Codex | GPT-6 Astra, GPT-5.6 Sol | **5x Plus (~100M tokens/mo)**<br/>Floor: `100.0M` | Mid: `220.0M` | Opt: `360.0M` | [RESEARCH (low)](https://openai.com/chatgpt/pricing/)<br/>*Basis: OpenAI Codex Pro 5x (official 5x Plus multiplier x 80-task band)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Pro (maximum)** | $200/mo | **codex**: Maximum Codex tasks<br/>**context**: GPT Reasoning 400K context | GPT-6 Astra, GPT-5.6 Sol Pro | **Maximum Codex (~400M tokens/mo)**<br/>Floor: `400.0M` | Mid: `880.0M` | Opt: `1440.0M` | [RESEARCH (low)](https://openai.com/chatgpt/pricing/)<br/>*Basis: OpenAI Codex Pro maximum (20x Plus x 80-task band)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |

**Key Gotchas & Constraints:**
- Codex ships inside ChatGPT plans, not a separate product
- Codex access is Limited on Free/Go, Expanded on Plus, Maximum on Pro
- GPT-5.3-Codex appears in other registries (GitHub Copilot) but is not marketed on ChatGPT pricing
- Content is used to train OpenAI models; opt-out available on all tiers
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

### Replit (`replit`)

- **Primary Pricing & Docs:** [https://replit.com/pricing](https://replit.com/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Not published on pricing page
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Terms: "Creating accounts with automation or registering multiple accounts" is prohibited."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core** | $20/mo<br/>($216/yr) | **agentHours**: Up to 30 hours of chat in Free Mode<br/>**projects**: Up to 60 projects on Free Mode<br/>**modelCredits**: $20 toward most powerful models | Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, Replit Agent | **$20 credit pool + 30h (~24M baseline; 2.09M Opus 5 to 287.18M Gemini Flash)**<br/>Floor: `24M` | [RESEARCH (low)](https://replit.com/pricing) |
| **Pro** | $100/mo<br/>($1080/yr) | **parallelAgents**: 10 parallel agents<br/>**modelCredits**: $100 toward most powerful models<br/>**collaboration**: 15 collaborators, 50 viewers | Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, Replit Agent | **$100 credit pool (~120M baseline; 10.47M Opus 5 to 1435.9M Gemini Flash)**<br/>Floor: `120M` | [RESEARCH (low)](https://replit.com/pricing) |
| **Enterprise** | Enterprise | **billing**: Custom seats; SSO/SAML, single-tenant, static IPs | Custom fleet | **Custom contract**<br/>Floor: `0M` | [RESEARCH (low)](https://replit.com/pricing) |

**Key Gotchas & Constraints:**
- $20/$100 'toward most powerful models' is a dollar credit pool spent at list prices across Claude Opus 5 (2.09M/10.47M), GPT-5.6 Sol (7.85M/39.25M), DeepSeek V4-Pro (60.54M/302.7M), Gemini 3.8 Flash (287.18M/1435.9M), and Replit Agent
- Beyond included Free-Mode hours, effort-based pricing applies (agent-hours billed as usage)
- Optional Prepacks: $90/$215/$425/$825/$2,000 per month
- Exact checkpoint consumption per tier not officially published
- Stacking prohibited: multi-account creation banned in terms; clamped to 1 copy in Dangerous Dave mode

---

### Tabnine (`tabnine`)

- **Primary Pricing & Docs:** [https://www.tabnine.com/pricing/](https://www.tabnine.com/pricing/)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Training never occurs on customer code
- **IP Indemnity:** True
- **Stacking Policy:** `silent` — *"Terms ban sharing an Account/Login and sell seats per registered user; multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Code Assistant** | $39/mo | **billing**: $39/user/mo (annual subscription)<br/>**usage**: Unlimited when using your own LLM on-prem/VPC; Tabnine-provided LLM access billed at provider list price + 5% handling fee<br/>**deployment**: SaaS, VPC, on-prem, or air-gapped; zero code retention | Tabnine Protected | **Platform fee; ~19.5M fee-equivalent tokens**<br/>Floor: `19.5M` | Mid: `39M` | Opt: `78M` | [RESEARCH (low)](https://www.tabnine.com/pricing/) |
| **Agentic Platform** | $59/mo | **billing**: $59/user/mo (annual subscription)<br/>**usage**: Same LLM economics as Code Assistant<br/>**included**: Context Engine, Tabnine CLI agents, MCP tool use, headless agents (optional add-on) | Tabnine Protected | **Platform fee; ~29.5M fee-equivalent tokens**<br/>Floor: `29.5M` | Mid: `59M` | Opt: `118M` | [RESEARCH (low)](https://www.tabnine.com/pricing/) |
| **Enterprise (Custom)** | Enterprise | **volume**: Quote-based; IP indemnification subject to terms<br/>**compliance**: GDPR, SOC 2, ISO 27001 | Tabnine Protected | **Custom volume contract**<br/>Floor: `0M` | [RESEARCH (low)](https://www.tabnine.com/pricing/) |

**Key Gotchas & Constraints:**
- Tabnine was acquired by Tricentis (agentic quality engineering) and consumer self-serve tiers (Starter/Pro $15) are discontinued
- Pricing is enterprise-first: annual per-user subscription with quote-based procurement
- Using your own LLM endpoint = unlimited usage; Tabnine-provided LLM access adds a 5% handling fee over provider list prices
- Reserve-token model means monthly token totals are not fixed

---

### Windsurf (Cognition) (`windsurf`)

- **Primary Pricing & Docs:** [https://windsurf.com/pricing](https://windsurf.com/pricing)
- **Category:** `coding-ide`
- **Data Privacy & Training:** Not published on pricing page
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Acceptable Use Policy bans "sharing credentials"; multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **quota**: Light auto-refreshing usage allowance (daily + weekly)<br/>**models**: Limited model availability<br/>**concurrency**: Up to 10 concurrent sessions | SWE-2, Kimi K2.5, GPT 5.2 Mini, Claude Haiku 4.5 | **Light agent quota (~3.3M tokens/mo)**<br/>Floor: `3.25M` | Mid: `7.15M` | Opt: `11.7M` | [RESEARCH (low)](https://windsurf.com/pricing)<br/>*Basis: Windsurf free quota (13 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Pro** | $20/mo | **quota**: Increased auto-refreshing daily + weekly allowance (size not published)<br/>**overage**: Extra usage purchased at API pricing<br/>**concurrency**: Up to 10 concurrent sessions | SWE-2, Claude Sonnet 5, Claude Haiku 4.5<br/>*(+2 more)* | **Pro daily+weekly quota (~75M tokens/mo)**<br/>Floor: `75.0M` | Mid: `165.0M` | Opt: `270.0M` | [RESEARCH (low)](https://windsurf.com/pricing)<br/>*Basis: Windsurf Pro quota (300 tasks/mo research estimate)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Max** | $200/mo | **quota**: Significantly higher daily + weekly allowance (size not published)<br/>**overage**: Extra usage at API pricing<br/>**concurrency**: Unlimited concurrent sessions | SWE-2, Claude Sonnet 5, Claude Haiku 4.5<br/>*(+2 more)* | **Max daily+weekly quota (~375M tokens/mo)**<br/>Floor: `375.0M` | Mid: `825.0M` | Opt: `1350.0M` | [RESEARCH (low)](https://windsurf.com/pricing)<br/>*Basis: Windsurf Max quota (5x Pro presumption x 300-task band)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |
| **Teams** | $80/mo | **quota**: Pro-level quota per full dev seat<br/>**billing**: $80/mo team base + $40/mo per full user seat<br/>**concurrency**: Unlimited concurrent sessions | SWE-2, Claude Sonnet 5, Claude Haiku 4.5<br/>*(+2 more)* | **Pro-level quota per full user seat (~75M tokens/mo/seat)**<br/>Floor: `75.0M` | Mid: `165.0M` | Opt: `270.0M` | [RESEARCH (low)](https://windsurf.com/pricing)<br/>*Basis: Windsurf Teams seat quota (mirrors Pro 300-task band)*<br/>*"Autonomous coding-agent tasks consume 200-800K input + 30-100K output tokens per task; interactive CLI sessions 60-240K"* |

**Key Gotchas & Constraints:**
- After Cognition's acquisition, windsurf.com/pricing serves the Devin-branded plan sheet; there is no separate Windsurf editor pricing
- Quotas are undisclosed 'usage allowances' that refresh daily and weekly; overage is consumed at API pricing
- SWE-2 is included free in Devin Desktop and CLI only through Oct 10, 2026
- Message cost varies by model, task size and complexity - not a fixed token count
- Old 'Cascade prompts' / 'Fast prompts' terminology is retired from pricing
- On March 19, 2026, Windsurf replaced credit blocks with auto-refreshing daily and weekly usage quotas deeply integrated with Devin
- Deep-dive telemetry: see [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md)

---

## 2. Coding Routers & Aggregators (5 Services)

### CommandCode (`commandcode`)

- **Primary Pricing & Docs:** [https://commandcode.ai/pricing](https://commandcode.ai/pricing)
- **Official Usage Limits & Rolling Caps:** [https://commandcode.ai/docs/resources/usage-limits](https://commandcode.ai/docs/resources/usage-limits)
- **Usage Estimates & Request Sizing:** [https://commandcode.ai/docs/resources/pricing-limits#usage-estimates](https://commandcode.ai/docs/resources/pricing-limits#usage-estimates)
- **Go Plan Specification:** [https://commandcode.ai/docs/plans/go](https://commandcode.ai/docs/plans/go)
- **GOAT Plan Specification & Model Allowances:** [https://commandcode.ai/docs/plans/goat](https://commandcode.ai/docs/plans/goat)
- **Pro Plan Specification & Premium Allowances:** [https://commandcode.ai/docs/plans/pro](https://commandcode.ai/docs/plans/pro)
- **Max Plans & Dual-Pool Credit Rules:** [https://commandcode.ai/docs/plans/max#usage-limits](https://commandcode.ai/docs/plans/max#usage-limits) · [https://commandcode.ai/docs/plans/max#how-credits-work](https://commandcode.ai/docs/plans/max#how-credits-work)
- **Category:** `coding-router`
- **Data Privacy & Training:** No training on your code (Zero Data Retention available via `CMD_ZDR=1`)
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Terms: "One account per person. You may not register, operate, or control more than one account... Creating, operating, or controlling multiple accounts is a material breach.""*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Go** | $1/mo | **monthlyCredits**: $10/mo compute credits<br/>**5h cap**: $3 rolling limit<br/>**weekly cap**: $6 rolling limit<br/>**requests**: ~15K mix (~26K DeepSeek V4 Flash at typical cache) | DeepSeek V4 Flash, GPT-5.6 Luna, GLM-5.3 Flash, MiniMax M3, Qwen 3.8 Max, Grok 4.5 | **$10 compute credits (~15M tokens on open models)**<br/>Floor: `15M` · Mid: `26M` · Opt: `84M` | [OFFICIAL (high)](https://commandcode.ai/docs/resources/pricing-limits#usage-estimates)<br/>*"On Go, DeepSeek V4 Flash runs ~ 42K requests with no cache - ~ 26K once the typical 50K cache reads are included."* |
| **GOAT** | $10/mo | **monthlyCredits**: $70/mo usage value credits<br/>**5h cap**: $14 rolling limit<br/>**weekly cap**: $35 rolling limit<br/>**requests**: ~75K mix (~154K with DeepSeek V4 Flash)<br/>**allowances**: $70 Sol/GLM-5.2/Hy3 · $60 DeepSeek Flash · $47 MiniMax M3 · $40 GLM Flash · $20 Luna/Grok | DeepSeek V4 Flash, GPT-5.6 Sol, GLM-5.2, GLM-5.3 Flash, Tencent Hy3, Qwen 3.8 27B, MiniMax M3, Gemini 3.8 Flash, GPT-5.6 Luna, Grok 4.5 | **$70 compute credits (~70M tokens)**<br/>Floor: `70M` · Mid: `120M` · Opt: `751M` | [OFFICIAL (high)](https://commandcode.ai/docs/plans/goat)<br/>*"You pay $10 and code with up to $70 of per-model credit allowances... $14 of usage in any 5 hours, $35 in any 7 days, and $70 per month."* |
| **Pro** | $20/mo | **monthlyCredits**: $80/mo usage value credits<br/>**5h cap**: $16 rolling limit<br/>**weekly cap**: $40 rolling limit<br/>**requests**: ~100K mix (~47% standard / ~53% premium)<br/>**allowances**: $80 Sol/GLM-5.2/Hy3 · $70 DeepSeek Flash · $57 MiniMax M3 · $50 GLM Flash · $20 Claude Sonnet/Opus | Claude Sonnet 5, Claude Opus 4.8, GPT-5.6 Sol, DeepSeek V4 Flash, GLM-5.2, GLM-5.3 Flash, Gemini 3.8 Flash, MiniMax M3, GPT-5.6 Terra | **$80 compute credits (~80M tokens)**<br/>Floor: `80M` · Mid: `120M` · Opt: `877M` | [OFFICIAL (high)](https://commandcode.ai/docs/plans/pro)<br/>*"Pro works the same way: 16 credits in any 5 hours and 40 in any 7 days across its per-model credits - premium models included - worth $16 / $40 of usage on a full-allowance model."* |
| **Max 10x** | $100/mo | **standardPool**: $150/mo standard model usage limit<br/>**premiumPool**: $100/mo premium model usage limit<br/>**5h cap**: $45 rolling limit<br/>**weekly cap**: $90 rolling limit<br/>**requests**: ~230K mix (~43% standard / ~57% premium) | Claude Sonnet 5, Claude Opus 4.8, GPT-5.6 Sol, DeepSeek V4 Flash, GLM-5.3 Flash, GPT-5.6 Terra, MiniMax M3, Grok 4.5 | **$150 standard + $100 premium credits**<br/>Floor: `150M` · Mid: `230M` · Opt: `500M` | [OFFICIAL (high)](https://commandcode.ai/docs/plans/max#usage-limits)<br/>*"On Max 10×, you have a $150 standard model usage limit and a $100 premium model usage limit... $45 of usage in any 5 hours and $90 in any 7 days."* |
| **Max 20x** | $200/mo | **standardPool**: $300/mo standard model usage limit<br/>**premiumPool**: $200/mo premium model usage limit<br/>**5h cap**: $90 rolling limit<br/>**weekly cap**: $180 rolling limit<br/>**requests**: ~370K mix (~43% standard / ~57% premium) | Claude Sonnet 5, Claude Opus 4.8, GPT-5.6 Sol, DeepSeek V4 Flash, GLM-5.3 Flash, GPT-5.6 Terra, MiniMax M3, Grok 4.5 | **$300 standard + $200 premium credits**<br/>Floor: `300M` · Mid: `370M` · Opt: `1000M` | [OFFICIAL (high)](https://commandcode.ai/docs/plans/max#usage-limits)<br/>*"On Max 20×, that's $300 standard and $200 premium... $90 of usage in any 5 hours and $180 in any 7 days."* |

**Key Gotchas & Constraints:**
- Vendor request definition: ~700–1K input tokens, ~125–200 output tokens, ~50K average prompt cache reads
- Paced by two rolling windows (5-hour and weekly) that start on first use; extra on-demand top-up credits bypass rolling caps
- Max 10x and Max 20x enforce distinct standard vs. premium model usage limits ($150/$100 on Max 10x, $300/$200 on Max 20x). Sol, Luna, Grok, and Gemini bill as standard; Claude Opus, Sonnet, and Fable bill as premium
- Domain moved from commandcode.dev to commandcode.ai
- Every plan adds a small processing fee on top of the sticker price
- Credits roll over forever; auto top-up billed at API cost
- Free tier retired - now paid ($1 Go tier); taste-1 learning data stored locally only

---

### Kilo Code (`kilo-code`)

- **Primary Pricing & Docs:** [https://kilo.ai/pricing](https://kilo.ai/pricing)
- **Category:** `coding-router`
- **Data Privacy & Training:** No training on your code (official)
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Per-seat Teams licensing; terms ban credential sharing but no multiple-account clause was found."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Individual** | Free ($0) | **models**: Access to 500+ models via Kilo Gateway or BYOK<br/>**gatewayFee**: 5% on all plans (no markup vs list price) | Kilo Gateway (500+ models) | **PAYG at provider list rates + 5% gateway fee**<br/>Floor: `0M` | [RESEARCH (low)](https://kilo.ai/pricing) |
| **Teams** | $15/mo | **seats**: $15/user/mo collaboration platform<br/>**inference**: Billed at provider rates; EU inference available<br/>**markup**: Inference passed through at provider rates with no markup; credit top-ups carry a 5% fee<br/>**kiloPass**: Kilo Pass Starter $19 / Pro $49 / Expert $199; up to 50% bonus credits (annual: 50% every month) | Kilo Gateway (500+ models) | **Platform fee; ~15M fee-equivalent tokens at open-model rates**<br/>Floor: `15M` | Mid: `30M` | Opt: `45M` | [RESEARCH (low)](https://kilo.ai/pricing) |
| **Enterprise** | Enterprise | **volume**: Quote-based<br/>**support**: Dedicated | Kilo Gateway (500+ models) | **Custom agree - quote-based**<br/>Floor: `0M` | [RESEARCH (low)](https://kilo.ai/pricing) |

**Key Gotchas & Constraints:**
- Rebranded kilocode.ai -> kilo.ai; pricing restructured to platform fee + inference + cloud compute
- Kilo Pass converts dollars 1:1 into paid credits, then adds bonus credits (50% month one; streak bonuses on monthly, 50% every month on annual)
- Bonus credits expire monthly; paid credits apply across IDE/CLI/Cloud Agents/Gateway
- Cloud agents billed per second (Gas Town $1.20/hr, Code Review $0.33/hr, Cloud Agent $0.60-1.20/hr)

---

### Kimi Code (`kimi-code`)

- **Primary Pricing & Docs:** [https://www.kimi.com/coding-plan/](https://www.kimi.com/coding-plan/)
- **Category:** `coding-router`
- **Data Privacy & Training:** Not published on pricing page
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"User agreement: "not register or operate multiple accounts for abusive purposes" and "You may not share your account credentials or make your account available to anyone else.""*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Moderato** | $19/mo<br/>($180/yr) | **quota**: Weekly-refreshed usage quota (~300 requests / 5h windows)<br/>**models**: Kimi K3 incl. K3-256k | Kimi K3, K2.7 Code | **Weekly-refreshed quota (~60M tokens/mo)**<br/>Floor: `60M` | [RESEARCH (low)](https://www.kimi.com/coding-plan/) |
| **Allegretto** | $39/mo<br/>($372/yr) | **quota**: Higher weekly limits + higher concurrency<br/>**speed**: K3 HighSpeed (5-6x speed, ~3x credit burn); 1M-context K3 | Kimi K3, K2.7 Code | **Higher weekly quota (~150M tokens/mo)**<br/>Floor: `150M` | [RESEARCH (low)](https://www.kimi.com/coding-plan/) |
| **Allegro** | $99/mo<br/>($948/yr) | **quota**: Expansive quota (~600-800 req/5h)<br/>**concurrency**: Higher caps | Kimi K3, K2.7 Code | **Expansive quota (~400M tokens/mo)**<br/>Floor: `400M` | [RESEARCH (low)](https://www.kimi.com/coding-plan/) |
| **Vivace** | $199/mo<br/>($1908/yr) | **quota**: Highest weekly quotas (~1,200 req/5h)<br/>**concurrency**: Max caps | Kimi K3, K2.7 Code | **Highest quota (~800M tokens/mo)**<br/>Floor: `800M` | [RESEARCH (low)](https://www.kimi.com/coding-plan/) |

**Key Gotchas & Constraints:**
- Quotas refresh weekly with ~5-hour rolling request windows (roughly 300-1,200 req/window by tier)
- K3 HighSpeed runs 5-6x faster but burns ~3x credits
- Exact credit counts per window are not officially published - estimates are research-derived
- K2.7 Code is the coding-optimized workhorse; K3 is the general flagship

---

### OpenCode (`opencode`)

- **Primary Pricing & Docs:** [https://opencode.ai/go](https://opencode.ai/go) · Usage Limits: [https://opencode.ai/docs/go/#usage-limits](https://opencode.ai/docs/go/#usage-limits) · Zen PAYG: [https://opencode.ai/zen](https://opencode.ai/zen)
- **Category:** `coding-router`
- **Data Privacy & Training:** Zero data retention (0 days) on most Go models; 30 days on Grok 4.6 & GPT-5.6 Luna; Muse Spark Contributor trains on code. Zen models US-hosted with zero retention
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Terms of Service: prohibits users who "create, maintain, or use multiple accounts to circumvent usage limits, access restrictions, billing obligations... or any other restriction or policy.""*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenSource CLI** | Free ($0) | **usage**: Free open-source agent; BYOK to any provider | BYOK any provider | **Token cost = your provider's rates**<br/>Floor: `0M` | [RESEARCH (low)](https://opencode.ai/zen) |
| **Zen (PAYG)** | $20/mo | **billing**: Pay-as-you-go dollar balance, min $20 top-up (+$1.23 card fee)<br/>**markup**: Zero markup per request<br/>**autoTopUp**: $20 when balance < $5 | GPT-5.6 Luna, GPT-5.6 Sol, Claude Fable 5.1<br/>*(+5 more)* | **Prepaid balance (~10M fee-equivalent tokens)**<br/>Floor: `10M` | Mid: `20M` | Opt: `40M` | [RESEARCH (low)](https://opencode.ai/zen) |
| **Go** | $10/mo | **monthlyAllowance**: Per-model monthly usage: $60 (tier 1 models), $30 (tier 2), $15 (tier 3)<br/>**fiveHourCap**: 20% of monthly allowance in any 5h ($12 / $6 / $3)<br/>**weeklyCap**: 50% of monthly allowance in any 7d ($30 / $15 / $7.50)<br/>**monthlyCap**: 100% of monthly allowance ($60 / $30 / $15)<br/>**requests**: Up to 31,580/mo on GLM-5.3-Flash, 65,000/mo on DeepSeek Flash, 150,400/mo on MiMo-V2.5, 226,600/mo on Muse Spark<br/>**topUp**: Optional 'Use balance' falls back to Zen PAYG balance when limits reached | Kimi K3, Qwen 3.8 Max, Grok 4.6, GLM-5.3, GLM-5.2, DeepSeek V4.1 Flash, MiniMax M3, MiMo-V2.5, Muse Spark<br/>*(28 models)* | **$10/mo open-model subscription ($15–$60 per-model allowances; ~30M–752M tokens)**<br/>Floor: `30M` | Mid: `95M` | Opt: `752M` | [OFFICIAL (high)](https://opencode.ai/docs/go/#usage-limits)<br/>*"Usage limits are defined as monthly dollar amounts... Each model has the following usage limits: 5-hour — 20% of the monthly limit; weekly — 50%; and monthly — 100%. For example, if a model has a $60 monthly limit, you can spend up to: 5-hour limit — $12, weekly limit — $30, monthly limit — $60."* |

**Key Gotchas & Constraints:**
- OpenCode Go ($10/mo) provides $15, $30, or $60 monthly usage allowance per model with 20% 5h and 50% weekly caps
- Optional 'Use balance' falls back to Zen PAYG balance when Go model limits are reached instead of blocking requests
- DeepSeek V4.1 Flash has 4× promotional limits ($60/mo limit; 26K req / 5h) through Sep 20, 2026 (normally $15)
- Muse Spark Contributor models train on prompt/output data and are not zero data retention (ZDR); all other Go models provide zero training (0 days retention, except Grok 4.6 and GPT-5.6 Luna with 30 days retention)
- Zen PAYG charges $1.23 card processing fee on top-ups; auto top-up at $20 below $5 balance
- The CLI itself is free/open-source; opencode.ai/pricing is retired (404) - offerings are Go ($10/mo) and Zen (PAYG)

---

### OpenRouter (`openrouter`)

- **Primary Pricing & Docs:** [https://openrouter.ai](https://openrouter.ai)
- **Category:** `coding-router`
- **Data Privacy & Training:** No (OpenRouter does not train; providers vary)
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Terms: "create multiple accounts as a single user, for purposes of bypassing or circumventing use limits... or for any other reason" is prohibited."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **rateLimit**: 20 RPM<br/>**dailyCap**: 50-1,000 RPD (50 RPD without payment history) | Free tier models (:free tag) | **50-1,000 requests/day on free models (~2M tokens/mo)**<br/>Floor: `2M` | [RESEARCH (low)](https://openrouter.ai) |
| **PAYG** | Enterprise | **platformFee**: 5.5% on top-ups<br/>**rateLimit**: Provider-native limits<br/>**concurrency**: Provider-dependent | Over 400+ models from 30+ providers | **Wholesale PAYG ($10 buys ~5M–66M tokens depending on model)**<br/>Floor: `20M` | [RESEARCH (low)](https://openrouter.ai) |

**Key Gotchas & Constraints:**
- Free tier restricted to 50 requests/day unless account has payment history
- 5.5% platform fee charged on crypto and card balance reloads
- Provider fallback order may route to higher-cost endpoints if not pinned

---

## 3. Direct APIs & Cloud Token Plans (15 Services)

### Alibaba Cloud (`alibaba-cloud`)

- **Primary Pricing & Docs:** [https://www.alibabacloud.com/help/en/model-studio/token-plan-overview](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview)
- **Category:** `api-provider`
- **Data Privacy & Training:** Personal: governed by the service agreement with cross-border transfer, no no-training commitment; Team: conversation data not used for model training
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Token Plan FAQ: "Can multiple people share one account? No... sharing the same account or API Key among multiple people is not allowed"; Team seats are bound to one member and one API key."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Lite** | $6/mo | **quota**: 2,500 credits per 7-day window (official; original price $8/mo)<br/>**window**: 7-day timer starts at first call; unused quota expires, service pauses when exhausted<br/>**concurrency**: 1-2 concurrent agents<br/>**extraBundle**: $15 = 20,000 credits, requires active subscription (max 5), not subject to the 7-day window<br/>**region**: Singapore region only | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5<br/>*(+2 more)* | **2,500 credits/7d; ~45M conservative (qwen3.6-plus basis, derived)**<br/>Floor: `45M` | Mid: `90M` | Opt: `126M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-personal-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Credits are deducted using tiered deduction coefficients by model; the deduction ratio is lower on a cache hit and hi..."* |
| **Essential** | $10/mo | **quota**: 5,625 credits per 7-day window (official; original price $16/mo)<br/>**window**: 7-day timer starts at first call; unused quota expires<br/>**concurrency**: 2-3 concurrent agents<br/>**extraBundle**: $15 = 20,000 credits, requires active subscription (max 5)<br/>**region**: Singapore region only | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5<br/>*(+2 more)* | **5,625 credits/7d; ~101M conservative (qwen3.6-plus basis, derived)**<br/>Floor: `101M` | Mid: `202M` | Opt: `283M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Personal Edition: Essential 5,625 Credits per 7-day quota (limited-time $10/month)"* |
| **Standard** | $18/mo | **quota**: 10,000 credits per 7-day window (official; original price $25/mo)<br/>**window**: 7-day timer starts at first call; unused quota expires<br/>**concurrency**: 3-4 concurrent agents<br/>**extraBundle**: $15 = 20,000 credits, requires active subscription (max 5)<br/>**region**: Singapore region only | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5<br/>*(+2 more)* | **10,000 credits/7d; ~180M conservative (qwen3.6-plus basis, derived)**<br/>Floor: `180M` | Mid: `359M` | Opt: `503M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Personal Edition: Standard 10,000 Credits per 7-day quota (limited-time $18/month)"* |
| **Pro** | $68/mo | **quota**: 40,000 credits per 7-day window (official; original price $80/mo)<br/>**window**: 7-day timer starts at first call; unused quota expires<br/>**concurrency**: 6-8 concurrent agents<br/>**extraBundle**: $15 = 20,000 credits, requires active subscription (max 5)<br/>**region**: Singapore region only | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5<br/>*(+2 more)* | **40,000 credits/7d; ~719M conservative (qwen3.6-plus basis, derived)**<br/>Floor: `719M` | Mid: `1438M` | Opt: `2013M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Personal Edition: Pro 40,000 Credits per 7-day quota (limited-time $68/month)"* |
| **Team Standard** | $20/mo | **quota**: 25,000 credits/seat/month (official; original price $30/seat)<br/>**window**: Monthly batch granted at subscription start; no 7-day window; unused expires<br/>**concurrency**: Shared workspace; each seat bound to one member and one API key<br/>**extraPack**: $700 = 625,000 shared credits (soonest-expiring first) | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5, GLM-5 | **25,000 credits/seat/mo; ~105M conservative/seat (derived)**<br/>Floor: `105M` | Mid: `210M` | Opt: `294M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Team Edition: Standard seat 25,000 Credits/seat/month"* |
| **Team Pro** | $75/mo | **quota**: 100,000 credits/seat/month (official; original price $100/seat)<br/>**window**: Monthly batch; unused expires<br/>**concurrency**: Shared workspace; one API key per seat<br/>**extraPack**: $700 = 625,000 shared credits | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5, GLM-5 | **100,000 credits/seat/mo; ~419M conservative/seat (derived)**<br/>Floor: `419M` | Mid: `839M` | Opt: `1174M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Team Edition: Pro seat 100,000 Credits/seat/month"* |
| **Team Max** | $200/mo | **quota**: 250,000 credits/seat/month (official)<br/>**window**: Monthly batch; unused expires<br/>**concurrency**: Shared workspace; one API key per seat<br/>**extraPack**: $700 = 625,000 shared credits | Qwen 3.7 Plus, Qwen 3.6 Plus, Kimi K2.5, GLM-5 | **250,000 credits/seat/mo; ~1.05B conservative/seat (derived)**<br/>Floor: `1048M` | Mid: `2097M` | Opt: `2935M` | [DERIVED (medium)](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview)<br/>*Basis: qwen3.6-plus*<br/>*"Team Edition: Max seat 250,000 Credits/seat/month"* |

**Key Gotchas & Constraints:**
- Token Plan and Coding Plan are separate products: Coding Plan (request-metered, Pro $50, 6,000 req/5h + 45,000/week + 90,000/month) is being phased out and is no longer available once sold out
- Credits are deducted with per-model coefficients that Alibaba does not publish; estimates are derived from the official qwen3.6-plus worked example
- Personal tier quotas run on a fixed 7-day window from first use and unused quota expires; calls block when exhausted (no pay-as-you-go)
- Personal plans offer no guarantee against data training and use cross-border (Singapore) processing; Team plans commit to no training on conversation data
- Team seats are bound to one member and one API key and cannot be shared
- Personal Edition is only available in the Singapore region

---

### Anthropic API (`anthropic-api`)

- **Primary Pricing & Docs:** [https://console.anthropic.com](https://console.anthropic.com)
- **Category:** `api-provider`
- **Data Privacy & Training:** No (Commercial API zero retention)
- **IP Indemnity:** True
- **Stacking Policy:** `silent` — *"Consumer/commercial terms ban sharing account credentials and API keys but do not address one person holding multiple paid accounts."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAYG** | Enterprise | **spendTiers**: Start $500/mo, Build $1,000/mo, Scale $200,000/mo (official 2026 tiers)<br/>**cacheReadDiscount**: 90% off cached input<br/>**cacheWritePremium**: 25% premium on cache writes<br/>**batchDiscount**: 50% off | Claude Fable 5.1, Claude Opus 5, Claude Sonnet 5, Claude Haiku 4.5 | **Direct API PAYG ($20 buys ~10M conservative / ~18M cached-agent Sonnet 5 tokens)**<br/>Floor: `10M` | Mid: `18M` | Opt: `25M` | [DERIVED (medium)](https://docs.claude.com/en/docs/about-claude/pricing)<br/>*Basis: Claude Sonnet 5*<br/>*"Claude Sonnet 5 $2 / MTok input, $10 / MTok output; cache reads 0.1x input"* |

**Key Gotchas & Constraints:**
- Rate limits and spend caps are tiered by cumulative spend (Start $500, Build $1,000, Scale $200,000+/mo); new accounts hit 429s on large codebases
- Thinking/reasoning tokens are billed at standard output token rates
- Cache write operations cost 25% more than base input tokens

---

### BytePlus ModelArk Coding Plan (`byteplus`)

- **Primary Pricing & Docs:** [https://www.byteplus.com/en/activity/arkcodingplan](https://www.byteplus.com/en/activity/arkcodingplan)
- **Category:** `api-provider`
- **Data Privacy & Training:** No training on Customer Data under BytePlus AI Services terms (except volunteered feedback)
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"BytePlus AI terms cover data training but contain no multi-account clause; plans are "primarily intended for individual developers" and non-coding use may be treated as abuse."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lite** | $10/mo | **usage**: 3x the usage of the Claude Pro plan<br/>**requests**: ≈1,900 requests/5h, 12,000/week, 24,000/month (official docs; older FAQ quoted 1,200/9,000/18,000)<br/>**tools**: Claude Code, Cursor, Cline, Kilo Code, Roo Code, OpenCode | Dola-Seed-2.0-Pro, Dola-Seed-2.0-Lite, GLM-5.3-Flash<br/>*(+4 more)* | **3x Claude Pro usage (~36M tokens/mo, anchored to our Claude Pro estimate)**<br/>Floor: `36M` | [DERIVED (medium)](https://docs.byteplus.com/en/docs/ModelArk/1925114)<br/>*Basis: Claude Pro conservative estimate (12M)*<br/>*"The Lite plan provides a usable total quota equivalent to 3x that of the Claude Pro plan, while the Pro plan offers 5..."* |
| **Pro** | $50/mo | **usage**: 5x Lite usage (also marketed as 3x Claude Max usage)<br/>**requests**: 5x Lite quotas (≈9,500/5h, 60,000/week, 120,000/month)<br/>**bonus**: ArkClaw included during subscription | Dola-Seed-2.0-Pro, Dola-Seed-2.0-Lite, GLM-5.3-Flash<br/>*(+3 more)* | **5x Lite (~180M tokens/mo)**<br/>Floor: `180M` | [RESEARCH (low)](https://www.byteplus.com/en/activity/arkcodingplan) |

**Key Gotchas & Constraints:**
- 2026 refresh renamed models from Bytedance-Seed naming to Dola-Seed-2.0 pro/lite
- Quota is marketed as a multiplier of Claude Pro/Max plans, not absolute credits
- Non-coding use of the plan may be treated as abuse and can lead to subscription deactivation or account suspension
- Model availability varies by region

---

### DeepSeek API (`deepseek-api`)

- **Primary Pricing & Docs:** [https://api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing)
- **Category:** `api-provider`
- **Data Privacy & Training:** No
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAYG (Flash)** | Enterprise | **concurrency**: 2,500 connections (official limit)<br/>**contextWindow**: 1M tokens context window, 384K maximum output<br/>**offPeakDiscount**: 50% off (off-peak input $0.15/M, output $0.60/M)<br/>**peakHours**: Mon-Fri 01:00-04:00 and 06:00-10:00 UTC | DeepSeek V4.1 Flash | **PAYG ($20 buys ~75M Flash tokens off-peak)**<br/>Floor: `75M` | [RESEARCH (low)](https://api-docs.deepseek.com/quick_start/pricing) |
| **PAYG (V4-Pro)** | Enterprise | **concurrency**: 500 connections (official limit)<br/>**contextWindow**: 1M tokens context window, 384K maximum output<br/>**offPeakDiscount**: 50% off off-peak vs peak | DeepSeek V4-Pro | **PAYG ($20 buys ~8M Pro tokens off-peak)**<br/>Floor: `8M` | Mid: `20M` | Opt: `40M` | [DERIVED (medium)](https://api-docs.deepseek.com/quick_start/pricing)<br/>*Basis: DeepSeek V4-Pro*<br/>*"V4-Pro peak: ¥9/M cache-miss input, ¥27/M output; off-peak prices are half the peak price"* |

**Key Gotchas & Constraints:**
- Peak hours are Mon-Fri 01:00-04:00 and 06:00-10:00 UTC (Asiapost-hours); other times 50% off
- Cache-hit tokens are nearly free but require identical prompt prefixes and are ephemeral
- $0.27-1.68/M price brackets quoted in older docs are stale; rely on current api-docs pricing

---

### Fireworks.ai (`fireworks-ai`)

- **Primary Pricing & Docs:** [https://fireworks.ai/pricing](https://fireworks.ai/pricing)
- **Category:** `api-provider`
- **Data Privacy & Training:** No
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **trial**: $1 free credits (official)<br/>**freeRpm**: Exact free-tier RPM unpublished; account-wide 6,000 RPM ceiling applies once a card is on file | Llama 3.3 70B, DeepSeek V3 | **$1 free trial (~2M tokens)**<br/>Floor: `2M` | [RESEARCH (low)](https://fireworks.ai/pricing) |
| **PAYG** | Enterprise | **RPM**: 6,000 requests/min with valid card<br/>**batchDiscount**: 50% off Batch API<br/>**latency**: Sub-100ms TTFT | Llama 4 Maverick, DeepSeek V4, Kimi K3 | **Serverless PAYG ($20 buys ~35M tokens)**<br/>Floor: `35M` | [RESEARCH (low)](https://fireworks.ai/pricing) |

**Key Gotchas & Constraints:**
- 503 load shedding errors occur during saturated cluster load events
- Card required on file to unlock 6,000 RPM high throughput
- Fine-tuning deployment incurs hourly standby charges

---

### Google AI Studio (`google-ai-studio`)

- **Primary Pricing & Docs:** [https://aistudio.google.com](https://aistudio.google.com)
- **Category:** `api-provider`
- **Data Privacy & Training:** Yes on Free tier; No on Paid tiers
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **RPM**: 15 requests/min<br/>**TPM**: 1,000,000 tokens/min<br/>**RPD**: 1,500 requests/day | Gemini 3.8 Flash, Gemini 3.1 Pro | **1,500 requests/day (~15M tokens/mo)**<br/>Floor: `15M` | [RESEARCH (low)](https://aistudio.google.com) |
| **Tier1** | Enterprise | **spendCap**: $250/mo spend limit<br/>**RPM**: 1,000 requests/min<br/>**TPM**: 4,000,000 tokens/min | Gemini 3.8 Flash, Gemini 3.1 Pro | **PAYG up to $250/mo spend cap (~67M conservative / ~130M cached-agent tokens @ $100)**<br/>Floor: `67M` | Mid: `100M` | Opt: `130M` | [DERIVED (medium)](https://ai.google.dev/gemini-api/docs/pricing)<br/>*Basis: Gemini 3.8 Flash*<br/>*"Gemini 3.8 Flash input $0.75 / output $3.75 per 1M tokens (input price through December 31, 2026)"* |
| **Tier2** | Enterprise | **spendCap**: $2,000/mo spend limit<br/>**RPM**: 2,000 requests/min<br/>**TPM**: 8,000,000 tokens/min | Gemini 3.8 Flash, Gemini 3.1 Pro | **PAYG up to $2,000/mo limit (~500M tokens)**<br/>Floor: `500M` | [RESEARCH (low)](https://aistudio.google.com) |
| **Tier3** | Enterprise | **spendCap**: $20,000-$100,000/mo spend limit<br/>**RPM**: 5,000+ requests/min<br/>**TPM**: 20,000,000+ tokens/min | Gemini 3.8 Flash, Gemini 3.1 Pro | **Enterprise scale PAYG (~2B tokens)**<br/>Floor: `2000M` | [RESEARCH (low)](https://aistudio.google.com) |

**Key Gotchas & Constraints:**
- Free tier data IS logged and used for model training and human review
- Promotional credits expire after 1 year and are non-refundable
- Context caching incurs continuous storage fees per hour

---

### Groq API (`groq-api`)

- **Primary Pricing & Docs:** [https://console.groq.com](https://console.groq.com)
- **Category:** `api-provider`
- **Data Privacy & Training:** No
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **limits**: Developer-plan base limits (Free is lower): per-model RPM 10-30, RPD 100-1,000, TPM 1.2K-70K, TPD up to ~500K | GPT-OSS-120B, Qwen3.8, Kimi K3 | **Per-model rate caps (~2-10M tokens/mo depending on model)**<br/>Floor: `5M` | [RESEARCH (low)](https://console.groq.com) |
| **PAYG** | Enterprise | **batchDiscount**: 50% batch/caching discount<br/>**throughput**: 400-800 tokens/sec on LPU hardware | GPT-OSS-120B, Qwen3.8, Kimi K3, Compound models | **Direct PAYG ($20 buys ~40M tokens)**<br/>Floor: `40M` | [RESEARCH (low)](https://console.groq.com) |

**Key Gotchas & Constraints:**
- Llama chat/vision models are GONE from Groq's catalog (only Llama Prompt-Guard safety models remain); lineup is now GPT-OSS/Qwen/Whisper/Compound
- Free-plan limits are per-model, not a single global quota; console tables show Developer-plan base limits unless stated otherwise
- Set manual spend caps to prevent runaway loops on ultra-fast inference

---

### Meta Llama API (`meta-model-api`)

- **Primary Pricing & Docs:** [https://dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai/docs/pricing-rate-limits)
- **Category:** `api-provider`
- **Data Privacy & Training:** Yes for Contributor tier; No for Standard tier
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard** | Enterprise | **RPM**: 3,000 requests/min<br/>**TPM**: 500,000 tokens/min<br/>**price**: $1.25/M input, $4.25/M output (official) | Muse Spark 1.3, Muse Spark 1.2 | **Standard PAYG ($20 buys ~10M list-blend / ~14M cached-agent tokens)**<br/>Floor: `10M` | Mid: `12M` | Opt: `14M` | [DERIVED (medium)](https://dev.meta.ai/docs/pricing-rate-limits)<br/>*Basis: Muse Spark 1.3*<br/>*"Standard: $1.25 per 1M input tokens, $4.25 per 1M output tokens; prompts and completions are not used to train Meta m..."* |
| **Contributor** | Enterprise | **RPM**: 60 requests/min<br/>**TPM**: 30,000 tokens/min<br/>**price**: $0.10-$0.20/M contributor pricing (~95% discount via muse-spark-1.2-contributor) | Muse Spark 1.2 (contributor) | **Contributor PAYG ($20 buys ~100M conservative / ~200M optimistic tokens)**<br/>Floor: `100M` | Mid: `133M` | Opt: `200M` | [DERIVED (medium)](https://dev.meta.ai/docs/pricing-rate-limits)<br/>*Basis: Muse Spark 1.2 (contributor)*<br/>*"Contributor: $0.10-$0.20 per 1M tokens in exchange for permission to use prompts and completions to train Meta models"* |

**Key Gotchas & Constraints:**
- Contributor allows training on your data
- Contributor tier throttled to 60 RPM

---

### MiniMax Token Plan (`minimax`)

- **Primary Pricing & Docs:** [https://platform.minimax.io/docs/guides/pricing-token-plan](https://platform.minimax.io/docs/guides/pricing-token-plan)
- **Category:** `api-provider`
- **Data Privacy & Training:** Not published on pricing page
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"App terms: "your account is personal to you... not to provide any other person with access"; platform terms: "the Account should be used solely by you". Multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Plus** | $22/mo | **quota**: 5-hour rolling + weekly windows<br/>**agents**: 3-4 concurrent agents | MiniMax M3, M2.7 | **5h + weekly windows (~20M tokens/mo est.)**<br/>Floor: `20M` | [RESEARCH (low)](https://platform.minimax.io/docs/guides/pricing-token-plan) |
| **Max** | $55/mo | **quota**: 5-hour rolling + weekly windows<br/>**agents**: 4-5 concurrent agents | MiniMax M3, M2.7 | **Higher windows (~65M tokens/mo est.)**<br/>Floor: `65M` | [RESEARCH (low)](https://platform.minimax.io/docs/guides/pricing-token-plan) |
| **Ultra** | $132/mo | **quota**: 5-hour rolling + weekly windows, extended sessions<br/>**agents**: 6-7 concurrent agents | MiniMax M3, M2.7 | **Highest windows (~160M tokens/mo est.)**<br/>Floor: `160M` | [RESEARCH (low)](https://platform.minimax.io/docs/guides/pricing-token-plan) |
| **Prepaid Credits** | Enterprise | **credits**: $5 = 5,000 / $25 = 25,000 / $100 = 100,000 credits (1,000 credits = $1)<br/>**validity**: 365 days | All MiniMax models | **$1 per 1,000 credits**<br/>Floor: `0M` | [RESEARCH (low)](https://platform.minimax.io/docs/guides/pricing-token-plan) |

**Key Gotchas & Constraints:**
- Sold as 'Token Plan' subscription rather than a separate coding plan
- Exact credits inside 5h/weekly windows are not officially published - token estimates are research-derived
- MiniMax H3, voice design and rapid voice cloning not included
- Prepaid credits: 1,000 credits = $1, valid 365 days

---

### Mistral API (`mistral-api`)

- **Primary Pricing & Docs:** [https://mistral.ai/pricing](https://mistral.ai/pricing)
- **Category:** `api-provider`
- **Data Privacy & Training:** Opt-out available
- **IP Indemnity:** False
- **Stacking Policy:** `unknown`

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free (Le Plan Studio)** | Free ($0) | **credits**: Signup credits + $10/mo included credits | Mistral Medium 3.5, Codestral | **$10/mo credits (~10M tokens on select models)**<br/>Floor: `10M` | [RESEARCH (low)](https://mistral.ai/pricing) |
| **PAYG** | Enterprise | **batchDiscount**: 50% off Batch API<br/>**cacheDiscount**: 90% off prefix caching<br/>**hardContextCap**: Enforced context limit (400 rather than truncation) | Mistral Medium 3.5, Mistral Small 4, Mistral Large 3<br/>*(+3 more)* | **Direct PAYG ($20 buys ~20M Codestral tokens)**<br/>Floor: `20M` | [RESEARCH (low)](https://mistral.ai/pricing) |

**Key Gotchas & Constraints:**
- Model lifecycle folded Magistral into Mistral Medium 3.5; Small is now 'Mistral Small 4'
- Training is opt-out rather than off by default; verify your workspace privacy settings
- Exceeding the context window triggers hard 400 Bad Request rather than truncation
- Codestral license restricts certain commercial reuse outside paid API

---

### Ollama Cloud (`ollama-cloud`)

- **Primary Pricing & Docs:** [https://ollama.com](https://ollama.com)
- **Category:** `api-provider`
- **Data Privacy & Training:** No
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Pricing FAQ: "Can I have multiple Ollama accounts? No. Ollama is one account per person.""*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **cloudModels**: Community hosted models<br/>**concurrency**: 1 stream<br/>**localUse**: Unlimited local execution | Llama 3.2, Qwen 2.5 Coder 7B | **Free cloud tier (~1M tokens/mo)**<br/>Floor: `1M` | [RESEARCH (low)](https://ollama.com) |
| **Pro** | $20/mo<br/>($200/yr) | **credits**: $60 cloud compute credits/mo<br/>**concurrency**: 3 concurrent streams<br/>**peakSurcharge**: 12:00-18:00 UTC peak rates, Mon-Fri | DeepSeek V4.1 Flash, DeepSeek V4-Pro, MiniMax M3, GLM-5, Kimi K3 | **$60 credits (~60M baseline; 31.4M Kimi K3 to 1.23B DeepSeek Flash)**<br/>Floor: `60M` | [RESEARCH (low)](https://ollama.com) |
| **Max** | $100/mo | **credits**: $300 cloud compute credits/mo<br/>**concurrency**: 10 concurrent streams<br/>**peakSurcharge**: Standard rates | DeepSeek V4.1 Flash, DeepSeek V4-Pro, MiniMax M3, GLM-5, Kimi K3 | **$300 credits (~300M baseline; 157.01M Kimi K3 to 6.15B DeepSeek Flash)**<br/>Floor: `300M` | [RESEARCH (low)](https://ollama.com) |
| **Team** | $500/mo | **credits**: $1,000 cloud compute credits/mo<br/>**concurrency**: 10 concurrent streams<br/>**privateEndpoints**: Dedicated pods | DeepSeek V4.1 Flash, DeepSeek V4-Pro, MiniMax M3, GLM-5, Kimi K3 | **$1,000 credits (~1B baseline; 523.36M Kimi K3 to 20.49B DeepSeek Flash)**<br/>Floor: `1000M` | [RESEARCH (low)](https://ollama.com) |

**Key Gotchas & Constraints:**
- Dollar credit pools ($60 Pro, $300 Max, $1,000 Team) spent across DeepSeek V4.1 Flash, DeepSeek V4-Pro, MiniMax M3, GLM-5, and Kimi K3
- Unused included usage does not roll over
- Peak pricing applies 12:00-18:00 UTC Monday-Friday
- Stacking prohibited: one account per person is strictly enforced; multiple accounts banned, clamped to 1 copy in Dangerous Dave mode

---

### OpenAI API (`openai-api`)

- **Primary Pricing & Docs:** [https://platform.openai.com](https://platform.openai.com)
- **Category:** `api-provider`
- **Data Privacy & Training:** No (API data not used for training by default; 30-day default retention, ZDR on request)
- **IP Indemnity:** True
- **Stacking Policy:** `silent` — *"Terms ban sharing account credentials; multiple paid accounts are not addressed."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAYG** | Enterprise | **spendTiers**: $100 / $500 / $1,000 / $5,000 / $200,000 mo spend caps (official)<br/>**retention**: 30-day default retention; ZDR available on request for eligible endpoints<br/>**batchDiscount**: 50% off Batch API | GPT-6 Astra, GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna | **Direct API PAYG ($20 buys ~10M mixed-frontier / ~18M Sol-class cached-agent / ~100M Luna-class)**<br/>Floor: `10M` | Mid: `18M` | Opt: `100M` | [DERIVED (medium)](https://platform.openai.com/docs/pricing)<br/>*Basis: GPT-5.6 Sol*<br/>*"gpt-5.6-sol $2.00 input / $10.00 output per 1M tokens; gpt-5.6-luna $0.10 / $0.60"* |

**Key Gotchas & Constraints:**
- Long-context pricing doubles on requests exceeding 272K tokens in context window
- Rate limits (TPM/RPM) are strictly tiered based on total historical account spend
- Reasoning tokens count towards output token billing

---

### Together.ai (`together-ai`)

- **Primary Pricing & Docs:** [https://www.together.ai/pricing](https://www.together.ai/pricing)
- **Category:** `api-provider`
- **Data Privacy & Training:** No
- **IP Indemnity:** False
- **Stacking Policy:** `silent` — *"Terms of Service reviewed; no multiple-account, sharing or seat clause found."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | Free ($0) | **rateLimits**: Dynamic rate limits - no fixed per-model RPM/TPM published; scales with account history<br/>**creditTrial**: $5 free credits | Llama 3.3 70B, DeepSeek V3, Qwen 2.5 Coder | **Signup credit (~5M tokens; amount not listed on the official pricing page)**<br/>Floor: `5M` | [RESEARCH (low)](https://www.together.ai/pricing) |
| **PAYG** | Enterprise | **tierLimits**: Dynamic limits scale with spend history ($25/$50/$100/$250 milestones historically)<br/>**batchDiscount**: 50% off Batch inference | Llama 3.3 70B, DeepSeek V3, Qwen 2.5 Coder 32B | **PAYG ($20 buys ~30M tokens)**<br/>Floor: `30M` | [RESEARCH (low)](https://www.together.ai/pricing) |

**Key Gotchas & Constraints:**
- Sudden traffic spikes hit 429 rate limits until account tier auto-upgrades
- Cold start delays on infrequently accessed open-weights models
- Dedicated endpoints incur minimum hourly billing

---

### Xiaomi MiMo Token Plan (`xiaomi-mimo`)

- **Primary Pricing & Docs:** [https://mimo.mi.com/docs/en-US/price/token-plan](https://mimo.mi.com/docs/en-US/price/token-plan) · Token Plan Subscription FAQ: [https://mimo.mi.com/docs/en-US/quick-start/faq/token-plan](https://mimo.mi.com/docs/en-US/quick-start/faq/token-plan) · Pay-As-You-Go Pricing: [https://mimo.mi.com/docs/en-US/price/pay-as-you-go](https://mimo.mi.com/docs/en-US/price/pay-as-you-go) · Rate Limits: [https://mimo.mi.com/docs/en-US/api/guidance/rate-limit](https://mimo.mi.com/docs/en-US/api/guidance/rate-limit) · Platform: [https://platform.xiaomimimo.com/token-plan](https://platform.xiaomimimo.com/token-plan)
- **Category:** `api-provider`
- **Data Privacy & Training:** Standard API terms; no explicit opt-out mechanism documented for model training
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Each account can only subscribe to one Token Plan at a time. If you want to change your plan, you must wait until the current billing cycle ends."*

#### Credit-to-Token Conversion Math

Xiaomi Token Plan uses a **credit-based system** where different operations consume different credit amounts per token:

| Model | Cache Hit (credits/token) | Cache Miss (credits/token) | Output (credits/token) |
| :--- | :---: | :---: | :---: |
| **MiMo-V2.5** | 2 | 100 | 200 |
| **MiMo-V2.5-Pro** | 2.5 | 300 | 600 |

Under Token-Max's standard agentic request (20K input, 75% cache hit, 1K output):
- **MiMo-V2.5**: (15,000 × 2) + (5,000 × 100) + (1,000 × 200) = 730,000 credits/turn → 34.762M credits per 1M tokens
- **MiMo-V2.5-Pro**: (15,000 × 2.5) + (5,000 × 300) + (1,000 × 600) = 2,137,500 credits/turn → 101.786M credits per 1M tokens

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lite** | $6/mo | **credits**: 4,100,000,000 (4.1B) Credits/mo<br/>**offPeakMultiplier**: 0.8× deduction rate UTC 16:00–24:00<br/>**rateLimit**: 10 RPM, 200 TPM (K) | MiMo-V2.5-Pro, MiMo-V2.5 | **4.1B credits; V2.5-Pro 40.28M / V2.5 117.93M tokens (derived from official table)**<br/>Floor: `40.28M` (V2.5-Pro) / `117.93M` (V2.5) | [OFFICIAL (high)](https://mimo.mi.com/docs/en-US/price/token-plan)<br/>*"Lite: 4.1 billion credits"* |
| **Standard** | $16/mo | **credits**: 11,000,000,000 (11B) Credits/mo<br/>**offPeakMultiplier**: 0.8× deduction rate UTC 16:00–24:00<br/>**rateLimit**: 10 RPM, 200 TPM (K) | MiMo-V2.5-Pro, MiMo-V2.5 | **11B credits; V2.5-Pro 108.07M / V2.5 316.42M tokens (derived from official table)**<br/>Floor: `108.07M` (V2.5-Pro) / `316.42M` (V2.5) | [OFFICIAL (high)](https://mimo.mi.com/docs/en-US/price/token-plan)<br/>*"Standard: 11 billion credits"* |
| **Pro** | $50/mo | **credits**: 38,000,000,000 (38B) Credits/mo<br/>**offPeakMultiplier**: 0.8× deduction rate UTC 16:00–24:00<br/>**rateLimit**: 10 RPM, 200 TPM (K) | MiMo-V2.5-Pro, MiMo-V2.5 | **38B credits; V2.5-Pro 373.33M / V2.5 1093.08M tokens (derived from official table)**<br/>Floor: `373.33M` (V2.5-Pro) / `1093.08M` (V2.5) | [OFFICIAL (high)](https://mimo.mi.com/docs/en-US/price/token-plan)<br/>*"Pro: 38 billion credits"* |
| **Max** | $100/mo | **credits**: 82,000,000,000 (82B) Credits/mo<br/>**offPeakMultiplier**: 0.8× deduction rate UTC 16:00–24:00<br/>**rateLimit**: 10 RPM, 200 TPM (K) | MiMo-V2.5-Pro, MiMo-V2.5 | **82B credits; V2.5-Pro 805.61M / V2.5 2358.9M tokens (derived from official table)**<br/>Floor: `805.61M` (V2.5-Pro) / `2358.9M` (V2.5) | [OFFICIAL (high)](https://mimo.mi.com/docs/en-US/price/token-plan)<br/>*"Max: 82 billion credits"* |

**Key Gotchas & Constraints:**
- Credit system: costs vary by cache hit/miss/output — actual token yield depends heavily on cache hit rate
- Off-peak 0.8× multiplier (UTC 16:00–24:00) effectively gives 25% more tokens during off-peak hours
- Each account limited to one active Token Plan at a time; no mid-cycle upgrades
- MiMo-V2.5-Pro-UltraSpeed (MXFP4 quantized, >1000 TPS) is PAYG-only and NOT included in Token Plans
- Rate limits are relatively low (10 RPM, 200K TPM) compared to Western providers
- Token Plan credits do NOT roll over to the next billing cycle
- Overseas (non-China) PAYG pricing is higher than domestic pricing
- OpenRouter pricing may differ from direct API pricing

---

### Z.ai GLM Coding Plan (`z-ai`)

- **Primary Pricing & Docs:** [https://z.ai/subscribe](https://z.ai/subscribe) · Usage Instructions: [https://docs.z.ai/devpack/overview#usage-instruction](https://docs.z.ai/devpack/overview#usage-instruction) · Usage Policy: [https://docs.z.ai/devpack/usage-policy](https://docs.z.ai/devpack/usage-policy)
- **Category:** `api-provider`
- **Data Privacy & Training:** Team plans: conversation data not used for model training (official). Personal plans: standard subscription terms, no public no-training commitment
- **IP Indemnity:** False
- **Stacking Policy:** `prohibited` — *"Subscription terms: benefits are "exclusive to the subscriber"; "Account sharing or multi-user access is prohibited" and the licence is tied to a single natural person with no aggregation/proxying."*

#### Stated Limits & Token Yield Estimates

| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lite** | $18/mo<br/>($151/yr) | **fiveHourCredits**: 2,000 credits<br/>**weeklyCredits**: 10,000 credits<br/>**weeklyLimitGLM53**: Up to 97M Tokens/week<br/>**weeklyLimitGLM53Flash**: Up to 584M Tokens/week<br/>**weeklyCeiling**: Up to 97M GLM-5.3 / 584M GLM-5.3-Flash tokens/week (~420M / 2,529M monthly ceiling)<br/>**concurrency**: Recommended for 1 project at a time (dynamic off-peak boost)<br/>**offPeakDiscount**: 50% credit rate during off-peak<br/>**peakHours**: Mon-Fri 14:00-18:00 UTC+8<br/>**toolRestrictions**: Strictly limited to supported coding tools (Claude Code, Cline, OpenCode, Goose) | GLM-5.3, GLM-5.3-Flash | **10K weekly credits; GLM-5.3 48-97M tokens/wk at 95% cache (official)**<br/>Floor: `208M` | Mid: `314M` | Opt: `420M` | [OFFICIAL (high)](https://docs.z.ai/devpack/overview)<br/>*Basis: GLM-5.3*<br/>*"Weekly limit, up to: GLM-5.3 97M Tokens, GLM-5.3-Flash 584M Tokens"* |
| **Pro** | $80/mo<br/>($605/yr) | **fiveHourCredits**: 12,000 credits<br/>**weeklyCredits**: 60,000 credits<br/>**weeklyLimitGLM53**: Up to 582M Tokens/week<br/>**weeklyLimitGLM53Flash**: Up to 3,504M Tokens/week<br/>**weeklyCeiling**: Up to 582M GLM-5.3 / 3,504M GLM-5.3-Flash tokens/week (~2,520M / 15,172M monthly ceiling; 6× Lite)<br/>**concurrency**: Recommended for 1-2 projects simultaneously (dynamic off-peak boost)<br/>**offPeakDiscount**: 50% credit rate during off-peak<br/>**includedMcps**: Vision, Web Search, Web Reader, Zread | GLM-5.3, GLM-5.3-Flash | **60K weekly credits; GLM-5.3 290-582M tokens/wk at 95% cache (official)**<br/>Floor: `1256M` | Mid: `1888M` | Opt: `2520M` | [OFFICIAL (high)](https://docs.z.ai/devpack/overview)<br/>*Basis: GLM-5.3*<br/>*"Weekly limit, up to: GLM-5.3 582M Tokens, GLM-5.3-Flash 3504M Tokens (6× Lite usage)"* |
| **Max** | $168/mo<br/>($1344/yr) | **fiveHourCredits**: 28,000 credits<br/>**weeklyCredits**: 140,000 credits<br/>**weeklyLimitGLM53**: Up to 1,358M Tokens/week<br/>**weeklyLimitGLM53Flash**: Up to 8,176M Tokens/week<br/>**weeklyCeiling**: Up to 1,358M GLM-5.3 / 8,176M GLM-5.3-Flash tokens/week (~5,884M / 35,402M monthly ceiling; 14× Lite)<br/>**concurrency**: Recommended for 2+ projects simultaneously (highest allocation, dynamic off-peak boost)<br/>**offPeakDiscount**: 50% credit rate during off-peak<br/>**priority**: Priority resource allocation during peak hours | GLM-5.3, GLM-5.3-Flash | **140K weekly credits; GLM-5.3 676M-1.36B tokens/wk at 95% cache (official)**<br/>Floor: `2927M` | Mid: `4405M` | Opt: `5884M` | [OFFICIAL (high)](https://docs.z.ai/devpack/overview)<br/>*Basis: GLM-5.3*<br/>*"Weekly limit, up to: GLM-5.3 1358M Tokens, GLM-5.3-Flash 8176M Tokens (14× Lite usage)"* |
| **Team Standard** | $80/mo | **fiveHourCredits**: 15,000 credits / seat<br/>**weeklyCredits**: 66,000 credits / seat<br/>**minSeats**: 2 seats minimum<br/>**concurrency**: 1-2 concurrent projects per seat<br/>**dataPrivacy**: Excluded from model training by default<br/>**overage**: On-demand overage billed at a 10% discount from model API list price<br/>**billing**: Centralized billing, seat management & VAT invoicing | GLM-5.3, GLM-5.3-Flash | **66K weekly credits/seat; GLM-5.3 319-638M tokens/wk/seat (derived from official table)**<br/>Floor: `1381M` | Mid: `2072M` | Opt: `2763M` | [DERIVED (medium)](https://docs.z.ai/devpack/teamplan)<br/>*Basis: GLM-5.3*<br/>*"Standard Seat: 15,000 credits / 5h, 66,000 credits / week"* |

**Key Gotchas & Constraints:**
- Strictly tool-only: direct generic API scraping or unauthorized tools trigger error 1113 or risk control suspension
- Dual 5-hour rolling limits and 7-day weekly reset cycles - exhaustion requires waiting for the 5-hour refresh
- Peak hours (Mon-Fri 14:00-18:00 UTC+8) consume credits at 2x the off-peak rate
- All plans serve GLM-5.3 and GLM-5.3-Flash only; GLM-5.2/GLM-5.1 requests are auto-routed to GLM-5.3 and GLM-4.7 to GLM-5.3-Flash
- GLM-5.3-Flash campaign (Sep 3-20, 2026): unlimited usage via ZCode 23:00-09:00 SGT and doubled quota on other agents - temporary bonus on top of the published allowance
- Subscriptions auto-renew at the end of each billing cycle; cancellation must be done at least 3 days before renewal date
- Subscriptions are non-refundable once purchased; downgrading team seats mid-cycle is not supported
- Account sharing or multi-user access is prohibited; violations trigger risk control (rate limiting, freezing, ban after >3 violations)

---

## 4. Cross-Reference Index

- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md): End-to-end ingestion pipeline and blended calculation methodology.
- [`docs/TOKEN_ESTIMATE_VALIDATION.md`](docs/TOKEN_ESTIMATE_VALIDATION.md): Empirical OSINT validation for 20:1 agent blends and prompt caching.
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md): Historical verification audit log and provider test passes.
- [`data/estimate-constants.json`](data/estimate-constants.json): Canonical mathematical constants shared across frontend and data scripts.
