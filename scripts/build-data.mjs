import fs from 'fs/promises';
import path from 'path';
import {
  resolveSeries,
  applyTopPerSeries,
  isUnbenchmarked,
  isHubRouter,
  passesAgeWindow,
  ageCutoffUnix,
  KNOWN_SERIES,
} from './series-taxonomy.mjs';

const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public/data');
const PLANS_DIR = path.join(process.cwd(), 'data/coding-plans');

function normalizeStr(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function classifyModelTier(model) {
  const id = (model.id || '').toLowerCase();
  const name = (model.name || '').toLowerCase();
  const codingScore = model.benchmarks?.codingIndex || 0;
  const cost = model.blendedCost;

  if (
    codingScore >= 70 ||
    id.includes('astra') || name.includes('astra') ||
    id.includes('fable') || name.includes('fable') ||
    id.includes('opus') || name.includes('opus') ||
    id.includes('sonnet-5') || name.includes('sonnet 5') ||
    id.includes('gpt-6') || name.includes('gpt-6') ||
    id.includes('gpt-sol') || name.includes('gpt sol') ||
    id.includes('qwen3.8-max') || name.includes('qwen3.8 max')
  ) {
    return 'frontier';
  }

  if (
    codingScore >= 40 ||
    cost > 0.1 ||
    id.includes('flash') ||
    id.includes('mini') ||
    id.includes('luna') ||
    id.includes('terra') ||
    id.includes('haiku')
  ) {
    return 'balanced';
  }

  return 'economy';
}

async function buildData() {
  console.log('Building consolidated data...');

  // Shared estimation constants (single source of truth; see docs/TOKEN_ESTIMATE_VALIDATION.md).
  const estimateConstants = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data/estimate-constants.json'), 'utf-8')
  );
  const { inputTokens: agentIn, outputTokens: agentOut } = estimateConstants.agentRequest;
  const agentRequestTokens = agentIn + agentOut;
  const cacheRate = estimateConstants.defaultCacheRate;

  // 1. Load models
  let models = [];
  try {
    const modelsData = await fs.readFile(path.join(PUBLIC_DATA_DIR, 'models.json'), 'utf-8');
    models = JSON.parse(modelsData);
  } catch {
    console.log('No models.json found, skipping models processing.');
  }

  let benchmarks = [];
  try {
    const benchData = await fs.readFile(path.join(PUBLIC_DATA_DIR, 'benchmarks.json'), 'utf-8');
    benchmarks = JSON.parse(benchData);
  } catch {
    console.log('No benchmarks.json found, skipping benchmarks processing.');
  }

  // 2. Merge benchmarks into models with enhanced matching
  let matchedCount = 0;
  for (const model of models) {
    const modelIdClean = model.id.split('/').pop() || '';
    const mIdNorm = normalizeStr(modelIdClean);
    const mNameNorm = normalizeStr(model.name);

      const match = benchmarks.find(b => {
        const bSlugClean = b.slug || '';
        const bSlugNorm = normalizeStr(bSlugClean);
        const bNameNorm = normalizeStr(b.name);

        return bSlugNorm === mIdNorm || bNameNorm === mNameNorm;
      });

    if (match && match.evaluations) {
      matchedCount++;
      let applied = false;
      if (match.evaluations.codingIndex != null) {
        model.benchmarks.codingIndex = match.evaluations.codingIndex;
        applied = true;
      }
      if (match.evaluations.intelligenceIndex != null) {
        model.benchmarks.intelligenceIndex = match.evaluations.intelligenceIndex;
        applied = true;
      }
      if (match.evaluations.agenticIndex != null) {
        model.benchmarks.agenticIndex = match.evaluations.agenticIndex;
        applied = true;
      }
      if (applied) model.benchmarkSource = 'artificial-analysis';
    } else if (model.benchmarks?.codingIndex != null) {
      model.benchmarkSource = 'openrouter';
    }

    // Cache pricing: never fabricate a discount. Use the real cachedInput from
    // the upstream fetch; unknown cache prices are treated as no caching.
    const inputPrice = model.pricing?.input || 0;
    const outputPrice = model.pricing?.output || 0;
    const cachedInput = model.pricing?.cachedInput;

    // Standard Agent Request from the shared estimate constants (default
    // 20K input at 75% cache + 1K output). When no cache price is known,
    // charge full input price for cached tokens (conservative).
    const freshIn = agentIn * (1 - cacheRate);
    const cachedIn = agentIn * cacheRate;
    const cachePrice = cachedInput !== null && cachedInput !== undefined ? cachedInput : inputPrice;
    const agentReqCost = (freshIn * inputPrice / 1e6) + (cachedIn * cachePrice / 1e6) + (agentOut * outputPrice / 1e6);
    model.agentBlendedCost = parseFloat(((agentReqCost / agentRequestTokens) * 1e6).toFixed(4));

    // Assign tier
    model.tierClass = classifyModelTier(model);

    // Single weighted value score (50% coding, 30% agentic, 20% intelligence),
    // with a confidence penalty for missing dimensions. Requires a coding index.
    const coding = model.benchmarks.codingIndex;
    if (coding != null && model.blendedCost > 0) {
      let score = coding * 0.5;
      let weight = 0.5;
      let dims = 1;
      const agentic = model.benchmarks.agenticIndex;
      const intelligence = model.benchmarks.intelligenceIndex;
      if (agentic != null) { score += agentic * 0.3; weight += 0.3; dims++; }
      if (intelligence != null) { score += intelligence * 0.2; weight += 0.2; dims++; }
      const penalty = dims === 3 ? 1 : dims === 2 ? 0.9 : 0.75;
      const quality = (score / weight) * penalty;
      model.benchmarks.valueScore = parseFloat(((quality / model.blendedCost) * 100).toFixed(1));
    } else {
      model.benchmarks.valueScore = null;
    }
  }

  console.log(`Matched ${matchedCount} models with Artificial Analysis benchmarks.`);

  // Authoritative series re-derive + unbenchmarked flag + age/hub re-assertion.
  // models.json may be stale from an older run; re-enforce the invariants here.
  const cutoff = ageCutoffUnix();
  let staleDropped = 0;
  const preSlice = [];
  for (const model of models) {
    if (isHubRouter(model.id) || !passesAgeWindow(model.createdUnix, cutoff)) {
      staleDropped++;
      continue;
    }
    model.series = resolveSeries(model.id, model.provider, model.name);
    if (!KNOWN_SERIES.includes(model.series)) model.series = 'other';
    model.unbenchmarked = isUnbenchmarked(model);
    preSlice.push(model);
  }

  // Idempotent top-3-per-series safety pass (in case models.json is stale).
  const { kept, summary: familySummary } = applyTopPerSeries(preSlice, 3, m => m.series);
  for (const s of familySummary) {
    console.log(`  ${s.series.padEnd(10)} kept ${s.kept}/${s.total}${s.dropped > 0 ? ` (dropped ${s.dropped})` : ''}`);
  }
  console.log(`Post-merge slice kept ${kept.length} models${staleDropped > 0 ? `; stale/age violations dropped: ${staleDropped}` : ''}.`);

  // Rewrite the merged list so downstream consumers get the sliced catalog.
  models.length = 0;
  models.push(...kept);

  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'models.json'), JSON.stringify(models, null, 2));
  console.log('Updated models.json with benchmark data and tier classifications.');

  // 3. Load coding plans (safely skipping _schema.json)
  const plans = [];
  try {
    const files = (await fs.readdir(PLANS_DIR)).sort();
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        const p = path.join(PLANS_DIR, file);
        const data = await fs.readFile(p, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.id && Array.isArray(parsed.tiers)) {
          plans.push(parsed);
        }
      }
    }
  } catch (e) {
    console.log(`No coding plans found in ${PLANS_DIR} or directory doesn't exist.`, e);
  }

  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'plans.json'), JSON.stringify(plans, null, 2));
  console.log(`Wrote plans.json with ${plans.length} plans.`);

  // 4. Build usage-limits.json (per provider, per tier, per model breakdown)
  function resolveModelBudget(tier, modelKey) {
    const tb = tier.estimatedTokenBudget;
    const pmb = tier.perModelTokenBudgets ?? tb?.perModelTokenBudgets;
    const fallback = {
      tokens: tb?.estimatedMillionTokens ?? 0,
      midpoint: tb?.midpointEstimate ?? tb?.estimatedMillionTokens ?? 0,
      optimistic: tb?.optimisticEstimate ?? tb?.estimatedMillionTokens ?? 0,
      basis: tb?.estimateMeta?.basisModel || 'tier-baseline',
      confidence: tb?.estimateMeta?.confidence || 'medium',
      isModelSpecific: false,
    };
    if (!modelKey || !pmb || Object.keys(pmb).length === 0) return fallback;

    const normModel = modelKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const variants = ['flash', 'mini', 'nano', 'micro', 'lite', 'small'];
    const keys = Object.keys(pmb).sort((a, b) => b.length - a.length);

    const matchedKey = keys.find(k => {
      const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normKey.length < 2) return false;
      for (const v of variants) {
        const keyHasVariant = normKey.includes(v);
        const targetHasVariant = normModel.length >= 2 && normModel.includes(v);
        if (keyHasVariant !== targetHasVariant) return false;
      }
      return normModel.length >= 2 && (normModel.includes(normKey) || normKey.includes(normModel));
    });

    if (!matchedKey) return fallback;
    const entry = pmb[matchedKey];
    return {
      tokens: entry.estimatedMillionTokens,
      midpoint: entry.midpointEstimate ?? entry.estimatedMillionTokens,
      optimistic: entry.optimisticEstimate ?? entry.estimatedMillionTokens,
      basis: entry.basis ?? 'per-model',
      confidence: entry.confidence ?? fallback.confidence,
      isModelSpecific: true,
    };
  }

  const usageLimitEntries = [];
  const structuredProviders = [];
  let totalTiersCount = 0;

  for (const plan of plans) {
    const providerObj = {
      id: plan.id,
      name: plan.name,
      category: plan.category,
      url: plan.url,
      lastVerified: plan.lastVerified,
      stackingPolicy: plan.stackingPolicy ?? 'unknown',
      stackingPolicyNote: plan.stackingPolicyNote,
      tiers: [],
    };

    for (const tier of plan.tiers || []) {
      totalTiersCount++;
      const tb = tier.estimatedTokenBudget;
      const OBFUSCATED_IDE_PLANS = new Set([
        'claude-code', 'cursor', 'windsurf', 'google-antigravity', 'openai-codex', 'amazon-q'
      ]);
      const isObfuscated = OBFUSCATED_IDE_PLANS.has(plan.id);
      const isOfficial = tb?.estimateMeta?.sourceType === 'official';
      const isEstimatedCeiling = isObfuscated || !isOfficial;
      const disclosedByVendor = isOfficial && !isObfuscated;
      const osintSource = isEstimatedCeiling ? 'docs/OSINT_USAGE_STATISTICS.md' : null;

      const tierObj = {
        name: tier.name,
        monthlyPrice: tier.monthlyPrice ?? null,
        annualPrice: tier.annualPrice ?? null,
        limits: tier.limits || {},
        defaultTokenBudget: {
          estimatedMillionTokens: tb?.estimatedMillionTokens ?? 0,
          midpointEstimate: tb?.midpointEstimate ?? null,
          optimisticEstimate: tb?.optimisticEstimate ?? null,
          description: tb?.description ?? '',
          assumptions: tb?.assumptions ?? '',
          sourceType: tb?.estimateMeta?.sourceType ?? 'official',
          confidence: tb?.estimateMeta?.confidence ?? 'medium',
          sourceUrl: tb?.estimateMeta?.sourceUrl ?? plan.url,
          sourceQuote: tb?.estimateMeta?.sourceQuote ?? '',
          basisModel: tb?.estimateMeta?.basisModel ?? 'default',
          isEstimatedCeiling,
          disclosedByVendor,
          osintSource,
        },
        models: [],
      };

      for (const modelKey of tier.models || []) {
        const resolved = resolveModelBudget(tier, modelKey);
        const monthlyTokens = Math.round(resolved.tokens * 1e6);
        const normalized21kTurns = Math.round(monthlyTokens / agentRequestTokens);
        const agentTasks = {
          small250k: Math.floor(monthlyTokens / 250000),
          medium550k: Math.floor(monthlyTokens / 550000),
          large900k: Math.floor(monthlyTokens / 900000),
        };

        const modelEntry = {
          modelKey,
          estimatedMillionTokens: resolved.tokens,
          midpointEstimate: resolved.midpoint,
          optimisticEstimate: resolved.optimistic,
          confidence: resolved.confidence,
          basis: resolved.basis,
          isModelSpecific: resolved.isModelSpecific,
          isEstimatedCeiling,
          disclosedByVendor,
          osintSource,
          computedUsageLimits: {
            monthlyTokens,
            normalized21kTurns,
            agentTasks,
          },
        };
        tierObj.models.push(modelEntry);

        usageLimitEntries.push({
          providerId: plan.id,
          providerName: plan.name,
          category: plan.category,
          tierName: tier.name,
          monthlyPrice: tier.monthlyPrice ?? null,
          annualPrice: tier.annualPrice ?? null,
          modelKey,
          estimatedMillionTokens: resolved.tokens,
          midpointEstimate: resolved.midpoint,
          optimisticEstimate: resolved.optimistic,
          confidence: resolved.confidence,
          basis: resolved.basis,
          isModelSpecific: resolved.isModelSpecific,
          isEstimatedCeiling,
          disclosedByVendor,
          osintSource,
          monthlyTokens,
          normalized21kTurns,
          agentTasks,
          tierLimits: tier.limits || {},
          sourceUrl: tb?.estimateMeta?.sourceUrl || plan.url,
        });
      }

      providerObj.tiers.push(tierObj);
    }

    structuredProviders.push(providerObj);
  }

  const usageLimitsPayload = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    constants: {
      agentTurnTokens: agentRequestTokens,
      defaultCacheRate: cacheRate,
      agentTaskTokens: {
        small: 250000,
        medium: 550000,
        large: 900000,
      },
    },
    summary: {
      totalProviders: plans.length,
      totalTiers: totalTiersCount,
      totalModelLimitEntries: usageLimitEntries.length,
    },
    providers: structuredProviders,
    entries: usageLimitEntries,
  };

  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'usage-limits.json'), JSON.stringify(usageLimitsPayload, null, 2));
  console.log(`Wrote usage-limits.json with ${usageLimitEntries.length} model limit entries across ${plans.length} providers.`);

  // 5. Last updated
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'last-updated.json'), JSON.stringify({
    timestamp: new Date().toISOString()
  }, null, 2));
  console.log('Wrote last-updated.json');
}

buildData().catch(err => {
  console.error(err);
  process.exit(1);
});
