# GEMINI.md — Gemini & Google Antigravity Agent Guide for Token-Max

> **Target:** Google Antigravity (AGY), Gemini CLI, Jules Agent, and associated Google DeepMind coding environments.

---

## 1. Tool Priority & Discovery Protocol

This repository is equipped with the **Codebase Knowledge Graph (codebase-memory-mcp)**:
1. **Prefer MCP Graph Tools for Code Discovery**:
   - `search_graph`: Find components, types, and hooks (e.g. `search_graph(name_pattern=".*HardwareBreakeven.*")`, `search_graph(name_pattern=".*computeHardwareEconomics.*")`).
   - `trace_path`: Trace incoming and outgoing calls for models, plans, and calculation engines.
   - `get_code_snippet`: Read source for specific symbols.
2. **Key Analytical Engines in `src/lib/`**:
   - `hardware.ts`: Local hardware CapEx depreciation, electricity OpEx, crossover volume, TCO curves.
   - `log-parser.ts` & `receipt-math.ts`: Client-side agent transcript parsing (JSONL, JSON, Markdown) and itemized thermal receipt generation.
   - `teams.ts`: 80/20 power-law team economics & centralized gateway routing.
   - `reasoning.ts`: Extended thinking token inflation and plan absorption policies.
   - `exporters.ts`: BYOK configuration generators (Aider, Continue, Cline, OpenCode, Cursor).
   - `throttle.ts`: 5-hour rolling pool, concurrency limits, and burst simulation.
   - `pricing.ts`: Blended rates, budget allocation, knapsack mix & match, Dangerous Dave mode.
   - `tos.ts`: Privacy policy and terms of service classifier.
3. **Fall Back to File & Grep Tools for**:
   - String literals, CSS classes, configuration JSONs, and Markdown files (`SOURCE.md`, `data/coding-plans/*.json`, `public/data/*.json`, `docs/*.md`).
   - Verifying file listings with `find_by_name` or `list_dir`.

---

## 2. Terminal & Background Task Guidelines

- **Terminal Concurrency**: Do not issue concurrent commands to the same persistent terminal session. Use separate subshells or wait for active tasks to complete.
- **Reactive Wakeup**: When launching background tasks (e.g. `sleep 30 && gh run list`), do NOT poll in a loop. Stop calling tools and let the system deliver the completion message.
- **Node.js Environment**: Use Node.js 20+ with ES modules (`import`/`export`) for all scripts in `scripts/*.mjs`.

---

## 3. Data Pipeline & Build Standards

- **Core Ingestion Scripts**:
  - `scripts/fetch-models.mjs`: Pulls from `https://openrouter.ai/api/v1/models` and calculates blended 3:1 input:output costs.
  - `scripts/fetch-benchmarks.mjs`: Pulls from `https://artificialanalysis.ai/api/v2/language/models/free` (requires `AA_API_KEY`) and matches model slugs.
  - `scripts/build-data.mjs`: Consolidates `public/data/models.json`, `public/data/plans.json`, `public/data/usage-limits.json` (394 entries), and `public/data/last-updated.json`.
  - `scripts/validate-data.mjs`: Validates all 33 curated plan schemas, limits, models, budgets, and published `usage-limits.json`.
- **Plan File Rule**: All plans in `data/coding-plans/` must strictly validate against `data/coding-plans/_schema.json` and cite primary documentation in `SOURCE.md`.
- **Python Generator**: Ensure `data/generate_plans.py` matches any changes to individual JSON files in `data/coding-plans/`.

---

## 4. Verification Checklists Before Completing Tasks

Every code change must pass:
```bash
# 1. Plan data audit & invariant validation
npm run validate-data

# 2. Complete unit test suite (102 tests across 8 suites)
npm test

# 3. Linter check (oxlint: 0 errors, 0 warnings)
npm run lint

# 4. Production build (tsc -b && vite build)
npm run build
```

---

## 5. UI Guardrails

- **HashRouter**: Never replace `HashRouter` with `BrowserRouter` in `src/App.tsx`. GitHub Pages serves the app at `https://heretek-ai.github.io/Token-Max/` without URL rewriting across all 12 routes (`#/`, `#/optimizer`, `#/simulator`, `#/exporter`, `#/reasoning`, `#/teams`, `#/receipt`, `#/hardware`, `#/models`, `#/plans`, `#/benchmarks`, `#/tos`).
- **Model Cleanliness**: Never display obsolete models (Mistral Nemo, Granite Micro, Lunaris, Gemma 1, Llama 2, GPT-3.5) by default in the Token Budget Translator.
- **Provider Colors**: New model providers must have a color mapped in `src/lib/pricing.ts`.
- **Theme Consistency**: Strictly use the Heretek Blood & Steel design system tokens from `@theme` in `src/index.css`.
