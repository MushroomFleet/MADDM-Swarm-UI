import { TaskSignature, SpecialistProfile, TaskContext } from './types';
import { SpecialistsStore } from '@/storage/specialists-store';
import { cosineSimilarity, normalizeVector, hashString, updateEMA } from './utils';
import { getPrimaryDomain } from './prompt-analyzer';
import { generateSpecialistName, formatSpecialistNameForDisplay, checkHonorificUpgrade } from '@/utils/specialist-names';

/**
 * Adaptive Resonance Orchestrator
 * 
 * Port of src/adaptive_resonance.py
 * 
 * Dynamically creates and manages specialist agents using
 * Adaptive Resonance Theory (ART) for pattern matching.
 */
export class AdaptiveResonanceOrchestrator {
  private vigilanceThreshold: number;
  private maxSpecialists: number;
  private learningRate: number;
  private storage: SpecialistsStore;

  constructor(config: {
    vigilanceThreshold?: number;
    maxSpecialists?: number;
    learningRate?: number;
  } = {}) {
    this.vigilanceThreshold = config.vigilanceThreshold ?? 0.75;
    this.maxSpecialists = config.maxSpecialists ?? 10;
    this.learningRate = config.learningRate ?? 0.3;
    this.storage = new SpecialistsStore();
  }

  /**
   * Extract task signature from task context
   */
  extractTaskSignature(task: TaskContext): TaskSignature {
    return {
      domain: getPrimaryDomain(task.domainWeights),
      domainWeights: task.domainWeights,
      complexity: task.complexity,
      keywords: task.keywords,
      outputType: task.outputType,
      estimatedDuration: task.estimatedDuration,
    };
  }

  /**
   * Convert task signature to 15-dimensional feature vector
   * 
   * Vector structure:
   * [0-5]   Domain weights (6 domains)
   * [6]     Complexity
   * [7-12]  Output type (one-hot, 6 types)
   * [13]    Keyword hash (normalized)
   * [14]    Duration (normalized)
   */
  private signatureToVector(signature: TaskSignature): number[] {
    const vec: number[] = [];

    // Domain encoding
    const domains = ['research', 'writing', 'coding', 'review', 'comparison', 'analysis'];
    for (const domain of domains) {
      vec.push(signature.domainWeights[domain] ?? 0);
    }

    // Complexity
    vec.push(signature.complexity);

    // Output type (one-hot)
    const outputTypes = ['tutorial', 'code', 'explanation', 'list', 'comparison', 'report'];
    for (const ot of outputTypes) {
      vec.push(ot === signature.outputType ? 1 : 0);
    }

    // Keyword encoding
    const keywordHash =
      signature.keywords.length > 0
        ? signature.keywords.reduce((sum, kw) => sum + hashString(kw), 0) /
          signature.keywords.length /
          1000
        : 0;
    vec.push(keywordHash);

    // Duration
    vec.push(Math.min(signature.estimatedDuration / 10, 1));

    return vec;
  }

  /**
   * Compute specialist centroid
   */
  private computeCentroid(profile: SpecialistProfile): number[] {
    if (profile.taskSignatures.length === 0) {
      return Array(15).fill(0);
    }

    const vectors = profile.taskSignatures.map(sig => this.signatureToVector(sig));

    const centroid = vectors[0].map((_, colIndex) => {
      const sum = vectors.reduce((acc, vec) => acc + vec[colIndex], 0);
      return sum / vectors.length;
    });

    return normalizeVector(centroid);
  }

  /**
   * Calculate resonance = cosine_similarity * success_rate * specialization_strength
   * This penalizes generalists (low specializationStrength) to encourage specialist creation
   */
  private async computeResonance(
    signature: TaskSignature,
    profile: SpecialistProfile
  ): Promise<number> {
    const taskVec = normalizeVector(this.signatureToVector(signature));
    const centroid = this.computeCentroid(profile);

    const similarity = cosineSimilarity(taskVec, centroid);

    const successRate =
      profile.totalExecutions > 0 ? profile.successCount / profile.totalExecutions : 0.5;

    return similarity * successRate * profile.specializationStrength;
  }

  /**
   * Find best matching specialist
   */
  async findBestMatch(signature: TaskSignature): Promise<{
    specialistId: string | null;
    resonance: number;
  }> {
    const specialists = await this.storage.getAllSpecialists();

    if (specialists.length === 0) {
      return { specialistId: null, resonance: 0 };
    }

    let bestSpecialistId: string | null = null;
    let bestResonance = 0;

    for (const specialist of specialists) {
      const resonance = await this.computeResonance(signature, specialist);

      if (resonance > bestResonance) {
        bestResonance = resonance;
        bestSpecialistId = specialist.id;
      }
    }

    return { specialistId: bestSpecialistId, resonance: bestResonance };
  }

  /**
   * Find top N specialists by resonance score
   * 
   * For parallel execution: returns specialists ranked by resonance,
   * each above vigilance threshold.
   * 
   * @param signature - Task signature to match against
   * @param count - Number of top specialists to return
   * @returns Array of specialist IDs with resonance scores, sorted descending
   */
  async findTopSpecialists(
    signature: TaskSignature,
    count: number
  ): Promise<Array<{ specialistId: string; resonance: number }>> {
    const specialists = await this.storage.getAllSpecialists();

    if (specialists.length === 0) {
      return [];
    }

    // Calculate resonance for all specialists
    const scoredSpecialists = await Promise.all(
      specialists.map(async (specialist) => ({
        specialistId: specialist.id,
        resonance: await this.computeResonance(signature, specialist),
      }))
    );

    // Sort by resonance descending
    scoredSpecialists.sort((a, b) => b.resonance - a.resonance);

    // Filter by vigilance threshold and take top N
    const qualified = scoredSpecialists.filter(
      s => s.resonance >= this.vigilanceThreshold
    );

    const topN = qualified.slice(0, count);

    console.log(`🔍 Top ${count} Specialists:`);
    for (const s of topN) {
      const specialist = await this.storage.getSpecialist(s.specialistId);
      const displayName = specialist 
        ? formatSpecialistNameForDisplay(s.specialistId, specialist)
        : s.specialistId;
      console.log(`   - ${displayName}: ${s.resonance.toFixed(3)}`);
    }

    return topN;
  }

  /**
   * Create new specialist with human-readable name
   */
  async createSpecialist(signature: TaskSignature): Promise<string> {
    // Fetch all existing specialist IDs to avoid collisions
    const allSpecialists = await this.storage.getAllSpecialists();
    const existingNames = new Set(allSpecialists.map(s => s.id));

    // Generate human-readable name
    const specialistId = generateSpecialistName(signature, existingNames);

    const profile: SpecialistProfile = {
      id: specialistId,
      taskSignatures: [signature],
      successCount: 0,
      failureCount: 0,
      averageQuality: 0,
      totalExecutions: 0,
      specializationStrength: 1.0,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    await this.storage.saveSpecialist(profile);
    console.log(`✨ Created specialist: ${specialistId}`);

    return specialistId;
  }

  /**
   * Adapt specialist with new experience
   */
  async adaptSpecialist(specialistId: string, signature: TaskSignature): Promise<void> {
    const profile = await this.storage.getSpecialist(specialistId);
    if (!profile) return;

    profile.taskSignatures.push(signature);
    if (profile.taskSignatures.length > 20) {
      profile.taskSignatures.shift();
    }

    if (profile.taskSignatures.length > 1) {
      const vectors = profile.taskSignatures.map(sig => this.signatureToVector(sig));

      const centroid = vectors[0].map((_, i) => {
        const sum = vectors.reduce((acc, vec) => acc + vec[i], 0);
        return sum / vectors.length;
      });

      const variance =
        vectors.reduce((sum, vec) => {
          const diff = vec.map((v, i) => v - centroid[i]);
          return sum + diff.reduce((s, d) => s + d * d, 0);
        }, 0) / vectors.length;

      profile.specializationStrength = 1.0 - Math.min(variance * 2, 1.0);
    }

    profile.lastUpdated = new Date();
    await this.storage.saveSpecialist(profile);
  }

  /**
   * Record execution outcome with honorific upgrade detection
   */
  async recordExecution(
    specialistId: string,
    success: boolean,
    qualityScore: number
  ): Promise<void> {
    const profile = await this.storage.getSpecialist(specialistId);
    if (!profile) return;

    profile.totalExecutions++;

    if (success) {
      profile.successCount++;
    } else {
      profile.failureCount++;
    }

    if (profile.averageQuality === 0) {
      profile.averageQuality = qualityScore;
    } else {
      profile.averageQuality = updateEMA(
        profile.averageQuality,
        qualityScore,
        this.learningRate
      );
    }

    profile.lastUpdated = new Date();
    await this.storage.saveSpecialist(profile);

    // Check for honorific upgrade
    const newHonorific = checkHonorificUpgrade(
      specialistId,
      profile.totalExecutions,
      profile.averageQuality
    );
    
    if (newHonorific) {
      const displayName = formatSpecialistNameForDisplay(specialistId, profile);
      console.log(`🎖️ Specialist earned title: ${displayName}!`);
    }
  }

  /**
   * Prune underperforming specialists
   */
  async pruneSpecialists(): Promise<void> {
    const specialists = await this.storage.getAllSpecialists();

    if (specialists.length <= this.maxSpecialists) {
      return;
    }

    const ranked = specialists
      .map(s => ({
        id: s.id,
        score:
          s.averageQuality * (s.successCount / Math.max(s.totalExecutions, 1)),
      }))
      .sort((a, b) => b.score - a.score);

    const toRemove = ranked.slice(this.maxSpecialists);
    const idsToRemove = toRemove.map(s => s.id);

    await this.storage.deleteSpecialists(idsToRemove);

    console.log(`🗑️ Pruned ${idsToRemove.length} specialists`);
  }

  /**
   * Main entry point: match or create specialist
   */
  async matchOrCreateSpecialist(task: TaskContext): Promise<string> {
    const signature = this.extractTaskSignature(task);
    const { specialistId, resonance } = await this.findBestMatch(signature);

    console.log(`🔍 Layer 1: Adaptive Resonance`);
    console.log(`   Task: ${task.prompt.substring(0, 50)}...`);
    
    const bestMatch = specialistId ? await this.storage.getSpecialist(specialistId) : null;
    const bestDisplayName = bestMatch 
      ? formatSpecialistNameForDisplay(specialistId, bestMatch)
      : 'none';
    
    console.log(`   Best match: ${bestDisplayName} (${resonance.toFixed(3)})`);
    console.log(`   Vigilance: ${this.vigilanceThreshold}`);

    if (resonance >= this.vigilanceThreshold && specialistId) {
      console.log(`   → Using specialist: ${bestDisplayName}`);
      await this.adaptSpecialist(specialistId, signature);
      return specialistId;
    } else {
      const newSpecialistId = await this.createSpecialist(signature);
      console.log(`   ✨ Created specialist: ${newSpecialistId}`);

      await this.pruneSpecialists();

      return newSpecialistId;
    }
  }
}
