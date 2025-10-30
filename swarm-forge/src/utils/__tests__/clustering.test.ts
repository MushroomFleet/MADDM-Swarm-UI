import { describe, it, expect } from 'vitest';
import { clusterBySimilarity, calculateCentroid } from '../clustering';

describe('Clustering', () => {
  it('should cluster similar items', () => {
    const items = [
      { id: 1, value: 'a' },
      { id: 2, value: 'a' },
      { id: 3, value: 'b' },
      { id: 4, value: 'a' },
      { id: 5, value: 'b' },
    ];

    const featureExtractor = (item: typeof items[0]) => ({
      is_a: item.value === 'a' ? 1 : 0,
      is_b: item.value === 'b' ? 1 : 0,
    });

    const clusters = clusterBySimilarity(items, featureExtractor, 0.9, 2);

    expect(clusters.length).toBe(2);
    expect(clusters[0].length).toBe(3); // Three 'a' items
    expect(clusters[1].length).toBe(2); // Two 'b' items
  });

  it('should respect minimum cluster size', () => {
    const items = [
      { id: 1, value: 'a' },
      { id: 2, value: 'a' },
      { id: 3, value: 'b' }, // Only one 'b'
    ];

    const featureExtractor = (item: typeof items[0]) => ({
      is_a: item.value === 'a' ? 1 : 0,
      is_b: item.value === 'b' ? 1 : 0,
    });

    const clusters = clusterBySimilarity(items, featureExtractor, 0.9, 2);

    expect(clusters.length).toBe(1); // Only 'a' cluster meets minimum size
    expect(clusters[0].length).toBe(2);
  });

  it('should calculate centroid correctly', () => {
    const features = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ];

    const centroid = calculateCentroid(features);

    expect(centroid.x).toBe(3); // Average of 1, 3, 5
    expect(centroid.y).toBe(4); // Average of 2, 4, 6
  });

  it('should handle empty clusters', () => {
    const centroid = calculateCentroid([]);
    expect(Object.keys(centroid).length).toBe(0);
  });
});
