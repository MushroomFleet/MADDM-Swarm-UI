/**
 * Core utility functions for vector operations and calculations
 */

/**
 * Calculate dot product of two vectors
 * 
 * Formula: vec1 · vec2 = Σ(vec1[i] * vec2[i])
 */
export function dotProduct(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vector length mismatch: ${vec1.length} vs ${vec2.length}`);
  }

  return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
}

/**
 * Calculate magnitude (L2 norm) of a vector
 * 
 * Formula: ||vec|| = √(Σ(vec[i]²))
 */
export function magnitude(vec: number[]): number {
  const sumOfSquares = vec.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumOfSquares);
}

/**
 * Normalize vector to unit length
 * 
 * Formula: normalized = vec / ||vec||
 */
export function normalizeVector(vec: number[]): number[] {
  const mag = magnitude(vec);
  
  if (mag === 0) {
    return vec;
  }

  return vec.map(v => v / mag);
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * Formula: cos(θ) = (vec1 · vec2) / (||vec1|| * ||vec2||)
 * 
 * Returns value between -1 and 1:
 * - 1.0 = identical direction
 * - 0.0 = orthogonal
 * - -1.0 = opposite direction
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vector length mismatch: ${vec1.length} vs ${vec2.length}`);
  }

  const dot = dotProduct(vec1, vec2);
  const mag1 = magnitude(vec1);
  const mag2 = magnitude(vec2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dot / (mag1 * mag2);
}

/**
 * Calculate Euclidean distance between two vectors
 * 
 * Formula: d = √(Σ((vec1[i] - vec2[i])²))
 */
export function euclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(`Vector length mismatch: ${vec1.length} vs ${vec2.length}`);
  }

  const sumOfSquaredDiffs = vec1.reduce((sum, val, i) => {
    const diff = val - vec2[i];
    return sum + diff * diff;
  }, 0);

  return Math.sqrt(sumOfSquaredDiffs);
}

/**
 * Calculate Jaccard similarity between two sets
 * 
 * Formula: J(A,B) = |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Simple hash function for strings
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Calculate exponential decay
 * 
 * Formula: value * exp(-age / rate)
 */
export function exponentialDecay(
  value: number,
  ageSeconds: number,
  decayRate: number
): number {
  const decayFactor = Math.exp(-ageSeconds / decayRate);
  return value * decayFactor;
}

/**
 * Update exponential moving average
 * 
 * Formula: EMA = α * new + (1-α) * old
 */
export function updateEMA(
  currentEMA: number,
  newValue: number,
  alpha: number = 0.1
): number {
  return alpha * newValue + (1 - alpha) * currentEMA;
}
