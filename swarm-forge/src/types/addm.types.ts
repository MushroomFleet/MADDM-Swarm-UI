/**
 * ADDM Type Definitions
 * Matches Python Pydantic models from addm-service
 */

/** Workflow modes for ADDM decision-making */
export type WorkflowMode = 'research_assembly' | 'news_analysis';

/** Ternary decision outcomes */
export type ADDMDecision = 'enhance' | 'research' | 'complete';

/** Decision request payload sent to Python service */
export interface ADDMDecisionRequest {
  /** Current response content to evaluate */
  content: string;

  /** Previous iteration context (empty for first iteration) */
  context: string;

  /** Workflow mode for tailored assessment */
  workflow_mode: WorkflowMode;

  /** Current iteration number (0-indexed) */
  iteration: number;

  /** Confidence threshold for completion (0.0-1.0) */
  confidence_threshold: number;

  /** Maximum allowed iterations (1-20) */
  max_iterations: number;
}

/** Quality assessment metrics */
export interface QualityMetrics {
  /** Overall quality score (0.0-1.0) */
  quality_score: number;

  /** Completeness assessment (0.0-1.0) */
  completeness_score: number;

  /** Potential for improvement (0.0-1.0) */
  improvement_potential: number;
}

/** Structured refinement strategy to replace raw prompt strings */
export interface RefinementStrategy {
  /** 'enhance' or 'research' */
  type: 'enhance' | 'research';

  /** Areas to focus refinement on */
  focus_areas: string[];

  /** Constraints to maintain during refinement */
  constraints: string[];

  /** Specific improvements needed */
  target_improvements?: string[];

  /** Research directions to pursue (research mode only) */
  research_directions?: string[];

  /** Current iteration number */
  iteration: number;
}

/** Decision response from Python service */
export interface ADDMDecisionResponse {
  /** Ternary decision outcome */
  decision: ADDMDecision;

  /** Confidence in the decision (0.0-1.0) */
  confidence: number;

  /** Simulated reaction time in milliseconds */
  reaction_time: number;

  /** Human-readable explanation */
  reasoning: string;

  /** Quality metrics for the content */
  metrics: QualityMetrics;

  /** Structured refinement strategy (only for enhance/research decisions) */
  refinement_strategy: RefinementStrategy | null;

  /** Generated prompt for next iteration (if enhance/research) - DEPRECATED */
  next_prompt: string | null;

  /** Whether context exceeds summarization threshold */
  should_summarize: boolean;

  /** Decision timestamp */
  timestamp: string;
}

/** ADDM configuration for the system */
export interface ADDMConfig {
  /** Enable ADDM loop mode */
  enabled: boolean;

  /** Workflow mode */
  workflowMode: WorkflowMode;

  /** Maximum iterations (1-20) */
  maxIterations: number;

  /** Confidence threshold for completion (0.0-1.0) */
  confidenceThreshold: number;

  /** Context summarization threshold (characters) */
  contextSummarizationThreshold: number;

  /** Python service URL */
  serviceUrl: string;

  /** Request timeout in milliseconds */
  requestTimeout: number;

  /** Maximum retry attempts */
  maxRetries: number;
}

/** Loop state tracking */
export interface ADDMLoopState {
  /** Unique loop identifier */
  loopId: string;

  /** Current iteration number */
  iteration: number;

  /** Is loop currently active */
  isActive: boolean;

  /** Aggregated content from all iterations */
  aggregatedContent: string;

  /** Context for next iteration */
  currentContext: string;

  /** Decision history */
  decisionHistory: ADDMDecisionResponse[];

  /** Total execution time in milliseconds */
  totalExecutionTime: number;

  /** Loop start timestamp */
  startedAt: Date;

  /** Loop end timestamp (if complete) */
  completedAt: Date | null;

  /** Final decision that ended the loop */
  finalDecision: ADDMDecision | null;
}

/** Error response from Python service */
export interface ADDMErrorResponse {
  error: string;
  message: string;
  detail?: Record<string, any>;
}

/** Health check response */
export interface ADDMHealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
}

/** ADDM execution result */
export interface ADDMExecutionResult {
  /** Was execution successful */
  success: boolean;

  /** Final aggregated content */
  content: string;

  /** Number of iterations completed */
  iterations: number;

  /** Final ADDM decision */
  finalDecision: ADDMDecision;

  /** Decision history */
  decisionHistory: ADDMDecisionResponse[];

  /** Total execution time */
  totalExecutionTime: number;

  /** Error message (if failed) */
  error?: string;
}
