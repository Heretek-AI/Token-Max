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
| 14 | Google Antigravity | antigravity.google/pricing + one.google.com plans | Verified, fixed | Ultra no longer $249.99; official Google AI Ultra 5x $99.99 and 20x $199.99; quotas 5-hour refresh until weekly cap. |
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
| 26 | OpenAI Codex | developers.openai.com/codex/pricing | Verified, low-confidence estimates | Free/Go $8/Plus $20; Pro from $100 (5x/20x); no published token quotas → scenario estimates. |
| 27 | OpenCode | opencode.ai/zen + terms | Verified, fixed model list | Zen $20 minimum + $1.23 fee, zero markup; Go $10; official Go model list differs from the old dataset (now Qwen3.7 Plus/Kimi K3/K2.7/GPT-5.6 Luna/MiMo-V2.5). Multiple-account circumvention prohibited. |
| 28 | OpenRouter | openrouter.ai/pricing + limits + terms | Verified | 5.5% platform fee; free-model limits 20 RPM / 50–1,000 RPD; multiple accounts to bypass limits prohibited. |
| 29 | Replit | replit.com/pricing + terms | Verified | Core $20 ($18 annual), Pro $100 ($90); registering multiple accounts prohibited. |
| 30 | Tabnine | tabnine.com/pricing + terms | Verified | $39/$59 annual per user; BYO LLM unlimited; provider LLM +5% handling; no training on customer code. |
| 31 | Together.ai | docs.together.ai rate limits | Verified, fixed | Dynamic rate limits replaced the stale fixed 60 RPM/60k TPM claim. |
| 32 | Windsurf (Cognition) | windsurf.com/pricing + AUP | Verified | Free/Pro $20/Max $200/Teams $80+$40; credential sharing banned. Data-training policy not published → unknown. |
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

## Open items

- **Claude Code / OpenAI Codex / Amazon Q Pro / Google Antigravity** capacity is intentionally unpublished by the vendor; figures are research estimates with `confidence: low`.
- **MiniMax** publishes prices and credit packages but not token quotas; third-party token figures conflict (~1.6B/mo claims vs our estimate) — verify in the console before trusting the estimate.
- **Alibaba** credit coefficients are only partially documented (one worked example); frontier-model deductions may differ from the qwen3.6-plus basis.
- **BytePlus** quota docs conflict across pages (≈1,900 vs 1,200 req/5h for Lite).
- **Kimi / Kiro / Replit / Meta Model API** rate-limit details are not fully published.
- **Windsurf, Kiro, Replit, Kimi, MiniMax, BytePlus** training policies are unpublished → TOS matrix shows Unknown.

## Re-verification checklist

1. Visit each `url` in `data/coding-plans/*.json`; confirm prices, tier names and quota units.
2. Update `estimatedTokenBudget` figures only from published numbers; otherwise keep the
   research label and update `estimateMeta.verifiedAt`.
3. Re-check `dataTraining`, `ipIndemnity`, `stackingPolicy` and `stackingPolicyNote`; a
   stacking claim that is `prohibited` requires a quote.
4. Run `npm run validate-data && npm test && npm run lint && npm run build`.
5. Record the pass here and bump `LAST_VERIFIED` in `data/generate_plans.py`.
