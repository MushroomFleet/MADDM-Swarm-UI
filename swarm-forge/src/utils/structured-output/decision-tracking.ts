/**
 * Enhanced ADDM Decision Tracking and Integration
 * Seamlessly connects ADDM decisions to section creation and labeling
 */

import { OutputLabelingSchema, OutputSection, OutputSectionType } from './labeling-schema';
import { IterationTracker } from './iteration-tracker';

/**
 * ADDM Decision Response Structure (from ADDM service)
 */
export interface ADDMDecisionResponse {
  decision: 'research' | 'enhance' | 'complete';
  confidence: number;
  reaction_time: number;
  reasoning: string;
  refinement_strategy?: {
    type: 'research' | 'enhance';
    focus_areas: string[];
    constraints: string[];
    target_improvements: string[];
    research_directions?: string[];
  };
  metrics: {
    quality_score: number;
    completeness_score: number;
    improvement_potential: number;
  };
  next_prompt?: string;
  should_summarize: boolean;
  timestamp: string;
}

/**
 * Decision Processing Context
 */
export interface DecisionContext {
  iteration: number;
  previousContent?: string;
  accumulatedSections?: OutputSection[];
  sessionId: string;
  userQuery: string;
  approachMetadata?: any;
}

/**
 * Processed Decision with Section Mapping
 */
export interface ProcessedDecision {
  originalDecision: ADDMDecisionResponse;
  sectionType: OutputSectionType;
  sectionLabel: string;
  contentStrategy: 'initial' | 'expand' | 'synthesize' | 'final';
  researchIterationCount?: number;
  metadata: {
    decisionTimestamp: string;
    processingTimestamp: string;
    confidenceCategory: 'high' | 'medium' | 'low';
    improvementScore: number;
    sectionPurpose: string;
  };
}

/**
 * Enhanced ADDM Decision Tracker
 * Intercepts and enriches ADDM decisions for structured section creation
 */
export class ADDMDecisionTracker {
  private iterationTracker: IterationTracker;
  private researchCount = 0;
  private sessionId: string;

  constructor(sessionId: string, initialPrompt: string) {
    this.sessionId = sessionId;
    this.iterationTracker = new IterationTracker(sessionId, initialPrompt);
  }

  /**
   * Process ADDM decision and create section mapping
   */
  async processDecision(
    rawDecision: ADDMDecisionResponse,
    context: DecisionContext
  ): Promise<ProcessedDecision> {
    const processingTimestamp = new Date().toISOString();

    // Validate decision data
    this.validateDecision(rawDecision);

    // Map decision to section type
    const sectionConfig = this.mapDecisionToSection(rawDecision, context.iteration);

    // Create section label
    const outputId = OutputLabelingSchema.generateOutputId();
    const sectionLabel = OutputLabelingSchema.generateSectionLabel(
      outputId,
      sectionConfig.sectionType,
      context.iteration,
      sectionConfig.researchIterationCount
    );

    // Record in iteration tracker
    this.iterationTracker.recordIteration({
      decision: rawDecision.decision,
      confidence: rawDecision.confidence,
      reasoning: rawDecision.reasoning,
      contentLength: context.previousContent?.length || 0,
      specialistId: context.approachMetadata?.specialist || undefined,
      qualityScore: rawDecision.metrics.quality_score,
      refinementStrategy: rawDecision.refinement_strategy,
    });

    // Create processed decision
    const processed: ProcessedDecision = {
      originalDecision: rawDecision,
      sectionType: sectionConfig.sectionType,
      sectionLabel,
      contentStrategy: sectionConfig.contentStrategy,
      researchIterationCount: sectionConfig.researchIterationCount,
      metadata: {
        decisionTimestamp: rawDecision.timestamp,
        processingTimestamp,
        confidenceCategory: this.categorizeConfidence(rawDecision.confidence),
        improvementScore: rawDecision.metrics.improvement_potential,
        sectionPurpose: sectionConfig.sectionPurpose,
      },
    };

    console.log(`[DecisionTracker] Processed decision: ${rawDecision.decision} → ${sectionConfig.sectionType} (${processed.metadata.confidenceCategory} confidence)`);

    return processed;
  }

  /**
   * Map ADDM decision to structured section configuration
   */
  private mapDecisionToSection(
    decision: ADDMDecisionResponse,
    iteration: number
  ): {
    sectionType: OutputSectionType;
    contentStrategy: 'initial' | 'expand' | 'synthesize' | 'final';
    sectionPurpose: string;
    researchIterationCount?: number;
  } {
    switch (decision.decision) {
      case 'research':
        this.researchCount++;
        return {
          sectionType: 'research',
          contentStrategy: 'expand',
          sectionPurpose: `Research expansion focusing on: ${decision.refinement_strategy?.focus_areas?.join(', ') || 'additional insights'}`,
          researchIterationCount: this.researchCount,
        };

      case 'enhance':
        return {
          sectionType: 'enhance',
          contentStrategy: 'synthesize',
          sectionPurpose: 'Final synthesis and refinement of all accumulated content into a comprehensive response',
        };

      case 'complete':
        return {
          sectionType: 'enhance', // Complete typically triggers final enhancement
          contentStrategy: 'final',
          sectionPurpose: 'Final completion synthesis with highest quality standards',
        };

      default:
        // Fallback for unknown decisions
        console.warn(`[DecisionTracker] Unknown decision type: ${decision.decision}, defaulting to enhance`);
        return {
          sectionType: 'enhance',
          contentStrategy: 'synthesize',
          sectionPurpose: 'Default refinement synthesis due to unrecognized decision type',
        };
    }
  }

  /**
   * Create complete section from processed decision and content
   */
  createSectionFromDecision(
    processedDecision: ProcessedDecision,
    content: string
  ): OutputSection {
    const section = OutputLabelingSchema.createSection(
      this.sessionId, // Use sessionId as baseId for sections
      processedDecision.sectionType,
      this.iterationTracker.getCurrentIteration(),
      processedDecision.originalDecision.decision,
      processedDecision.researchIterationCount
    );

    section.content = content;
    section.timestamp = Date.now();

    return section;
  }

  /**
   * Get complete decision history
   */
  getDecisionHistory(): Array<{
    iteration: number;
    decision: ProcessedDecision;
    sectionCreated?: OutputSection;
  }> {
    const history = [];
    const iterations = this.iterationTracker.getAllIterations();

    for (const iter of iterations) {
      // Note: In practice, we'd store the ProcessedDecision alongside iterations
      // This is a simplified representation
      history.push({
        iteration: iter.iteration,
        decision: {
          originalDecision: {
            decision: iter.decision,
            confidence: iter.confidence,
            reasoning: iter.reasoning,
            timestamp: iter.timestamp,
            // Other fields would be populated from stored data
          } as ADDMDecisionResponse,
          // Simplified - would need to reconstruct from stored data
        } as ProcessedDecision,
      });
    }

    return history;
  }

  /**
   * Validate ADDM decision response
   */
  private validateDecision(decision: ADDMDecisionResponse): void {
    const errors: string[] = [];

    if (!['research', 'enhance', 'complete'].includes(decision.decision)) {
      errors.push(`Invalid decision type: ${decision.decision}`);
    }

    if (typeof decision.confidence !== 'number' || decision.confidence < 0 || decision.confidence > 1) {
      errors.push(`Invalid confidence value: ${decision.confidence}`);
    }

    if (!decision.reasoning || decision.reasoning.trim().length === 0) {
      errors.push('Missing reasoning');
    }

    if (!decision.metrics) {
      errors.push('Missing metrics');
    } else {
      if (typeof decision.metrics.quality_score !== 'number') {
        errors.push('Invalid quality_score');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Invalid ADDM decision: ${errors.join(', ')}`);
    }
  }

  /**
   * Categorize confidence levels
   */
  private categorizeConfidence(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats(): {
    totalDecisions: number;
    decisionDistribution: Record<string, number>;
    averageConfidence: number;
    researchIterations: number;
    sessionId: string;
  } {
    const iterations = this.iterationTracker.getAllIterations();
    const distribution = this.iterationTracker.getDecisionCounts();
    const performance = this.iterationTracker.getPerformanceMetrics();

    return {
      totalDecisions: iterations.length,
      decisionDistribution: distribution,
      averageConfidence: performance.averageConfidence,
      researchIterations: this.researchCount,
      sessionId: this.sessionId,
    };
  }

  /**
   * Complete tracking and get final report
   */
  completeTracking(): {
    stats: ReturnType<ADDMDecisionTracker['getTrackingStats']>;
    agentNotes: any; // From iteration tracker
    decisions: ReturnType<ADDMDecisionTracker['getDecisionHistory']>;
  } {
    // Mark as complete in iteration tracker
    this.iterationTracker.completeLoop({
      confidence: 0.95,
      decision: 'complete',
      qualityScore: 85,
    });

    return {
      stats: this.getTrackingStats(),
      agentNotes: this.iterationTracker.getAgentNotes(),
      decisions: this.getDecisionHistory(),
    };
  }
}

/**
 * Alternating Decision Enforcer
 * Prevents consecutive same decisions and enforces alternation
 */
export class AlternatingDecisionEnforcer {
  private lastDecision: 'research' | 'enhance' | null = null;
  private alternationEnabled: boolean = true;

  /**
   * Process decision with alternation enforcement
   */
  async enforceAlternation(
    rawDecision: ADDMDecisionResponse,
    iteration: number
  ): Promise<ADDMDecisionResponse> {
    if (!this.alternationEnabled || iteration === 0) {
      // Allow first decision as-is, or disable alternation
      this.lastDecision = rawDecision.decision === 'complete' ? null : rawDecision.decision;
      return rawDecision;
    }

    // Check for repeated decision type
    const isRepeated = this.lastDecision && rawDecision.decision === this.lastDecision;

    if (isRepeated) {
      console.warn(`[AlternatingEnforcer] Preventing repeated decision: ${rawDecision.decision} after ${this.lastDecision}`);

      // Enforce alternation by selecting alternative or forcing complete
      const alternative = this.selectAlternativeDecision(rawDecision, iteration);

      this.lastDecision = alternative.decision === 'complete' ? null : alternative.decision;
      return alternative;
    }

    // Accept non-repeated decision
    this.lastDecision = rawDecision.decision === 'complete' ? null : rawDecision.decision;
    return rawDecision;
  }

  /**
   * Select alternative decision when alternation enforced
   */
  private selectAlternativeDecision(
    repeatedDecision: ADDMDecisionResponse,
    iteration: number
  ): ADDMDecisionResponse {
    const alternatives = [];

    // If repeated research → prefer enhance
    if (repeatedDecision.decision === 'research') {
      alternatives.push(
        this.createAlternativeDecision('enhance', repeatedDecision, iteration)
      );
    }

    // If repeated enhance → prefer complete or research (based on iteration count)
    if (repeatedDecision.decision === 'enhance') {
      if (iteration >= 2) {
        // After multiple iterations, prefer complete
        alternatives.push(
          this.createAlternativeDecision('complete', repeatedDecision, iteration)
        );
      } else {
        // Early iterations, allow research
        alternatives.push(
          this.createAlternativeDecision('research', repeatedDecision, iteration)
        );
      }
    }

    // Add complete as fallback option
    alternatives.push(
      this.createAlternativeDecision('complete', repeatedDecision, iteration)
    );

    // Select based on confidence or simple priority
    return alternatives[0]; // Prefer first alternative
  }

  /**
   * Create alternative decision while preserving metadata
   */
  private createAlternativeDecision(
    newType: 'research' | 'enhance' | 'complete',
    originalDecision: ADDMDecisionResponse,
    iteration: number
  ): ADDMDecisionResponse {
    let newReasoning = '';
    let confidence = originalDecision.confidence * 0.9; // Slightly reduce confidence for alternation

    switch (newType) {
      case 'enhance':
        newReasoning = `Alternating to enhance (was: ${originalDecision.decision}). Decision changed to enforce alternation at iteration ${iteration}.`;
        break;
      case 'research':
        newReasoning = `Alternating to research (was: ${originalDecision.decision}). Decision modified for progression at iteration ${iteration}.`;
        break;
      case 'complete':
        newReasoning = `Forced completion due to repeated decisions. Alternation enforcement after multiple ${originalDecision.decision} iterations.`;
        confidence = Math.min(originalDecision.confidence + 0.1, 0.95); // Boost confidence for complete
        break;
    }

    return {
      ...originalDecision,
      decision: newType,
      reasoning: newReasoning,
      confidence,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Decision Flow Adaptor
 * Interfaces between ADDM service calls and structured tracking
 */
export class DecisionFlowAdaptor {
  private sessionId: string;
  private tracker: ADDMDecisionTracker | null = null;
  private alternator: AlternatingDecisionEnforcer | null = null;

  /**
   * Initialize for new session
   */
  initializeSession(sessionId: string, userQuery: string): void {
    this.sessionId = sessionId;
    this.tracker = new ADDMDecisionTracker(sessionId, userQuery);
    this.alternator = new AlternatingDecisionEnforcer();
  }

  /**
   * Intercept ADDM service call and process decision with alternation enforcement
   */
  async interceptDecisionCall(
    serviceCall: () => Promise<ADDMDecisionResponse>,
    context: DecisionContext
  ): Promise<ProcessedDecision> {
    if (!this.tracker || !this.alternator) {
      throw new Error('Decision components not initialized. Call initializeSession first.');
    }

    // Make the ADDM service call
    const rawDecision = await serviceCall();

    // ENFORCE ALTERNATION - KEY FEATURE
    const enforcedDecision = await this.alternator.enforceAlternation(rawDecision, context.iteration);

    if (enforcedDecision.decision !== rawDecision.decision) {
      console.log(`[DecisionFlowAdaptor] ALTERNATED: ${rawDecision.decision} (${rawDecision.confidence.toFixed(3)}) → ${enforcedDecision.decision} (${enforcedDecision.confidence.toFixed(3)})`);
    }

    // Process the enforced decision through our tracker
    const processed = await this.tracker.processDecision(enforcedDecision, context);

    return processed;
  }

  /**
   * Get current session statistics
   */
  getSessionStats() {
    return this.tracker?.getTrackingStats();
  }

  /**
   * Complete session and get final report
   */
  completeSession(): {
    stats: any;
    agentNotes: any;
    decisions: any;
  } | null {
    return this.tracker?.completeTracking() || null;
  }
}

/**
 * Integration Helpers for existing SwarmADDMBridge
 */
export class ADDMIntegrationHelpers {
  /**
   * Create section based on decision type mapping
   */
  static createSectionForDecision(
    processedDecision: ProcessedDecision,
    content: string,
    sessionId: string
  ): OutputSection {
    const baseOutputId = `${sessionId}_${processedDecision.metadata.decisionTimestamp}`;

    return OutputLabelingSchema.createSection(
      baseOutputId,
      processedDecision.sectionType,
      0, // Would need to track iteration properly
      processedDecision.originalDecision.decision,
      processedDecision.researchIterationCount
    );
  }

  /**
   * Validate decision flow integrity
   */
  static validateDecisionFlow(decisions: ProcessedDecision[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for proper sequence
    let seenResearch = false;
    let seenEnhance = false;

    for (const decision of decisions) {
      switch (decision.originalDecision.decision) {
        case 'research':
          if (seenEnhance) {
            errors.push('Research decision found after enhance decision');
          }
          seenResearch = true;
          break;

        case 'enhance':
          if (seenEnhance) {
            errors.push('Multiple enhance decisions found');
          }
          seenEnhance = true;
          break;

        case 'complete':
          // Complete can appear after any decision
          break;
      }
    }

    // Must have at least one decision
    if (decisions.length === 0) {
      errors.push('No decisions recorded');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
