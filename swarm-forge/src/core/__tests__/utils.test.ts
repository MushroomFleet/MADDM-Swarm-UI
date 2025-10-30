import { describe, it, expect } from 'vitest';
import {
  dotProduct,
  magnitude,
  normalizeVector,
  cosineSimilarity,
  jaccardSimilarity,
  exponentialDecay,
  updateEMA,
} from '../utils';

describe('Vector Mathematics', () => {
  it('should calculate dot product correctly', () => {
    const vec1 = [1, 2, 3];
    const vec2 = [4, 5, 6];
    expect(dotProduct(vec1, vec2)).toBe(32); // 1*4 + 2*5 + 3*6 = 32
  });

  it('should calculate magnitude correctly', () => {
    const vec = [3, 4];
    expect(magnitude(vec)).toBe(5);
  });

  it('should normalize vector to unit length', () => {
    const vec = [3, 4];
    const normalized = normalizeVector(vec);
    expect(normalized[0]).toBeCloseTo(0.6);
    expect(normalized[1]).toBeCloseTo(0.8);
    expect(magnitude(normalized)).toBeCloseTo(1.0);
  });

  it('should calculate cosine similarity correctly', () => {
    const vec1 = [1, 0];
    const vec2 = [1, 0];
    expect(cosineSimilarity(vec1, vec2)).toBe(1);

    const vec3 = [1, 0];
    const vec4 = [0, 1];
    expect(cosineSimilarity(vec3, vec4)).toBe(0);
  });

  it('should calculate Jaccard similarity', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([2, 3, 4]);
    expect(jaccardSimilarity(set1, set2)).toBeCloseTo(0.5);
  });

  it('should calculate exponential decay', () => {
    const value = 100;
    const decay = exponentialDecay(value, 1800, 1800);
    expect(decay).toBeCloseTo(36.79, 1);
  });

  it('should update EMA correctly', () => {
    const ema = updateEMA(0.8, 0.9, 0.1);
    expect(ema).toBeCloseTo(0.81);
  });
});
