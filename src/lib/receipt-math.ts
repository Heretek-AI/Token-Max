import type { NormalizedModel } from './types';
import type { ParsedAgentSession } from './log-parser';
import { getEffectiveCacheMultiplier } from './pricing';

export interface ReceiptLineItem {
  label: string;
  quantityDescription: string;
  unitRateDescription: string;
  subtotalCost: number;
}

export interface ModelRepricingItem {
  modelId: string;
  modelName: string;
  provider: string;
  sessionCost: number;
  savingsVsBaseline: number; // baselineCost - sessionCost
  savingsPercentVsBaseline: number; // positive = cheaper, negative = more expensive
  isBaseline: boolean;
}

export interface SubscriptionImpactItem {
  planId: string;
  planName: string;
  tierName: string;
  monthlyPrice: number;
  metricLabel: string;
  quotaConsumedDescription: string;
  quotaConsumedPercentage: number;
  equivalentValueAbsorbed: number; // How much API cost the plan absorbed for this session
}

export interface SessionReceiptReport {
  session: ParsedAgentSession;
  baselineModelName: string;
  baselineTotalCost: number;
  lineItems: ReceiptLineItem[];
  modelRepricings: ModelRepricingItem[];
  subscriptionImpacts: SubscriptionImpactItem[];
  headlineSummary: string;
}

/**
 * Calculates itemized receipt and cross-model repricing for a parsed agent session.
 */
export function calculateSessionReceipt(
  session: ParsedAgentSession,
  models: NormalizedModel[]
): SessionReceiptReport {
  // Find or fallback to baseline model
  const baselineModel = models.find((m) => m.id === session.detectedModel) ||
    models.find((m) => m.id.includes('sonnet')) ||
    models[0];

  const inPrice = baselineModel?.pricing.input ?? 3.0;
  const outPrice = baselineModel?.pricing.output ?? 15.0;
  const cacheMult = baselineModel ? getEffectiveCacheMultiplier(baselineModel) : 0.1;

  const freshInputTokens = Math.max(0, session.totalInputTokens - session.totalCachedTokens);
  const cachedInputTokens = session.totalCachedTokens;
  const outputTokens = session.totalOutputTokens;

  // Costs in dollars
  const freshInputCost = (freshInputTokens * inPrice) / 1e6;
  const cachedInputCost = (cachedInputTokens * inPrice * cacheMult) / 1e6;
  const outputCost = (outputTokens * outPrice) / 1e6;
  const baselineTotalCost = freshInputCost + cachedInputCost + outputCost;

  // Itemized lines
  const lineItems: ReceiptLineItem[] = [
    {
      label: 'Fresh Context Input (Uncached)',
      quantityDescription: `${freshInputTokens.toLocaleString()} tokens`,
      unitRateDescription: `$${inPrice.toFixed(2)} / M`,
      subtotalCost: Number(freshInputCost.toFixed(4)),
    },
    {
      label: `Cached Context Reads (${Math.round(session.effectiveCacheHitRate * 100)}% Hit Rate)`,
      quantityDescription: `${cachedInputTokens.toLocaleString()} tokens`,
      unitRateDescription: `$${(inPrice * cacheMult).toFixed(2)} / M (${Math.round((1 - cacheMult) * 100)}% off)`,
      subtotalCost: Number(cachedInputCost.toFixed(4)),
    },
    {
      label: 'Visible Code Diffs & Responses',
      quantityDescription: `${outputTokens.toLocaleString()} tokens`,
      unitRateDescription: `$${outPrice.toFixed(2)} / M`,
      subtotalCost: Number(outputCost.toFixed(4)),
    },
  ];

  // Benchmark target models for repricing
  const targetModelIds = [
    'deepseek/deepseek-v4.1-flash',
    'deepseek/deepseek-r1',
    'google/gemini-2.0-flash-001',
    'z-ai/glm-5.3-flash',
    'openai/o3-mini',
    'anthropic/claude-sonnet-5',
    'anthropic/claude-opus-5',
  ];

  const modelMap = new Map<string, NormalizedModel>();
  for (const m of models) {
    modelMap.set(m.id, m);
  }

  const modelRepricings: ModelRepricingItem[] = [];

  for (const targetId of targetModelIds) {
    const targetModel = modelMap.get(targetId);
    if (!targetModel) continue;

    const tInPrice = targetModel.pricing.input || targetModel.blendedCost * 0.75;
    const tOutPrice = targetModel.pricing.output || targetModel.blendedCost * 1.75;
    const tCacheMult = getEffectiveCacheMultiplier(targetModel);

    const tFreshCost = (freshInputTokens * tInPrice) / 1e6;
    const tCachedCost = (cachedInputTokens * tInPrice * tCacheMult) / 1e6;
    const tOutputCost = (outputTokens * tOutPrice) / 1e6;
    const totalTargetCost = tFreshCost + tCachedCost + tOutputCost;

    const savings = baselineTotalCost - totalTargetCost;
    const savingsPercent = baselineTotalCost > 0
      ? Math.round((savings / baselineTotalCost) * 100)
      : 0;

    modelRepricings.push({
      modelId: targetModel.id,
      modelName: targetModel.name,
      provider: targetModel.provider,
      sessionCost: Number(totalTargetCost.toFixed(3)),
      savingsVsBaseline: Number(savings.toFixed(3)),
      savingsPercentVsBaseline: savingsPercent,
      isBaseline: targetModel.id === baselineModel?.id,
    });
  }

  // Sort: cheapest first
  modelRepricings.sort((a, b) => a.sessionCost - b.sessionCost);

  // Subscription plan impact
  const subscriptionImpacts: SubscriptionImpactItem[] = [
    {
      planId: 'cursor-pro',
      planName: 'Cursor',
      tierName: 'Pro ($20/mo)',
      monthlyPrice: 20,
      metricLabel: 'Monthly Fast Requests',
      quotaConsumedDescription: `${session.totalTurns} of 500 fast requests consumed`,
      quotaConsumedPercentage: Math.min(100, Number(((session.totalTurns / 500) * 100).toFixed(1))),
      equivalentValueAbsorbed: Number(baselineTotalCost.toFixed(2)),
    },
    {
      planId: 'claude-code-pro',
      planName: 'Claude Code',
      tierName: 'Pro ($20/mo)',
      monthlyPrice: 20,
      metricLabel: '5-Hour Rolling Pool',
      quotaConsumedDescription: `${session.totalTurns} of ~60 session turns consumed`,
      quotaConsumedPercentage: Math.min(100, Number(((session.totalTurns / 60) * 100).toFixed(1))),
      equivalentValueAbsorbed: Number(baselineTotalCost.toFixed(2)),
    },
    {
      planId: 'google-ai-pro',
      planName: 'Google Antigravity',
      tierName: 'Google AI Pro ($19.99/mo)',
      monthlyPrice: 19.99,
      metricLabel: '5-Hour Refresh Window',
      quotaConsumedDescription: `${session.totalTurns} of ~90 window turns consumed`,
      quotaConsumedPercentage: Math.min(100, Number(((session.totalTurns / 90) * 100).toFixed(1))),
      equivalentValueAbsorbed: Number(baselineTotalCost.toFixed(2)),
    },
  ];

  const cheapest = modelRepricings[0];
  const headlineSummary = cheapest && cheapest.sessionCost < baselineTotalCost
    ? `This session cost $${baselineTotalCost.toFixed(2)} on ${baselineModel?.name || 'Sonnet 5'}. It would have cost $${cheapest.sessionCost.toFixed(2)} on ${cheapest.modelName} (${cheapest.savingsPercentVsBaseline}% cheaper).`
    : `This session executed ${session.totalTurns} turns across ${(session.totalTokens / 1e6).toFixed(2)}M tokens at a ${Math.round(session.effectiveCacheHitRate * 100)}% prompt cache hit rate.`;

  return {
    session,
    baselineModelName: baselineModel?.name || 'Claude Sonnet 5',
    baselineTotalCost: Number(baselineTotalCost.toFixed(3)),
    lineItems,
    modelRepricings,
    subscriptionImpacts,
    headlineSummary,
  };
}
