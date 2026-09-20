# CLAUDE.md — Claude Code Developer Guide for Token-Max

> **Target:** Anthropic Claude Code CLI (`claude`), Claude Desktop, and associated agentic workflows.

---

## 1. Fast Command Reference

```bash
# Development
npm run dev              # Launch local Vite dev server (http://localhost:5173/Token-Max/)

# Quality Checks
npm run lint             # Run oxlint (0 errors, 0 warnings enforced)
npm run validate-data    # Enforce plan data schema invariants & usage-limits.json
npm test                 # Run vitest (102 tests across 8 suites)
npm run build            # Run tsc -b && vite build

# Data Pipeline
node scripts/build-data.mjs       # Rebuild consolidated plans, models & usage-limits data
node scripts/fetch-models.mjs     # Fetch latest OpenRouter models (public)
AA_API_KEY="..." node scripts/fetch-benchmarks.mjs  # Fetch AA benchmarks
python3 data/generate_plans.py   # Regenerate all 33 curated coding plan JSONs
```

---

## 2. Key Architectural Tenets

1. **Zero-Backend Single Page App**:
   - Hosted on GitHub Pages at `https://heretek-ai.github.io/Token-Max/`.
   - Routing uses **`HashRouter`** (`src/App.tsx`) with 12 distinct routes (`#/`, `#/optimizer`, `#/simulator`, `#/exporter`, `#/reasoning`, `#/teams`, `#/receipt`, `#/hardware`, `#/models`, `#/plans`, `#/benchmarks`, `#/tos`).

2. **Analytical & Simulation Tool Suite**:
   - **Local Hardware vs Cloud Breakeven (`#/hardware`)**: Models Mac Studio/RTX CapEx amortization, electricity OpEx, memory bandwidth, and generation throughput crossover curves.
   - **Agent Session Receipt Analyzer (`#/receipt`)**: 100% client-side parser for Antigravity JSONL, Cline JSON, and Aider logs with itemized thermal receipt and cross-model repricing.
   - **Team & Org Gateway Economics (`#/teams`)**: 80/20 power-law modeling comparing seat licenses vs gateway routing vs optimal hybrid architecture.
   - **Reasoning Token Exploder (`#/reasoning`)**: Visualizes hidden thinking token inflation across effort levels and Plan Absorption policies.
   - **BYOK Config Exporter (`#/exporter`)**: Instant configuration generator for Aider, Continue, Cline, OpenCode, and Cursor.
   - **5-Hour Throttle Simulator (`#/simulator`)**: Discrete 5-min simulation of rolling token pools, concurrency limits, and queue cliffs.
   - **Multi-Model Mix Optimizer (`#/optimizer`)**: Workload composer and overages calculator.

3. **Dual-Part Token Budget Translator (`src/components/plans/TokenTranslator.tsx`)**:
   - Subscriptions (e.g. Cursor Pro $20, Copilot Pro $10, Z.ai Lite $18) do not sell raw API tokens.
   - **Part 1**: Displays the plan's **native models**, **credit quotas**, and **rate limits**.
   - **Part 2**: Compares what that exact monthly spend buys in direct pay-as-you-go API tokens.
   - **Constraint**: Obsolete or noisy models (e.g. Mistral Nemo, Granite Micro, Lunaris, Gemma 1, Llama 2, GPT-3.5) are strictly filtered out so they never float to the top of the comparison.

4. **Plan Schema Integrity (`data/coding-plans/`)**:
   - 33 plans tracked across `coding-ide`, `coding-router`, and `api-provider`.
   - Every tier MUST include complete `limits`, `models`, and `estimatedTokenBudget` (with `description`, `estimatedMillionTokens`, and `assumptions`).
   - Never leave fields empty or null on paid tiers.

5. **Analytical & Mathematical Safety Invariants**:
   - Always use nullish coalescing `??` for pricing lookups so that free prompt tokens (`pricing.input === 0`) are not overridden by non-zero fallbacks.
   - Sanitize all BYOK exporter inputs against YAML newline/delimiter injections using `sanitizeYamlScalar`.
   - Never let log parser accumulate unvalidated tokens without `safeTokenNumber` protection against `NaN` or non-numeric tokens.

6. **Primary Evidence & Public Datasets (`SOURCE.md` & `usage-limits.json`)**:
   - `SOURCE.md` is the single source of truth for verbatim vendor documentation quotes, pricing URLs, and credit-to-token derivation rationale across all 33 plans.
   - `public/data/usage-limits.json` is generated during build (`scripts/build-data.mjs`), validating 394 model limit entries against schema invariants in CI (`scripts/validate-data.mjs`).


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
  - TypeScript types imported using `import type { ... }` due to `verbatimModuleSyntax`.
- **Styling**: Tailwind CSS v4 using the **Heretek Blood & Steel** theme in `src/index.css`:
  - Blood red accents (`#8a1818`, `--color-primary: #a81c1c`)
  - Steel rails and borders (`--color-steel-*`)
  - Deep void surfaces (`--color-void-*`)
- **React**: Functional components with hooks (`useState`, `useMemo`, `useEffect`). No class components.

---

## 5. Adding a New Plan Workflow

1. Research the service and record official quotes, links, and quota math in `SOURCE.md`.
2. Create `data/coding-plans/<id>.json` conforming to `data/coding-plans/_schema.json`.
3. Append plan creation to `data/generate_plans.py`.
4. Add provider color to `getProviderColor` in `src/lib/pricing.ts`.
5. Run `node scripts/build-data.mjs` to regenerate `public/data/plans.json` and `public/data/usage-limits.json`.
6. Run `npm run lint && npm run validate-data && npm test && npm run build`.
7. Verify live via `npm run dev` at `#/plans`.
