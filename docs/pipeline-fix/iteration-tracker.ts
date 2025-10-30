/**
 * Iteration Tracker for ADDM Decision History
 * Captures and manages metadata for each ADDM loop iteration
 */

import { AgentNotes } from './labeling-schema';

export interface IterationMetrics {
  iteration: number;
  decision: 'research' | 'enhance' | 'complete';
  confidence: number;
  reasoning: string;
  timestamp: string;
  contentLength?: number;
  executionTimeMs?: number;
  specialistId?: string;
  approachId?: string;
  qualityScore?: number;
  refinementStrategy?: any;
}

export interface LoopMetadata {
  sessionId: string;
  startTime: number;
  totalIterations: number;
  currentIteration: number;
  totalExecutionTime?: number;
  finalDecision?: 'complete';
  finalConfidence?: number;
  overallQuality?: number;
  loopComplete?: boolean;
}

export class IterationTracker {
  private iterations: IterationMetrics[] = [];
  public metadata: LoopMetadata;
  public agentNotes: AgentNotes;

  constructor(sessionId: string, initialPrompt: string) {
    this.metadata = {
      sessionId,
      startTime: Date.now(),
      totalIterations: 0,
      currentIteration: 0,
    };

    this.agentNotes = {
      sessionStart: new Date().toISOString(),
      totalIterations: 0,
      decisions: [],
      finalOutcome: {
        success: false,
        qualityScore: 0,
        executionTime: 0,
      },
    };

    console.log(`[IterationTracker] Started tracking session: ${sessionId}`);
  }

  /**
   * Record an ADDM decision and iteration details
   */
  recordIteration(metrics: Partial<IterationMetrics>): void {
    const iterationNumber = this.metadata.currentIteration;

    const fullMetrics: IterationMetrics = {
      iteration: iterationNumber,
      decision: 'research', // default
      confidence: 0.5,
      reasoning: '',
      timestamp: new Date().toISOString(),
      ...metrics,
    };

    this.iterations.push(fullMetrics);
    this.metadata.totalIterations = this.iterations.length;
    this.metadata.currentIteration++;

    // Update agent notes
    this.agentNotes.decisions.push({
      iteration: fullMetrics.iteration,
      decision: fullMetrics.decision,
      confidence: fullMetrics.confidence,
      reasoning: fullMetrics.reasoning,
      timestamp: fullMetrics.timestamp,
      refinementStrategy: fullMetrics.refinementStrategy,
    });

    console.log(`[IterationTracker] Recorded iteration ${iterationNumber}: ${fullMetrics.decision} (${fullMetrics.confidence.toFixed(2)})`);
  }

  /**
   * Update iteration metrics after execution
   */
  updateIterationMetrics(iteration: number, updates: Partial<Omit<IterationMetrics, 'iteration' | 'decision' | 'timestamp'>>): void {
    const iterationRecord = this.iterations.find(i => i.iteration === iteration);
    if (iterationRecord) {
      Object.assign(iterationRecord, updates);
    } else {
      console.warn(`[IterationTracker] Iteration ${iteration} not found for update`);
    }
  }

  /**
   * Mark loop as complete and record final metrics
   */
  completeLoop(finalMetrics?: {
    decision?: 'complete';
    confidence?: number;
    qualityScore?: number;
  }): void {
    const endTime = Date.now();
    this.metadata.totalExecutionTime = endTime - this.metadata.startTime;
    this.metadata.loopComplete = true;

    if (finalMetrics) {
      this.metadata.finalDecision = finalMetrics.decision || 'complete';
      this.metadata.finalConfidence = finalMetrics.confidence || 0.9;
      this.metadata.overallQuality = finalMetrics.qualityScore || 0.8;
    }

    // Update agent notes final outcome
    this.agentNotes.totalIterations = this.metadata.totalIterations;
    this.agentNotes.finalOutcome = {
      success: true,
      qualityScore: this.metadata.overallQuality || 85,
      executionTime: this.metadata.totalExecutionTime,
    };

    console.log(`[IterationTracker] Loop completed: ${this.metadata.totalIterations} iterations, ${this.metadata.totalExecutionTime}ms`);
  }

  /**
   * Get current iteration number
   */
  getCurrentIteration(): number {
    return this.metadata.currentIteration;
  }

  /**
   * Get all recorded iterations
   */
  getAllIterations(): IterationMetrics[] {
    return [...this.iterations];
  }

  /**
   * Get specific iteration details
   */
  getIteration(iteration: number): IterationMetrics | null {
    return this.iterations.find(i => i.iteration === iteration) || null;
  }

  /**
   * Get decision counts by type
   */
  getDecisionCounts(): Record<string, number> {
    const counts = {
      research: 0,
      enhance: 0,
      complete: 0,
    };

    this.iterations.forEach(iter => {
      counts[iter.decision]++;
    });

    return counts;
  }

  /**
   * Calculate performance metrics
   */
  getPerformanceMetrics(): {
    totalIterations: number;
    averageConfidence: number;
    averageContentLength: number;
    totalContentLength: number;
    decisionDistribution: Record<string, number>;
    averageIterationTime: number;
    qualityTrend: number[];
  } {
    const decisionCounts = this.getDecisionCounts();
    const confidences = this.iterations.map(i => i.confidence);
    const contentLengths = this.iterations.map(i => i.contentLength || 0).filter(l => l > 0);
    const qualityScores = this.iterations.map(i => i.qualityScore || 0).filter(q => q > 0);

    return {
      totalIterations: this.metadata.totalIterations,
      averageConfidence: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
      averageContentLength: contentLengths.length > 0 ? contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length : 0,
      totalContentLength: contentLengths.reduce((a, b) => a + b, 0),
      decisionDistribution: decisionCounts,
      averageIterationTime: this.metadata.totalExecutionTime ? this.metadata.totalExecutionTime / this.iterations.length : 0,
      qualityTrend: qualityScores,
    };
  }

  /**
   * Get structured agent notes
   */
  getAgentNotes(): AgentNotes {
    return { ...this.agentNotes };
  }

  /**
   * Get loop metadata
   */
  getLoopMetadata(): LoopMetadata {
    return { ...this.metadata };
  }

  /**
   * Export tracking data for analysis
   */
  exportData(): {
    metadata: LoopMetadata;
    iterations: IterationMetrics[];
    performance: ReturnType<IterationTracker['getPerformanceMetrics']>;
  } {
    return {
      metadata: this.getLoopMetadata(),
      iterations: this.getAllIterations(),
      performance: this.getPerformanceMetrics(),
    };
  }

  /**
   * Reset tracker (for testing)
   */
  reset(sessionId: string): void {
    this.iterations = [];
    this.metadata = {
      sessionId,
      startTime: Date.now(),
      totalIterations: 0,
      currentIteration: 0,
    };
    this.agentNotes = {
      sessionStart: new Date().toISOString(),
      totalIterations: 0,
      decisions: [],
      finalOutcome: {
        success: false,
        qualityScore: 0,
        executionTime: 0,
      },
    };
  }

  /**
   * Validate iteration sequence
   */
  validateIterationSequence(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const iterations = this.getAllIterations();

    // Check for sequential iterations
    for (let i = 0; i < iterations.length; i++) {
      if (iterations[i].iteration !== i) {
        errors.push(`Iteration ${i} missing or out of sequence`);
      }
    }

    // Check for reasonable confidence values
    iterations.forEach(iter => {
      if (iter.confidence < 0 || iter.confidence > 1) {
        errors.push(`Invalid confidence for iteration ${iter.iteration}: ${iter.confidence}`);
      }
    });

    // Check decision sequence (research can happen multiple times, enhance once, complete once)
    const enhanceIterations = iterations.filter(i => i.decision === 'enhance');
    const completeIterations = iterations.filter(i => i.decision === 'complete');

    if (enhanceIterations.length > 1) {
      errors.push('Multiple enhance decisions found');
    }
    if (completeIterations.length > 1) {
      errors.push('Multiple complete decisions found');
    }
    if (completeIterations.length === 1 && enhanceIterations.length === 1) {
      const enhanceIndex = enhanceIterations[0].iteration;
      const completeIndex = completeIterations[0].iteration;
      if (completeIndex <= enhanceIndex) {
        errors.push('Complete decision occurred before enhance decision');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Iteration Tracker Factory
 */
export class IterationTrackerFactory {
  static createForSession(sessionId: string, initialPrompt: string): IterationTracker {
    return new IterationTracker(sessionId, initialPrompt);
  }

  static createFromExistingData(sessionId: string, data: {
    metadata: LoopMetadata;
    iterations: IterationMetrics[];
  }): IterationTracker {
    const tracker = new IterationTracker(sessionId, 'restored');

    // Restore state
    Object.assign(tracker.metadata, data.metadata);
    tracker.iterations = [...data.iterations];
    tracker.agentNotes.totalIterations = data.metadata.totalIterations;
    tracker.agentNotes.decisions = data.iterations.map(iter => ({
      iteration: iter.iteration,
      decision: iter.decision,
      confidence: iter.confidence,
      reasoning: iter.reasoning,
      timestamp: iter.timestamp,
      refinementStrategy: iter.refinementStrategy,
    }));

    return tracker;
  }
}

/**
 * Usage Example:
 *
 * const tracker = IterationTrackerFactory.createForSession('session-123', 'Research AI');
 *
 * tracker.recordIteration({
 *   decision: 'research',
 *   confidence: 0.85,
 *   reasoning: 'Good structure, needs more depth',
 *   refinementStrategy: { type: 'research', focus_areas: ['theory', 'applications'] }
 * });
 *
 * tracker.updateIterationMetrics(0, { contentLength: 2500, executionTimeMs: 3500 });
 * tracker.completeLoop({ qualityScore: 0.85 });
 *
 * const notes = tracker.getAgentNotes();
 * const performance = tracker.getPerformanceMetrics();
 */
