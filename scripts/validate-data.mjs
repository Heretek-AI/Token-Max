import fs from 'fs/promises';
import path from 'path';

const PLANS_DIR = path.join(process.cwd(), 'data/coding-plans');
const PUBLIC_PLANS = path.join(process.cwd(), 'public/data/plans.json');

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
  if (plan.stackingPolicy !== undefined && !STACKING_POLICIES.has(plan.stackingPolicy)) {
    err(`${where}: stackingPolicy "${plan.stackingPolicy}" must be one of ${[...STACKING_POLICIES].join(', ')}`);
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
  }
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
