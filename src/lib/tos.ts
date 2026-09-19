import type { CodingPlan } from './types';

export type TrainingStatus = 'no-training' | 'zdr' | 'opt-out' | 'trains' | 'unknown';

export interface TrainingClassification {
  free: TrainingStatus;
  individual: TrainingStatus;
  enterprise: TrainingStatus;
}

const NO_TRAINING_PHRASES = [
  'no training',
  'no ai training',
  'not trained',
  'not used for training',
  'not used to train',
  'never occurs',
  'never trained',
  'zero training',
  'zero-retention',
  'zero retention',
  'zdr',
  'excluded from model training',
  'excluded from training',
  'does not train',
  'do not train',
  'training never occurs',
  'not use conversation data for model training',
  'not used for model training',
];

const ZDR_PHRASES = ['zero-retention', 'zero retention', 'zdr', 'commercial api zero retention'];

const TRAINS_PHRASES = [
  'used for training',
  'used to train',
  'used for ml improvement',
  'used for model training',
  'train on',
  'trains on',
  'training on customer',
  'may use copilot interaction data',
  'train and improve ai models',
  'content used to improve',
  'content is logged and used',
  'yes on free',
  'public repl',
  'used for model improvement',
  'interactions are recorded and used',
  'may be used for model improvement',
  'no guarantee',
];

const OPT_OUT_PHRASES = ['opt-out', 'opt out', 'privacy mode', 'training opt-out', 'in-settings opt-out'];

const UNKNOWN_PHRASES = ['not published', 'unpublished', 'depends on api provider', 'not disclosed', 'no public'];

function normalize(text: string): string {
  return (text || '').toLowerCase();
}

function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some(p => text.includes(p));
}

function classifyText(text: string): TrainingStatus {
  const lower = normalize(text).trim();
  if (lower === 'no' || lower === 'none' || lower === 'no training' || lower === 'never') return 'no-training';
  if (hasAny(lower, ZDR_PHRASES) && hasAny(lower, NO_TRAINING_PHRASES)) return 'zdr';
  if (hasAny(lower, NO_TRAINING_PHRASES)) return 'no-training';
  if (hasAny(lower, TRAINS_PHRASES)) return 'trains';
  if (hasAny(lower, OPT_OUT_PHRASES)) return 'opt-out';
  if (hasAny(lower, UNKNOWN_PHRASES)) return 'unknown';
  return 'unknown';
}

/**
 * Plans whose policy is documented per audience but whose phrasing mixes
 * clauses in one sentence. Values are curated from the plan's own
 * dataTraining/gotchas/tosHighlights text and upstream sources.
 */
const TRAINING_OVERRIDES: Record<string, TrainingClassification> = {
  'alibaba-cloud': { free: 'unknown', individual: 'unknown', enterprise: 'no-training' },
  'meta-model-api': { free: 'unknown', individual: 'trains', enterprise: 'no-training' },
  'meta-muse-code': { free: 'unknown', individual: 'trains', enterprise: 'no-training' },
  'google-ai-studio': { free: 'trains', individual: 'no-training', enterprise: 'no-training' },
  'z-ai': { free: 'unknown', individual: 'unknown', enterprise: 'no-training' },
  openrouter: { free: 'no-training', individual: 'no-training', enterprise: 'unknown' },
  'github-copilot': { free: 'trains', individual: 'opt-out', enterprise: 'no-training' },
  aider: { free: 'unknown', individual: 'unknown', enterprise: 'unknown' },
  tabnine: { free: 'unknown', individual: 'no-training', enterprise: 'no-training' },
  'openai-api': { free: 'unknown', individual: 'no-training', enterprise: 'no-training' },
  'anthropic-api': { free: 'unknown', individual: 'no-training', enterprise: 'no-training' },
  'claude-code': { free: 'unknown', individual: 'opt-out', enterprise: 'opt-out' },
  'openai-codex': { free: 'unknown', individual: 'opt-out', enterprise: 'no-training' },
  'google-antigravity': { free: 'opt-out', individual: 'opt-out', enterprise: 'opt-out' },
  lovable: { free: 'opt-out', individual: 'opt-out', enterprise: 'no-training' },
  'augment-code': { free: 'unknown', individual: 'no-training', enterprise: 'no-training' },
  'amazon-q': { free: 'opt-out', individual: 'no-training', enterprise: 'no-training' },
};

export function classifyTraining(plan: CodingPlan): TrainingClassification {
  if (TRAINING_OVERRIDES[plan.id]) return TRAINING_OVERRIDES[plan.id];
  const status = classifyText(plan.dataTraining);
  return { free: status, individual: status, enterprise: status };
}

export interface BadgeInfo {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'muted';
  title: string;
}

export function trainingBadge(status: TrainingStatus): BadgeInfo {
  switch (status) {
    case 'zdr':
      return { label: 'ZDR Safe', tone: 'success', title: 'Zero data retention: inputs are not retained or trained on' };
    case 'no-training':
      return { label: 'No Training', tone: 'success', title: 'Provider states inputs are not used for model training' };
    case 'opt-out':
      return { label: 'Opt-Out Setting', tone: 'warning', title: 'Training or data use is active until disabled in settings' };
    case 'trains':
      return { label: 'Trains Code', tone: 'danger', title: 'Inputs may be used for model training or human review' };
    default:
      return { label: 'Unknown', tone: 'muted', title: 'No explicit public statement found — treat as unverified' };
  }
}

export interface IndemnityInfo {
  label: string;
  tone: 'success' | 'warning' | 'muted';
  description: string;
}

export function getIndemnityInfo(plan: CodingPlan): IndemnityInfo {
  const ip = plan.ipIndemnity;
  if (ip === true) {
    return {
      label: 'Full Indemnity',
      tone: 'success',
      description: 'Full legal IP indemnification covered for copyright infringement on generated code.',
    };
  }
  if (typeof ip === 'string') {
    const lower = ip.toLowerCase();
    if (lower.includes('enterprise') || lower.includes('team') || lower.includes('business')) {
      return { label: 'Enterprise Only', tone: 'warning', description: ip };
    }
    if (lower.includes('full') || lower.includes('all plans')) {
      return { label: 'Full Indemnity', tone: 'success', description: ip };
    }
    return { label: 'Unclear', tone: 'muted', description: ip };
  }
  return {
    label: 'None',
    tone: 'muted',
    description: 'No intellectual property indemnification provided on standard or individual subscription tiers.',
  };
}

export type GotchaCategory = 'data-privacy' | 'ip-legal' | 'billing' | 'limits' | 'restrictions';

export interface GotchaClassification {
  category: GotchaCategory;
  severity: 'critical' | 'warning' | 'advisory';
}

const RESTRICTION_WORDS = ['ban', 'banned', 'suspend', 'suspension', 'bulk', 'multiple accounts', 'multi-account', 'account sharing', 'unauthorized', 'tool-only', 'lock-in', 'error 1113', 'circumvent', 'breach', 'prohibited'];
const PRIVACY_WORDS = ['train', 'training', 'privacy', 'telemetry', 'human review', 'data retention', 'zero retention'];
const LEGAL_WORDS = ['indemnity', 'indemnification', 'copyright', 'liability', 'ip ', 'legal'];
const BILLING_WORDS = ['bill', 'billing', 'fee', 'fees', 'charge', 'overage', 'refund', 'refunds', 'cost', 'expire', 'expires', 'rate', '$', 'price', 'non-refundable'];
const LIMIT_WORDS = ['limit', 'limits', 'throttle', 'cooldown', 'hard limit', 'quota', 'cap', 'resets', 'reset'];

function matchesWord(text: string, words: string[]): boolean {
  return words.some(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}`, 'i').test(text);
  });
}

/** Classify a gotcha with word-boundary matching (fixes 'ip' inside 'subscription'). */
export function classifyGotcha(text: string): GotchaClassification {
  const lower = normalize(text);
  if (matchesWord(lower, RESTRICTION_WORDS)) {
    return { category: 'restrictions', severity: 'critical' };
  }
  if (matchesWord(lower, PRIVACY_WORDS)) {
    return { category: 'data-privacy', severity: 'critical' };
  }
  if (matchesWord(lower, LEGAL_WORDS)) {
    return { category: 'ip-legal', severity: 'warning' };
  }
  if (matchesWord(lower, BILLING_WORDS)) {
    const severe = matchesWord(lower, ['fee', 'fees', 'overage', 'refund', 'refunds', 'expire', 'expires', 'non-refundable', 'in-arrears']);
    return { category: 'billing', severity: severe ? 'warning' : 'advisory' };
  }
  if (matchesWord(lower, LIMIT_WORDS)) {
    const severe = matchesWord(lower, ['throttle', 'cooldown', 'hard limit']);
    return { category: 'limits', severity: severe ? 'warning' : 'advisory' };
  }
  return { category: 'limits', severity: 'advisory' };
}
