import { ApproachPattern, PatternCluster, PatternSignature, StyleCharacteristics, PerformanceMetrics } from './types';
import { DynamicApproachManager } from './dynamic-approaches';
import { hashString } from './utils';

/**
 * Approach Evolution
 * 
 * Creates new approaches from discovered patterns.
 * Port of src/approach_evolution.py ApproachEvolution class.
 */
export class ApproachEvolution {
  private manager: DynamicApproachManager;

  constructor(manager: DynamicApproachManager) {
    this.manager = manager;
  }

  /**
   * Create approach from discovered pattern cluster
   */
  async createApproachFromCluster(
    cluster: PatternCluster,
    signature: PatternSignature,
    style: StyleCharacteristics
  ): Promise<ApproachPattern | null> {
    // Generate approach ID
    const primaryDomain = Object.entries(signature.domainWeights)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    const idBase = `approach_${primaryDomain}_${style.structureType}`;
    const hash = hashString(idBase + cluster.clusterId);
    const approachId = `${idBase}_${hash.toString(36).substring(0, 6)}`;

    // Generate human-readable name
    const name = this.generateApproachName(signature, style);

    // Create initial performance metrics
    const now = new Date();
    const metrics: PerformanceMetrics = {
      usageCount: 0,
      firstUsed: now,
      lastUsed: now,
      avgQuality: cluster.avgQuality,
      minQuality: cluster.avgQuality,
      maxQuality: cluster.avgQuality,
      qualityStdDev: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      recentQualityTrend: 'new',
      qualityHistory: [],
    };

    const approach: ApproachPattern = {
      id: approachId,
      name,
      version: 1,
      createdAt: now,
      lastUpdated: now,
      patternSignature: signature,
      styleCharacteristics: style,
      performanceMetrics: metrics,
      parentId: null,
      generation: 0,
      tags: this.generateTags(signature, style),
      active: true,
    };

    return approach;
  }

  private generateApproachName(
    signature: PatternSignature,
    style: StyleCharacteristics
  ): string {
    const domain = Object.entries(signature.domainWeights)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    const structure = style.structureType.replace('_', ' ');
    const output = signature.outputTypes[0] || 'content';

    return `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${output} (${structure})`;
  }

  private generateTags(
    signature: PatternSignature,
    style: StyleCharacteristics
  ): string[] {
    const tags: string[] = [];

    // Add top domains
    const topDomains = Object.entries(signature.domainWeights)
      .filter(([_, w]) => w > 0.5)
      .map(([d]) => d);
    tags.push(...topDomains);

    // Add structure type
    tags.push(style.structureType);

    // Add tone
    tags.push(style.tone);

    // Add special characteristics
    if (signature.requiresCode) tags.push('code-heavy');
    if (signature.requiresExamples) tags.push('example-rich');
    if (style.depthLevel === 'comprehensive') tags.push('comprehensive');

    return tags;
  }
}
