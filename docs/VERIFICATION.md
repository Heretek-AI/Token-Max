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
| 7 | Claude Code | claude.com/pricing + docs.claude.com costs | Verified, low-confidence estimates | Prices and 5-hour/weekly shared-pool mechanics verified; Anthropic publishes no token numbers → 12/60/240M research estimates. |
| 8 | CommandCode | commandcode.ai/pricing + terms | Verified | Go $1 genuinely includes $10 credits; one account per person (stacking prohibited). |
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
| 26 | OpenAI Codex | developers.openai.com/codex/pricing | Verified, low-confidence estimates | Free/Go $8/Plus $20; Pro from $100 (5x/20x); no published token quotas → scenario estimates rebased on the 250K–900K OSINT agent-task band (Plus 20M floor / 44M / 72M). |
| 27 | OpenCode | opencode.ai/zen + terms | Verified, fixed model list | Zen $20 minimum + $1.23 fee, zero markup; Go $10; official Go model list differs from the old dataset (now Qwen3.7 Plus/Kimi K3/K2.7/GPT-5.6 Luna/MiMo-V2.5). Multiple-account circumvention prohibited. |
| 28 | OpenRouter | openrouter.ai/pricing + limits + terms | Verified | 5.5% platform fee; free-model limits 20 RPM / 50–1,000 RPD; multiple accounts to bypass limits prohibited. |
| 29 | Replit | replit.com/pricing + terms | Verified | Core $20 ($18 annual), Pro $100 ($90); registering multiple accounts prohibited. |
| 30 | Tabnine | tabnine.com/pricing + terms | Verified | $39/$59 annual per user; BYO LLM unlimited; provider LLM +5% handling; no training on customer code. |
| 31 | Together.ai | docs.together.ai rate limits | Verified, fixed | Dynamic rate limits replaced the stale fixed 60 RPM/60k TPM claim. |
| 32 | Windsurf (Cognition) | windsurf.com/pricing + AUP | Verified | Free/Pro $20/Max $200/Teams $80+$40; credential sharing banned. Data-training policy not published → unknown. Estimates rebased on the 250K–900K OSINT agent-task band (Pro 75M floor / 165M / 270M); Max restored to a clean 5x Pro relation. |
| 33 | Z.ai GLM Coding Plan | docs.z.ai devpack overview/teamplan/usage-policy | Verified, fixed | Official 95%-cache token allowance table (Lite 48–97M/wk, Pro 290–580M/wk, Max 676–1,352M/wk for GLM-5.3); peak Mon–Fri 14–18 UTC+8 at 1x, off-peak 0.5x; estimates now derived from these floors/ceilings. |

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
