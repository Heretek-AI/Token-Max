# 🤖 AGENTS.md — Universal AI Agent Guidelines for Token-Max

> **Target Audience:** Any autonomous or pair-programming AI agent (Claude Code, Gemini CLI, Google Antigravity, OpenCode, Codex, Aider, Windsurf, Devin, Roo Code, etc.) working on this repository.

---

## 1. Project Mission & Purpose

**Token-Max** is an open-source analytics platform designed to **unobfuscate vague AI subscription units** (like "credits", "effort units", "checkpoints", and "requests") into **definitive token counts and economic comparisons**.

It solves a fundamental developer problem:
- Many coding subscriptions charge flat monthly fees ($10–$200/mo) but obscure what compute you actually receive.
- Developers often do not know whether a $20/month subscription gives them better or worse value than using direct pay-as-you-go APIs (e.g. Anthropic, OpenAI, DeepSeek, Z.ai).
- Token-Max tracks **440+ foundation models** and **33+ developer coding subscriptions**, providing real-time calculators, quality vs. cost benchmarks, and Terms-of-Service audits.

---

## 2. Core Architecture & Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Routing:** HashRouter (`#/`, `#/models`, `#/plans`, `#/benchmarks`, `#/tos`) — **CRITICAL**: Hash routing is required for GitHub Pages compatibility without server-side rewrite rules.
- **Backend / Runtime:** **Zero runtime backend**. Token-Max is a pure static single-page application (SPA) hosted on GitHub Pages.
- **Data Layer:** Pre-computed static JSON files generated during build and stored in `public/data/`:
  - `public/data/models.json`: ~440+ normalized models with OpenRouter pricing and Artificial Analysis benchmarks.
  - `public/data/plans.json`: Consolidated array of all 33 curated coding subscription plans.
  - `public/data/budget-precomputed.json`: Fast lookups for common budgets ($5, $10, $20, $50, $100, $200).
  - `public/data/last-updated.json`: Timestamp metadata.

---

## 3. Strict Invariants & Ground Rules

Agents modifying this repository **MUST** adhere to the following rules:

### A. Never Show Obsolete Models in the Token Budget Translator
- When translating plan budgets into direct API yields, **NEVER** let obsolete, low-end, or legacy models (e.g. *Mistral Nemo*, *Granite Micro*, *Lunaris 8B*, *Gemma 1*, *Llama 2*, *GPT-3.5*) float to the top simply because their per-token rate is $0.05/M.
- The Token Budget Translator (`src/components/plans/TokenTranslator.tsx`) must always clearly separate:
  1. **Part 1: Plan Native Allowance & Included Models** (what the tool officially offers).
  2. **Part 2: Direct Modern API Equivalents** (filtering exclusively for modern frontier models with Coding Index ≥ 65, best-value workhorses, or exact plan-model matches).

### B. All 33 Coding Plans Must Comply with `data/coding-plans/_schema.json`
Every plan file in `data/coding-plans/*.json` must include:
- `id`: unique string identifier matching filename (e.g. `cursor.json` -> `cursor`).
- `name`: official display name.
- `category`: strictly one of `"coding-ide"`, `"coding-router"`, or `"api-provider"`.
- `url`: official pricing/documentation URL.
- `lastVerified`: ISO date (`YYYY-MM-DD`).
- `tiers`: array of tier objects, each with:
  - `name`: string.
  - `monthlyPrice`: number or `null` (for custom/enterprise).
  - `limits`: key-value object of human-readable limits (e.g. `fastRequests`, `fiveHourCredits`, `concurrency`). **Never leave as empty `{}`**.
  - `models`: string array of models supported. **Never leave as empty `[]`**.
  - `estimatedTokenBudget`: object with `description`, `estimatedMillionTokens`, and `assumptions`. **Never leave as `null`**.
- `gotchas`: array of gotcha strings.
- `dataTraining`: data privacy / training policy string.
- `ipIndemnity`: boolean or descriptive string.

### C. Reproducible Generation
Whenever modifying or adding plans in `data/coding-plans/`, update `data/generate_plans.py` to ensure that running `python3 data/generate_plans.py` regenerates all plan JSON files consistently.

### D. Zero Linter Warnings
The repository uses `oxlint`. Every PR/commit must pass `npm run lint` with **0 errors and 0 warnings**.

### E. Decision Engine Stacking Modes Depend on Raw Tier Budgets
The Decision Engine (`src/components/budget/LabDecisionEngine.tsx`) offers Mix & Match (combined distinct lesser subscriptions) and Dangerous Dave Mode (stacked copies of one subscription). Both read the **raw** `tier.estimatedTokenBudget.estimatedMillionTokens` and `tier.monthlyPrice` via `buildStackCandidates` / `computeMixAndMatch` / `computeDaveStacks` in `src/lib/pricing.ts`. Do not:
- Set `estimatedTokenBudget` to `null`, `0`, or an empty object on any tier — the stacking modes silently drop such plans.
- Feed the standard leaderboard's budget-normalized yields into stacking math (it double-counts the budget).
Increase the Mix & Match bundle cap above 4 without adding dedupe/combination guards.

---

## 4. Directory Layout

```
Token-Max/
├── .github/workflows/
│   ├── deploy.yml            # Builds & deploys dist/ to GitHub Pages on push to main
│   └── update-data.yml        # Daily cron (06:00 UTC) running fetch & build scripts
├── data/
│   ├── coding-plans/          # Curated JSON files for all 33 services
│   │   ├── _schema.json       # JSON Schema defining plan structure
│   │   ├── cursor.json
│   │   ├── z-ai.json
│   │   └── ... (31 more)
│   └── generate_plans.py      # Python script that generates all 33 plan files
├── docs/
│   ├── DATA_SOURCES.md        # Comprehensive data lineage & API documentation
│   └── MAINTAINABILITY.md     # Operations runbook for updates and maintenance
├── public/data/               # Static JSON consumed by frontend
│   ├── models.json
│   ├── plans.json
│   ├── benchmarks.json
│   ├── budget-precomputed.json
│   └── last-updated.json
├── scripts/
│   ├── fetch-models.mjs       # Fetches ~440+ models from OpenRouter API
│   ├── fetch-benchmarks.mjs   # Fetches benchmarks from Artificial Analysis API v2
│   └── build-data.mjs         # Merges models, benchmarks, and plans into public/data/
├── src/
│   ├── components/
│   │   ├── budget/            # BudgetInput, BudgetResults
│   │   ├── layout/            # Header, Footer
│   │   ├── models/            # ModelTable, PricingBadge
│   │   ├── plans/             # PlanGrid, PlanDetail, TokenTranslator
│   │   ├── benchmarks/        # ValueScatter, LeaderboardTable
│   │   ├── tos/               # GotchaCards, TrainingMatrix
│   │   └── shared/            # SearchFilter, LoadingSpinner, DataFreshness
│   ├── hooks/                 # useModels, usePlans, useBenchmarks, useBudget
│   ├── lib/                   # types.ts, pricing.ts, benchmarks.ts
│   ├── pages/                 # Dashboard, ModelsExplorer, PlansCompare, BenchmarksPage, TosAudit
│   ├── App.tsx                # HashRouter setup
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 5. Standard Agent Commands

```bash
# Start local development server
npm run dev

# Run oxlint (must be 0 warnings, 0 errors)
npm run lint

# TypeScript check + Vite production build
npm run build

# Consolidate and build static data files
npm run build-data
# or: node scripts/build-data.mjs

# Fetch OpenRouter models (public API)
npm run fetch-models
# or: node scripts/fetch-models.mjs

# Fetch benchmarks (requires AA_API_KEY)
AA_API_KEY="your_key" npm run fetch-benchmarks
# or: AA_API_KEY="your_key" node scripts/fetch-benchmarks.mjs

# Full data update sequence
npm run update-data

# Regenerate all plan files
python3 data/generate_plans.py
```

---

## 6. How to Add a New Coding Service (Quick Reference)

1. Research the service's official pricing page and documentation.
2. Create `data/coding-plans/<service-id>.json` following `_schema.json`.
3. Add the plan generation definition into `data/generate_plans.py`.
4. If the provider is a model creator, add their brand color to `getProviderColor` in `src/lib/pricing.ts`.
5. Run `node scripts/build-data.mjs` to re-generate `public/data/plans.json`.
6. Run `npm run lint && npm run build` to confirm zero errors.
7. Test the changes in `#/plans` and the Token Budget Translator.
