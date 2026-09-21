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
const TOKENPLANS_JSON_URL = 'https://api.tokenplans.dev/plans.json';
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

async function auditTokenPlans(localPlans) {
  console.log('\n--- Auditing tokenplans.dev Verified Pricing Ledger ---');
  try {
    const res = await fetchWithTimeout(TOKENPLANS_JSON_URL);
    if (!res.ok) {
      console.warn(`[WARN] tokenplans.dev returned HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`Successfully fetched tokenplans.dev ledger: ${data.total ?? data.data?.length ?? 0} total plans tracked.`);
    console.log(`Ledger metadata: last_modified=${data.last_modified}, projection=${data.projection}`);

    const externalPlans = data.data || [];
    let matchedCount = 0;
    const trackedExternalIds = new Set();

    for (const ep of externalPlans) {
      trackedExternalIds.add(ep.providerId || ep.id);
      // Check for match against local plans
      const localMatch = localPlans.find((lp) => {
        const cleanLpId = (lp.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanEpId = (ep.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanEpProvider = (ep.providerId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanLpId === cleanEpProvider || cleanLpId.includes(cleanEpProvider) || cleanEpId.includes(cleanLpId);
      });

      if (localMatch) {
        matchedCount++;
        const modelPreview = (ep.models || []).slice(0, 3).join(', ');
        console.log(`  • [MATCH] ${ep.providerId || ep.id} (${ep.name}) -> Token-Max: ${localMatch.name}`);
        console.log(`    ↳ Flagship models: ${modelPreview || 'None listed'} (lastChecked: ${ep.lastChecked || 'N/A'})`);
      }
    }

    console.log(`Cross-referenced ${matchedCount} plans from tokenplans.dev against Token-Max's curated catalog.`);

    // Find any providers tracked in tokenplans.dev that Token-Max doesn't have yet
    const missingProviders = [...trackedExternalIds].filter(
      (extId) => !localPlans.some((lp) => lp.id.toLowerCase().includes(extId) || extId.includes(lp.id.toLowerCase()))
    );
    if (missingProviders.length > 0) {
      console.log(`Untracked providers in tokenplans.dev: ${missingProviders.slice(0, 8).join(', ')}${missingProviders.length > 8 ? '...' : ''}`);
    }
  } catch (err) {
    console.warn(`[SKIP] Could not audit tokenplans.dev (${err.message}). Continuing...`);
  }
}

async function main() {
  console.log('=== Token-Max External Sources Auditor ===');
  const modelsPath = path.join(process.cwd(), 'public/data/models.json');
  const plansPath = path.join(process.cwd(), 'public/data/plans.json');
  
  let localModels = [];
  let localPlans = [];
  
  try {
    const rawModels = await fs.readFile(modelsPath, 'utf-8');
    localModels = JSON.parse(rawModels);
  } catch {
    console.warn('Local models.json not found, proceeding with empty catalog.');
  }

  try {
    const rawPlans = await fs.readFile(plansPath, 'utf-8');
    localPlans = JSON.parse(rawPlans);
  } catch {
    console.warn('Local plans.json not found, proceeding with empty catalog.');
  }

  await auditLLMPrice(localModels);
  await auditDevForth();
  await auditTokenPlans(localPlans);
  console.log('\nAudit pass completed.\n');
}

main().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(0); // Exit cleanly so CI isn't broken by external outages
});
