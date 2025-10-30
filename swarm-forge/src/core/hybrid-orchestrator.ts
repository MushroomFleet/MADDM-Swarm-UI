import { AdaptiveResonanceOrchestrator } from './adaptive-resonance';
import { StigmergicBoard } from './stigmergic-board';
import { DynamicApproachManager } from './dynamic-approaches';
import { ExecutionHistoryStore } from '@/storage/history-store';
import { ContentAnalyzer } from './content-analyzer';
import { TaskContext, CoordinationResult, ExecutionRecord, ApproachPattern, ParallelCoordinationResult } from './types';
import { formatSpecialistNameForDisplay } from '@/utils/specialist-names';

/**
 * Hybrid Swarm Orchestrator
 * 
 * Port of src/hybrid_swarm.py HybridSwarmOrchestrator class.
 * 
 * Combines all three coordination layers:
 * 1. Adaptive Resonance (specialist selection)
 * 2. Dynamic Approaches (pattern matching)
 * 3. Stigmergic Coordination (signal blending)
 */
export class HybridSwarmOrchestrator {
  private adaptiveLayer: AdaptiveResonanceOrchestrator;
  private stigmergicBoard: StigmergicBoard;
  private approachManager: DynamicApproachManager;
  private historyStore: ExecutionHistoryStore;
  private executionCount: number;
  private patternDiscoveryThreshold: number;

  constructor(config: {
    vigilanceThreshold?: number;
    decayRate?: number;
    patternDiscoveryThreshold?: number;
  } = {}) {
    this.adaptiveLayer = new AdaptiveResonanceOrchestrator({
      vigilanceThreshold: config.vigilanceThreshold,
    });

    this.stigmergicBoard = new StigmergicBoard({
      decayRate: config.decayRate,
    });

    this.approachManager = new DynamicApproachManager();
    this.historyStore = new ExecutionHistoryStore();
    this.executionCount = 0;
    this.patternDiscoveryThreshold = config.patternDiscoveryThreshold ?? 10;
  }

  /**
   * Get parallel coordination decision (NO LLM execution)
   * 
   * Returns top N specialists with their coordination decisions.
   * Each specialist independently selects an approach via stigmergic signals.
   */
  async getParallelCoordination(
    task: TaskContext,
    parallelCount: number
  ): Promise<ParallelCoordinationResult> {
    console.log(`\n🎯 Parallel Coordination (${parallelCount} specialists)`);
    console.log(`   Prompt: "${task.prompt.substring(0, 60)}..."`);

    // Ensure at least one specialist exists (create if needed)
    await this.adaptiveLayer.matchOrCreateSpecialist(task);

    // Layer 1: Get top N specialists by resonance
    const taskSignature = {
      domain: Object.keys(task.domainWeights)[0] || 'general',
      domainWeights: task.domainWeights,
      complexity: task.complexity,
      keywords: task.keywords,
      outputType: task.outputType,
      estimatedDuration: task.estimatedDuration,
    };

    // Check pool size for bootstrap mode
    const allSpecialists = await this.adaptiveLayer['storage'].getAllSpecialists();
    const poolSize = allSpecialists.length;

    // During bootstrap (small pool), lower vigilance to get more specialists
    let topSpecialists = await this.adaptiveLayer.findTopSpecialists(
      taskSignature,
      parallelCount
    );

    // If we got fewer specialists than requested due to vigilance, try bootstrap mode
    if (topSpecialists.length < parallelCount && poolSize >= parallelCount) {
      console.log(`   ⚙️ Bootstrap mode: relaxing vigilance to fill ${parallelCount} slots (pool: ${poolSize})`);
      
      // Calculate resonance for all specialists manually
      const allScored = await Promise.all(
        allSpecialists.map(async (specialist) => ({
          specialistId: specialist.id,
          resonance: await this.adaptiveLayer['computeResonance'](taskSignature, specialist),
        }))
      );
      
      // Sort by resonance and take top N (ignore vigilance threshold)
      allScored.sort((a, b) => b.resonance - a.resonance);
      topSpecialists = allScored.slice(0, parallelCount);
    }

    // Safety: If none passed vigilance, fall back to best available specialist
    if (topSpecialists.length === 0) {
      console.warn(`⚠️ No specialists above vigilance - using best available`);
      const { specialistId: bestId, resonance } = await this.adaptiveLayer.findBestMatch(taskSignature);
      if (bestId) {
        console.log(`   → Fallback best: ${bestId} (${resonance.toFixed(3)})`);
        topSpecialists.push({ specialistId: bestId, resonance });
      } else {
        // Absolute safety: create one
        const newId = await this.adaptiveLayer.matchOrCreateSpecialist(task);
        console.log(`   → Fallback created: ${newId}`);
        topSpecialists.push({ specialistId: newId, resonance: 0.5 });
      }
    }

    console.log(`\n🔍 Selected ${topSpecialists.length} specialists:`);
    for (const { specialistId, resonance } of topSpecialists) {
      const specialist = await this.adaptiveLayer['storage'].getSpecialist(specialistId);
      const displayName = specialist 
        ? formatSpecialistNameForDisplay(specialistId, specialist)
        : specialistId;
      console.log(`     - ${displayName}: resonance ${resonance.toFixed(3)}`);
    }

    // Layer 2 & 3: For each specialist, independently select approach
    const coordinations: CoordinationResult[] = [];
    const specialistResonances = new Map(
      topSpecialists.map(({ specialistId, resonance }) => [specialistId, resonance])
    );

    for (const { specialistId } of topSpecialists) {
      // Get approach matches for this specialist's perspective
      const matches = await this.approachManager.matchApproaches(task, 0.1, 3);

      let approachId: string;
      let selectedApproach: ApproachPattern | undefined;

      if (matches.length === 0) {
        approachId = 'fallback';
      } else {
        // Use stigmergic signals to select approach
        approachId = await this.selectWithSignals(matches, task.id, specialistId);
        selectedApproach = matches.find(m => m.approach.id === approachId)?.approach;
      }

      coordinations.push({
        taskId: task.id,
        specialistId,
        approachId,
        qualityTarget: selectedApproach?.performanceMetrics.avgQuality ?? 0.7,
        taskContext: task,
        approachMetadata: selectedApproach
          ? {
              name: selectedApproach.name,
              signature: selectedApproach.patternSignature,
              style: selectedApproach.styleCharacteristics,
              expectedQuality: selectedApproach.performanceMetrics.avgQuality,
            }
          : undefined,
      });
    }

    console.log(`\n✅ Generated ${coordinations.length} parallel coordinations`);

    // Final safety: ensure at least one coordination exists
    if (coordinations.length === 0) {
      console.warn(`⚠️ No coordinations generated - returning fallback coordination`);
      const fallbackSpecialistId = topSpecialists[0]?.specialistId ?? (await this.adaptiveLayer.matchOrCreateSpecialist(task));
      return {
        taskId: task.id,
        specialistId: fallbackSpecialistId,
        approachId: 'fallback',
        qualityTarget: 0.7,
        taskContext: task,
        approachMetadata: undefined,
        alternativeSpecialists: [],
      };
    }

    return {
      taskId: task.id,
      specialistId: coordinations[0].specialistId, // Primary specialist
      approachId: coordinations[0].approachId,
      qualityTarget: coordinations[0].qualityTarget,
      taskContext: task,
      approachMetadata: coordinations[0].approachMetadata,
      alternativeSpecialists: coordinations.slice(1).map(c => ({
        specialistId: c.specialistId,
        resonance: specialistResonances.get(c.specialistId) ?? 0,
      })),
    };
  }

  /**
   * Get coordination decision (NO LLM execution)
   * 
   * Returns specialist, approach, and style guidance for LLM.
   */
  async getCoordination(task: TaskContext): Promise<CoordinationResult> {
    console.log(`\n🎯 Hybrid Coordination`);
    console.log(`   Prompt: "${task.prompt.substring(0, 60)}..."`);

    // Layer 1: Adaptive Resonance
    const specialistId = await this.adaptiveLayer.matchOrCreateSpecialist(task);

    // Layer 2: Dynamic Approaches
    console.log(`\n🔍 Layer 2: Dynamic Approaches`);
    const matches = await this.approachManager.matchApproaches(task, 0.1, 3);

    if (matches.length === 0) {
      console.log(`   No matches - using fallback`);
      return {
        taskId: task.id,
        specialistId,
        approachId: 'fallback',
        qualityTarget: 0.7,
        taskContext: task,
      };
    }

    console.log(`   Found ${matches.length} matches:`);
    matches.forEach(({ approach, score }) => {
      console.log(`     - ${approach.name}: ${score.toFixed(3)}`);
    });

    // Layer 3: Stigmergic Signals
    console.log(`\n🔍 Layer 3: Stigmergic Coordination`);
    const approachId = await this.selectWithSignals(matches, task.id, specialistId);
    const selectedApproach = matches.find(m => m.approach.id === approachId)?.approach;

    console.log(`   Selected: ${selectedApproach?.name ?? approachId}`);
    console.log(`   Quality target: ${selectedApproach?.performanceMetrics.avgQuality.toFixed(2) ?? '0.70'}`);

    return {
      taskId: task.id,
      specialistId,
      approachId,
      qualityTarget: selectedApproach?.performanceMetrics.avgQuality ?? 0.7,
      taskContext: task,
      approachMetadata: selectedApproach
        ? {
            name: selectedApproach.name,
            signature: selectedApproach.patternSignature,
            style: selectedApproach.styleCharacteristics,
            expectedQuality: selectedApproach.performanceMetrics.avgQuality,
          }
        : undefined,
    };
  }

  /**
   * Select approach from matches using signals
   * 
   * Blends pattern match score (70%) with signal strength (30%)
   */
  private async selectWithSignals(
    matches: Array<{ approach: ApproachPattern; score: number }>,
    taskId: string,
    specialistId: string
  ): Promise<string> {
    const signals = await this.stigmergicBoard.readSignals(taskId, specialistId);
    const signalMap = new Map(signals.map(s => [s.approach, s.strength]));

    const scored = matches.map(({ approach, score }) => {
      const signalStrength = signalMap.get(approach.id) ?? 0;
      const combined = 0.7 * score + 0.3 * (signalStrength / 100);
      return { approachId: approach.id, score: combined };
    });

    scored.sort((a, b) => b.score - a.score);

    console.log(`   Blending scores (70% pattern + 30% signals):`);
    scored.slice(0, 3).forEach(s => {
      console.log(`     - ${s.approachId}: ${s.score.toFixed(3)}`);
    });

    return scored[0].approachId;
  }

  /**
   * Record execution result - updates all layers
   */
  async recordExecutionResult(result: {
    taskId: string;
    specialistId: string;
    approachId: string;
    quality: number;
    success: boolean;
    taskContext: TaskContext;
    content?: string;
    executionTimeMs?: number;
    qualityTarget?: number;
  }): Promise<void> {
    console.log(`\n📊 Recording Result`);
    console.log(`   Quality: ${result.quality.toFixed(2)}`);
    console.log(`   Success: ${result.success}`);

    // Update all three layers
    await this.adaptiveLayer.recordExecution(
      result.specialistId,
      result.success,
      result.quality
    );

    await this.stigmergicBoard.depositSignal(
      result.taskId,
      result.approachId,
      result.quality,
      result.specialistId
    );

    await this.approachManager.recordExecution(
      result.approachId,
      result.quality,
      result.success
    );

    // Analyze content if provided (for pattern discovery)
    let contentFeatures = null;
    let fullContent: string | undefined = undefined;
    
    if (result.content) {
      const analyzer = new ContentAnalyzer();
      contentFeatures = analyzer.analyzeContent(result.content);
      fullContent = result.content;
      console.log(`   Content analyzed: ${contentFeatures.totalLength} chars, ${contentFeatures.sectionCount} sections`);
    }

    // Save to history with rich data
    const record: ExecutionRecord = {
      recordId: `exec_${result.taskId}_${Date.now()}`,
      timestamp: new Date(),
      taskContext: result.taskContext,
      specialistId: result.specialistId,
      approachId: result.approachId,
      qualityTarget: result.qualityTarget ?? 0.8,
      actualQuality: result.quality,
      success: result.success,
      executionTimeMs: result.executionTimeMs ?? 0,
      contentFeatures,
      fullContent,
    };

    await this.historyStore.saveRecord(record);
    this.executionCount++;

    if (this.executionCount % this.patternDiscoveryThreshold === 0) {
      console.log(`\n🔍 Pattern discovery ready (${this.executionCount} executions)`);
    }
  }

  /**
   * Check if pattern discovery is ready
   */
  isPatternDiscoveryReady(): boolean {
    return this.executionCount % this.patternDiscoveryThreshold === 0;
  }

  /**
   * Get current execution count
   */
  getExecutionCount(): number {
    return this.executionCount;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stigmergicBoard.dispose();
    this.approachManager.clearCache();
  }
}
