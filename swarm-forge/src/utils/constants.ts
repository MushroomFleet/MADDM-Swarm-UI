/**
 * System-wide constants
 */

// Coordination defaults
export const DEFAULT_VIGILANCE_THRESHOLD = 0.75;
export const DEFAULT_DECAY_RATE = 1800; // 30 minutes
export const DEFAULT_MAX_SPECIALISTS = 10;
export const DEFAULT_LEARNING_RATE = 0.3;
export const PATTERN_DISCOVERY_THRESHOLD = 10;

// Parallel execution defaults
export const DEFAULT_PARALLEL_ENABLED = false;
export const DEFAULT_PARALLEL_COUNT = 2;
export const DEFAULT_PARALLEL_STRATEGY = 'quality_voting' as const;
export const DEFAULT_PARALLEL_TIMEOUT = 60000; // 60s per specialist
export const MAX_PARALLEL_COUNT = 5;
export const MIN_PARALLEL_COUNT = 2;

// Domain types
export const DOMAINS = [
  'research',
  'writing',
  'coding',
  'review',
  'comparison',
  'analysis',
] as const;

export type Domain = (typeof DOMAINS)[number];

// Output types
export const OUTPUT_TYPES = [
  'tutorial',
  'code',
  'explanation',
  'list',
  'comparison',
  'report',
] as const;

export type OutputType = (typeof OUTPUT_TYPES)[number];

// Quality thresholds
export const QUALITY_EXCELLENT = 0.9;
export const QUALITY_GOOD = 0.8;
export const QUALITY_ADEQUATE = 0.7;
export const QUALITY_POOR = 0.5;

// IndexedDB configuration
export const DB_NAME = 'HybridSwarmDB';
export const DB_VERSION = 1;

// OpenRouter configuration
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Default model - append :online for web search grounding (toggle in UI)
export const DEFAULT_MODEL = 'x-ai/grok-4-fast';

// localStorage keys
export const STORAGE_KEY_API_KEY = 'hybrid-swarm-api-key';
export const STORAGE_KEY_CONFIG = 'hybrid-swarm-config';
