# GEMINI.md — Gemini & Google Antigravity Agent Guide for Token-Max

> **Target:** Google Antigravity (AGY), Gemini CLI, Jules Agent, and associated Google DeepMind coding environments.

---

## 1. Tool Priority & Discovery Protocol

This repository is equipped with the **Codebase Knowledge Graph (codebase-memory-mcp)**:
1. **Prefer MCP Graph Tools for Code Discovery**:
   - `search_graph`: Find components, types, and hooks (e.g. `search_graph(name_pattern=".*TokenTranslator.*")`).
   - `trace_path`: Trace incoming and outgoing calls for models and plans hooks.
   - `get_code_snippet`: Read source for specific symbols.
2. **Fall Back to File & Grep Tools for**:
   - String literals, CSS classes, configuration JSONs, and Markdown files (`data/coding-plans/*.json`, `public/data/*.json`, `docs/*.md`).
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
  - `scripts/build-data.mjs`: Consolidates `public/data/models.json`, `public/data/plans.json`, `public/data/budget-precomputed.json`, and `public/data/last-updated.json`.
- **Plan File Rule**: All plans in `data/coding-plans/` must strictly validate against `data/coding-plans/_schema.json`.
- **Python Generator**: Ensure `data/generate_plans.py` matches any changes to individual JSON files in `data/coding-plans/`.

---

## 4. Verification Checklists Before Completing Tasks

Every code change must pass:
```bash
# 1. Plan data audit (0 missing limits, 0 missing models, 0 missing token budgets)
python3 -c '
import json, glob
plans = [json.load(open(f)) for f in glob.glob("data/coding-plans/*.json") if "_schema" not in f]
for p in plans:
    for t in p["tiers"]:
        assert t.get("limits") and len(t["limits"]) > 0, f"{p[\"name\"]} tier {t[\"name\"]} missing limits"
        assert t.get("models") and len(t["models"]) > 0, f"{p[\"name\"]} tier {t[\"name\"]} missing models"
        assert t.get("estimatedTokenBudget"), f"{p[\"name\"]} tier {t[\"name\"]} missing estimatedTokenBudget"
print("All plans passed validation!")
'

# 2. Linter check (oxlint)
npm run lint

# 3. Production build
npm run build
```

---

## 5. UI Guardrails

- **HashRouter**: Never replace `HashRouter` with `BrowserRouter` in `src/App.tsx`. GitHub Pages serves the app at `https://heretek-ai.github.io/Token-Max/` without URL rewriting.
- **Model Cleanliness**: Never display obsolete models (Mistral Nemo, Granite Micro, Lunaris, Gemma 1, Llama 2, GPT-3.5) by default in the Token Budget Translator.
- **Provider Colors**: New model providers must have a color mapped in `src/lib/pricing.ts`.
