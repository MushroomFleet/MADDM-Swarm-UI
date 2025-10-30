import { cosineSimilarity } from '@/core/utils';

/**
 * Threshold-based clustering
 * 
 * Port of pattern_analyzer.py _cluster_by_similarity() method.
 * 
 * Groups items that are similar above a threshold.
 * Unlike K-means, this doesn't require knowing the number of clusters.
 */

/**
 * Cluster items by similarity using threshold-based algorithm
 * 
 * @param items - Items to cluster
 * @param featureExtractor - Function to extract feature vector from item
 * @param similarityThreshold - Minimum similarity to group (0-1)
 * @param minClusterSize - Minimum items to form a cluster
 * @returns Array of clusters (each cluster is array of items)
 */
export function clusterBySimilarity<T>(
  items: T[],
  featureExtractor: (item: T) => Record<string, number>,
  similarityThreshold: number,
  minClusterSize: number
): Array<T[]> {
  // Extract all feature vectors
  const features = items.map(featureExtractor);

  const used = new Set<number>();
  const clusters: Array<T[]> = [];

  // Process each item
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;

    // Start new cluster with this item
    const cluster = [items[i]];
    used.add(i);

    // Find similar items
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateFeatureSimilarity(features[i], features[j]);

      if (similarity >= similarityThreshold) {
        cluster.push(items[j]);
        used.add(j);
      }
    }

    // Only keep clusters above minimum size
    if (cluster.length >= minClusterSize) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Calculate similarity between two feature dictionaries
 * 
 * Uses cosine similarity on aligned feature vectors
 */
function calculateFeatureSimilarity(
  features1: Record<string, number>,
  features2: Record<string, number>
): number {
  // Get all unique keys
  const keys = new Set([...Object.keys(features1), ...Object.keys(features2)]);

  if (keys.size === 0) return 0;

  // Create aligned vectors
  const vec1 = Array.from(keys).map(k => features1[k] ?? 0);
  const vec2 = Array.from(keys).map(k => features2[k] ?? 0);

  return cosineSimilarity(vec1, vec2);
}

/**
 * Calculate cluster centroid (mean of all feature vectors)
 */
export function calculateCentroid(
  features: Record<string, number>[]
): Record<string, number> {
  if (features.length === 0) return {};

  const allKeys = new Set<string>();
  features.forEach(f => Object.keys(f).forEach(k => allKeys.add(k)));

  const centroid: Record<string, number> = {};

  for (const key of allKeys) {
    const values = features.map(f => f[key] ?? 0);
    centroid[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  return centroid;
}
