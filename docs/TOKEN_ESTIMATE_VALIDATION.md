# Token Estimate Validation — OSINT Review

This document audits every weighted average Token-Max uses to turn model prices and
subscription units into token estimates, and compares each assumption against published
real-world usage research. It is the evidence base for the recalibration shipped in
Phases 1–3 (agentic Budget yields, constant consolidation, plan-data reconciliation).

- Methodology map: how each weighted average is built (`file:line` references).
- OSINT evidence: measured input/output splits, cache hit rates, request sizes and
  effective $/M from production and benchmark studies.
- Verdicts: which assumptions match, which are conservative, and which are wrong for
  agentic workloads.

## 1. Methodology map

Token-Max has four distinct weighting mechanisms. None of them is a global
model-weighted average; each one is deliberately scoped.

| # | Mechanism | Location | Formula / weights |
|---|-----------|----------|-------------------|
| 1 | Legacy chatbot list-price blend | `scripts/fetch-models.mjs:48-49` | `blendedCost = (input×3 + output×1) / 4` (implied 3:1) |
| 2 | Agentic blend (prompt caching) | `scripts/fetch-models.mjs:104-108`, `scripts/build-data.mjs:109-111`, `src/lib/pricing.ts:200-218` | 20K input (75% cached) + 1K output = 21K; `agentBlendedCost = costPerRequest / 21,000 × 1,000,000` |
| 3 | Weighted quality score | `src/lib/pricing.ts:100-110`, `scripts/build-data.mjs:116-129` | 50% Coding + 30% Agentic + 20% Intelligence; coverage penalty ×0.9 (2 dims) / ×0.75 (1 dim) |
| 4 | Per-plan blended $/M constants | `data/generate_plans.py` (hand-curated assumptions) | ~$2/M frontier, ~$2.10/M Copilot credits, ~$1/M aggregators, ~$0.83/M Replit, 1.4× margin Augment |

Derived quantities that inherit these assumptions:

- `tierRawRequests = estimatedMillionTokens × 1e6 / 21,000` (`src/lib/pricing.ts:497-503`).
- Budget page yield: `millionTokens = budget / blendedCost` (`src/lib/pricing.ts:61`).
- WorkflowCalculator workload model (`src/components/budget/WorkflowCalculator.tsx:18-43,121-124,147-148`):
  40 agent requests per task, context presets 10K/40K/100K, 30 turns/hour,
  1K output per turn, 1–2K MCP tool tokens per turn, quadratic session context sum.
- Cache-price fallbacks when upstream omits them (`scripts/fetch-models.mjs:84-99`):
  Anthropic/DeepSeek/Z.ai 10%, Gemini 25%, OpenAI 50%.
- Plan-level cache assumptions: 75% default; Z.ai official 95%; Anthropic 90% discount.

## 2. OSINT evidence

| Source | Finding |
|--------|---------|
| BSWEN, *100M tokens tracked across 1,289 requests* (2026-03-10) | **~78,277 tokens per request**; **99.4% input / 0.6% output** (≈166:1); **84% cache hit**; prompt caching cut the bill 74% |
| Bai et al., *How Do AI Agents Spend Your Money?* (arXiv:2604.22750, 2026) | Agentic coding **153:1** input:output (chat 1.33:1, code reasoning 0.16:1); **4.17M tokens + $1.86 per task**; up to **30× run-to-run variance**; agents self-predict usage at r ≤ 0.39 |
| Vantage, *The Hidden Cost Driver in Agentic Coding Sessions*, via Tokenade (2026) | Typical 50-turn session ≈ **1M input / 40K output (25:1)**; input ≈85% of session cost; full-time agent user **$400–$1,500/mo** |
| Cursor community forum (2026) | **500K–1M tokens per API request** in large repos, ~90% cache reads; a single focused prompt logged **178,304 cache-read tokens** |
| Tom's Hardware / OpenClaw (2026) | **603B tokens / 7.6M requests** = ~79,342 tokens/request; **$1.3M** spend = **$2.16/M effective blended** |
| AI Cost Estimator, *Real data breakdown* (2026-06-18) | CLI agents (15–20 turns): 50–200K input / 10–40K output; autonomous sandbox agents: **200–800K input / 30–100K output per task, $2–$15/task**; quadratic context growth |
| Token Limits (2026-04-18) | Tool outputs dominate plan burn: one grep = 10–15K tokens, file reads = 1–20K tokens; Claude Code allowances are weekly and neither token counts nor thresholds are published |
| Anthropic, *Prompt caching* docs (2026) | Cache reads billed at **10%** of input; cache writes **1.25×** (5-min TTL) / **2×** (1-hour TTL) |
| The Information / Fortune, via Tokenade (2026-05) | Uber: **$500–$2,000 per heavy Claude Code user per month**; annual AI budget spent in 4 months |

## 3. Verdicts by assumption

| Token-Max assumption | Real-world finding | Verdict |
|----------------------|--------------------|---------|
| 3:1 list blend (`blendedCost`) | 1.33:1 chat; 25:1–166:1 agentic | **Wrong for agentic**: at an output price of 5× input it implies 2.0×input per token vs ~0.43×input measured. Used by Budget yields at `pricing.ts:61` → understates agentic token yields ~4–5×. Acceptable only as a legacy chat metric. |
| 20:1 + 75% cache agent blend (`agentBlendedCost`) | 25:1 + 84% measured | **Conservative match**: 0.55×input vs 0.43×input measured (~25% high). Very close to the normalized effective price that OpenClaw actually paid ($2.16/M). |
| 21K standard agent request | 78K (Claude Code), 79K (OpenClaw), 500K–1M (Cursor heavy repos) | **3.7× low**: token *totals* are unaffected (they flow through the $/M blend), but every derived *request count* (`tierRawRequests`, TokenTranslator "requests") is overstated ~3.7× unless relabelled as normalized 21K-equivalents. |
| ~150K tokens/agent task (Antigravity, Windsurf, Codex JSONs) | CLI session 50–200K input; autonomous task 200–800K input + output; SWE-bench 4.17M/task | **Low for an agentic "task"** and internally inconsistent with WorkflowCalculator (40 req × 21K–100K context = 0.84–4M/task). |
| ~$2/M frontier blend | $2.16/M observed (OpenClaw); Vantage/Uber monthly spend consistent | **Excellent match.** |
| 75% default cache rate | 84% measured; Anthropic/Z.ai plan tables assume up to 95% | **Conservative but defensible**; Z.ai's 95% is handled per-plan. |
| MCP tool overhead 1–2K/turn | 10–15K per grep, 1–20K per file read | **Understated** for verbose tool stacks; session mode only. |
| Cache-write premium unmodeled | 1.25×–2× input (Anthropic) | **Missing**: `cachedInputWrite` is captured in `models.json` but never priced into `calculateAgentRequestCost`. |
| Plan monthly yields (e.g. Claude Code Pro 12M, Cursor Pro 10M) | Vendor quotas unpublished; heavy users burn 200M+ tokens/mo | **Unverifiable by design**; correctly labelled `confidence: low`. Caps ≠ heavy-user demand. |
| Weighted quality score 50/30/20 | No external equivalent | **Product choice, not a token estimate**; no OSINT conflict. |

## 4. Recalibration actions

- **Phase 1** — Budget token yields default to `agentBlendedCost` with a selectable
  chat (3:1) blend; request outputs relabelled as normalized 21K-equivalents.
- **Phase 2** — `STANDARD_AGENT_REQUEST_TOKENS` and `DEFAULT_CACHE_RATE` exported as the
  single source of truth; optional cache-write share pricing via `cachedInputWrite`.
- **Phase 3** — Antigravity/Windsurf/Codex agent-task estimates rebased on the OSINT
  band (CLI session vs autonomous task), with provenance kept in `estimateMeta`.
- **Phase 4** — `npm run validate-data && npm test && npm run lint && npm run build`,
  recorded in `docs/VERIFICATION.md`.

## 5. Open items

- Vendor plan caps remain opaque (Anthropic, Cursor, Codex, Antigravity, Windsurf); the
  estimates are ceilings, not observations, and should stay low-confidence.
- The 84% cache figure comes from a single 100M-token tracking study; the 25:1 session
  ratio and the 153:1 benchmark ratio describe different workloads (interactive session
  vs autonomous SWE-bench trajectories) — both are quoted, neither is universal.
- Effective $/M from OpenClaw includes batch/volume discounts; treat $2.16/M as one
  observed point, not a market constant.

## 6. Sources

1. BSWEN, *Claude Code Token Usage: Real Data From 100M Tokens Tracked*,
   https://docs.bswen.com/blog/2026-03-10-claude-code-token-usage-per-request/
2. Bai et al., *How Do AI Agents Spend Your Money? Analyzing and Predicting Token
   Consumption in Agentic Coding Tasks*, arXiv:2604.22750,
   https://arxiv.org/abs/2604.22750 (project data:
   https://longjubai.github.io/agent_token_consumption/)
3. Flowstate, *Observations on AI agent token consumption*,
   https://www.flowstate.inc/insights/will-hackett/agent-token-consumption/
4. Tokenade, *Claude Code Token Usage Statistics (2026)*,
   https://tokenade.net/en/stats/claude-code-token-usage-statistics
5. Cursor Community Forum, *Cursor high token usage*,
   https://forum.cursor.com/t/cursor-high-token-usage/156924
6. Tom's Hardware, *OpenClaw creator burns through $1.3 million in OpenAI API tokens*,
   https://www.tomshardware.com/tech-industry/artificial-intelligence/openclaw-creator-burns-through-1-3-million-in-openai-api-tokens-in-a-single-month
7. AI Cost Estimator, *How Many Tokens Does an AI Coding Agent Use Per Session?*,
   https://ai-cost-estimator.com/blog/ai-coding-agent-token-consumption-how-much-per-session
8. Token Limits, *Claude Code Token Limit: Pro vs Max vs Team*,
   https://tokenlimits.app/blog/claude-code-token-limit-per-plan
9. Anthropic, *Prompt caching*,
   https://platform.claude.com/docs/en/build-with-claude/prompt-caching
