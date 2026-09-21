# Provider Verification Log

This document is the audit trail for the curated plan data in `data/coding-plans/`.
Every provider was checked against its official pricing, quota or legal pages during the
**September 18–19, 2026** audit pass. Facts that could not be confirmed against a primary
source are explicitly labelled unknown or low-confidence and carry that label in
`estimatedTokenBudget.estimateMeta`.

- Machine-readable provenance: `estimateMeta` on every tier
  (`sourceUrl`, `sourceQuote`, `sourceType`, `confidence`, `verifiedAt`, `basisModel`, `cacheAssumption`).
- Invariant enforcement: `npm run validate-data` (runs in CI with `lint`, `test` and `build`).
- Multi-account policy: `stackingPolicy` + evidence note on every plan, surfaced by
  Dangerous Dave mode and the TOS page.

## Verification status by provider

| # | Provider | Official source checked | Status | Notes / open items |
|---|----------|------------------------|--------|--------------------|
| 1 | Aider | aider.chat | Verified | Free OSS, BYOK only; no vendor pricing. |
| 2 | Alibaba Cloud (Token Plan) | alibabacloud.com token-plan docs | Verified, derived estimates | Prices/credits official; credit→token coefficients unpublished, derived from the official qwen3.6-plus worked example. Coding Plan (request-based) is a separate, phased-out product. |
| 3 | Amazon Q Developer | aws.amazon.com/q/developer/pricing | Verified, low-confidence Pro | Free = 50 agentic requests/mo (official); Pro = $19 with no published cap → scenario band (21/105/210M). |
| 4 | Anthropic API | docs.claude.com pricing + commercial terms | Verified | Sonnet 5 $2/$10, cache reads 0.1x, writes +25%, batch −50%, spend tiers Start/Build/Scale; no training on Customer Content. |
| 5 | Augment Code | augmentcode.com/pricing | Verified | $20/$100 pools; flat 40% LLM fee; 50 seats; top-ups 12 months. |
| 6 | BytePlus ModelArk | docs.byteplus.com ModelArk 1925114/2165245 + AI terms | Verified, quota docs conflict | Lite $10/Pro $50; docs quote ≈1,900 req/5h, 12,000/wk, 24,000/mo for Lite (older FAQ lower); no token conversion; Customer Data not used for training. |
| 7 | Claude Code | claude.com/pricing + docs.claude.com costs | Verified, low-confidence estimates | Prices and 5-hour/weekly shared-pool mechanics verified; Anthropic publishes no token numbers → 12/60/240M research estimates. Faros AI & Morph empirical telemetry confirmed Max 20x tier asymmetry (20x in 5h burst, but only ~6x weekly) and shared capacity pool across CLI, Claude.ai, and Cowork. |
| 8 | CommandCode | commandcode.ai/pricing + terms | Verified | Full 5-tier matrix verified: Go $1 ($10 credits, 250/5h, 1k/7d), GOAT $10 ($70 credits, 500/5h, 2k/7d), Pro $20 ($80 credits, 750/5h, 3k/7d), Max 10x $100 ($150 credits, 1.5k/5h, 6k/7d), Max 20x $200 ($300 credits, 3k/5h, 12k/7d); dual standard & premium pools; one account per person (stacking prohibited). |
| 9 | Cursor | cursor.com/pricing + FAQ | Verified, pool sizes unpublished | Pro+ = 3x and Ultra = 20x Pro limits (official); Pro pool modelled at ~10M tokens. Reseller purchases unauthorized. |
| 10 | DeepSeek API | api-docs.deepseek.com pricing | Verified, fixed | Previous USD figures did not match official CNY rates; now quotes ¥9/¥27 with cache-hit ¥0.15–0.30 and 50% off-peak. |
| 11 | Fireworks.ai | fireworks.ai/pricing + account quotas docs | Verified | $1 credits; 6,000 RPM account-wide cap with card. Exact free RPM unpublished. |
| 12 | GitHub Copilot | github.com/features/copilot/plans | Verified | 1 credit = $0.01; Pro $15, Pro+ $70, Max $200 total credits; Flex allotment is variable → conservative estimates use base credits only. |
| 13 | Google AI Studio | ai.google.dev pricing + rate limits | Verified | Flash $0.75/$3.75 promotional through 2026-12-31; tier caps $250/$2,000/$20,000+; free data trains, paid does not. |
| 14 | Google Antigravity | antigravity.google/pricing + one.google.com plans | Verified, fixed | Ultra no longer $249.99; official Google AI Ultra 5x $99.99 and 20x $199.99; quotas 5-hour refresh until weekly cap. Research estimates rebased on the 250K–900K OSINT agent-task band (Pro 75M floor / 165M / 270M). |
| 15 | Groq API | console.groq.com rate limits | Verified, fixed | Console tables are Developer-plan base limits; Free is lower and per-model. |
| 16 | Kilo Code | kilo.ai/pricing + teams + kilo-pass | Verified | $15/user platform fee, inference at provider rates with no markup; Kilo Pass $19/$49/$199 with up to 50% bonus. |
| 17 | Kimi Code | kimi.ai/help membership pricing | Verified | $19/$39/$99/$199 (annual $15/$31/$79/$159); shared credit pool + separate 5h/weekly Kimi Code limit; credit counts unpublished. |
| 18 | Kiro | kiro.dev/pricing + FAQ | Verified | Credit multipliers published; no rollover; third-party automation harnesses not permitted. |
| 19 | Lovable | lovable.dev/pricing + subscription docs | Verified | $25/$50 (annual $21/$42); credits expire after 2 months; unlimited workspace members. |
| 20 | Meta Model API | dev.meta.ai pricing/rate limits | Verified | Now serves Muse Spark 1.3/1.2; Standard $1.25/$4.25 no-training, Contributor $0.10–$0.20 with training rights; hosted Llama tiers superseded. |
| 21 | Meta Muse Code | developer.meta.com Muse Code | Verified | $5/$15/$50; High = 5x, Power = 20x Everyday (official); keys limited to Muse Code. |
| 22 | MiniMax Token Plan | platform.minimax.io token-plan docs | Verified, token quota unpublished | Prices, windows, agents and 1,000 credits = $1 verified; monthly token quotas not published → research estimates. |
| 23 | Mistral API | mistral.ai/pricing | Verified, fixed | Studio includes $10/mo credits; training is opt-out (previous "No" was wrong). |
| 24 | Ollama Cloud | ollama.com/pricing | Verified, fixed | Team = **$1,000** credits and 10 streams (not $1,600/50); one account per person; peak Mon–Fri 12–18 UTC. |
| 25 | OpenAI API | platform.openai.com docs + enterprise privacy | Verified, fixed | Sol $2/$10 and Luna $0.10/$0.60; ZDR is not default (30-day retention, ZDR on request); spend caps $100–$200k. |
| 26 | OpenAI Codex | developers.openai.com/codex/pricing | Verified, low-confidence estimates | Free/Go $8/Plus $20; Pro from $100 (5x/20x); no published token quotas → scenario estimates rebased on the 250K–900K OSINT agent-task band (Plus 20M floor / 44M / 72M). DevForth telemetry confirms observed window limits: Plus ($15/5h, $70/7d), Pro 5x ($75/5h, $350/7d), Pro 20x ($400/5h, $2,560/7d). |
| 27 | OpenCode | opencode.ai/zen + docs.opencode.ai/go + terms | Verified | Zen $20 minimum + $1.23 fee, zero markup; Go $10/mo open-model subscription covering 28 models across $15, $30, $60 monthly allowance pools with 20% 5h and 50% 7d rolling window exhaustion caps. Multiple-account circumvention prohibited. |
| 28 | OpenRouter | openrouter.ai/pricing + limits + terms | Verified | 5.5% platform fee; free-model limits 20 RPM / 50–1,000 RPD; multiple accounts to bypass limits prohibited. |
| 29 | Replit | replit.com/pricing + terms | Verified | Core $20 ($18 annual), Pro $100 ($90); registering multiple accounts prohibited. |
| 30 | Tabnine | tabnine.com/pricing + terms | Verified | $39/$59 annual per user; BYO LLM unlimited; provider LLM +5% handling; no training on customer code. |
| 31 | Together.ai | docs.together.ai rate limits | Verified, fixed | Dynamic rate limits replaced the stale fixed 60 RPM/60k TPM claim. |
| 32 | Windsurf (Cognition) | windsurf.com/pricing + AUP | Verified | Free/Pro $20/Max $200/Teams $80+$40; credential sharing banned. Data-training policy not published → unknown. Estimates rebased on the 250K–900K OSINT agent-task band (Pro 75M floor / 165M / 270M); Max restored to a clean 5x Pro relation. |
| 33 | Z.ai GLM Coding Plan | docs.z.ai devpack overview/teamplan/usage-policy | Verified | Lite $18, Pro $80, Max $168 with official weekly allowance ceilings: GLM-5.3 (97M / 582M / 1,358M) and GLM-5.3-Flash (584M / 3,504M / 8,176M); concurrency caps (1 / 1-2 / 2+); 95% prompt cache; off-peak 50% credit rate outside Mon–Fri 14–18 UTC+8. |

## Discrepancy log (September 2026 audit)

Fixed against official sources:

- **Z.ai** estimates exceeded the officially published allowance ceilings and are now floor/midpoint/ceiling derived from the docs table.
- **Alibaba Cloud** used invented "1K credits = $1" and 1,000 tokens/credit arithmetic; replaced with official credit quotas and a documented qwen3.6-plus deduction basis, plus the missing Essential tier.
- **Cursor** Pro+/Ultra now match the official 3x/20x multipliers.
- **Google Antigravity** Ultra price split into the official 5x ($99.99) and 20x ($199.99) plans.
- **Ollama Cloud** Team credits/concurrency corrected ($1,000 / 10 streams) and model list refreshed.
- **GitHub Copilot** conservative budgets no longer assume the variable Flex allotment.
- **Anthropic/OpenAI API** token estimates now match their own pricing formulas and the 20k/1k cached-agent workload; OpenAI ZDR claim corrected.
- **Amazon Q** Free tier now uses the official 50-request cap; Pro is an explicitly low-confidence scenario band instead of 200M.
- **DeepSeek** CNY pricing, **Mistral** training opt-out, **Groq** Developer-plan limits, **Together** dynamic limits, **Fireworks** trial math, **BytePlus** internal anchor, **Augment** 40% fee, and four zero-budget paid tiers (Kilo Teams, OpenCode Zen, Tabnine ×2) were corrected.

### September 19, 2026 — OSINT task-band recalibration

- **Antigravity / Windsurf / OpenAI Codex** opaque-quota estimates replaced the 150K-tokens-per-task basis (below the OSINT autonomous-task band and inconsistent with the WorkflowCalculator's 40-request task model) with the shared band in `data/estimate-constants.json`: 250K conservative / 550K midpoint / 900K optimistic tokens per autonomous task (interactive CLI sessions measure 60–240K; autonomous tasks 200–800K in + 30–100K out). Tier relations (5x/20x multipliers, per-seat mirrors) are preserved and every changed tier carries floor/midpoint/ceiling values plus `estimateMeta` provenance. Evidence: `docs/TOKEN_ESTIMATE_VALIDATION.md`.

## Open items

- **Claude Code / OpenAI Codex / Amazon Q Pro / Google Antigravity** capacity is intentionally unpublished by the vendor; figures are research estimates with `confidence: low` (Antigravity/Codex now use the 250K–900K OSINT task band).
- **MiniMax** publishes prices and credit packages but not token quotas; third-party token figures conflict (~1.6B/mo claims vs our estimate) — verify in the console before trusting the estimate.
- **Alibaba** credit coefficients are only partially documented (one worked example); frontier-model deductions may differ from the qwen3.6-plus basis.
- **BytePlus** quota docs conflict across pages (≈1,900 vs 1,200 req/5h for Lite).
- **Kimi / Kiro / Replit / Meta Model API** rate-limit details are not fully published.
- **Windsurf, Kiro, Replit, Kimi, MiniMax, BytePlus** training policies are unpublished → TOS matrix shows Unknown.

## Verification passes

### 2026-09-20 — External Sources & Empirical Usage Telemetry Audit Pass

Comprehensive investigation across 13 external pricing APIs, machine-readable datasets, and real-world engineering telemetry:

- **Secondary Pricing Feed Ingestion & Auditor (`scripts/audit-external-sources.mjs`):**
  - Integrated `llmprice.com` daily JSON feed (`/assets/pricing-data.json`), cross-validating 481 models and confirming exact first-party cache-write rates and long-context pricing rules for OpenAI, Anthropic, Google, and DeepSeek.
  - Added non-destructive CLI command `npm run audit-sources` to cross-check live pricing deltas without build-blocking failure points.
- **Claude Code Quota Asymmetry Discovery (Faros AI & MorphLLM Telemetry):**
  - Reverse-engineered and documented the 5-hour burst vs. weekly ceiling multiplier disparity: Max 20x provides 20x burst headroom in a 5-hour window but scales weekly capacity to only ~6x of the Pro tier.
  - Documented cross-surface capacity pooling across Claude Code CLI, Claude.ai, and Claude Cowork.
  - Added dedicated `claude-code-max20x` throttle profile to `src/lib/throttle-profiles.ts`.
- **OpenAI Codex Observed Limit Windows (DevForth Telemetry):**
  - Incorporated DevForth empirical tracking of OpenAI subscriptions: Plus ($15/5h, $70/7d), Pro 5x ($75/5h, $350/7d), and Pro 20x ($400/5h, $2,560/7d).
  - Added `openai-codex-pro5x` and `openai-codex-pro20x` throttle profiles to `src/lib/throttle-profiles.ts`.
- **Enterprise Spend Benchmarking (DX 400+ Organization Study):**
  - Verified ground-truth blended developer spend ($200–$600/month per seat) for hybrid IDE and CLI agent workflows.
  - Documented GitHub Copilot's June 1, 2026 token transition and promotional credit offsets ($30–$70/user/mo).
- **Chinese Regional Token Plans Baseline (`tokenplan.vip`):**
  - Verified domestic Chinese token subscriptions and off-peak rate multipliers across 41 platforms.

### 2026-09-19 — Adversarial Codebase Audit & 4-Phase Systemic Hardening

Comprehensive adversarial investigation and remediation across analytical engines, mathematical models, ingestion scripts, schema invariants, security controls, and UI presentation:

- **Phase 1 (Critical & High Math, URL & Allocation Fixes - `91b4d6a`):**
  - Eliminated URL query parameter crash vectors in `WorkflowCalculator.tsx` with fallback chains for `?ctx=` and `?quality=`.
  - Replaced `||` with `??` across 5 core calculation files (`pricing.ts`, `teams.ts`, `receipt-math.ts`, `reasoning.ts`, `WorkflowCalculator.tsx`) to eliminate systemic falsy zero-price bugs where $0 cached prompt tokens or $0 free tiers were overridden by fallbacks.
  - Guarded knapsack against `NaN` budgets in `computeDaveStacks` and `computeMixAndMatch`.
  - Fixed free cache multiplier inversion (`cachedInput === 0` correctly evaluates to 0).
  - Prevented wildcard model query explosion (`matchesPlanModel` rejects queries `< 3` characters).
  - Implemented Hamilton-Hare largest remainder algorithm in `teams.ts` for exact seat allocation invariant.

- **Phase 2 (Medium Severity Hardening & Input Sanitization - `2911e19`):**
  - Protected `throttle.ts` sprint duration, concurrency, and cadence against `NaN`, negative values, and zero-division.
  - Clamped URL mix token parsing and inputs in `MixOptimizer.tsx`.
  - Added `sanitizeYamlScalar` to `exporters.ts` to strip control characters and newlines, preventing YAML injection attacks.
  - Hardened `log-parser.ts` with `safeTokenNumber` against `NaN`/non-numeric log tokens, added 25MB parser limit, and enforced 15MB file upload limit in `SessionReceipt.tsx`.

- **Phase 3 (Data Ingestion & Pipeline Invariants - `c052c9b`):**
  - Made `fetch-benchmarks.mjs` and `fetch-models.mjs` fail fast with explicit errors on API failure, refusing to clobber existing datasets with empty outputs.
  - Added `.sort()` to `fs.readdir(PLANS_DIR)` in `build-data.mjs` for 100% deterministic plan builds across OS environments.
  - Synchronized `_schema.json` with strict validation rules (required non-empty `limits`, `models`, and non-null `estimatedTokenBudget`).
  - Added contextual multi-tier TOS classification in `tos.ts` for mixed policies (free trains vs paid shielded).

- **Phase 4 (UI Display Polish - `e4e66aa`):**
  - Replaced misleading `$0+` and `Free+` labels in `PlanGrid.tsx` with `"Free tier available"`, `"Free"`, or `"Enterprise / Custom"`.
  - Handled $0 and null pricing in `TokenTranslator.tsx` with dedicated empty states rather than falling back to $20/mo.

Commands run from repository root, all green:
1. `npm run validate-data` — 33/33 plans valid against strict schema.
2. `npm test` — 97/97 unit tests pass across 8 test suites.
3. `npm run lint` — 0 errors, 0 warnings (oxlint).
4. `npm run build` — TypeScript and Vite production build succeeds.

### 2026-09-19 — Multi-Model Mix Optimizer & Shareable URL State

Delivered the Multi-Model Mix Optimizer tool and workflow URL permalinks:
- **Shareable Scenario Permalinks:** Integrated `useSearchParams` into [`src/components/budget/WorkflowCalculator.tsx`](file:///home/john/Projects/Token-Max/src/components/budget/WorkflowCalculator.tsx) to encode daily/session parameters, cache rate, and pipeline mode into the URL hash, with a one-click clipboard share button.
- **Mix Optimizer Page:** Created [`src/pages/MixOptimizer.tsx`](file:///home/john/Projects/Token-Max/src/pages/MixOptimizer.tsx) (`#/optimizer`) enabling developers to construct custom model pipelines across all 440+ models, with Autonomous Agent, Daily Driver, and Lean Open presets.
- **Multi-Model Pool Drain Engine Integration:** Evaluated all 33 subscription plans against custom model mixes, computing pool utilization percentages, pay-per-use overages, and direct API savings.
- **Navigation & Routing:** Added `/optimizer` route in [`src/App.tsx`](file:///home/john/Projects/Token-Max/src/App.tsx) and header navigation item in [`src/components/layout/Header.tsx`](file:///home/john/Projects/Token-Max/src/components/layout/Header.tsx).

Commands run from repository root, all green:
1. `npm run validate-data` — 33/33 plans valid.
2. `npm test` — 46/46 unit tests pass.
3. `npm run lint` — 0 errors, 0 warnings (oxlint).
4. `npm run build` — TypeScript and Vite production build succeeds.

### 2026-09-19 — Quota calculation methodology evaluation & pool drain engine

Forensic comparative audit of competitor and peer methodologies (**DeepFrugal**, **AI-10-USD**) versus Token-Max's pricing logic. Implemented architectural enhancements:
- **Shared Constants:** Added `timeOfDayBlend` (80% off-peak, 20% peak) and `agentCachePresets` to [`data/estimate-constants.json`](file:///home/john/Projects/Token-Max/data/estimate-constants.json) and [`src/lib/estimate-constants.ts`](file:///home/john/Projects/Token-Max/src/lib/estimate-constants.ts).
- **Time-of-Day Blending:** Added `calculateTimeBlendedCost()` in [`src/lib/pricing.ts`](file:///home/john/Projects/Token-Max/src/lib/pricing.ts) to model off-peak discounts (DeepSeek, Z.ai).
- **Multi-Model Pool Drain Engine:** Implemented `calculatePoolDrain()` in [`src/lib/pricing.ts`](file:///home/john/Projects/Token-Max/src/lib/pricing.ts) modeling sequential subscription quota exhaustion across mixed model pipelines with pay-per-use overage billing.
- **Model-Specific Tier Allowances:** Extended `_schema.json` and populated `modelAllowances` in [`data/generate_plans.py`](file:///home/john/Projects/Token-Max/data/generate_plans.py) for router plans (CommandCode, OpenCode Go).
- **Hybrid Pipeline Workflow Mode:** Enhanced [`src/components/budget/WorkflowCalculator.tsx`](file:///home/john/Projects/Token-Max/src/components/budget/WorkflowCalculator.tsx) with a Single vs. Hybrid Pipeline toggle (75% Workhorse / 25% Frontier) displaying subscription pool usage and overages.

Commands run from repository root, all green:
1. `python3 data/generate_plans.py` — regenerated all 33 plan files with modelAllowances.
2. `node scripts/build-data.mjs` — rebuilt `public/data/plans.json`.
3. `npm run validate-data` — 33/33 plans conform to schema invariants.
4. `npm test` — 46/46 unit tests passing (+4 new tests for pool drain & time blending).
5. `npm run lint` — 0 errors, 0 warnings (oxlint).
6. `npm run build` — TypeScript and Vite production build succeeds.

### 2026-09-19 — Comprehensive live web crawl & quota validation pass

Systematic multi-batch web crawl of all 33 coding plans using Firecrawl MCP (`firecrawl-firecrawl_scrape`) and live search verification against official documentation and pricing portals. Detailed audit log stored in [`docs/CRAWL_AUDIT_2026.md`](file:///home/john/Projects/Token-Max/docs/CRAWL_AUDIT_2026.md).

Key updates and validations:
- **Annual Pricing Ingestion:** Added official annual discounted rates: Cursor Pro+ ($576/yr), Cursor Ultra ($1,920/yr), Claude Code Pro ($200/yr upfront), Replit Core ($216/yr), Replit Pro ($1,080/yr).
- **DeepSeek API Specifications:** Reconciled official DeepSeek docs (`https://api-docs.deepseek.com/quick_start/pricing`), validating DeepSeek-V4.1-Flash ($0.15/$0.60 off-peak) and DeepSeek-V4-Pro ($0.66/$1.98 off-peak) with 1M context windows, 384K output max, and 2,500/500 concurrency ceilings.
- **Provider Pricing URLs:** Updated explicit canonical pricing links for Together AI (`https://www.together.ai/pricing`) and Fireworks AI (`https://fireworks.ai/pricing`).
- **Quota & Tier Sanity:** Confirmed all 33 plans and tiers maintain valid non-zero token budgets, models lists, and limits definitions per schema.

Commands run from the repository root, all green:
1. `python3 data/generate_plans.py` — regenerated all 33 plan files with updated annual prices and DeepSeek specs.
2. `node scripts/build-data.mjs` — consolidated `public/data/plans.json` and updated freshness metadata.
3. `npm run validate-data` — all 33 plan files pass 100% schema invariant checks.
4. `npm test` — 42/42 tests pass across pricing, cache blend, stacking, and TOS auditing.
5. `npm run lint` — 0 errors, 0 warnings (oxlint).
6. `npm run build` — TypeScript check and Vite static production build succeed.

### 2026-09-19 — token-estimate recalibration (Phases 0–4)

Commands run from the repository root, all green:

1. `python3 data/generate_plans.py` — regenerated all 33 plan files; re-running produced
   no diff (idempotent).
2. `node scripts/build-data.mjs` — consolidated `public/data/plans.json`; the refactored
   `models.json` agent blend was byte-identical to the pre-refactor artifact.
3. `npm run validate-data` — all 33 plan files pass schema invariants
   (midpoint ≥ conservative, optimistic ≥ midpoint on every rebased tier).
4. `npm test` — 42 tests pass (pricing blend modes, cache-write pricing, stacking, TOS).
5. `npm run lint` — 0 errors, 0 warnings.
6. `npm run build` — TypeScript + Vite production build succeeds.

Evidence and OSINT sources: `docs/TOKEN_ESTIMATE_VALIDATION.md`.

## Re-verification checklist

1. Visit each `url` in `data/coding-plans/*.json`; confirm prices, tier names and quota units.
2. Update `estimatedTokenBudget` figures only from published numbers; otherwise keep the
   research label and update `estimateMeta.verifiedAt`.
3. Re-check `dataTraining`, `ipIndemnity`, `stackingPolicy` and `stackingPolicyNote`; a
   stacking claim that is `prohibited` requires a quote.
4. Run `npm run validate-data && npm test && npm run lint && npm run build`.
5. Record the pass here and bump `LAST_VERIFIED` in `data/generate_plans.py`.

### 2026-09-20 — External OSINT Comparative Audit & Runtime Telemetry Integration

Findings from comparative analysis across 4 primary external sources:
1. `sites.diy` (Bilal Bakht Ahmad, May 1, 2026): Live MITM proxy logging of Claude Code, Codex, Kimi, GLM sessions measured **92.4% cache read / 2.4% fresh input / 5.2% output** (97.47% cache hit rate on context). Validated Token-Max's `deepAgent: 0.92` cache preset. Documented 5-hour rolling limits vs weekly hard ceilings (Claude Pro $4.75/5h, $38/wk = 8 max sessions/wk, 7.6× subsidy, 26.9M tok/mo ceiling on Opus 4.7; Codex Plus $22/5h, $134/wk = 26.8× subsidy, 250M tok/mo ceiling on GPT-5.5).
2. `tokenplans.dev` (Krzysztof, September 2026): Hand-verified pricing ledger of 89 plans across 31 providers tracking Req / $1, confidence levels (Exact, Proxy ~, Coarse ≈), and borrowed-cap flags.
3. `sessionwatcher.com` (Soren Starck, 2026): Turn-level (~4,800 tokens) vs agent run (50K–100K+) sizing; prompt caching discounts (90% Anthropic, 50% OpenAI); median developer uses <40% of plan allowance; rate-limit lockout wage economics ($75/hr × 2 hrs/wk lost = $600/mo productivity loss).

Enhancements implemented:
1. `src/components/plans/TokenTranslator.tsx` — added `EMPIRICAL_SATURATION_DATA` card comparing conservative usable floors (40h human workweek) against theoretical 24/7 saturation ceilings (sites.diy empirical proxy logs) with 5h cap, weekly cap, sessions/week, and subsidy multipliers.
2. `src/components/budget/WorkflowCalculator.tsx` — added interactive Rate-Limit Lockout Economics & Wage Risk card ($75/hr baseline) calculating weekly lockout exposure and monthly developer wage loss when daily demand exceeds 5-hour rolling capacity.
3. `scripts/audit-external-sources.mjs` — integrated `https://api.tokenplans.dev/plans.json` public teaser endpoint to automatically cross-reference tracked coding providers and flagship models.
4. `docs/TOKEN_ESTIMATE_VALIDATION.md` & `docs/OSINT_USAGE_STATISTICS.md` — added detailed citations and methodology alignment documentation.

Commands run, all green:
- `npm run validate-data` (422 entries across 34 providers pass invariants)
- `npm test` (109/109 tests pass across 8 suites)
- `npm run lint` (0 errors, 0 warnings across 71 files)
- `npm run build` (TypeScript + Vite build succeeds in 637ms)

### 2026-09-19 — Leaderboard quality-filter leak fix + Z.ai V3 price/ceiling update

Findings: with Quality Baseline = Top Frontier (≥75), Z.ai GLM tiers surfaced as
"Multi-Model" rows because (a) `matchesPlanModel` matched "GLM-5.3-FlashX" via greedy
substring before the base `z-ai/glm-5.3` (AI-index 74.8), and (b) the `unmatchedTiers`
fallback path skipped the quality gate entirely. Normalized-at-budget columns were
additionally displayed without the tier's actual native allowance, misleading on tier
cost vs yield.

Fixes:
1. `src/lib/pricing.ts` — exact-match priority + variant guard in `matchesPlanModel`
   (base names no longer match flash/mini/nano/micro/lite/small variants); added
   `rawMonthlyTokens`/`rawMonthlyRequests` to subscription rows; unmatched-tier
   fallback rows are now gated to `minCodingIndex === 0` so unbenchmarked suites
   cannot leak into quality-filtered leaderboards.
2. `src/lib/types.ts` — `ApplesToApplesOption.rawMonthlyTokens/.rawMonthlyRequests`
   plus tier `estimateMeta` typing (matches `_schema.json`).
3. `src/components/budget/LabDecisionEngine.tsx` — leaderboard shows subscriptions'
   native token allowance under the normalized yield and "+$X unspent" under tier cost;
   explanatory tooltips updated.
4. `data/coding-plans/z-ai.json` + `data/generate_plans.py` + rebuilding
   `public/data/plans.json` — Pro $72 → $80, Max $160 → $168 (official V3), official
   weekly-ceiling limits added as limits + `estimateMeta.sourceQuote` evidence
   (up to 97M/582M/1,358M GLM-5.3 tokens per week on Lite/Pro/Max).

Commands run from the repository root, all green:

1. `npm run validate-data` — 33/33 plan files pass schema invariants.
2. `npm test` — 98/98 tests pass (8 suites), incl. new `matchesPlanModel` variant tests.
3. `npm run lint` — 0 errors, 0 warnings.
4. `npm run build` — TypeScript + Vite production build succeeds.
5. Simulation (`six tiers @ $200, minCodingIndex=75`): Z.ai rows = 0; top ranks are
   Gemini 3.8 Flash (CI 76.3), Kimi K3 (76.2), Claude Opus 5 (78). Unfiltered run:
   Z.ai Max resolves to `Z.ai: GLM 5.3` (CI 74.8, native 2,927M, $168).

### 2026-09-19 — UX Phase 0: design-token AA hardening + shared primitives

Contrast audit (WCAG 4.5:1 for text) of semantic tokens on surface/steel chrome
found two failures: `--color-primary` (was blood-500, 3.67:1) and
`--color-primary-light` on the header steel gradient (4.19:1).

Fixes:
1. `src/index.css` — `--color-primary: hsl(0 85% 55%)` (4.71:1 on surface) and
   `--color-primary-light: hsl(0 80% 64%)` (4.94:1 on header steel). No component
   changes needed; all chrome reads the semantic tokens.
2. New shared primitives under `src/components/shared/` (token-only styling):
   `DataBadge.tsx`, `Card.tsx`, `TableShell.tsx` (incl. `Th`/`Td` with sticky
   header), `StatBlock.tsx`, `Toolbar.tsx`, `Tooltip.tsx` — Phase 1–3 pages
   migrate onto these incrementally.
3. `src/pages/TosAudit.tsx` — migrated hero pill to `DataBadge` and all four
   metric cards to `StatBlock` as the wired-up reference usage.

Verification: lint 0/0, tests 98/98, production build clean; built CSS confirmed
to carry the updated primary/primary-light values (`#ee2b2b`, `#ed5a5a`).

### 2026-09-19 — UX Phases 1–5 (grouped IA, shareable state, power-tool pass, Quiet theme, perf/PWA)

1. **Phase 1 — Navigation & mobile**: Header rebuilt with grouped IA
   (Calculate / Forecast / Data / Tools) as keyboard-navigable hover dropdowns;
   full-screen hamburger drawer below `lg`; footer quick-route chips; no
   setState-in-effect (links close menus on click; Escape closes).
2. **Phase 2 — First-touch & state**: `useQueryState` hook (shareable hash
   query + localStorage restore) wired into budget (`?b=`), quality baseline
   (`?q=`), lab (`?lab=`), unit (`?unit=`), cache (`?cache=`), engine mode
   (`?mode=`); "Copy Link" button reproduces the exact ranking; leaderboard
   shows top 3 with "See full ranking" expander; hero CTA smooth-scrolls to
   the Decision Engine.
3. **Phase 3 — Power-tool pass**: sticky table headers via new
   `thead-sticky` utility applied to ModelTable, LeaderboardTable,
   TrainingMatrix and the Decision Engine leaderboard; "Copy CSV" exports the
   visible ranking.
4. **Phase 4 — Quiet theme**: `[data-theme='quiet']` token overrides
   (semantic tokens + chrome gradients) with `ThemeToggle` (persisted,
   respects `prefers-color-scheme`); Blood & Steel remains the default.
5. **Phase 5 — Perf/PWA**: all 12 routes lazy-loaded with Suspense
   fallback; header data-freshness pill (replaces the "Machine Spirit" place
   holder); production-only service worker (`public/sw.js`: cache-first
   hashed assets, network-first data JSON + index).

Verification: `npm run lint` 0 errors/0 warnings; `npm test` 98/98; `npm run
build` clean with per-route chunks (core 90 KB gz, pages 5–16 KB gz, shared
chart chunk 99 KB gz); `dist/sw.js` emitted. Known limits: Quiet theme is
best-effort on third-party-styled surfaces; deeper per-page component
migrations (card tables < md, wizard splits) scheduled for the next pass.

## Per-Model Subscription Token Yields (2026-09-19)

### Mechanism
- `PlanTier.perModelTokenBudgets`: per-model yields assuming the entire quota
  drains exclusively on that model; keys are lowercase substrings of real
  `tier.models` entries; optional `basis` (`official-table`,
  `official-multiplier`, `list-price-credit`, `equal-rate`) and `confidence`.
- `scripts/validate-data.mjs` enforces keys ⊆ tier.models, positive finite
  token values, monotonic mid/optimistic values, and the basis/confidence enums.
- `computeApplesToApples` renders one subscription row per (tier, matched
  model), resolving per-model budgets via `resolveTierModelBudget`
  (longest-key-first) and falling back to the tier pool otherwise. Stacking
  (Mix & Match / Dangerous Dave) stays tier-pool-based; no double-counting.
- Tier matching fixed to forward matching + per-tier per-model claims so
  "GLM-5.3-Flash" can no longer be stolen by the shorter "GLM-5.3".

### Included plans (verified official sources via Firecrawl OSINT)
| Plan | Basis | Source |
|---|---|---|
| z-ai | official-table: GLM-5.3-Flash = exact 3.03x GLM-5.3 (Lite 146-292, Max 2,047-4,095 M tok/wk) | docs.z.ai/devpack/overview |
| kiro | official-multiplier table (Auto 1.0x; Opus 2.2x, Sonnet 1.3x, Haiku 0.4x, Qwen3 Coder Next 0.05x, DeepSeek 0.25x, MiniMax 0.15/0.25x) | kiro.dev/docs/models |
| commandcode | list-price-credit via officially published at-cost token rates; GOAT/Pro per-model allowances (MiniMax M3 $47/$57, MiMo deals, DeepSeek V4.1 Flash $60/$70) | commandcode.ai/docs/resources/pricing-limits |
| cursor | list-price-credit on officially published per-model rates for both usage pools ($20/$60/$200 modeled pools) | cursor.com/docs/account/pricing |
| claude-code | list-price-credit with Fable drawn at official 50%-of-weekly-limits cap | claude.com/pricing |
| github-copilot | AI credits (1 credit = $0.01) drained at official per-token tables; 300/3,900/10,000 base credits | docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing |
| kimi-code | list-price-credit (K3 3/15/0.30 vs K2.7 Code 0.95/4.00/0.19) | kimi.com/code/docs + CommandCode at-cost mirror |
| openai-codex | list-price-credit at OpenAI GPT-5.6/6 rates | OpenAI published pricing (mirrors) |
| meta-model-api | equal-rate: Muse Spark 1.1/1.2/1.3 share identical Standard pricing | dev.meta.ai/docs/pricing-rate-limits |

### Fallback plans (tier-pool yield, no official per-model differential retrievable)
alibaba-cloud, augment-code, byteplus, google-ai-studio, google-antigravity,
groq-api, kimi-code: (covered), meta-muse-code, minimax, ollama-cloud,
opencode Go (already had modelAllowances $ semantics), replit, together-ai,
windsurf (Devin quota mechanism unpublished), plus any pseudo-model slot
("Auto mode", "API models", "frontier pool", "SWE-2", hetero pools).

### Verification
`npm run lint` 0/0; `npm run validate-data` OK (33 plans);
`npm test` 100/100 (added per-model + fallback cases);
`npm run build` clean; data regenerated via `python3 data/generate_plans.py`
and `node scripts/build-data.mjs`.

## Adversarial Review Recalibration (2026-09-19)

### Key Audit Findings & Mathematical Fixes
1. **Cache Rate Harmonization**: Eliminated `_PER_MODEL_CACHE_RATE = 0.95` in `data/generate_plans.py` which was artificially doubling plan token capacity. Plan generation now enforces the shared `defaultCacheRate: 0.75` from `data/estimate-constants.json` across all credit pools, reserving 95% caching only for providers with documented guarantees (Z.ai).
2. **Model-Aware Token Resolution in `TokenTranslator`**: `TokenTranslator.tsx` now calls `resolveTierModelBudget(currentTier, comparisonModel.name, comparisonModel.id)` rather than comparing direct API yields against monolithic tier scalars. Relabeled linear request counts to "Normalized 21K Turns".
3. **Multi-Model Pool Drain Engine Fix**: Fixed `calculatePoolDrain` in `src/lib/pricing.ts` to support `perModelTokenBudgets` alongside `modelAllowances`. Removed the `Math.max(monthlyPrice, ...)` flaw that was artificially inflating pool capacity for low-cost models.
4. **Stack Candidates Model-Aware Ranking**: `buildStackCandidates` now scores and scales candidates using the matched model's resolved token capacity (`resolveTierModelBudget`), preventing Dangerous Dave and Mix & Match from assigning inaccurate token yields to models.
5. **Workflow Calculator Model Alignment**: `WorkflowCalculator.tsx` now resolves plan capacity using `resolveTierModelBudget` for the active primary model in the workflow and verifies fit against `poolDrain.overageCost === 0`.
6. **Subsystem Policy Reconciliation**: Updated Cursor Pro evidence quotes and reasoning token descriptions across `src/lib/throttle-profiles.ts` and `src/lib/reasoning.ts` to reflect the dual-pool architecture (Cursor Models pool vs Other Models at API rates).

### Verification
- `npm run lint` — 0 errors, 0 warnings (72 files).
- `npm run validate-data` — 33 plans and 33 models pass all schema invariants.
- `npm test` — 102/102 tests pass (8 suites, including new tests for model-aware stack candidates and pool drainage).
- `npm run build` — Clean production build with Vite + TypeScript.

## Recalibration & Machine-Readable Usage Limits Export (2026-09-19 / 2026-09-20)

### Key Achievements & Recalibrations
1. **Machine-Readable Usage Limits Dataset (`public/data/usage-limits.json`)**:
   - Compiled and published 394 normalized limit records across all 33 services as part of the GitHub Pages build/deployment pipeline.
   - Includes empirical agent task counts (250K conservative, 550K midpoint, 900K complex turns), mathematical basis formulas, and source links.
   - Enforced schema validation in `scripts/validate-data.mjs` (CI fails if entries are missing, empty, or non-finite).
2. **CommandCode Full 5-Tier Matrix Audit**:
   - Expanded from single-tier stub to complete matrix: Go ($1, $10 credits, 250/5h, 1k/7d), GOAT ($10, $70 credits, 500/5h, 2k/7d), Pro ($20, $80 credits, 750/5h, 3k/7d), Max 10x ($100, $150 credits, 1.5k/5h, 6k/7d), and Max 20x ($200, $300 credits, 3k/5h, 12k/7d).
   - Modeled dual standard and premium credit pools, rolling 5-hour pools, and 7-day sliding window exhaustion rules.
3. **OpenCode Go 28-Model Matrix Recalibration**:
   - Audited the full 28-model Go catalog across $15, $30, and $60 monthly allowance pools with 20% 5h and 50% 7d rolling window caps.
   - Integrated model-specific request limits and token yields into `data/generate_plans.py` and `data/coding-plans/opencode.json`.
4. **Z.ai GLM Coding Plan Formal Quota Alignment**:
   - Recalibrated Lite ($18), Pro ($80), and Max ($168) against official weekly allowance ceilings: GLM-5.3 (97M, 582M, 1,358M tok/wk) and GLM-5.3-Flash (584M, 3,504M, 8,176M tok/wk).
   - Documented project concurrency limits (1, 1–2, 2+), 95% prompt cache, and off-peak 50% credit pricing.
5. **Primary Documentation Index (`SOURCE.md`)**:
   - Established `SOURCE.md` as the unified primary evidence archive with direct links, documentation quotes, and mathematical formulas for all 33 services.

### Verification
- `npm run lint` — 0 errors, 0 warnings (72 files).
- `npm run validate-data` — 33 plans and 394 usage limits entries pass all schema invariants.
- `npm test` — 102/102 tests pass across 8 test suites.
- `npm run build` — Clean production build with Vite + TypeScript.

## Adversarial Math Audit & Telemetry Remediation Pass (September 19, 2026)

### Key Audit Findings & Remediations (ADV-01 through ADV-05)
1. **ADV-01: Non-Stackable Plans in Dangerous Dave Mode**:
   - Resolved user requirement allowing non-stackable plans into Dangerous Dave mode while enforcing mathematical and contractual reality.
   - Plans with `stackingPolicy === 'prohibited'` are strictly clamped to `copies: 1` in `computeDaveStacks` (`src/lib/pricing.ts`).
   - Lab Decision Engine displays an amber warning banner highlighting ToS single-account constraints rather than artificially projecting 4x multipliers.
2. **ADV-02: Robust String Request Quota Parsing (`parseTierRequestLimit`)**:
   - Replaced brittle `Number(tier.limits.fastRequests)` with regex-powered `parseTierRequestLimit` capable of parsing human-readable quotas like `"500 fast requests/mo"`, `"1k/7d"`, `"250/5h"`, and hyphenated ranges (`"200-300"`).
   - Fixed pool drain calculations across OpenCode, CommandCode, and Z.ai tiers where numeric conversion previously yielded `NaN` or `undefined`.
3. **ADV-03: Partitioned Sub-Pool Architecture**:
   - Extended `poolDrain` in `src/lib/pricing.ts` to support dual standard and premium model allowances.
   - Workflows mixing standard and premium models now deplete their respective partitioned allowances rather than overflowing into overages prematurely.
4. **ADV-04: Expanded Per-Model Yield Catalog for Credit Pool Providers**:
   - Added explicit, multi-model `perModelTokenBudgets` across the full model fleets of credit-pool IDEs and API providers:
     - **Augment Code** (`augment-code`): Standard ($14.28 net credit after 40% LLM service fee) and Business ($71.43 net credit) across Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, and Cosmos.
     - **Replit** (`replit`): Core ($20 credit) and Pro ($100 credit) across Claude Opus 5, GPT-5.6 Sol, DeepSeek V4-Pro, Gemini 3.8 Flash, and Replit Agent.
     - **Ollama Cloud** (`ollama-cloud`): Pro ($60 credit), Max ($300 credit), and Team ($1,000 credit) across DeepSeek V4.1 Flash, DeepSeek V4-Pro, MiniMax M3, GLM-5, and Kimi K3.
5. **ADV-05: Real-World OSINT Telemetry & Obfuscation Auditing**:
   - Added `isEstimatedCeiling`, `disclosedByVendor`, and `osintSource` fields to `public/data/usage-limits.json`, tracking 414 total normalized entries across 33 providers.
   - Cross-linked reverse-engineered client telemetry, community telemetry traces, and proxy analytics to [`docs/OSINT_USAGE_STATISTICS.md`](docs/OSINT_USAGE_STATISTICS.md) for opaque services (Claude Code, Cursor, Windsurf, Google Antigravity, OpenAI Codex, Amazon Q).

### Verification
- `npm run lint` — 0 errors, 0 warnings (72 files).
- `npm run validate-data` — 33 plans and 414 usage limits entries pass all schema invariants.
- `npm test` — 107/107 tests pass across 8 test suites (expanded by 5 tests for non-stackable clamping, regex parsing, partitioned sub-pools).
- `npm run build` — Clean production build with Vite + TypeScript.

---

## Pass 10: Xiaomi MiMo Token Plan Integration (2026-09-20)

**Scope:** Added Xiaomi MiMo as the 34th curated coding plan. MiMo Token Plans use a credit-based pricing system with model-specific credit consumption rates that vary by cache hit, cache miss, and output tokens.

### Changes
1. **New Plan File (`data/coding-plans/xiaomi-mimo.json`)**:
   - 4 tiers: Lite ($6/mo, 4.1B credits), Standard ($16/mo, 11B), Pro ($50/mo, 38B), Max ($100/mo, 82B).
   - Per-model token budgets for MiMo-V2.5 and MiMo-V2.5-Pro derived from official credit-to-token conversion tables.
   - Off-peak 0.8× multiplier (UTC 16:00–24:00) noted in gotchas.
   - MiMo-V2.5-Pro-UltraSpeed (PAYG-only, MXFP4 quantized, >1000 TPS) documented as excluded from Token Plans.
2. **Plan Generator (`data/generate_plans.py`)**:
   - Added `xiaomi-mimo` to `STACKING_POLICY` (prohibited).
   - Full plan generation with per-model credit-to-token math.
3. **Provider Color (`src/lib/pricing.ts`)**: Added `xiaomi: '#ff6900'` brand orange.
4. **Series Taxonomy**: Added `MiMo` to `KNOWN_SERIES` in both `scripts/series-taxonomy.mjs` and `scripts/validate-data.mjs`.
5. **Tests (`src/lib/pricing.test.ts`)**: Added 2 tests for Xiaomi provider color and MiMo tier budget resolution (109 total).
6. **Build Data**: Regenerated `public/data/plans.json` (34 plans) and `public/data/usage-limits.json` (422 entries across 34 providers).

### Data Sources
- Official Token Plan pricing: [https://mimo.mi.com/docs/en-US/price/token-plan](https://mimo.mi.com/docs/en-US/price/token-plan)
- Pay-As-You-Go overseas pricing: [https://mimo.mi.com/docs/en-US/price/pay-as-you-go](https://mimo.mi.com/docs/en-US/price/pay-as-you-go)
- Rate limits: [https://mimo.mi.com/docs/en-US/api/guidance/rate-limit](https://mimo.mi.com/docs/en-US/api/guidance/rate-limit)
- Model cards: [https://mimo.mi.com/models/en-US/mimo-v2.5](https://mimo.mi.com/models/en-US/mimo-v2.5) · [https://mimo.mi.com/models/en-US/mimo-v2.5-pro](https://mimo.mi.com/models/en-US/mimo-v2.5-pro)
- OpenRouter listings: [https://openrouter.ai/xiaomi](https://openrouter.ai/xiaomi)

### Verification
- `npm run lint` — 0 errors, 0 warnings.
- `npm run validate-data` — 34 plans and 422 usage-limit entries pass all schema invariants.
- `npm test` — 109/109 tests pass across 8 test suites.
- `npm run build` — Clean production build.


---

## Adversarial Audit Remediation Pass (September 20, 2026)

Full hostile audit (15 findings, VULN-01 through VULN-15) remediated in one pass.

### Summary of Fixes

1. **VULN-01 (Critical) — Data pipeline supply chain**: `update-data.yml` no longer auto-pushes
   third-party-derived data to `main`; refreshes open a PR (branch `data-refresh/<date>`) for human
   review. All GitHub Actions pinned by commit SHA. `validate-data.mjs` gained price sanity bounds
   (non-free models must have positive finite in/out prices; ceilings $1,000/$2,000 per M; cachedInput
   must be null or finite ≥ 0).
2. **VULN-02 (High) — Cache scaling on metered quotas**: `computeApplesToApples` now applies
   symmetric cache scaling **only to dollar-credit pools** (`isDollarPoolTier`: `limits` containing a
   credit key or `perModelTokenBudgets` on a credit/equal-rate basis). Usage-metered quotas deliver
   fixed tokens regardless of the user's cache rate and are never scaled.
3. **VULN-03 (High) — payg-overage never throttled**: `simulateSprintThrottle` now emits a distinct
   `overage` status for `payg-overage` profiles (Google AI Pro, OpenCode Zen, DeepSeek PAYG) once a
   window/monthly ceiling is crossed; `SimulationResult.overageTurns` reports billed excess; overall
   status resolves by severity (`smooth < queued < overage < blocked`). BurstSimulator gains an
   Overage filter, badge, chart color, and stat column.
4. **VULN-04 (High) — Hardware feasibility & payback basis**: `computeHardwareEconomics` derives
   `requiredInferenceHours` from the preset's flagship decode throughput and reports
   `infeasibleWorkload` / `feasibleMonthlyVolumeM`. Payback is only quoted when the amortized monthly
   alpha is positive, so headline savings and payback cannot contradict. HardwareBreakeven renders
   the infeasibility warning with the required-vs-available decode hours.
5. **VULN-05 (High) — Synthetic receipts**: `ParsedAgentSession.measuredTokens` distinguishes
   measured from parser-fabricated token counts; `SessionReceiptReport.tokensMeasured` propagates it;
   the receipt page and copied receipt both flag estimated sessions; the headline prefix
   "ESTIMATED …" prevents synthetic numbers passing as a bill.
6. **VULN-06 (Medium) — Impossible reasoning combos**: `calculateReasoningCost` checks
   input+reasoning+output against `contextWindow` and reasoning+output against `maxOutput` (unknown
   caps treated as feasible); ReasoningExploder disables infeasible effort pills and renders the
   impossibility reason.
7. **VULN-07 (Medium) — Cache-assumption regex hijack**: `parsePlanCacheAssumption` anchors the
   percent to cache context (`NN% cache|hit` or `cache … NN%`), so discount percentages cannot be
   misparsed as cache rates; results clamp to ≤ 0.95.
8. **VULN-08 (Medium) — Divergent cache heuristics**: the ad-hoc `(1 − assumed×0.8)` formula for
   unmatched tiers was replaced by the same model-priced ratio used for matched tiers (via a
   lab-representative basis model), gated identically on dollar pools.
9. **VULN-09 (Medium) — Arbitrage spend asymmetry**: the callout now discloses when the API leg
   outspends a capped single-seat subscription by >1.25x and points to Dave Mode / Mix & Match.
10. **VULN-10 (Medium) — ToS classifier liability**: `'no guarantee'` removed from TRAINS evidence;
    `ipIndemnity: true` renders "Indemnity Offered (warning)" with a carve-outs caveat instead of
    "Full Indemnity"; string indemnities get a verify-scope label; `classifyGotcha` only assigns
    critical data-privacy severity on strong training/retention signals, weak mentions ("training"
    inside a caching sentence) downgrade to warning.
11. **VULN-11 (Medium) — Benchmark starvation**: `build-data.mjs` gained an effort-suffix-stripped
    fuzzy matching fallback (recovered 11 of 35 models; match rate 29% → 60%) and a hard floor:
    builds fail below a 25% match rate unless `ALLOW_LOW_BENCH_MATCH=1`.
12. **VULN-12 (Medium) — Quota/time realism**: weekly quotas convert at 52/12 weeks (not ×4); the
    throttle simulator carries a deferred-turn backlog so slow-queue delay actually reduces
    completed turns instead of being cosmetic.
13. **VULN-13 (Medium) — Zero-hostile URL params**: shared `numParam` helper (`src/lib/params.ts`)
    replaces `Number(x) || default` in HardwareBreakeven and BurstSimulator; `?salvage=0`,
    `?prior=0`, `?idleHours=0` now render as configured.
14. **VULN-14 (Medium) — Cache-write premium + clamp unification**: `cacheWriteShare` (0.06) added to
    `data/estimate-constants.json` and wired into `agentBlendedCost` in both `fetch-models.mjs` and
    `build-data.mjs` (amortized write cost at the provider write rate); salvage clamp unified at 50
    via `SALVAGE_CLAMP_MAX`; `costPer1kRequests || 1` → `?? 1` (invariant I).
15. **VULN-15 (Low) — Literal extraction**: session cache-bust residual (0.15) and provider
    cache-read fallback ratios moved into `data/estimate-constants.json`; teams.ts no longer
    fabricates a 10% cache discount for unknown cache prices (conservative full-input fallback).
    Residual: `classifyModelTier`'s hardcoded model-name table and teams.ts chat workload shapes
    remain flagged for a future data-driven refactor.

### Verification
- `npm run lint` — 0 errors, 0 warnings.
- `npm run validate-data` — 34 plans and 422 usage-limit entries pass all schema invariants (now
  including price sanity bounds).
- `npm test` — 127/127 tests pass across 8 suites (expanded by regression tests for VULN-02/03/04/05/06/07/09 and updated expectations for VULN-10/12).
- `npm run build` — Clean production build.
