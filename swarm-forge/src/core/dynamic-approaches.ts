import { ApproachPattern, TaskContext, PatternSignature } from './types';
import { ApproachesStore } from '@/storage/approaches-store';
import { jaccardSimilarity, updateEMA } from './utils';

/**
 * Dynamic Approach Manager
 * 
 * Port of src/dynamic_approach_manager.py
 * 
 * Manages lifecycle of emergent approach patterns with
 * multi-factor scoring and performance tracking.
 */
export class DynamicApproachManager {
  private storage: ApproachesStore;
  private cache: Map<string, ApproachPattern>;

  constructor() {
    this.storage = new ApproachesStore();
    this.cache = new Map();
  }

  /**
   * Match task to approaches using multi-factor scoring
   * 
   * Scoring factors:
   * - Domain overlap: 40%
   * - Complexity fit: 20%
   * - Keyword matching: 20%
   * - Output type match: 20%
   */
  async matchApproaches(
    taskContext: TaskContext,
    threshold: number = 0.5,
    limit: number = 10
  ): Promise<Array<{ approach: ApproachPattern; score: number }>> {
    const approaches = await this.storage.getActiveApproaches();

    console.log(`\n🎯 Matching approaches (threshold: ${threshold}, available: ${approaches.length})`);

    const matches: Array<{ approach: ApproachPattern; score: number }> = [];
    const scoredApproaches: Array<{ name: string; score: number }> = [];

    for (const approach of approaches) {
      const score = this.calculateMatchScore(taskContext, approach.patternSignature);
      scoredApproaches.push({ name: approach.name, score });

      if (score >= threshold) {
        matches.push({ approach, score });
      }
    }

    // Log top 5 scores for debugging
    scoredApproaches.sort((a, b) => b.score - a.score);
    console.log(`   Top 5 scores:`);
    scoredApproaches.slice(0, 5).forEach(({ name, score }) => {
      const status = score >= threshold ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${score.toFixed(3)}`);
    });

    if (matches.length === 0) {
      console.log(`   ⚠️ No approaches above threshold ${threshold}`);
    } else {
      console.log(`   ✅ Found ${matches.length} matches`);
    }

    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, limit);
  }

  /**
   * Calculate match score
   */
  private calculateMatchScore(task: TaskContext, signature: PatternSignature): number {
    const scores: number[] = [];

    // 1. Domain overlap (40%)
    let domainOverlap = 0;
    for (const [domain, taskWeight] of Object.entries(task.domainWeights)) {
      const sigWeight = signature.domainWeights[domain] ?? 0;
      domainOverlap += Math.min(taskWeight, sigWeight);
    }
    scores.push(domainOverlap * 0.45);

    // 2. Complexity fit (20%)
    const inRange =
      task.complexity >= signature.complexityMin &&
      task.complexity <= signature.complexityMax;

    let complexityFit: number;
    if (inRange) {
      complexityFit = 1.0;
    } else {
      const midpoint = (signature.complexityMin + signature.complexityMax) / 2;
      const distance = Math.abs(task.complexity - midpoint);
      complexityFit = Math.max(0, 1 - distance);
    }
    scores.push(complexityFit * 0.25);

    // 3. Keyword matching (10% - reduced to be more forgiving)
    const taskKeywordSet = new Set(task.keywords);
    const sigKeywordSet = new Set(signature.keywordPatterns);
    const intersection = new Set([...taskKeywordSet].filter(x => sigKeywordSet.has(x)));
    const minSize = Math.min(taskKeywordSet.size, sigKeywordSet.size);
    const keywordSimilarity = minSize > 0 ? intersection.size / minSize : 0;
    scores.push(keywordSimilarity * 0.1);

    // 4. Output type match (20%)
    const outputMatch = signature.outputTypes.includes(task.outputType) ? 1.0 : 0.0;
    scores.push(outputMatch * 0.2);

    return scores.reduce((sum, s) => sum + s, 0);
  }

  /**
   * Record execution result
   */
  async recordExecution(
    approachId: string,
    quality: number,
    success: boolean
  ): Promise<void> {
    const approach = await this.getApproach(approachId);
    if (!approach) return;

    const metrics = approach.performanceMetrics;

    metrics.usageCount++;
    metrics.lastUsed = new Date();

    if (metrics.usageCount === 1) {
      metrics.avgQuality = quality;
      metrics.minQuality = quality;
      metrics.maxQuality = quality;
    } else {
      metrics.avgQuality = updateEMA(metrics.avgQuality, quality, 0.1);
      metrics.minQuality = Math.min(metrics.minQuality, quality);
      metrics.maxQuality = Math.max(metrics.maxQuality, quality);
    }

    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }
    metrics.successRate = metrics.successCount / metrics.usageCount;

    metrics.qualityHistory.push({
      timestamp: new Date().toISOString(),
      quality,
    });
    if (metrics.qualityHistory.length > 100) {
      metrics.qualityHistory = metrics.qualityHistory.slice(-100);
    }

    metrics.recentQualityTrend = this.calculateTrend(metrics.qualityHistory);

    approach.lastUpdated = new Date();
    await this.storage.saveApproach(approach);
    this.cache.set(approachId, approach);
  }

  /**
   * Calculate quality trend
   */
  private calculateTrend(
    history: Array<{ timestamp: string; quality: number }>
  ): 'improving' | 'stable' | 'declining' | 'new' {
    if (history.length < 10) return 'new';

    const recent = history.slice(-10).map(h => h.quality);
    const previous =
      history.length >= 20 ? history.slice(-20, -10).map(h => h.quality) : recent;

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b) / previous.length;

    const diff = recentAvg - previousAvg;

    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }

  // CRUD with caching
  async getApproach(approachId: string): Promise<ApproachPattern | null> {
    if (this.cache.has(approachId)) {
      return this.cache.get(approachId)!;
    }

    const approach = await this.storage.getApproach(approachId);
    if (approach) {
      this.cache.set(approachId, approach);
    }
    return approach;
  }

  async createApproach(approach: ApproachPattern): Promise<boolean> {
    const success = await this.storage.saveApproach(approach);
    if (success) {
      this.cache.set(approach.id, approach);
    }
    return success;
  }

  async updateApproach(approach: ApproachPattern): Promise<boolean> {
    approach.lastUpdated = new Date();
    const success = await this.storage.saveApproach(approach);
    if (success) {
      this.cache.set(approach.id, approach);
    }
    return success;
  }

  async deleteApproach(approachId: string): Promise<boolean> {
    const success = await this.storage.deleteApproach(approachId);
    if (success) {
      this.cache.delete(approachId);
    }
    return success;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
