import fs from 'fs/promises';
import path from 'path';

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
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'models.json'), JSON.stringify(models, null, 2));
  console.log('Updated models.json with benchmark data and tier classifications.');

  // 3. Load coding plans (safely skipping _schema.json)
  const plans = [];
  try {
    const files = await fs.readdir(PLANS_DIR);
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
