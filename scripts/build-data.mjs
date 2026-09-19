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
      if (match.evaluations.codingIndex != null) {
        model.benchmarks.codingIndex = match.evaluations.codingIndex;
      }
      if (match.evaluations.intelligenceIndex != null) {
        model.benchmarks.intelligenceIndex = match.evaluations.intelligenceIndex;
      }
      if (match.evaluations.agenticIndex != null) {
        model.benchmarks.agenticIndex = match.evaluations.agenticIndex;
      }
    }

    // Cache rate calculation heuristics
    const inputPrice = model.pricing?.input || 0;
    const outputPrice = model.pricing?.output || 0;
    const provLower = (model.provider || '').toLowerCase();
    const idLower = (model.id || '').toLowerCase();

    let cachedInput = model.pricing?.cachedInput;
    if (cachedInput === null || cachedInput === undefined) {
      if (provLower.includes('anthropic') || idLower.includes('claude')) {
        cachedInput = inputPrice * 0.10;
      } else if (provLower.includes('deepseek') || idLower.includes('deepseek')) {
        cachedInput = inputPrice * 0.10;
      } else if (provLower.includes('z-ai') || idLower.includes('glm')) {
        cachedInput = inputPrice * 0.10;
      } else if (provLower.includes('google') || idLower.includes('gemini')) {
        cachedInput = inputPrice * 0.25;
      } else if (provLower.includes('openai') || idLower.includes('gpt') || idLower.includes('codex')) {
        cachedInput = inputPrice * 0.50;
      }
      if (model.pricing && cachedInput !== null && cachedInput !== undefined) {
        model.pricing.cachedInput = parseFloat(cachedInput.toFixed(4));
      }
    }

    // Standard Agent Request: 20k input (75% cached) + 1k output = 21k context
    const freshIn = 20000 * 0.25;
    const cachedIn = 20000 * 0.75;
    const cachePrice = cachedInput !== null && cachedInput !== undefined ? cachedInput : (inputPrice * 0.50);
    const agentReqCost = (freshIn * inputPrice / 1e6) + (cachedIn * cachePrice / 1e6) + (1000 * outputPrice / 1e6);
    model.agentBlendedCost = parseFloat(((agentReqCost / 21000) * 1e6).toFixed(4));

    // Assign tier
    model.tierClass = classifyModelTier(model);

    // Compute value score: (Coding Index / Blended Cost) * 10
    if (model.benchmarks.codingIndex != null && model.blendedCost > 0) {
      model.benchmarks.valueScore = parseFloat(((model.benchmarks.codingIndex / model.blendedCost) * 10).toFixed(1));
    } else {
      model.benchmarks.valueScore = null;
    }
  }

  console.log(`Matched ${matchedCount} models with Artificial Analysis benchmarks.`);
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'models.json'), JSON.stringify(models, null, 2));
  console.log('Updated models.json with benchmark data and tier classifications.');

  // 3. Compute Budgets
  const budgets = [5, 10, 20, 50, 100, 200];
  const budgetPrecomputed = {};

  for (const model of models) {
    budgetPrecomputed[model.id] = {};
    for (const budget of budgets) {
      let millionsOfTokens = 0;
      let thousandRequests = 0;

      if (model.blendedCost > 0) {
        millionsOfTokens = budget / model.blendedCost;
      } else if (model.blendedCost === 0 && model.isFree) {
        millionsOfTokens = null;
      }

      if (model.costPer1kRequests > 0) {
        thousandRequests = budget / model.costPer1kRequests;
      } else if (model.costPer1kRequests === 0 && model.isFree) {
        thousandRequests = null;
      }

      budgetPrecomputed[model.id][`budget_${budget}`] = {
        millionsOfTokens,
        thousandRequests
      };
    }
  }

  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'budget-precomputed.json'), JSON.stringify(budgetPrecomputed, null, 2));
  console.log('Wrote budget-precomputed.json');

  // 4. Load coding plans (safely skipping _schema.json)
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
