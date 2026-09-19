# CLAUDE.md — Claude Code Developer Guide for Token-Max

> **Target:** Anthropic Claude Code CLI (`claude`), Claude Desktop, and associated agentic workflows.

---

## 1. Fast Command Reference

```bash
# Development
npm run dev              # Launch local Vite dev server (http://localhost:5173/Token-Max/)

# Quality Checks
npm run lint             # Run oxlint (0 errors, 0 warnings enforced)
npm run build            # Run tsc -b && vite build

# Data Pipeline
node scripts/build-data.mjs       # Rebuild consolidated plans & models data
node scripts/fetch-models.mjs     # Fetch latest OpenRouter models (public)
AA_API_KEY="..." node scripts/fetch-benchmarks.mjs  # Fetch AA benchmarks
python3 data/generate_plans.py   # Regenerate all 33 curated coding plan JSONs
```

---

## 2. Key Architectural Tenets

1. **Zero-Backend Single Page App**:
   - Hosted on GitHub Pages at `https://heretek-ai.github.io/Token-Max/`.
   - Routing uses **`HashRouter`** (`src/App.tsx`) to avoid 404s on GitHub Pages when reloading deep URLs like `#/plans` or `#/models`.

2. **Dual-Part Token Budget Translator (`src/components/plans/TokenTranslator.tsx`)**:
   - Subscriptions (e.g. Cursor Pro $20, Copilot Pro $10, Z.ai Lite $18) do not sell raw API tokens.
   - **Part 1**: Displays the plan's **native models**, **credit quotas**, and **rate limits**.
   - **Part 2**: Compares what that exact monthly spend buys in direct pay-as-you-go API tokens.
   - **Constraint**: Obsolete or noisy models (e.g. Mistral Nemo, Granite Micro, Lunaris, Gemma 1, Llama 2, GPT-3.5) are strictly filtered out so they never float to the top of the comparison.

3. **Plan Schema Integrity (`data/coding-plans/`)**:
   - 33 plans tracked across `coding-ide`, `coding-router`, and `api-provider`.
   - Every tier MUST include complete `limits`, `models`, and `estimatedTokenBudget` (with `description`, `estimatedMillionTokens`, and `assumptions`).
   - Never leave fields empty or null on paid tiers.

---

## 3. Model Classification in `scripts/build-data.mjs`

When updating `classifyModelTier(model)`:
- **`frontier`**: Models with Coding Index ≥ 70, or flagship models like GPT-6 Astra, Claude Opus 5, Claude Sonnet 5, Claude Fable 5.1, GPT-5.6 Sol, Qwen 3.8 Max.
- **`value`**: High efficiency models with Coding Index ≥ 45 and Blended Cost ≤ $5.00/M (e.g. DeepSeek V4.1 Flash, Gemini 3.8 Flash, GLM-5.3-Flash, Muse Spark 1.3).
- **`balanced`**: Mid-tier models.

---

## 4. Code Style & Linting Rules

- **Linter**: `oxlint` (`.oxlintrc.json`).
  - No unused variables (remove them or prefix with `_` if required by interface signatures).
  - Clean imports, no unused modules.
- **Styling**: Tailwind CSS v4 using modern `@theme` variables in `src/index.css`:
  - `--color-primary: #6366f1`
  - `--color-surface: #ffffff` (dark: `#0f172a`)
  - `--color-text: #0f172a` (dark: `#f1f5f9`)
- **React**: Functional components with hooks (`useState`, `useMemo`, `useEffect`). No class components.

---

## 5. Adding a New Plan Workflow

1. Research the service and verify pricing, limits, and models.
2. Create `data/coding-plans/<id>.json` conforming to `data/coding-plans/_schema.json`.
3. Append plan creation to `data/generate_plans.py`.
4. Add provider color to `getProviderColor` in `src/lib/pricing.ts`.
5. Run `node scripts/build-data.mjs`.
6. Run `npm run lint && npm run build`.
7. Verify live via `npm run dev` at `#/plans`.
