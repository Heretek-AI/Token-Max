# 2026 Comprehensive Web Crawl & Usage Specs Audit Log

This document records the comprehensive web crawl research and validation pass performed on **September 19, 2026** across all **33 coding subscription plans** tracked by Token-Max.

Every provider's official pricing page, billing documentation, and Terms of Service were crawled using Firecrawl and web search to validate that Token-Max's tier pricing, limits, quotas, model catalogs, token budget estimates, and stacking policies match real-world provider offerings.

---

## 1. Audit Summary & Key Changes

| Category | Count | Status | Key Verifications & Updates |
| :--- | :--- | :--- | :--- |
| **Coding IDEs** | 14 | 100% Crawled & Verified | Added annual pricing for Cursor Pro+ ($576/yr) and Ultra ($1920/yr), Claude Code Pro ($200/yr), Replit Core ($216/yr) and Pro ($1080/yr). Reconciled Windsurf (Cognition Devin) SWE-2 tiers and daily/weekly refresh quotas. Verified Kiro credit tiers and add-on rates ($0.04/credit). |
| **Coding Routers** | 5 | 100% Crawled & Verified | Verified Kilo Code platform ($0 ind / $15 team) + Kilo Pass bonus structures. Verified Kimi Code tempo tiers (Moderato $19, Allegretto $39, Allegro $99, Vivace $199) and Agent Swarm. Verified OpenCode Zen PAYG auto top-ups. |
| **API Providers** | 14 | 100% Crawled & Verified | Updated DeepSeek API endpoints to `api-docs.deepseek.com`, verified exact Flash ($0.15/$0.60 off-peak) and V4-Pro rates, 2,500/500 concurrency caps, and 1M context. Verified Google AI Studio Gemini 3.8 Flash ($0.75/$3.75), 3.7 Flash, and 3.1 Pro pricing. Updated Together AI and Fireworks AI to explicit pricing URLs. |

---

## 2. Provider-by-Provider Crawl Evidence & Findings

### Batch 1: Frontier AI Coding IDEs

#### 1. Cursor (`cursor`)
- **Primary URLs Crawled**: `https://cursor.com/pricing`, `https://cursor.com/docs/account/pricing`
- **Extracted Specs**:
  - **Hobby**: $0/mo. Limited Agent requests, access to Composer.
  - **Pro**: $20/mo ($192/yr billed annually = $16/mo). Extended limits on Agent, generous limits for Grok, frontier models, MCPs/skills/hooks, cloud agents.
  - **Pro+**: $60/mo ($576/yr billed annually with 20% discount = $48/mo). 3x Pro limits on Agent.
  - **Ultra**: $200/mo ($1920/yr billed annually with 20% discount = $160/mo). 20x Pro limits on Agent.
  - **Start (India only)**: ₹649/mo (~$7.80/mo). Cursor Models pool only, non-fast mode, medium effort.
  - **Teams**: Standard ($40/user/mo), Premium ($120/user/mo, 5x standard limits). Third-party models incur a Cursor Token Rate of $0.25/M tokens.
  - **Models**: Cursor Grok 4.6, Grok 4.5, Composer 2.5, Claude Sonnet 5, Claude Opus 5, Claude Fable 5.1, Gemini 3.1 Pro, Gemini 3.8 Flash, GPT-5.6 Sol/Terra/Luna, Muse Spark 1.3.
- **Validation Verdict**: Matches. Populated `annualPrice` on Pro+ ($576) and Ultra ($1920).

#### 2. Windsurf / Devin (`windsurf`)
- **Primary URLs Crawled**: `https://windsurf.com/pricing`, `https://devin.ai/pricing`
- **Extracted Specs**:
  - **Free**: $0/mo. Light quota to code with agents, limited model availability, unlimited inline edits, unlimited Tab completions.
  - **Pro**: $20/mo. Access to frontier models (OpenAI, Claude, Gemini, SpaceXAI, open source), free use of SWE-2 Free through October 10, 2026, Devin Cloud access, extra usage at API pricing.
  - **Max**: $200/mo. Significantly higher quotas (5x Pro).
  - **Teams**: $80/mo team plan + $40/mo per full dev seat.
  - **Quota Mechanics**: Rolling daily and weekly refreshes. Extra usage charged at API pricing.
- **Validation Verdict**: Matches. Reconciled with Cognition Devin platform updates.

#### 3. Claude Code (`claude-code`)
- **Primary URLs Crawled**: `https://claude.com/pricing`, `https://docs.anthropic.com/en/docs/claude-code`
- **Extracted Specs**:
  - **Pro**: $20/mo ($17/mo billed annually = $200 upfront). Claude Code included, >=5x usage of Free per 5-hour session. Models: Opus 5, Sonnet 5, Haiku 4.5.
  - **Max 5x**: $100/mo. 5x Pro usage per 5-hour session, higher output limits, Claude Fable 5.1 (50% of weekly limits). Billed monthly.
  - **Max 20x**: $200/mo. 20x Pro usage per 5-hour session. Billed monthly.
  - **Team**: Standard ($25/mo or $20 annual), Premium ($125/mo or $100 annual, 5x standard).
  - **Usage**: Shared rolling 5-hour window + weekly caps across web, desktop, mobile, and CLI. Opt-in usage credits at API rates after quota.
- **Validation Verdict**: Matches. Populated `annualPrice: 200` on Pro tier.

#### 4. GitHub Copilot (`github-copilot`)
- **Primary URLs Crawled**: `https://github.com/features/copilot/plans`
- **Extracted Specs**:
  - **Free**: $0/mo. 2,000 completions/mo, 50 chat/agent requests/mo.
  - **Pro**: $10/mo ($100/yr). Unlimited completions. Total monthly AI credits: $15 ($10 base + $5 flex). 1 credit = $0.01.
  - **Pro+**: $39/mo. 4x+ usage of Pro. Total monthly AI credits: $70 ($39 base + $31 flex).
  - **Max**: $100/mo. 2.9x+ usage of Pro+. Total monthly AI credits: $200 ($100 base + $100 flex).
  - **Business**: $19/user/mo.
  - **Enterprise**: $39/user/mo.
  - **Models**: Claude Fable 5/5.1, Opus 4.7/4.8/5, Sonnet 4/4.6/5, Haiku 4.5, GPT-5/5.2/5.3/5.4/5.5/5.6/Sol/Terra/Luna, GPT-6 Astra, Gemini 3.5/3.6/3.7/3.8 Flash, Grok 4.5/4.6, Kimi K2.7/K3.
- **Validation Verdict**: Matches 100%. Conservative estimates properly anchored to base credits.

#### 5. Google Antigravity (`google-antigravity`)
- **Primary URLs Crawled**: `https://antigravity.google/pricing`
- **Extracted Specs**:
  - **Individual**: $0/mo. Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash, 3.1 Pro, Claude Sonnet & Opus 4.6, gpt-oss-120b. Basic weekly rate limits.
  - **Google AI Pro**: $19.99/mo (Google One AI Premium tier).
  - **Google AI Ultra 5x**: $99.99/mo flexible AI credit pool.
  - **Google AI Ultra 20x**: $199.99/mo flexible AI credit pool.
  - **Organization (Google Cloud)**: Consumption-based API pricing with Gemini Enterprise Agent Platform under GCP ToS.
- **Validation Verdict**: Matches. Tiers reflect official Google AI Ultra 5x and 20x splits.

#### 6. OpenAI Codex (`openai-codex`)
- **Primary URLs Crawled**: `https://openai.com/chatgpt/pricing/`
- **Extracted Specs**:
  - **Free**: $0/mo. GPT-5.6 Luna, limited Codex access, 27K context.
  - **Go**: $8/mo. More messages and tools, 54K instant / 256K reasoning context.
  - **Plus**: $20/mo. GPT-6 Astra, GPT-5.6 Sol/Terra, GPT-5 Thinking Mini, expanded Codex usage.
  - **Pro (5x)**: $100/mo. 5x usage, GPT-6 Astra, GPT-5.6 Sol Pro.
  - **Pro (maximum)**: $200/mo. Maximum Codex tasks, 128K instant / 400K reasoning context.
- **Validation Verdict**: Matches. Rebased on OSINT 250K-900K task band.

#### 7. Replit (`replit`)
- **Primary URLs Crawled**: `https://replit.com/pricing`
- **Extracted Specs**:
  - **Core**: $20/mo ($18/mo billed annually = $216/yr). Up to 30 hours of chat on Free Mode, up to 60 projects, $20 toward powerful models, Plan mode, unlimited workspaces.
  - **Pro**: $100/mo ($90/mo billed annually = $1080/yr). 10 parallel agents, $100 toward powerful models, up to 15 collaborators, 50 viewers.
  - **Enterprise**: Custom seats, single-tenant, static IPs.
- **Validation Verdict**: Matches. Added `annualPrice: 216` (Core) and `annualPrice: 1080` (Pro).

#### 8. Lovable (`lovable`)
- **Primary URLs Crawled**: `https://lovable.dev/pricing`, `https://docs.lovable.dev/introduction/plans-and-credits`
- **Extracted Specs**:
  - **Free**: 5 daily build credits (up to 30/mo) + 20 Cloud credits + 4 AI gateway credits.
  - **Pro**: $25/mo ($0.25/credit = 100 base credits/mo) + 5 daily build credits grant + 20 Cloud credits + 4 AI credits. Top-ups $15 per 50 credits ($0.30/credit).
  - **Business**: $50/mo ($0.50/credit) + daily build credits + Cloud/AI grants. Top-ups $30 per 50 credits.
  - **Expiry**: Monthly credits expire after 2 months; top-ups expire after 12 months.
- **Validation Verdict**: Matches. Workspaces support unlimited members; priced by credits not seats.

---

### Batch 2: Workhorse & Specialized IDEs

#### 9. Augment Code (`augment-code`)
- **Primary URLs Crawled**: `https://www.augmentcode.com/pricing`
- **Extracted Specs**:
  - **Standard**: $20/mo flat per team (no per-seat charge), up to 50 seats with $20/mo usage included.
  - **Business**: $100/mo flat per team, up to 50 seats with $100/mo usage included.
  - **Usage Metering**: LLM model inference at public API list price + flat 40% service fee. Compute (Cosmos) billed separately. Top-ups valid 12 months.
  - **Privacy**: No AI training on paid plans.
- **Validation Verdict**: Matches the new flat-rate pooled team model.

#### 10. Amazon Q Developer (`amazon-q`)
- **Primary URLs Crawled**: `https://aws.amazon.com/q/developer/pricing/`
- **Extracted Specs**:
  - **Free**: $0/mo. 50 agentic requests/mo, 1,000 lines of code (LOC) transformation/mo.
  - **Pro**: $19/user/mo. Increased agentic request limits, 4,000 LOC transformation/mo ($0.003/additional LOC), admin dashboard, IP indemnity, opt-out data collection by default.
- **Validation Verdict**: Matches. Free tier limits are strictly 50 agentic requests/mo.

#### 11. Tabnine (`tabnine`)
- **Primary URLs Crawled**: `https://www.tabnine.com/pricing/`
- **Extracted Specs**:
  - **Code Assistant Platform**: $39/user/mo (billed annually). Completions and chat.
  - **Agentic Platform**: $59/user/mo (billed annually). Context engine and autonomous workflows.
  - **Enterprise**: Custom.
  - **Usage**: Unlimited completions; no training on customer code; IP indemnity on enterprise.
- **Validation Verdict**: Matches official updated platform pricing.

#### 12. Kiro (`kiro`)
- **Primary URLs Crawled**: `https://kiro.dev/pricing/`
- **Extracted Specs**:
  - **Free**: 50 credits/mo, Claude Sonnet 4.5 & open weight models.
  - **Pro**: $20/user/mo. 1,000 credits/mo, premium models (Auto, Sonnet 5, Opus 5, GPT-5.6 Sol). Add-on credits at $0.04/credit.
  - **Pro+**: $40/user/mo. 2,000 credits/mo.
  - **Pro Max**: $100/user/mo. 5,000 credits/mo.
  - **Power**: $200/user/mo. 10,000 credits/mo.
- **Validation Verdict**: Matches. Third-party automation harnesses (e.g. OpenClaw) explicitly banned.

#### 13. Meta Muse Code (`meta-muse-code`)
- **Primary URLs Crawled**: `https://developer.meta.com/ai/products/muse-code`
- **Extracted Specs**:
  - **Everyday**: $5/mo.
  - **High**: $15/mo (5x Everyday).
  - **Power**: $50/mo (20x Everyday).
  - Models: Muse Spark 1.3. API keys restricted to Muse Code client.
- **Validation Verdict**: Matches official developer product specifications.

#### 14. Aider (`aider`)
- **Primary URLs Crawled**: `https://aider.chat/docs/faq.html`
- **Extracted Specs**:
  - Open-source terminal tool under Apache 2.0.
  - $0 subscription; BYOK (Bring Your Own Key) to any upstream API provider.
- **Validation Verdict**: Matches.

---

### Batch 3: Coding Routers & Proxies

#### 15. CommandCode (`commandcode`)
- **Primary URLs Crawled**: `https://commandcode.ai/pricing`
- **Extracted Specs**:
  - Go ($1/mo, includes $10 credits), GOAT ($10/mo), Pro ($20/mo), Max 10x ($100/mo), Max 20x ($200/mo).
  - Strictly one account per person (stacking prohibited by terms).
- **Validation Verdict**: Matches.

#### 16. Kimi Code (`kimi-code`)
- **Primary URLs Crawled**: `https://www.kimi.com/coding-plan/`
- **Extracted Specs**:
  - **Moderato**: $19/mo ($15/mo annual).
  - **Allegretto**: $39/mo ($31/mo annual). Includes Agent Swarm.
  - **Allegro**: $99/mo ($79/mo annual). 1M context.
  - **Vivace**: $199/mo ($159/mo annual). Highest concurrency.
- **Validation Verdict**: Matches official tempo tiers.

#### 17. Kilo Code (`kilo-code`)
- **Primary URLs Crawled**: `https://kilo.ai/pricing`
- **Extracted Specs**:
  - **Individual**: $0/mo platform fee. Open source extension, BYOK or Kilo Gateway at exact provider rates (0% markup, 5% processing fee on credit top-ups).
  - **Teams**: $15/user/mo platform fee. Shared agent modes, team analytics, centralized billing.
  - **Kilo Pass**: Starter ($19/mo, up to $26.60 credits), Pro ($49/mo, up to $68.60 credits), Expert ($199/mo, up to $278.60 credits). Bonus credits up to 50%.
- **Validation Verdict**: Matches.

#### 18. OpenCode (`opencode`)
- **Primary URLs Crawled**: `https://opencode.ai/zen`
- **Extracted Specs**:
  - Free CLI ($0).
  - Zen PAYG: $20 minimum deposit with $1.23 card fee, zero model markup.
  - Go: $10/mo flat. Models include Qwen 3.7 Plus, Kimi K3, K2.7, GPT-5.6 Luna.
  - Account circumvention prohibited.
- **Validation Verdict**: Matches.

#### 19. OpenRouter (`openrouter`)
- **Primary URLs Crawled**: `https://openrouter.ai/models`, `https://openrouter.ai/docs`
- **Extracted Specs**:
  - Free tier: 20 RPM, 50-1,000 RPD on free endpoints.
  - PAYG: 5.5% platform fee on model API costs, prompt caching passed through.
  - Multi-account bypass strictly prohibited.
- **Validation Verdict**: Matches.

---

### Batch 4: Direct API Providers & Model Studios

#### 20. Anthropic API (`anthropic-api`)
- **Primary URLs Crawled**: `https://www.anthropic.com/pricing`, `https://docs.anthropic.com/en/api/rate-limits`
- **Extracted Specs**:
  - Fable 5.1: $10/M in, $50/M out, cache read $0.25/M, write $12.50/M.
  - Opus 5: $5/M in, $25/M out, cache read $0.50/M, write $6.25/M.
  - Sonnet 5: $2/M in, $10/M out, cache read $0.20/M, write $2.50/M.
  - Haiku 4.5: $1/M in, $5/M out, cache read $0.10/M, write $1.25/M.
  - 50% discount on Batch processing. No training on API data.
- **Validation Verdict**: Matches.

#### 21. OpenAI API (`openai-api`)
- **Primary URLs Crawled**: `https://openai.com/api/pricing/`, `https://platform.openai.com/docs/pricing`
- **Extracted Specs**:
  - GPT-5.6 Sol: $2.00/M in, $10.00/M out.
  - GPT-5.6 Luna: $0.10/M in, $0.60/M out.
  - 50% discount on Prompt Caching reads and Batch API.
  - 30-day data retention by default; Zero Data Retention (ZDR) available on request.
- **Validation Verdict**: Matches.

#### 22. DeepSeek API (`deepseek-api`)
- **Primary URLs Crawled**: `https://api-docs.deepseek.com/quick_start/pricing`
- **Extracted Specs**:
  - **Flash (DeepSeek-V4.1-Flash)**: 1M context, 384K output. 2,500 concurrency limit.
    - Input Cache Miss: $0.15/M off-peak, $0.30/M peak.
    - Input Cache Hit: $0.003/M off-peak, $0.006/M peak.
    - Output: $0.60/M off-peak, $1.20/M peak.
  - **V4-Pro (DeepSeek-V4-Pro)**: 500 concurrency limit.
    - Input Cache Miss: $0.66/M off-peak, $1.32/M peak.
    - Input Cache Hit: $0.022/M off-peak, $0.044/M peak.
    - Output: $1.98/M off-peak, $3.96/M peak.
- **Validation Verdict**: Updated URL to `https://api-docs.deepseek.com/quick_start/pricing`, updated Flash budget to ~75M off-peak, recorded official concurrency and 1M/384K context limits.

#### 23. Google AI Studio (`google-ai-studio`)
- **Primary URLs Crawled**: `https://ai.google.dev/pricing`
- **Extracted Specs**:
  - Gemini 3.8 Flash: $0.75/M in, $3.75/M out (promotional through Dec 31, 2026; $1.50/$7.50 after). Cache read $0.075/M.
  - Gemini 3.7 Flash: $0.75/M in, $3.75/M out.
  - Gemini 3.1 Pro Preview: <=200K $2.00/$12.00; >200K $4.00/$18.00.
  - Gemini 3.5 Flash-Lite: $0.30/M in, $2.50/M out.
  - 50% Batch discount. Free tier trains; Paid tier does not.
- **Validation Verdict**: Matches.

#### 24. Z.ai GLM Coding Plan (`z-ai`)
- **Primary URLs Crawled**: `https://z.ai/subscribe`, `https://docs.z.ai/devpack/overview`
- **Extracted Specs**:
  - **Lite**: $18/mo ($151/yr). 2,000 5-hour credits, 10,000 weekly credits. 48-97M GLM-5.3 tokens/wk at 95% cache = 208M-420M tokens/mo.
  - **Pro**: $72/mo ($605/yr). 12,000 5-hour credits, 60,000 weekly credits. 1,256M-2,511M tokens/mo.
  - **Max**: $160/mo ($1,344/yr). 28,000 5-hour credits, 140,000 weekly credits. 2,927M-5,854M tokens/mo.
  - Off-peak 50% discount. Stacking prohibited.
- **Validation Verdict**: Matches official documentation table.

#### 25. Alibaba Cloud Model Studio (`alibaba-cloud`)
- **Primary URLs Crawled**: `https://www.alibabacloud.com/help/en/model-studio/token-plan-overview`
- **Extracted Specs**:
  - Personal Lite ($6/mo, 2,500 credits/7d), Essential ($10/mo, 5,625 credits/7d), Plus ($28/mo, 16,875 credits/7d), Pro ($56/mo, 35,000 credits/7d).
  - Team Starter ($28/mo), Team Growth ($100/mo), Team Scale ($270/mo).
  - Extra bundle: $15 = 20,000 credits.
- **Validation Verdict**: Matches.

#### 26. BytePlus ModelArk (`byteplus`)
- **Primary URLs Crawled**: `https://docs.byteplus.com/en/docs/ModelArk/1925114`
- **Extracted Specs**:
  - Lite ($10/mo): 3x Claude Pro usage (≈1,900 req/5h, 12,000/wk, 24,000/mo).
  - Pro ($50/mo): 5x Lite usage (≈9,500 req/5h, 60,000/wk, 120,000/mo), ArkClaw included.
- **Validation Verdict**: Matches.

#### 27. MiniMax Token Plan (`minimax`)
- **Primary URLs Crawled**: `https://platform.minimax.io/docs/guides/pricing-token-plan`
- **Extracted Specs**:
  - Plus ($22/mo), Max ($55/mo), Ultra ($132/mo).
  - 5-hour and weekly rolling windows.
- **Validation Verdict**: Matches.

#### 28. Mistral API (`mistral-api`)
- **Primary URLs Crawled**: `https://mistral.ai/pricing`
- **Extracted Specs**:
  - Free: $10/mo API credits, Vibe on web, mobile & CLI for code.
  - Pro: $14.99/mo ($5.99 for students), $30/mo API credits, all-day Vibe coding.
  - Team: $24.99/user/mo ($50/mo min).
  - Mistral Large: $0.50/M in, $1.50/M out, 50% batch discount, up to 90% cache discount.
- **Validation Verdict**: Matches.

#### 29. Groq API (`groq-api`)
- **Primary URLs Crawled**: `https://groq.com/pricing/`, `https://console.groq.com/docs/models`
- **Extracted Specs**:
  - Pay-as-you-go tokens-as-a-service model, no subscription fee.
  - Sub-100ms TTFT LPX inference. Batch API 50% discount. Prompt caching support.
- **Validation Verdict**: Matches.

#### 30. Together AI (`together-ai`)
- **Primary URLs Crawled**: `https://www.together.ai/pricing`
- **Extracted Specs**:
  - $5 free trial credits.
  - PAYG serverless inference on open-weight models (Llama 3.3 70B, DeepSeek V3, Qwen 2.5 Coder).
  - 50% batch discount. Dynamic tier limits ($25/$50/$100/$250 spend).
- **Validation Verdict**: Updated URL to `https://www.together.ai/pricing`.

#### 31. Fireworks AI (`fireworks-ai`)
- **Primary URLs Crawled**: `https://fireworks.ai/pricing`
- **Extracted Specs**:
  - $1 free trial credits.
  - Serverless PAYG with 6,000 RPM with card on file. 50% batch discount.
- **Validation Verdict**: Updated URL to `https://fireworks.ai/pricing`.

#### 32. Meta Model API (`meta-model-api`)
- **Primary URLs Crawled**: `https://dev.meta.ai/docs/pricing-rate-limits`
- **Extracted Specs**:
  - Standard tier ($1.25/M in, $4.25/M out, no training).
  - Contributor tier ($0.10-$0.20/M with model improvement rights).
- **Validation Verdict**: Matches.

#### 33. Ollama Cloud (`ollama-cloud`)
- **Primary URLs Crawled**: `https://ollama.com`
- **Extracted Specs**:
  - Free: $0/mo, community hosted models, 1 stream, unlimited local execution.
  - Pro: $20/mo ($200/yr), $60 cloud credits/mo, 3 concurrent streams.
  - Max: $100/mo ($1,000/yr), $300 credits/mo, 6 streams.
  - Team: $500/mo, $1,000 credits/mo, 10 streams.
  - Stacking prohibited (one account per person).
- **Validation Verdict**: Matches.

---

## 3. Invariant Verification Results

The regenerated plans and consolidated data passed all automated validation steps:

```bash
$ npm run validate-data
Validated 33 plan files against schema invariants. OK

$ npm test
✓ src/lib/tos.test.ts (14 tests)
✓ src/lib/pricing.test.ts (28 tests)
Test Files 2 passed (2) | Tests 42 passed (42)

$ npm run lint
Found 0 warnings and 0 errors.

$ npm run build
✓ built in 619ms
```
