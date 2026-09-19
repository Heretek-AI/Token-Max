import constants from '../../data/estimate-constants.json';
import type { CacheRate } from './types';

/**
 * Shared token-estimate assumptions. The JSON file is the single source of
 * truth and is also read by `scripts/*.mjs` and `data/generate_plans.py`.
 * Rationale and OSINT evidence: docs/TOKEN_ESTIMATE_VALIDATION.md.
 */
export const AGENT_REQUEST_INPUT_TOKENS = constants.agentRequest.inputTokens;
export const AGENT_REQUEST_OUTPUT_TOKENS = constants.agentRequest.outputTokens;
export const STANDARD_AGENT_REQUEST_TOKENS = AGENT_REQUEST_INPUT_TOKENS + AGENT_REQUEST_OUTPUT_TOKENS;
export const CHAT_REQUEST_INPUT_TOKENS = constants.chatRequest.inputTokens;
export const CHAT_REQUEST_OUTPUT_TOKENS = constants.chatRequest.outputTokens;
export const CHAT_REQUEST_TOKENS = CHAT_REQUEST_INPUT_TOKENS + CHAT_REQUEST_OUTPUT_TOKENS;
export const CHAT_BLEND_INPUT_WEIGHT = constants.chatBlend.inputWeight;
export const CHAT_BLEND_OUTPUT_WEIGHT = constants.chatBlend.outputWeight;
export const DEFAULT_CACHE_RATE = constants.defaultCacheRate as CacheRate;
/** Anthropic cache-write premium (5-minute TTL) used when a provider price is missing. */
export const CACHE_WRITE_PREMIUM = constants.cacheWritePremium;
