import fs from 'fs/promises';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/benchmarks.json');

async function fetchBenchmarks() {
  console.log('Fetching benchmarks from Artificial Analysis...');
  const apiKey = process.env.AA_API_KEY;
  if (!apiKey) {
    console.warn('Warning: AA_API_KEY environment variable not set. API may reject the request.');
  }

  const headers = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  let allModels = [];
  let nextCursor = null;
  let hasMore = true;

  while (hasMore) {
    let url = 'https://artificialanalysis.ai/api/v2/language/models/free';
    if (nextCursor) {
      url += `?cursor=${nextCursor}`;
    }

    console.log(`Fetching ${url}`);
    const res = await fetch(url, { headers });
    if (!res.ok) {
       console.error(`Failed to fetch AA API: ${res.status} ${res.statusText}`);
       // If it fails (e.g. 401 without key), write empty array and exit gracefully
       break;
    }

    const data = await res.json();
    const items = data.data || [];
    
    for (const item of items) {
      allModels.push({
        slug: item.slug,
        name: item.name,
        releaseDate: item.release_date,
        evaluations: {
          intelligenceIndex: item.evaluations?.artificial_analysis_intelligence_index ?? null,
          codingIndex: item.evaluations?.coding_index ?? null,
          agenticIndex: item.evaluations?.agentic_index ?? null,
        },
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

    hasMore = data.has_more || false;
    nextCursor = data.next_cursor || null;
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allModels, null, 2));
  console.log(`Wrote ${allModels.length} benchmarks to ${OUTPUT_FILE}`);
}

fetchBenchmarks().catch(err => {
  console.error(err);
  process.exit(1);
});
