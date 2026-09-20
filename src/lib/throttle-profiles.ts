export type ThrottleExhaustionBehavior = 'hard-block' | 'slow-queue' | 'payg-overage';
export type ThrottleStatus = 'smooth' | 'queued' | 'blocked';

export interface ThrottleProfile {
  id: string;
  name: string;
  category: 'coding-ide' | 'coding-router' | 'api-provider';
  tierName: string;
  monthlyPrice: number | null;
  /** Max concurrent requests/connections supported without blocking or queuing */
  maxConcurrency: number;
  /** Rolling window length in hours (e.g. 5 for Claude Code / Antigravity), or null if strictly monthly */
  rollingWindowHours: number | null;
  /** Max requests or turns allowed within the rolling window before throttling */
  rollingWindowTurns: number | null;
  /** Priority/Fast requests included per monthly billing cycle (e.g. Cursor 500) */
  monthlyFastRequests: number | null;
  /** Behavior when quota or rolling window is exhausted */
  exhaustionBehavior: ThrottleExhaustionBehavior;
  /** Average latency penalty incurred when operating in slow queue (in seconds) */
  slowQueueDelaySec: number;
  /** Official or OSINT quote/evidence explaining this throttle structure */
  evidenceQuote: string;
  url: string;
}

export const THROTTLE_PROFILES: ThrottleProfile[] = [
  {
    id: 'cursor-pro',
    name: 'Cursor',
    category: 'coding-ide',
    tierName: 'Pro',
    monthlyPrice: 20,
    maxConcurrency: 1, // Composer runs 1 active agent task concurrently by default
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: 500,
    exhaustionBehavior: 'slow-queue',
    slowQueueDelaySec: 30, // Slow pool typically introduces 20-60s queue wait during peak hours
    evidenceQuote: 'Cursor Models pool + Other Models pool (third-party at API rates). Priority queue allocation with slow queue fallback on proprietary models.',
    url: 'https://cursor.com/docs/account/pricing',
  },
  {
    id: 'cursor-ultra',
    name: 'Cursor',
    category: 'coding-ide',
    tierName: 'Ultra',
    monthlyPrice: 400,
    maxConcurrency: 3,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: 10000, // 20x Pro pool
    exhaustionBehavior: 'slow-queue',
    slowQueueDelaySec: 10,
    evidenceQuote: '20x Pro pool with priority queue allocation across Cursor Models and expanded third-party API allowance.',
    url: 'https://cursor.com/docs/account/pricing',
  },
  {
    id: 'claude-code-pro',
    name: 'Claude Code',
    category: 'coding-ide',
    tierName: 'Pro',
    monthlyPrice: 20,
    maxConcurrency: 2,
    rollingWindowHours: 5,
    rollingWindowTurns: 60, // Estimated ~50-60 agent turns per 5-hour rolling pool on Sonnet
    monthlyFastRequests: null,
    exhaustionBehavior: 'hard-block',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Shared 5-hour rolling session limit. Once exhausted, sessions are paused until the rolling window refreshes.',
    url: 'https://claude.com/pricing',
  },
  {
    id: 'claude-code-max5x',
    name: 'Claude Code',
    category: 'coding-ide',
    tierName: 'Max5x',
    monthlyPrice: 100,
    maxConcurrency: 5,
    rollingWindowHours: 5,
    rollingWindowTurns: 300, // 5x the Pro tier rolling pool
    monthlyFastRequests: null,
    exhaustionBehavior: 'hard-block',
    slowQueueDelaySec: 0,
    evidenceQuote: '5x Pro usage per 5-hour rolling session, with higher output priority at peak times.',
    url: 'https://claude.com/pricing',
  },
  {
    id: 'google-antigravity-indiv',
    name: 'Google Antigravity',
    category: 'coding-ide',
    tierName: 'Individual',
    monthlyPrice: 0,
    maxConcurrency: 1,
    rollingWindowHours: 168, // Weekly refresh (~25 tasks/month)
    rollingWindowTurns: 15,
    monthlyFastRequests: 60,
    exhaustionBehavior: 'hard-block',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Baseline weekly-refreshed quota (~25 agent tasks/mo). No credit overage available.',
    url: 'https://antigravity.google/pricing',
  },
  {
    id: 'google-ai-pro',
    name: 'Google Antigravity',
    category: 'coding-ide',
    tierName: 'Google AI Pro',
    monthlyPrice: 19.99,
    maxConcurrency: 3,
    rollingWindowHours: 5,
    rollingWindowTurns: 90,
    monthlyFastRequests: null,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'High quota refreshed every 5 hours until weekly cap reached; opt-in AI credit overage.',
    url: 'https://antigravity.google/pricing',
  },
  {
    id: 'github-copilot-pro',
    name: 'GitHub Copilot',
    category: 'coding-ide',
    tierName: 'Individual',
    monthlyPrice: 10,
    maxConcurrency: 1,
    rollingWindowHours: 1,
    rollingWindowTurns: 30, // Strict RPM and turn throttles for non-standard models
    monthlyFastRequests: 300,
    exhaustionBehavior: 'slow-queue',
    slowQueueDelaySec: 25,
    evidenceQuote: 'Rate limits apply to high-volume interactions; premium models subject to monthly and per-hour allocations.',
    url: 'https://github.com/features/copilot',
  },
  {
    id: 'windsurf-pro',
    name: 'Windsurf',
    category: 'coding-ide',
    tierName: 'Pro',
    monthlyPrice: 15,
    maxConcurrency: 2,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: 500, // 500 premium credits/mo
    exhaustionBehavior: 'slow-queue',
    slowQueueDelaySec: 20,
    evidenceQuote: '500 Cascade flow credits per month, with soft fallback to standard model routing when consumed.',
    url: 'https://codeium.com/windsurf',
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode',
    category: 'coding-router',
    tierName: 'Zen',
    monthlyPrice: 10,
    maxConcurrency: 8,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: 2000,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Multi-provider routing pool with high concurrency support and direct pass-through API rates.',
    url: 'https://opencode.ai/pricing',
  },
  {
    id: 'deepseek-api-flash',
    name: 'DeepSeek API',
    category: 'api-provider',
    tierName: 'PAYG (Flash)',
    monthlyPrice: null,
    maxConcurrency: 2500, // Official published limit: 2,500 connections
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Official limit: 2,500 concurrent connections, 1M context, 50% off-peak discount.',
    url: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
  {
    id: 'deepseek-api-pro',
    name: 'DeepSeek API',
    category: 'api-provider',
    tierName: 'PAYG (V4-Pro)',
    monthlyPrice: null,
    maxConcurrency: 500, // Official published limit: 500 connections
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Official limit: 500 concurrent connections, 1M context, reasoning frontier tier.',
    url: 'https://api-docs.deepseek.com/quick_start/pricing',
  },
  {
    id: 'anthropic-api-tier2',
    name: 'Anthropic API',
    category: 'api-provider',
    tierName: 'Tier 2 ($40+ spend)',
    monthlyPrice: null,
    maxConcurrency: 40,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Tier 2: 1,000 RPM, 400K TPM Sonnet, easily handles 10-20 concurrent agent loops.',
    url: 'https://docs.anthropic.com/en/api/rate-limits',
  },
  {
    id: 'openai-api-tier2',
    name: 'OpenAI API',
    category: 'api-provider',
    tierName: 'Tier 2 ($50+ spend)',
    monthlyPrice: null,
    maxConcurrency: 50,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'payg-overage',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Tier 2: 5,000 RPM, 2M TPM, high concurrency for background parallel agents.',
    url: 'https://platform.openai.com/docs/guides/rate-limits',
  },
  {
    id: 'alibaba-cloud-coding',
    name: 'Alibaba Cloud (Bailian)',
    category: 'api-provider',
    tierName: 'Standard Pay-As-You-Go',
    monthlyPrice: null,
    maxConcurrency: 5, // Strict 5 QPS concurrency throttle on standard tiers
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'hard-block',
    slowQueueDelaySec: 0,
    evidenceQuote: 'Default concurrency cap is 5 QPS per model; higher concurrency requires enterprise quota escalation.',
    url: 'https://help.aliyun.com/document_detail/2712560.html',
  },
  {
    id: 'groq-api',
    name: 'Groq Cloud',
    category: 'api-provider',
    tierName: 'On-Demand API',
    monthlyPrice: null,
    maxConcurrency: 30,
    rollingWindowHours: null,
    rollingWindowTurns: null,
    monthlyFastRequests: null,
    exhaustionBehavior: 'hard-block',
    slowQueueDelaySec: 0,
    evidenceQuote: 'High token-per-second LPUs with Tier 2 300 RPM rate caps.',
    url: 'https://groq.com/pricing',
  },
];
