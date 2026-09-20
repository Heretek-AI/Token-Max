// Shared model taxonomy: canonical series resolution, routing-variant
// stripping, hub-router exclusion, age window, and rank comparator.
// Consumed by fetch-models.mjs, fetch-benchmarks.mjs, build-data.mjs and
// validate-data.mjs so the whole pipeline shares one source of truth.

export const AGE_WINDOW_DAYS = 365;
export const SERIES_CAP = 3;

export const SECONDS_PER_DAY = 86_400;
export const AGE_WINDOW_SECONDS = AGE_WINDOW_DAYS * SECONDS_PER_DAY;

// Canonical series identifiers the whole pipeline understands.
export const KNOWN_SERIES = [
  'GPT',
  'Claude',
  'Gemini',
  'Grok',
  'Qwen',
  'DeepSeek',
  'Llama',
  'GLM',
  'Kimi',
  'Mistral',
  'MiMo',
  'other',
];

// OpenRouter hub-router entries route dynamically across many models and
// cannot be attributed to a single series; they are excluded entirely.
const HUB_ROUTER_PREFIXES = ['openrouter/'];

const HUB_ROUTER_IDS = new Set([
  'openrouter/auto',
  'openrouter/auto-beta',
  'openrouter/fusion',
  'openrouter/pareto-code',
  'openrouter/free',
  'openrouter/bodybuilder',
]);

// Routing variants (free/batch/nitro/flex/floor/extended/search) point at the
// same underlying model; strip before matching so only the primary variant is
// cataloged.
const ROUTING_SUFFIX_RE = /:(free|batch|nitro|flex|floor|extended|search)$/i;

export function stripRouterSuffix(id) {
  return (id || '').replace(ROUTING_SUFFIX_RE, '');
}

export function isHubRouter(id) {
  const clean = (id || '').toLowerCase();
  if (HUB_ROUTER_PREFIXES.some(p => clean.startsWith(p))) return true;
  return HUB_ROUTER_IDS.has(clean);
}

export function ageCutoffUnix(nowMs = Date.now()) {
  return Math.floor(nowMs / 1000) - AGE_WINDOW_SECONDS;
}

export function passesAgeWindow(createdUnix, cutoffUnix) {
  if (!Number.isFinite(createdUnix)) return true; // no date evidence: keep, ranked last
  return createdUnix >= cutoffUnix;
}

// Canonical series table. Order matters: first matching provider prefix wins,
// then the id/substring patterns are checked as verification.
const SERIES_TABLE = [
  { series: 'GPT', providers: ['openai'], patterns: ['gpt', 'o1', 'o3', 'o4', 'codex'] },
  { series: 'Claude', providers: ['anthropic'], patterns: ['claude'] },
  { series: 'Gemini', providers: ['google'], patterns: ['gemini'] },
  { series: 'Grok', providers: ['x-ai'], patterns: ['grok'] },
  { series: 'Qwen', providers: ['qwen'], patterns: ['qwen'] },
  { series: 'DeepSeek', providers: ['deepseek'], patterns: ['deepseek'] },
  { series: 'Llama', providers: ['meta-llama', 'meta'], patterns: ['llama'] },
  { series: 'GLM', providers: ['z-ai'], patterns: ['glm'] },
  { series: 'Kimi', providers: ['moonshotai', 'moonshot'], patterns: ['kimi'] },
  { series: 'Mistral', providers: ['mistralai', 'mistral', 'mistral-nemo'], patterns: ['mistral', 'magistral', 'ministral', 'devstral', 'pixtral', 'codestral'] },
  { series: 'MiMo', providers: ['xiaomi'], patterns: ['mimo'] },
];

/**
 * Resolve the canonical series for a model.
 * Returns one of KNOWN_SERIES (never null) so grouping is always defined.
 */
export function resolveSeries(id, provider = '', name = '') {
  const cleanId = stripRouterSuffix((id || '').toLowerCase());
  const prov = (provider || cleanId.split('/')[0] || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  for (const entry of SERIES_TABLE) {
    const providerHit = entry.providers.some(p => prov === p || prov.startsWith(`${p}/`) || cleanId.startsWith(`${p}/`) || cleanId.startsWith(`${p}-`));
    const patternHit = entry.patterns.some(p => cleanId.includes(p) || nm.includes(p));
    if (providerHit || patternHit) return entry.series;
  }

  return 'other';
}

/**
 * Rank comparator (descending). Falls back to recency, then context window,
 * for newly-released models that lack benchmark coverage.
 */
export function rankKey(model) {
  const b = model.benchmarks || {};
  const intelligence = Number.isFinite(b.intelligenceIndex) ? b.intelligenceIndex : -1;
  const coding = Number.isFinite(b.codingIndex) ? b.codingIndex : -1;
  const agentic = Number.isFinite(b.agenticIndex) ? b.agenticIndex : -1;
  const created = Number.isFinite(model.createdUnix) ? model.createdUnix : -1;
  const context = Number.isFinite(model.contextWindow) ? model.contextWindow : -1;
  return { intelligence, coding, agentic, created, context };
}

export function compareModels(a, b) {
  const ka = rankKey(a);
  const kb = rankKey(b);
  if (kb.intelligence !== ka.intelligence) return kb.intelligence - ka.intelligence;
  if (kb.coding !== ka.coding) return kb.coding - ka.coding;
  if (kb.agentic !== ka.agentic) return kb.agentic - ka.agentic;
  if (kb.created !== ka.created) return kb.created - ka.created;
  return kb.context - ka.context;
}

/**
 * Sort descending by compareModels within each series group and retain the
 * top SERIES_CAP entries. Returns a new array; does not mutate the input.
 */
export function applyTopPerSeries(models, cap = SERIES_CAP, seriesKey = m => m.series) {
  const groups = new Map();
  for (const m of models) {
    const s = seriesKey(m) || 'other';
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s).push(m);
  }

  const kept = [];
  const summary = [];
  for (const [series, group] of groups.entries()) {
    group.sort(compareModels);
    const slice = group.slice(0, cap);
    kept.push(...slice);
    summary.push({ series, kept: slice.length, dropped: group.length - slice.length, total: group.length });
  }

  summary.sort((a, b) => a.series.localeCompare(b.series));
  return { kept, summary };
}

export function isUnbenchmarked(model) {
  const b = model.benchmarks || {};
  return !(
    Number.isFinite(b.intelligenceIndex) ||
    Number.isFinite(b.codingIndex) ||
    Number.isFinite(b.agenticIndex)
  );
}
