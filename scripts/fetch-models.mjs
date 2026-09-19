import fs from 'fs/promises';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/models.json');

async function fetchModels() {
  console.log('Fetching models from OpenRouter...');
  const headers = {};
  if (process.env.OPENROUTER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  }

  // Shared estimation constants (single source of truth; see docs/TOKEN_ESTIMATE_VALIDATION.md).
  const constants = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data/estimate-constants.json'), 'utf-8')
  );
  const { inputTokens: agentIn, outputTokens: agentOut } = constants.agentRequest;
  const { inputTokens: chatIn, outputTokens: chatOut } = constants.chatRequest;
  const { inputWeight: blendIn, outputWeight: blendOut } = constants.chatBlend;
  const cacheRate = constants.defaultCacheRate;
  const agentRequestTokens = agentIn + agentOut;

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
    const pricing = model.pricing || {};
    const inputPrice = parseFloat(pricing.prompt || '0') * 1_000_000;
    const outputPrice = parseFloat(pricing.completion || '0') * 1_000_000;

    // Dynamic-priced routers report negative sentinel prices; they cannot be
    // compared on a per-token basis, so skip them entirely.
    if (inputPrice < 0 || outputPrice < 0) {
      continue;
    }

    const isFree = id.endsWith(':free') || (inputPrice === 0 && outputPrice === 0);
    const isBatch = id.includes(':batch');
    // blendedCost: legacy chatbot blend (default 3:1 input:output)
    const blendedCost = (inputPrice * blendIn + outputPrice * blendOut) / (blendIn + blendOut);
    
    // costPer1kRequests: legacy chat request (default 2K input + 1K output)
    const costFor1Req = (chatIn * (parseFloat(pricing.prompt || '0'))) + (chatOut * (parseFloat(pricing.completion || '0')));
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
    }

    let cachedInput = null;
    let cachedInputWrite = null;
    // Prefer the real cache prices published by the upstream provider. Only
    // fall back to documented provider ratios when the API omits them.
    const upstreamCacheRead = parseFloat(pricing.input_cache_read || '');
    const upstreamCacheWrite = parseFloat(pricing.input_cache_write || '');
    if (Number.isFinite(upstreamCacheRead) && upstreamCacheRead >= 0 && inputPrice > 0) {
      cachedInput = upstreamCacheRead * 1_000_000;
    }
    if (Number.isFinite(upstreamCacheWrite) && upstreamCacheWrite >= 0 && inputPrice > 0) {
      cachedInputWrite = upstreamCacheWrite * 1_000_000;
    }
    if (cachedInput === null) {
      const provLower = provider.toLowerCase();
      const idLower = id.toLowerCase();
      if (inputPrice > 0) {
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
      }
    }

    // Agentic coding calculation: standard agent request (default 20K input at
    // 75% cache + 1K output) from the shared estimate constants.
    // When no cache price is known, charge full input price for cached tokens (conservative).
    const freshIn = agentIn * (1 - cacheRate);
    const cachedIn = agentIn * cacheRate;
    const cachePrice = cachedInput !== null ? cachedInput : inputPrice;
    const agentReqCost = (freshIn * inputPrice / 1e6) + (cachedIn * cachePrice / 1e6) + (agentOut * outputPrice / 1e6);
    const agentBlendedCost = (agentReqCost / agentRequestTokens) * 1e6;

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
        cachedInput: cachedInput !== null ? parseFloat(cachedInput.toFixed(4)) : null,
        cachedInputWrite: cachedInputWrite !== null ? parseFloat(cachedInputWrite.toFixed(4)) : null,
        reasoning: null,
        webSearch: null,
      },
      blendedCost,
      agentBlendedCost: parseFloat(agentBlendedCost.toFixed(4)),
      costPer1kRequests,
      benchmarks,
      benchmarkSource: null,
      reasoning: null,
      isFree,
      isBatch
    });
  }

  // Filter out non-text if we can identify them (modality usually starts with text or multi)
  const textModels = normalized.filter(m => !m.modality.startsWith('image->'));

  if (textModels.length === 0) {
    throw new Error('No models normalized from OpenRouter. Refusing to overwrite output file with empty dataset.');
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(textModels, null, 2));
  console.log(`Wrote ${textModels.length} models to ${OUTPUT_FILE}`);
}

fetchModels().catch(err => {
  console.error(err);
  process.exit(1);
});
