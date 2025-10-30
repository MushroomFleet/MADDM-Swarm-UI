/**
 * ADDM Loop Manager
 * Manages iteration state and loop execution
 */
import { nanoid } from 'nanoid';
import type {
  ADDMConfig,
  ADDMDecision,
  ADDMDecisionRequest,
  ADDMDecisionResponse,
  ADDMLoopState,
  ADDMExecutionResult,
} from '../types/addm.types';
import { ADDMClient } from './ADDMClient';

export class ADDMLoopManager {
  private client: ADDMClient;
  private config: ADDMConfig;
  private currentLoop: ADDMLoopState | null = null;

  constructor(config: ADDMConfig) {
    this.config = config;
    this.client = new ADDMClient(config);
  }

  /**
   * Initialize a new ADDM loop
   */
  initializeLoop(): ADDMLoopState {
    const loopId = nanoid();

    this.currentLoop = {
      loopId,
      iteration: 0,
      isActive: true,
      aggregatedContent: '',
      currentContext: '',
      decisionHistory: [],
      totalExecutionTime: 0,
      startedAt: new Date(),
      completedAt: null,
      finalDecision: null,
    };

    console.log(`[ADDMLoopManager] Initialized loop ${loopId}`);

    return this.currentLoop;
  }

  /**
   * Get current loop state
   */
  getCurrentLoop(): ADDMLoopState | null {
    return this.currentLoop;
  }

  /**
   * Make decision for current iteration
   */
  async makeIterationDecision(
    content: string,
  ): Promise<ADDMDecisionResponse> {
    if (!this.currentLoop) {
      throw new Error('No active loop. Call initializeLoop() first.');
    }

    if (!this.currentLoop.isActive) {
      throw new Error('Loop is not active');
    }

    const startTime = Date.now();

    // Build decision request
    const request: ADDMDecisionRequest = {
      content: content.trim(),
      context: this.currentLoop.currentContext,
      workflow_mode: this.config.workflowMode,
      iteration: this.currentLoop.iteration,
      confidence_threshold: this.config.confidenceThreshold,
      max_iterations: this.config.maxIterations,
    };

    // Call ADDM service
    const decision = await this.client.makeDecision(request);

    const executionTime = Date.now() - startTime;

    // Update loop state
    this.updateLoopState(decision, content, executionTime);

    return decision;
  }

  /**
   * Update loop state after decision
   */
  private updateLoopState(
    decision: ADDMDecisionResponse,
    content: string,
    executionTime: number
  ): void {
    if (!this.currentLoop) return;

    // Add to decision history
    this.currentLoop.decisionHistory.push(decision);

    // Aggregate content
    if (this.currentLoop.aggregatedContent) {
      this.currentLoop.aggregatedContent += '\n\n' + content.trim();
    } else {
      this.currentLoop.aggregatedContent = content.trim();
    }

    // Update context (with summarization if needed)
    if (decision.should_summarize) {
      this.currentLoop.currentContext = this.summarizeContext(
        this.currentLoop.aggregatedContent
      );
    } else {
      this.currentLoop.currentContext = this.currentLoop.aggregatedContent;
    }

    // Update execution time
    this.currentLoop.totalExecutionTime += executionTime;

    // Increment iteration
    this.currentLoop.iteration++;

    // Check if loop should complete
    if (decision.decision === 'complete') {
      this.completeLoop(decision.decision);
    } else if (this.currentLoop.iteration >= this.config.maxIterations) {
      console.warn(
        `[ADDMLoopManager] Max iterations (${this.config.maxIterations}) reached`
      );
      this.completeLoop('complete');
    }

    console.log(`[ADDMLoopManager] Loop state updated`, {
      loopId: this.currentLoop.loopId,
      iteration: this.currentLoop.iteration,
      decision: decision.decision,
      isActive: this.currentLoop.isActive,
    });
  }

  /**
   * Summarize context when it exceeds threshold
   */
  private summarizeContext(context: string): string {
    // Simple truncation strategy
    // In production, could use LLM summarization
    const maxLength = this.config.contextSummarizationThreshold;

    if (context.length <= maxLength) {
      return context;
    }

    console.log(
      `[ADDMLoopManager] Context exceeds ${maxLength} chars, truncating`
    );

    // Keep most recent 80% of context
    const keepLength = Math.floor(maxLength * 0.8);
    return '...[previous content truncated]...\n\n' +
           context.slice(-keepLength);
  }

  /**
   * Complete the current loop
   */
  private completeLoop(finalDecision: ADDMDecision): void {
    if (!this.currentLoop) return;

    this.currentLoop.isActive = false;
    this.currentLoop.completedAt = new Date();
    this.currentLoop.finalDecision = finalDecision;

    console.log(
      `[ADDMLoopManager] Loop ${this.currentLoop.loopId} completed`,
      {
        iterations: this.currentLoop.iteration,
        decision: finalDecision,
        totalTime: this.currentLoop.totalExecutionTime,
      }
    );
  }

  /**
   * Get execution result
   */
  getExecutionResult(): ADDMExecutionResult {
    if (!this.currentLoop) {
      throw new Error('No loop to get result from');
    }

    return {
      success: this.currentLoop.completedAt !== null,
      content: this.currentLoop.aggregatedContent,
      iterations: this.currentLoop.iteration,
      finalDecision: this.currentLoop.finalDecision || 'complete',
      decisionHistory: this.currentLoop.decisionHistory,
      totalExecutionTime: this.currentLoop.totalExecutionTime,
    };
  }

  /**
   * Cancel current loop
   */
  cancelLoop(): void {
    if (this.currentLoop && this.currentLoop.isActive) {
      console.log(
        `[ADDMLoopManager] Cancelling loop ${this.currentLoop.loopId}`
      );
      this.completeLoop('complete');
    }
  }

  /**
   * Check if ADDM service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    return this.client.healthCheck();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ADDMConfig>): void {
    this.config = { ...this.config, ...config };
    this.client.updateConfig(this.config);
  }
}
