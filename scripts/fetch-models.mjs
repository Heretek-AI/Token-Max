import fs from 'fs/promises';
import path from 'path';
import {
  isHubRouter,
  ageCutoffUnix,
  passesAgeWindow,
  resolveSeries,
  applyTopPerSeries,
  isUnbenchmarked,
  KNOWN_SERIES,
} from './series-taxonomy.mjs';

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
  const cacheWriteShare = constants.cacheWriteShare ?? 0;
  const cacheWritePremium = constants.cacheWritePremium ?? 1.25;
  const agentRequestTokens = agentIn + agentOut;

  const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  const models = data.data || [];
  
  console.log(`Fetched ${models.length} raw models.`);

  const cutoff = ageCutoffUnix();
  console.log(`Age window: keeping models created >= ${new Date(cutoff * 1000).toISOString().slice(0, 10)} (last 365 days).`);

  const normalized = [];
  let droppedHubs = 0;
  let droppedOld = 0;

  for (const model of models) {
    const rawId = model.id;
    if (isHubRouter(rawId)) {
      droppedHubs++;
      continue;
    }

    // Age filter BEFORE ranking: legacy flagships must not consume top-3 slots.
    if (!passesAgeWindow(model.created, cutoff)) {
      droppedOld++;
      continue;
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

    const benchmarks = {
      intelligenceIndex: null,
      codingIndex: null,
      agenticIndex: null,
      valueScore: null
    };

    const aa = model.benchmarks?.artificial_analysis;
    if (aa) {
      benchmarks.intelligenceIndex = Number.isFinite(aa.intelligence_index) ? aa.intelligence_index : null;
      benchmarks.codingIndex = Number.isFinite(aa.coding_index) ? aa.coding_index : null;
      benchmarks.agenticIndex = Number.isFinite(aa.agentic_index) ? aa.agentic_index : null;
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
      // Documented per-provider fallback ratios from data/estimate-constants.json
      // (VULN-15: previously scattered literals). Unknown providers get no
      // fabricated discount — cached tokens bill at full input price.
      const fallbacks = constants.providerCacheReadFallback ?? {};
      const provLower = provider.toLowerCase();
      const idLower = id.toLowerCase();
      if (inputPrice > 0) {
        const fallbackKey = Object.keys(fallbacks).find(k => provLower.includes(k) || idLower.includes(k));
        if (fallbackKey) {
          cachedInput = inputPrice * fallbacks[fallbackKey];
        }
      }
    }

    // Agentic coding calculation: standard agent request (default 20K input at
    // 75% cache + 1K output) from the shared estimate constants.
    // When no cache price is known, charge full input price for cached tokens (conservative).
    // Amortized cache-write share (VULN-14): the fraction of cached context
    // rewritten each turn is billed at the provider's write rate instead of
    // being silently treated as a free read.
    const freshIn = agentIn * (1 - cacheRate);
    const cachedIn = agentIn * cacheRate;
    const cachePrice = cachedInput !== null ? cachedInput : inputPrice;
    const writePrice = cachedInputWrite !== null ? cachedInputWrite : inputPrice * cacheWritePremium;
    const agentReqCost = (freshIn * inputPrice / 1e6) +
      (cachedIn * (1 - cacheWriteShare) * cachePrice / 1e6) +
      (cachedIn * cacheWriteShare * writePrice / 1e6) +
      (agentOut * outputPrice / 1e6);
    const agentBlendedCost = (agentReqCost / agentRequestTokens) * 1e6;

    const createdUnix = Number.isFinite(model.created) ? model.created : null;
    const unbenchmarked = isUnbenchmarked({ benchmarks });

    normalized.push({
      id: model.id,
      name: model.name,
      provider: provider,
      series: resolveSeries(id, provider, model.name),
      releasedAt: createdUnix !== null ? new Date(createdUnix * 1000).toISOString().slice(0, 10) : null,
      createdUnix,
      unbenchmarked,
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

  // Top-3 per series: sort by intelligence -> coding -> agentic -> created ->
  // context and retain the cap per canonical family.
  const { kept, summary } = applyTopPerSeries(textModels, 3, m => m.series);
  const droppedSiblings = textModels.length - kept.length;
  const droppedAnywhere = kept.length === 0;

  console.log(`\nHub routers excluded: ${droppedHubs}, older-than-365d excluded: ${droppedOld}`);
  console.log(`Series slice summary (kept/dropped of sibling variants within past-365d):`);
  for (const s of summary) {
    console.log(`  ${s.series.padEnd(10)} kept ${s.kept}/${s.total}${s.dropped > 0 ? ` (dropped ${s.dropped})` : ''}`);
  }
  console.log(`Total kept: ${kept.length} of ${textModels.length} recent text models (dropped ${droppedSiblings} older/ranked-out siblings).`);

  if (droppedAnywhere || kept.length === 0) {
    throw new Error('Top-3-per-series slice produced an empty dataset. Refusing to overwrite output file.');
  }

  // Ensure every retained model has a resolvable canonical series.
  for (const m of kept) {
    if (!KNOWN_SERIES.includes(m.series)) {
      m.series = 'other';
    }
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(kept, null, 2));
  console.log(`Wrote ${kept.length} models to ${OUTPUT_FILE}`);
}

fetchModels().catch(err => {
  console.error(err);
  process.exit(1);
});
