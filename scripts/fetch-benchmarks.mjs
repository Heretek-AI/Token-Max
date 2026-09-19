import fs from 'fs/promises';
import path from 'path';
import {
  ageCutoffUnix,
  resolveSeries,
  applyTopPerSeries,
  isUnbenchmarked,
} from './series-taxonomy.mjs';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/benchmarks.json');

async function fetchBenchmarks() {
  console.log('Fetching benchmarks from Artificial Analysis...');
  const apiKey = process.env.AA_API_KEY;
  if (!apiKey) {
    console.error('AA_API_KEY env var is required. Set it from the Artificial Analysis dashboard (kept as a GitHub repo secret).');
    process.exit(1);
  }

  const headers = { 'x-api-key': apiKey };

  let allModels = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `https://artificialanalysis.ai/api/v2/language/models/free?page=${page}`;
    console.log(`Fetching ${url} (page ${page}/${totalPages})...`);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch AA API page ${page}: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    totalPages = data.pagination?.total_pages || 1;
    const items = data.data || [];

    const cutoff = ageCutoffUnix();
    console.log(`Age window: keeping benchmarks released >= ${new Date(cutoff * 1000).toISOString().slice(0, 10)} (last 365 days).`);

    for (const item of items) {
      const releaseUnix =
        item.release_date && !Number.isNaN(Date.parse(item.release_date))
          ? Math.floor(Date.parse(item.release_date) / 1000)
          : null;
      if (releaseUnix !== null && releaseUnix < cutoff) continue;

      const evaluations = {
        intelligenceIndex: item.evaluations?.artificial_analysis_intelligence_index ?? null,
        codingIndex: item.evaluations?.artificial_analysis_coding_index ?? null,
        agenticIndex: item.evaluations?.artificial_analysis_agentic_index ?? null,
      };

      allModels.push({
        id: item.id,
        slug: item.slug,
        name: item.name,
        series: resolveSeries(item.slug || item.id || '', item.model_creator?.name || '', item.name),
        releasedAt: item.release_date || null,
        createdUnix: releaseUnix,
        unbenchmarked: isUnbenchmarked({ benchmarks: evaluations }),
        creator: item.model_creator?.name || 'Unknown',
        evaluations,
        pricing: {
          input: item.pricing?.price_1m_input_tokens ?? null,
          output: item.pricing?.price_1m_output_tokens ?? null,
          cacheHit: item.pricing?.price_1m_cache_hit_tokens ?? null,
        },
        performance: {
          tokensPerSecond: item.performance?.median_output_tokens_per_second ?? null,
          ttft: item.performance?.median_time_to_first_token_seconds ?? null,
          e2e: item.performance?.median_end_to_end_response_time_seconds ?? null,
        },
        costs: {
          totalCost: item.artificial_analysis_intelligence_index_cost?.total_cost ?? null,
          costPerTask: item.artificial_analysis_intelligence_index_cost?.cost_per_task?.total_cost ?? null,
        }
      });
    }

    page++;
  }

  if (allModels.length === 0) {
    throw new Error('No benchmarks collected from Artificial Analysis. Refusing to overwrite output file with empty dataset.');
  }

  // Top-3 per series so the standalone benchmark artifact cannot reintroduce
  // legacy flagships during the merge step in build-data.mjs.
  const { kept, summary } = applyTopPerSeries(allModels, 3, m => m.series);
  for (const s of summary) {
    console.log(`  ${s.series.padEnd(10)} kept ${s.kept}/${s.total}${s.dropped > 0 ? ` (dropped ${s.dropped})` : ''}`);
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(kept, null, 2));
  console.log(`Wrote ${kept.length} benchmarks to ${OUTPUT_FILE}`);
}

fetchBenchmarks().catch(err => {
  console.error(err);
  process.exit(1);
});
