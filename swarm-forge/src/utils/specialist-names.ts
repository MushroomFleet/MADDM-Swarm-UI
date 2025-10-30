import { TaskSignature, SpecialistProfile } from '@/core/types';
import { hashString } from '@/core/utils';

/**
 * Specialist Naming Utility
 * 
 * Generates human-readable specialist names using hybrid approach:
 * - Format: [honorific_]domain_animal
 * - Examples: coding_falcon, expert_research_owl, master_writing_raven
 * 
 * Honorific progression:
 * - None: 0-9 executions
 * - expert: 10-49 executions with >0.8 quality
 * - master: 50+ executions with >0.8 quality
 */

// Word lists
const DOMAINS = [
  'coding',
  'research', 
  'writing',
  'review',
  'comparison',
  'analysis',
  'general',
] as const;

const ANIMALS = [
  // Birds
  'falcon', 'eagle', 'hawk', 'owl', 'raven', 'sparrow', 'swan', 'crane',
  // Mammals
  'wolf', 'fox', 'tiger', 'bear', 'lynx', 'otter', 'panda', 'jaguar',
  // Marine
  'dolphin', 'shark', 'whale', 'orca', 'seal', 'octopus',
  // Mythical
  'dragon', 'phoenix', 'griffin', 'unicorn', 'sphinx', 'pegasus', 'hydra',
] as const;

type Domain = typeof DOMAINS[number];
type Animal = typeof ANIMALS[number];

/**
 * Parsed specialist name components
 */
export interface ParsedSpecialistName {
  honorific: string | null;
  domain: string;
  animal: string;
  original: string;
}

/**
 * Generate specialist name from task signature
 * 
 * Algorithm:
 * 1. Extract primary domain from domainWeights
 * 2. Hash domain + outputType for deterministic animal selection
 * 3. Handle collisions by trying next animal in rotation
 * 4. Add counter suffix only if all animals exhausted
 * 
 * Note: Honorific is NOT part of base name - computed dynamically on display
 */
export function generateSpecialistName(
  signature: TaskSignature,
  existingNames: Set<string>,
  performanceMetrics?: { totalExecutions: number; averageQuality: number }
): string {
  const domain = getPrimaryDomain(signature);
  const hash = hashString(`${domain}_${signature.outputType}`);
  
  // Try to find available animal
  const animal = selectAnimal(domain, hash, existingNames);
  
  // Build base name without honorific
  const baseName = `${domain}_${animal}`;
  
  // Ensure uniqueness with counter if needed
  const uniqueName = ensureUniqueness(baseName, existingNames);
  
  return uniqueName;
}

/**
 * Parse specialist name back to components
 * 
 * Handles formats:
 * - coding_falcon
 * - expert_coding_falcon
 * - master_research_owl_2
 */
export function parseSpecialistName(name: string): ParsedSpecialistName {
  const parts = name.split('_');
  
  // Check if first part is honorific
  const knownHonorifics = ['expert', 'master'];
  const hasHonorific = parts.length >= 3 && knownHonorifics.includes(parts[0]);
  
  if (hasHonorific) {
    return {
      honorific: parts[0],
      domain: parts[1],
      animal: parts.slice(2).join('_'), // Handle animals with numbers like "falcon_2"
      original: name,
    };
  } else {
    return {
      honorific: null,
      domain: parts[0],
      animal: parts.slice(1).join('_'),
      original: name,
    };
  }
}

/**
 * Format specialist name for display with current honorific
 * 
 * Dynamically computes honorific based on performance metrics.
 * This allows specialists to "earn" titles without changing their base ID.
 */
export function formatSpecialistNameForDisplay(
  specialistId: string,
  specialist?: { totalExecutions: number; averageQuality: number }
): string {
  if (!specialist) {
    return specialistId;
  }
  
  const parsed = parseSpecialistName(specialistId);
  const currentHonorific = getHonorific(specialist.totalExecutions, specialist.averageQuality);
  
  if (currentHonorific && !parsed.honorific) {
    // Specialist earned honorific, prepend it
    return `${currentHonorific}_${specialistId}`;
  }
  
  if (!currentHonorific && parsed.honorific) {
    // Specialist lost honorific (quality dropped), remove it
    return `${parsed.domain}_${parsed.animal}`;
  }
  
  // Return as-is (either has matching honorific or none)
  return specialistId;
}

/**
 * Determine honorific based on performance
 * 
 * Rules:
 * - master: 50+ executions with >0.8 avg quality
 * - expert: 10+ executions with >0.8 avg quality
 * - null: otherwise
 */
export function getHonorific(totalExecutions: number, averageQuality: number): string | null {
  if (totalExecutions >= 50 && averageQuality > 0.8) {
    return 'master';
  }
  
  if (totalExecutions >= 10 && averageQuality > 0.8) {
    return 'expert';
  }
  
  return null;
}

/**
 * Extract primary domain from task signature
 * 
 * Returns domain with highest weight, falls back to 'general'
 */
export function getPrimaryDomain(signature: TaskSignature): Domain {
  const domains = Object.entries(signature.domainWeights);
  
  if (domains.length === 0) {
    return 'general';
  }
  
  // Find domain with max weight
  const [primaryDomain] = domains.reduce((max, curr) => 
    curr[1] > max[1] ? curr : max
  );
  
  // Validate against known domains
  if (DOMAINS.includes(primaryDomain as Domain)) {
    return primaryDomain as Domain;
  }
  
  return 'general';
}

/**
 * Select animal deterministically from domain + hash
 * 
 * Handles collisions by rotating through animal list.
 * Returns first available animal that doesn't collide.
 */
function selectAnimal(domain: string, hash: number, existingNames: Set<string>): Animal {
  const startIndex = Math.abs(hash) % ANIMALS.length;
  
  // Try all animals starting from hash-determined index
  for (let i = 0; i < ANIMALS.length; i++) {
    const animalIndex = (startIndex + i) % ANIMALS.length;
    const animal = ANIMALS[animalIndex];
    const candidateName = `${domain}_${animal}`;
    
    // Check if this combination is available
    if (!existingNames.has(candidateName)) {
      return animal;
    }
  }
  
  // All animals taken for this domain - return the hash-selected one
  // (uniqueness will be handled by counter suffix)
  return ANIMALS[startIndex];
}

/**
 * Ensure uniqueness with counter suffix if needed
 * 
 * Examples:
 * - coding_falcon (first)
 * - coding_falcon_2 (second)
 * - coding_falcon_3 (third)
 */
function ensureUniqueness(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) {
    return baseName;
  }
  
  // Find next available counter
  let counter = 2;
  while (existingNames.has(`${baseName}_${counter}`)) {
    counter++;
  }
  
  return `${baseName}_${counter}`;
}

/**
 * Check if honorific upgrade occurred
 * 
 * Returns new honorific if specialist earned a title upgrade, null otherwise.
 * Useful for logging honorific progression.
 */
export function checkHonorificUpgrade(
  specialistId: string,
  totalExecutions: number,
  averageQuality: number
): string | null {
  const parsed = parseSpecialistName(specialistId);
  const currentHonorific = parsed.honorific;
  const newHonorific = getHonorific(totalExecutions, averageQuality);
  
  // Check if honorific changed (either earned or upgraded)
  if (newHonorific && newHonorific !== currentHonorific) {
    return newHonorific;
  }
  
  return null;
}
