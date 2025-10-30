import { TaskContext } from './types';
import { hashString } from './utils';
import { nanoid } from 'nanoid';

/**
 * Prompt Analyzer
 * 
 * Analyzes user prompts to extract task characteristics.
 * Ported from agent_tools/get_coordination.py PromptAnalyzer class.
 */

// Domain keyword mappings
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  research: [
    'research',
    'investigate',
    'analyze',
    'study',
    'explore',
    'what is',
    'explain',
    'tell me about',
  ],
  writing: [
    'write',
    'create',
    'draft',
    'compose',
    'tutorial',
    'guide',
    'how to',
    'make a',
  ],
  review: ['review', 'check', 'evaluate', 'critique', 'assess', 'improve', 'feedback'],
  coding: [
    'code',
    'implement',
    'build',
    'develop',
    'program',
    'function',
    'script',
    'debug',
  ],
  comparison: ['compare', 'vs', 'versus', 'difference', 'better', 'which', 'between'],
  analysis: ['analyze', 'analysis', 'examine', 'dissect', 'breakdown'],
};

// Common stop words
const STOP_WORDS = new Set([
  'what',
  'when',
  'where',
  'which',
  'would',
  'should',
  'could',
  'about',
  'that',
  'this',
  'with',
  'from',
  'they',
  'have',
  'been',
  'the',
  'and',
  'for',
]);

/**
 * Analyze user prompt and extract task characteristics
 */
export async function analyzePrompt(prompt: string): Promise<TaskContext> {
  const promptLower = prompt.toLowerCase();

  // Extract domain weights
  const domainWeights: Record<string, number> = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matches = keywords.filter(kw => promptLower.includes(kw)).length;

    if (matches > 0) {
      domainWeights[domain] = Math.min(1.0, matches / 3.0);
    }
  }

  if (Object.keys(domainWeights).length === 0) {
    domainWeights.general = 1.0;
  }

  // Estimate complexity
  const wordCount = prompt.split(/\s+/).length;
  const hasMultipleQuestions = (prompt.match(/\?/g) || []).length > 1 || / and /.test(promptLower);

  let complexity: number;
  if (wordCount > 50 || hasMultipleQuestions) {
    complexity = 0.8;
  } else if (wordCount > 20) {
    complexity = 0.6;
  } else {
    complexity = 0.4;
  }

  // Extract keywords
  const words = prompt.toLowerCase().match(/\b\w+\b/g) || [];
  const keywords = words
    .filter(w => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 5);

  // Determine output type
  let outputType: string;
  if (/tutorial|guide|how to/.test(promptLower)) {
    outputType = 'tutorial';
  } else if (/code|example|implement/.test(promptLower)) {
    outputType = 'code';
  } else if (/list|comparison|compare/.test(promptLower)) {
    outputType = 'list';
  } else {
    outputType = 'explanation';
  }

  const taskId = `task_${Date.now()}_${nanoid(6)}`;

  return {
    id: taskId,
    prompt,
    domainWeights,
    complexity,
    keywords,
    outputType,
    estimatedDuration: complexity * 3.0,
  };
}

/**
 * Extract primary domain from weights
 */
export function getPrimaryDomain(domainWeights: Record<string, number>): string {
  const entries = Object.entries(domainWeights);
  if (entries.length === 0) return 'general';
  
  return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
