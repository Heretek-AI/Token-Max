import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public/data');
const PLANS_DIR = path.join(process.cwd(), 'data/coding-plans');

async function buildData() {
  console.log('Building consolidated data...');

  // 1. Load models and benchmarks
  let models = [];
  try {
    const modelsData = await fs.readFile(path.join(PUBLIC_DATA_DIR, 'models.json'), 'utf-8');
    models = JSON.parse(modelsData);
  } catch (e) {
    console.log('No models.json found, skipping models processing.');
  }

  let benchmarks = [];
  try {
    const benchData = await fs.readFile(path.join(PUBLIC_DATA_DIR, 'benchmarks.json'), 'utf-8');
    benchmarks = JSON.parse(benchData);
  } catch (e) {
    console.log('No benchmarks.json found, skipping benchmarks processing.');
  }

  // 2. Merge benchmarks into models
  for (const model of models) {
    // Try to match AA slug to OR id or name
    const match = benchmarks.find(b => 
      b.slug === model.id.split('/').pop() || 
      b.slug === model.id.replace(/\//g, '-') ||
      b.name.toLowerCase() === model.name.toLowerCase() ||
      model.id.toLowerCase().includes(b.slug)
    );

    if (match) {
      model.benchmarks.intelligenceIndex = model.benchmarks.intelligenceIndex ?? match.evaluations.intelligenceIndex;
      model.benchmarks.codingIndex = model.benchmarks.codingIndex ?? match.evaluations.codingIndex;
      model.benchmarks.agenticIndex = model.benchmarks.agenticIndex ?? match.evaluations.agenticIndex;
    }

    // Compute value score
    if (model.benchmarks.codingIndex != null && model.blendedCost > 0) {
      model.benchmarks.valueScore = (model.benchmarks.codingIndex / model.blendedCost) * 100;
    }
  }

  // Write updated models back if we made modifications
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'models.json'), JSON.stringify(models, null, 2));
  console.log('Updated models.json with benchmark data.');

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
         // Infinite tokens conceptually for free models, but let's put null or max
         millionsOfTokens = null;
      }

      if (model.costPer1kRequests > 0) {
        thousandRequests = budget / (model.costPer1kRequests / 1000); // Wait, costPer1kRequests is for 1000 requests. 
        // 1k requests = 1 unit. cost for 1 unit = costPer1kRequests
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

  // 4. Load coding plans
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
