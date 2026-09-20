import fs from 'fs/promises';
import path from 'path';

const PLANS_DIR = path.join(process.cwd(), 'data/coding-plans');
const PUBLIC_PLANS = path.join(process.cwd(), 'public/data/plans.json');
const PUBLIC_MODELS = path.join(process.cwd(), 'public/data/models.json');
const PUBLIC_USAGE_LIMITS = path.join(process.cwd(), 'public/data/usage-limits.json');

const CATEGORIES = new Set(['coding-ide', 'coding-router', 'api-provider']);
const STACKING_POLICIES = new Set(['allowed', 'silent', 'prohibited', 'unknown']);

const errors = [];

function err(msg) {
  errors.push(msg);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validatePlan(plan, filename) {
  const where = `${filename}`;
  if (!plan || typeof plan !== 'object') {
    err(`${where}: not a JSON object`);
    return;
  }
  if (typeof plan.id !== 'string' || plan.id.length === 0) err(`${where}: missing id`);
  const idFromFile = filename.replace(/\.json$/, '');
  if (plan.id !== idFromFile) err(`${where}: id "${plan.id}" does not match filename`);
  if (typeof plan.name !== 'string' || plan.name.trim() === '') err(`${where}: missing name`);
  if (!CATEGORIES.has(plan.category)) err(`${where}: category "${plan.category}" is not one of ${[...CATEGORIES].join(', ')}`);
  if (typeof plan.url !== 'string' || !/^https?:\/\//.test(plan.url)) err(`${where}: url must be an http(s) URL`);
  if (!isIsoDate(plan.lastVerified)) err(`${where}: lastVerified must be YYYY-MM-DD`);
  if (typeof plan.dataTraining !== 'string' || plan.dataTraining.trim() === '') err(`${where}: dataTraining must be a non-empty string`);
  if (typeof plan.ipIndemnity !== 'boolean' && (typeof plan.ipIndemnity !== 'string' || plan.ipIndemnity.trim() === '')) {
    err(`${where}: ipIndemnity must be a boolean or non-empty string`);
  }
  if (!Array.isArray(plan.gotchas) || plan.gotchas.length === 0) err(`${where}: gotchas must be a non-empty array`);
  if (!Array.isArray(plan.tosHighlights)) err(`${where}: tosHighlights must be an array`);
  if (!STACKING_POLICIES.has(plan.stackingPolicy)) {
    err(`${where}: stackingPolicy must be one of ${[...STACKING_POLICIES].join(', ')}`);
  }
  if (plan.stackingPolicy === 'prohibited' && (typeof plan.stackingPolicyNote !== 'string' || plan.stackingPolicyNote.trim() === '')) {
    err(`${where}: prohibited stackingPolicy requires a stackingPolicyNote with the evidence`);
  }

  if (!Array.isArray(plan.tiers) || plan.tiers.length === 0) {
    err(`${where}: tiers must be a non-empty array`);
    return;
  }

  const seenTierNames = new Set();
  for (const tier of plan.tiers) {
    const t = `${where} [${tier?.name ?? '?'}]`;
    if (!isPlainObject(tier)) {
      err(`${t}: tier is not an object`);
      continue;
    }
    if (typeof tier.name !== 'string' || tier.name.trim() === '') err(`${t}: missing tier name`);
    if (seenTierNames.has(tier.name)) err(`${t}: duplicate tier name`);
    seenTierNames.add(tier.name);
    if (tier.monthlyPrice !== null && (typeof tier.monthlyPrice !== 'number' || tier.monthlyPrice < 0 || !Number.isFinite(tier.monthlyPrice))) {
      err(`${t}: monthlyPrice must be a non-negative number or null`);
    }
    if (tier.annualPrice !== undefined && tier.annualPrice !== null) {
      if (typeof tier.annualPrice !== 'number' || tier.annualPrice <= 0) {
        err(`${t}: annualPrice must be a positive number or null`);
      } else if (typeof tier.monthlyPrice === 'number' && tier.monthlyPrice > 0 && tier.annualPrice / 12 >= tier.monthlyPrice) {
        err(`${t}: annualPrice/12 (${(tier.annualPrice / 12).toFixed(2)}) must be lower than monthlyPrice ${tier.monthlyPrice}`);
      }
    }
    if (!isPlainObject(tier.limits) || Object.keys(tier.limits).length === 0) err(`${t}: limits must be a non-empty object`);
    if (!Array.isArray(tier.models) || tier.models.length === 0) err(`${t}: models must be a non-empty array`);
    if (Array.isArray(tier.models)) {
      const dupes = tier.models.filter((m, i) => tier.models.indexOf(m) !== i);
      if (dupes.length > 0) err(`${t}: duplicate model entries: ${[...new Set(dupes)].join(', ')}`);
    }

    const tb = tier.estimatedTokenBudget;
    if (!isPlainObject(tb)) {
      err(`${t}: estimatedTokenBudget must be an object (never null)`);
      continue;
    }
    if (typeof tb.description !== 'string' || tb.description.trim() === '') err(`${t}: estimatedTokenBudget.description required`);
    if (typeof tb.assumptions !== 'string' || tb.assumptions.trim() === '') err(`${t}: estimatedTokenBudget.assumptions required`);
    const meta = tb.estimateMeta;
    if (!isPlainObject(meta)) {
      err(`${t}: estimatedTokenBudget.estimateMeta required`);
    } else {
      if (!['official', 'derived', 'research', 'community'].includes(meta.sourceType)) {
        err(`${t}: estimateMeta.sourceType must be official|derived|research|community`);
      }
      if (!['high', 'medium', 'low'].includes(meta.confidence)) {
        err(`${t}: estimateMeta.confidence must be high|medium|low`);
      }
      if (!isIsoDate(meta.verifiedAt)) err(`${t}: estimateMeta.verifiedAt must be YYYY-MM-DD`);
      if (meta.sourceUrl !== undefined && (typeof meta.sourceUrl !== 'string' || !/^https?:\/\//.test(meta.sourceUrl))) {
        err(`${t}: estimateMeta.sourceUrl must be an http(s) URL`);
      }
      if (meta.sourceType === 'official' && (typeof meta.sourceUrl !== 'string' || meta.sourceUrl.trim() === '')) {
        err(`${t}: estimateMeta.sourceType "official" requires a sourceUrl`);
      }
    }
    if (typeof tb.estimatedMillionTokens !== 'number' || !Number.isFinite(tb.estimatedMillionTokens)) {
      err(`${t}: estimatedTokenBudget.estimatedMillionTokens must be a number`);
      continue;
    }
    const paid = typeof tier.monthlyPrice === 'number' && tier.monthlyPrice > 0;
    if (paid && tb.estimatedMillionTokens <= 0) {
      err(`${t}: paid tier ($${tier.monthlyPrice}) must have estimatedMillionTokens > 0 (stacking drops zero budgets)`);
    }
    if (tb.estimatedMillionTokens < 0) err(`${t}: estimatedMillionTokens must not be negative`);
    if (tb.midpointEstimate !== undefined && tb.midpointEstimate !== null) {
      if (typeof tb.midpointEstimate !== 'number' || tb.midpointEstimate < tb.estimatedMillionTokens) {
        err(`${t}: midpointEstimate must be a number >= estimatedMillionTokens`);
      }
    }
    if (tb.optimisticEstimate !== undefined && tb.optimisticEstimate !== null) {
      const floor = tb.midpointEstimate ?? tb.estimatedMillionTokens;
      if (typeof tb.optimisticEstimate !== 'number' || tb.optimisticEstimate < floor) {
        err(`${t}: optimisticEstimate must be a number >= midpoint/conservative estimate`);
      }
    }

    const pmb = tier.perModelTokenBudgets;
    if (pmb !== undefined && pmb !== null) {
      if (!isPlainObject(pmb)) {
        err(`${t}: perModelTokenBudgets must be an object`);
      } else {
        const tierModels = Array.isArray(tier.models) ? tier.models : [];
        for (const [key, entry] of Object.entries(pmb)) {
          if (!isPlainObject(entry)) {
            err(`${t}: perModelTokenBudgets[${key}] must be an object`);
            continue;
          }
          const matched = tierModels.some(m => m.toLowerCase().includes(key));
          if (!matched) {
            err(`${t}: perModelTokenBudgets key "${key}" does not match any entry of tier.models`);
          }
          if (typeof entry.estimatedMillionTokens !== 'number' || !Number.isFinite(entry.estimatedMillionTokens) || entry.estimatedMillionTokens <= 0) {
            err(`${t}: perModelTokenBudgets[${key}].estimatedMillionTokens must be a finite number > 0`);
          }
          if (entry.midpointEstimate !== undefined && entry.midpointEstimate !== null
            && (typeof entry.midpointEstimate !== 'number' || entry.midpointEstimate < entry.estimatedMillionTokens)) {
            err(`${t}: perModelTokenBudgets[${key}].midpointEstimate must be a number >= estimatedMillionTokens`);
          }
          if (entry.optimisticEstimate !== undefined && entry.optimisticEstimate !== null) {
            const pmbFloor = entry.midpointEstimate ?? entry.estimatedMillionTokens;
            if (typeof entry.optimisticEstimate !== 'number' || entry.optimisticEstimate < pmbFloor) {
              err(`${t}: perModelTokenBudgets[${key}].optimisticEstimate must be >= midpoint/conservative estimate`);
            }
          }
          if (entry.basis !== undefined && entry.basis !== null
            && !['official-table', 'official-multiplier', 'list-price-credit', 'equal-rate'].includes(entry.basis)) {
            err(`${t}: perModelTokenBudgets[${key}].basis must be official-table|official-multiplier|list-price-credit|equal-rate`);
          }
          if (entry.confidence !== undefined && entry.confidence !== null
            && !['high', 'medium', 'low'].includes(entry.confidence)) {
            err(`${t}: perModelTokenBudgets[${key}].confidence must be high|medium|low`);
          }
        }
      }
    }
  }
}

async function validateModels(models) {
  if (!Array.isArray(models)) {
    err('public/data/models.json: must be a JSON array');
    return;
  }
  if (models.length === 0) {
    err('public/data/models.json: must not be empty');
    return;
  }

  // Series membership whitelist (mirrors scripts/series-taxonomy.mjs).
  const KNOWN_SERIES = new Set([
    'GPT', 'Claude', 'Gemini', 'Grok', 'Qwen', 'DeepSeek', 'Llama',
    'GLM', 'Kimi', 'Mistral', 'MiMo', 'other',
  ]);

  const SERIES_CAP = 3;
  const AGE_WINDOW_DAYS = 365;
  const cutoffUnix = Math.floor(Date.now() / 1000) - AGE_WINDOW_DAYS * 86400;

  const groups = new Map();
  for (const m of models) {
    const where = `public/data/models.json [${m?.id ?? '?'}]`;
    if (!m || typeof m !== 'object') {
      err(`${where}: not an object`);
      continue;
    }

    if (typeof m.series !== 'string' || m.series.length === 0) {
      err(`${where}: missing canonical "series" field`);
    } else if (!KNOWN_SERIES.has(m.series)) {
      err(`${where}: series "${m.series}" is not in the known taxonomy`);
    }

    const createdUnix = Number(m.createdUnix);
    if (!Number.isFinite(createdUnix)) {
      if (!m.releasedAt || Number.isNaN(Date.parse(m.releasedAt))) {
        err(`${where}: neither createdUnix nor releasedAt provide a verifiable release date`);
      }
    } else if (createdUnix < cutoffUnix) {
      const ageDays = Math.floor((Date.now() / 1000 - createdUnix) / 86400);
      err(`${where}: model is ${ageDays} days old, exceeding the ${AGE_WINDOW_DAYS}-day age window`);
    }

    const s = m.series || 'other';
    if (!groups.has(s)) groups.set(s, 0);
    groups.set(s, groups.get(s) + 1);
  }

  // No series may exceed the top-3 slice cap.
  for (const [series, count] of groups.entries()) {
    if (count > SERIES_CAP) {
      err(`public/data/models.json: series "${series}" contains ${count} models, exceeding the top-${SERIES_CAP} cap`);
    }
  }

  console.log(`Checked ${models.length} models across ${groups.size} series for cap/age invariants.`);
}

function validateUsageLimits(usageLimits, plans) {
  const where = 'public/data/usage-limits.json';
  if (!usageLimits || typeof usageLimits !== 'object') {
    err(`${where}: not an object`);
    return;
  }
  if (usageLimits.schemaVersion !== '1.0.0') {
    err(`${where}: invalid schemaVersion "${usageLimits.schemaVersion}" (expected "1.0.0")`);
  }
  if (!usageLimits.summary || typeof usageLimits.summary !== 'object') {
    err(`${where}: missing summary object`);
  } else {
    if (usageLimits.summary.totalProviders !== plans.size) {
      err(`${where}: summary.totalProviders (${usageLimits.summary.totalProviders}) does not match plans count (${plans.size})`);
    }
    if (usageLimits.summary.totalModelLimitEntries !== usageLimits.entries?.length) {
      err(`${where}: summary.totalModelLimitEntries (${usageLimits.summary.totalModelLimitEntries}) does not match entries count (${usageLimits.entries?.length})`);
    }
  }

  if (!Array.isArray(usageLimits.providers) || usageLimits.providers.length !== plans.size) {
    err(`${where}: providers array length (${usageLimits.providers?.length}) does not match plans count (${plans.size})`);
  }

  const providerMap = new Map((usageLimits.providers || []).map(p => [p.id, p]));
  for (const [id, plan] of plans.entries()) {
    const p = providerMap.get(id);
    if (!p) {
      err(`${where}: missing provider "${id}"`);
      continue;
    }
    if (p.tiers?.length !== plan.tiers.length) {
      err(`${where}: provider "${id}" tier count (${p.tiers?.length}) does not match plan (${plan.tiers.length})`);
    }
    for (const tier of plan.tiers) {
      const t = p.tiers?.find(x => x.name === tier.name);
      if (!t) {
        err(`${where}: provider "${id}" missing tier "${tier.name}"`);
        continue;
      }
      for (const modelKey of tier.models || []) {
        const m = t.models?.find(x => x.modelKey === modelKey);
        if (!m) {
          err(`${where}: [${id}/${tier.name}] missing model entry for "${modelKey}"`);
          continue;
        }
        if (!Number.isFinite(m.estimatedMillionTokens) || m.estimatedMillionTokens < 0) {
          err(`${where}: [${id}/${tier.name}/${modelKey}] invalid estimatedMillionTokens: ${m.estimatedMillionTokens}`);
        }
        const limits = m.computedUsageLimits;
        if (!limits || !Number.isFinite(limits.monthlyTokens) || limits.monthlyTokens < 0) {
          err(`${where}: [${id}/${tier.name}/${modelKey}] invalid computed monthlyTokens: ${limits?.monthlyTokens}`);
        }
        if (!Number.isFinite(limits.normalized21kTurns) || limits.normalized21kTurns < 0) {
          err(`${where}: [${id}/${tier.name}/${modelKey}] invalid computed normalized21kTurns: ${limits?.normalized21kTurns}`);
        }
      }
    }
  }

  if (Array.isArray(usageLimits.entries)) {
    for (const entry of usageLimits.entries) {
      if (!plans.has(entry.providerId)) {
        err(`${where} [entries]: unknown providerId "${entry.providerId}"`);
      }
      if (!Number.isFinite(entry.monthlyTokens) || entry.monthlyTokens < 0) {
        err(`${where} [entries]: invalid monthlyTokens for ${entry.providerId}/${entry.tierName}/${entry.modelKey}`);
      }
      if (!Number.isFinite(entry.normalized21kTurns) || entry.normalized21kTurns < 0) {
        err(`${where} [entries]: invalid normalized21kTurns for ${entry.providerId}/${entry.tierName}/${entry.modelKey}`);
      }
    }
  }

  console.log(`Validated usage-limits.json: ${usageLimits.summary?.totalModelLimitEntries} entries across ${plans.size} providers.`);
}

async function main() {
  let files = [];
  try {
    files = (await fs.readdir(PLANS_DIR)).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort();
  } catch (e) {
    console.error(`Cannot read ${PLANS_DIR}: ${e.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('No plan files found.');
    process.exit(1);
  }

  const plans = new Map();
  for (const file of files) {
    const raw = await fs.readFile(path.join(PLANS_DIR, file), 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      err(`${file}: invalid JSON: ${e.message}`);
      continue;
    }
    validatePlan(parsed, file);
    plans.set(parsed.id, parsed);
  }

  // Cross-check the consolidated artifact the frontend consumes.
  let consolidated = null;
  try {
    consolidated = JSON.parse(await fs.readFile(PUBLIC_PLANS, 'utf-8'));
  } catch (e) {
    err(`public/data/plans.json: cannot read: ${e.message}`);
  }
  if (Array.isArray(consolidated)) {
    const consolidatedIds = new Set(consolidated.map(p => p.id));
    for (const id of plans.keys()) {
      if (!consolidatedIds.has(id)) err(`public/data/plans.json: missing plan "${id}" (stale build artifact?)`);
    }
    for (const p of consolidated) {
      if (!plans.has(p.id)) {
        err(`public/data/plans.json: contains unknown plan "${p.id}"`);
        continue;
      }
      const source = plans.get(p.id);
      if (JSON.stringify(source) !== JSON.stringify(p)) {
        err(`public/data/plans.json: "${p.id}" differs from data/coding-plans/${p.id}.json — run npm run build-data`);
      }
    }
  }

  // Cross-check public/data/usage-limits.json
  try {
    const rawUsage = await fs.readFile(PUBLIC_USAGE_LIMITS, 'utf-8');
    const parsedUsage = JSON.parse(rawUsage);
    validateUsageLimits(parsedUsage, plans);
  } catch (e) {
    err(`public/data/usage-limits.json: cannot read or parse: ${e.message}`);
  }

  // Model catalog regression checks: series cap + 365-day age window.
  try {
    const rawModels = await fs.readFile(PUBLIC_MODELS, 'utf-8');
    const models = JSON.parse(rawModels);
    await validateModels(models);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.warn('Warning: public/data/models.json missing; skipping model catalog checks.');
    } else if (e instanceof SyntaxError) {
      err(`public/data/models.json: invalid JSON: ${e.message}`);
    } else {
      err(`public/data/models.json: cannot read: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\nValidation FAILED with ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\nValidated ${plans.size} plan files against schema invariants. OK`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
