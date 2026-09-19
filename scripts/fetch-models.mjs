import fs from 'fs/promises';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/models.json');

async function fetchModels() {
  console.log('Fetching models from OpenRouter...');
  const headers = {};
  if (process.env.OPENROUTER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  const models = data.data || [];
  
  console.log(`Fetched ${models.length} raw models.`);

  const normalized = [];

  for (const model of models) {
    // Filter non-text output models if needed, though most are text. 
    // OpenRouter doesn't have a strict output modality field but architecture usually has it.
    // We'll keep it simple: if architecture implies it's text.
    if (model.architecture && model.architecture.modality && !model.architecture.modality.includes('text')) {
      if (model.architecture.modality.includes('image')) { // keep text->text or image+text->text
         // actually modality often describes input->output, let's just proceed.
      }
    }

    const id = model.id;
    const isFree = id.endsWith(':free');
    const isBatch = id.endsWith(':nitro') || id.includes('batch'); // Approximate for batch

    // Prices are strings per 1 token, convert to number per 1M
    const pricing = model.pricing || {};
    const inputPrice = parseFloat(pricing.prompt || '0') * 1_000_000;
    const outputPrice = parseFloat(pricing.completion || '0') * 1_000_000;
    // blendedCost: (input*3 + output*1) / 4
    const blendedCost = (inputPrice * 3 + outputPrice * 1) / 4;
    
    // costPer1kRequests: assuming 2K input + 1K output
    // cost for 1 request = (2000 * prompt_price) + (1000 * completion_price)
    // 1k requests = 1000 * cost_for_1_request
    const costFor1Req = (2000 * (parseFloat(pricing.prompt || '0'))) + (1000 * (parseFloat(pricing.completion || '0')));
    const costPer1kRequests = costFor1Req * 1000;

    const provider = id.split('/')[0] || 'unknown';

    let benchmarks = {
      intelligenceIndex: null,
      codingIndex: null,
      agenticIndex: null,
      valueScore: null
    };

    if (model.benchmarks && model.benchmarks.artificial_analysis) {
      benchmarks.intelligenceIndex = model.benchmarks.artificial_analysis.intelligence_index || null;
      benchmarks.codingIndex = model.benchmarks.artificial_analysis.coding_index || null;
      benchmarks.agenticIndex = model.benchmarks.artificial_analysis.agentic_index || null;
      if (benchmarks.codingIndex && blendedCost > 0) {
        benchmarks.valueScore = (benchmarks.codingIndex / blendedCost) * 100;
      }
    }

    let cachedInput = null;
    const provLower = provider.toLowerCase();
    const idLower = id.toLowerCase();
    if (provLower.includes('anthropic') || idLower.includes('claude')) {
      cachedInput = inputPrice * 0.10; // 90% off
    } else if (provLower.includes('deepseek') || idLower.includes('deepseek')) {
      cachedInput = inputPrice * 0.10; // 90% off
    } else if (provLower.includes('z-ai') || idLower.includes('glm')) {
      cachedInput = inputPrice * 0.10; // 90% off
    } else if (provLower.includes('google') || idLower.includes('gemini')) {
      cachedInput = inputPrice * 0.25; // 75% off
    } else if (provLower.includes('openai') || idLower.includes('gpt') || idLower.includes('codex')) {
      cachedInput = inputPrice * 0.50; // 50% off
    }

    // Agentic coding calculation: 20k input context (75% cached) + 1k output completion = 21k context
    const freshIn = 20000 * 0.25;
    const cachedIn = 20000 * 0.75;
    const cachePrice = cachedInput !== null ? cachedInput : (inputPrice * 0.50);
    const agentReqCost = (freshIn * inputPrice / 1e6) + (cachedIn * cachePrice / 1e6) + (1000 * outputPrice / 1e6);
    const agentBlendedCost = (agentReqCost / 21000) * 1e6;

    normalized.push({
      id: model.id,
      name: model.name,
      provider: provider,
      modality: model.architecture?.modality || 'text->text',
      contextWindow: model.context_length || 0,
      maxOutput: model.top_provider?.max_completion_tokens || 0,
      pricing: {
        input: inputPrice,
        output: outputPrice,
        cachedInput: cachedInput ? parseFloat(cachedInput.toFixed(4)) : null,
        cachedInputWrite: null,
        reasoning: null,
        webSearch: null,
      },
      blendedCost,
      agentBlendedCost: parseFloat(agentBlendedCost.toFixed(4)),
      costPer1kRequests,
      benchmarks,
      reasoning: null,
      isFree,
      isBatch
    });
  }

  // Filter out non-text if we can identify them (modality usually starts with text or multi)
  const textModels = normalized.filter(m => !m.modality.startsWith('image->'));
  
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(textModels, null, 2));
  console.log(`Wrote ${textModels.length} models to ${OUTPUT_FILE}`);
}

fetchModels().catch(err => {
  console.error(err);
  process.exit(1);
});
