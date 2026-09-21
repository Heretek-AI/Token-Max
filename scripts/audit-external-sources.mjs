#!/usr/bin/env node
/**
 * scripts/audit-external-sources.mjs
 *
 * Automated verification script that fetches external public feeds:
 * 1. llmprice.com/assets/pricing-data.json (Direct model prices, cache rates, long-context rules)
 * 2. devforth.io/agents-for-code.md (Observed agent limit windows and task values)
 *
 * Cross-checks external pricing and empirical limits against Token-Max's local datasets.
 * Runs non-destructively and gracefully handles offline/rate-limited environments.
 */

import fs from 'fs/promises';
import path from 'path';

const LLMPRICE_JSON_URL = 'https://llmprice.com/assets/pricing-data.json';
const DEVFORTH_AGENTS_URL = 'https://devforth.io/agents-for-code.md';
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Token-Max-Auditor/1.0 (+https://github.com/Heretek-AI/Token-Max)',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function auditLLMPrice(localModels) {
  console.log('\n--- Auditing llmprice.com Daily Feed ---');
  try {
    const res = await fetchWithTimeout(LLMPRICE_JSON_URL);
    if (!res.ok) {
      console.warn(`[WARN] llmprice.com returned HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`Successfully fetched llmprice.com catalog: ${data.models?.length ?? 0} total listings.`);
    console.log(`Feed metadata: verified=${data.verified}, captured_at=${data.captured_at}`);

    // Direct first-party listings
    const directModels = (data.models || []).filter((m) => m.endpoint_kind === 'direct');
    console.log(`Identified ${directModels.length} direct provider listings in llmprice feed:`);

    let matchCount = 0;
    for (const dm of directModels) {
      // Find matching model in local models.json
      const localMatch = localModels.find((m) => {
        const cleanLocalId = (m.id || '').toLowerCase();
        const cleanDmSlug = (dm.slug || '').toLowerCase();
        const cleanDmId = (dm.id || '').toLowerCase();
        return (
          cleanLocalId.includes(cleanDmSlug) ||
          cleanLocalId.includes(cleanDmId) ||
          m.name.toLowerCase() === dm.name.toLowerCase()
        );
      });

      if (localMatch) {
        matchCount++;
        const localInput = localMatch.pricing?.prompt ? localMatch.pricing.prompt * 1e6 : null;
        const localOutput = localMatch.pricing?.completion ? localMatch.pricing.completion * 1e6 : null;
        const diffIn = localInput != null ? Math.abs(localInput - dm.input) : null;
        const diffOut = localOutput != null ? Math.abs(localOutput - dm.output) : null;

        const flag = (diffIn != null && diffIn > 0.05) || (diffOut != null && diffOut > 0.05) ? ' [RATE DELTA]' : ' [MATCH]';
        console.log(
          `  • ${dm.provider} - ${dm.name} (${dm.id}): in=$${dm.input}/M, out=$${dm.output}/M, cached=$${dm.cached}/M${flag}`
        );
        if (dm.long_threshold) {
          console.log(
            `    ↳ Long context: >${dm.long_threshold.toLocaleString()} tokens → in=$${dm.long_input}/M, out=$${dm.long_output}/M`
          );
        }
      }
    }
    console.log(`Cross-referenced ${matchCount} direct models against local catalog.`);
  } catch (err) {
    console.warn(`[SKIP] Could not audit llmprice.com (${err.message}). Continuing...`);
  }
}

async function auditDevForth() {
  console.log('\n--- Auditing devforth.io Observed Plan Limits ---');
  try {
    const res = await fetchWithTimeout(DEVFORTH_AGENTS_URL);
    if (!res.ok) {
      console.warn(`[WARN] devforth.io returned HTTP ${res.status}`);
      return;
    }
    const text = await res.text();
    console.log(`Successfully fetched devforth.io agents markdown (${text.length} bytes).`);

    const planSections = text.split(/^### /gm).slice(1);
    console.log(`Parsed ${planSections.length} plan sections from devforth.io.`);

    for (const section of planSections) {
      const lines = section.split('\n');
      const title = lines[0]?.trim();
      const priceLine = lines.find((l) => l.startsWith('- Price per month:'));
      const windowsLine = lines.find((l) => l.startsWith('- Observed limit windows:'));
      const valueLine = lines.find((l) => l.startsWith('- Estimated included API-equivalent value:'));

      if (windowsLine && !windowsLine.includes('No measured windows')) {
        console.log(`  • ${title}`);
        if (priceLine) console.log(`    ${priceLine.trim()}`);
        if (valueLine) console.log(`    ${valueLine.trim()}`);
        console.log(`    ${windowsLine.trim()}`);
      }
    }
  } catch (err) {
    console.warn(`[SKIP] Could not audit devforth.io (${err.message}). Continuing...`);
  }
}

async function main() {
  console.log('=== Token-Max External Sources Auditor ===');
  const modelsPath = path.join(process.cwd(), 'public/data/models.json');
  let localModels = [];
  try {
    const raw = await fs.readFile(modelsPath, 'utf-8');
    localModels = JSON.parse(raw);
  } catch {
    console.warn('Local models.json not found, proceeding with empty catalog.');
  }

  await auditLLMPrice(localModels);
  await auditDevForth();
  console.log('\nAudit pass completed.\n');
}

main().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(0); // Exit cleanly so CI isn't broken by external outages
});
