# Phase 2: TypeScript Integration Layer

## Phase Overview

**Goal:** Build a robust TypeScript integration layer that connects the Node.js backend to the Python ADDM service

**Prerequisites:**
- Phase 1 complete (Python ADDM service running)
- Node.js 18+ with TypeScript
- Existing Hybrid-Swarm backend accessible
- Python service accessible at `http://localhost:8000`

**Estimated Duration:** 7-10 days

**Key Deliverables:**
- ADDMClient for HTTP communication with Python service
- Complete TypeScript type definitions matching Python models
- ADDMLoopManager for iteration state management
- SwarmADDMBridge for coordinating ADDM with swarm
- Comprehensive error handling and retry logic
- Integration with existing stores

## Step-by-Step Implementation

### Step 1: TypeScript Type Definitions

**Purpose:** Create type-safe interfaces matching the Python Pydantic models

**Duration:** 3-4 hours

#### Instructions

Create TypeScript interfaces that exactly match the Python models for type safety across the stack.

#### Code Example: `src/types/addm.types.ts`

```typescript
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
  
  /** Generated prompt for next iteration (if enhance/research) */
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
```

#### Verification

- [ ] All interfaces defined
- [ ] Types match Python Pydantic models
- [ ] Optional fields marked correctly
- [ ] Enums use TypeScript string literals

---

### Step 2: ADDM Client Implementation

**Purpose:** Create HTTP client for communicating with Python ADDM service

**Duration:** 4-6 hours

#### Instructions

Build a robust HTTP client with retry logic, timeout handling, and error recovery.

#### Code Example: `src/services/ADDMClient.ts`

```typescript
/**
 * ADDM Client
 * HTTP client for Python ADDM service
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ADDMDecisionRequest,
  ADDMDecisionResponse,
  ADDMHealthResponse,
  ADDMErrorResponse,
  ADDMConfig
} from '../types/addm.types';

export class ADDMClient {
  private client: AxiosInstance;
  private config: ADDMConfig;
  
  constructor(config: ADDMConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.serviceUrl,
      timeout: config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }
  
  /**
   * Check if ADDM service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<ADDMHealthResponse>('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('[ADDMClient] Health check failed:', error);
      return false;
    }
  }
  
  /**
   * Make ADDM decision with retry logic
   */
  async makeDecision(
    request: ADDMDecisionRequest
  ): Promise<ADDMDecisionResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        console.log(
          `[ADDMClient] Making decision (attempt ${attempt + 1}/${this.config.maxRetries})`,
          { iteration: request.iteration }
        );
        
        const response = await this.client.post<ADDMDecisionResponse>(
          '/api/v1/decide',
          request
        );
        
        console.log(
          `[ADDMClient] Decision received: ${response.data.decision}`,
          {
            confidence: response.data.confidence,
            reaction_time: response.data.reaction_time,
          }
        );
        
        return response.data;
        
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[ADDMClient] Decision attempt ${attempt + 1} failed:`,
          error
        );
        
        // Don't retry on validation errors (4xx)
        if (this.isClientError(error)) {
          throw this.transformError(error);
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries failed
    throw new Error(
      `ADDM decision failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }
  
  /**
   * Get service status
   */
  async getStatus(): Promise<Record<string, any>> {
    try {
      const response = await this.client.get('/api/v1/status');
      return response.data;
    } catch (error) {
      console.error('[ADDMClient] Status check failed:', error);
      throw this.transformError(error);
    }
  }
  
  /**
   * Handle axios errors
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as ADDMErrorResponse;
      console.error('[ADDMClient] Server error:', {
        status: error.response.status,
        error: data.error,
        message: data.message,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('[ADDMClient] No response from server');
    } else {
      // Error setting up request
      console.error('[ADDMClient] Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
  
  /**
   * Transform axios error to readable error
   */
  private transformError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const data = error.response.data as ADDMErrorResponse;
        return new Error(
          `ADDM service error (${error.response.status}): ${data.message || error.message}`
        );
      } else if (error.request) {
        return new Error('ADDM service not reachable');
      }
    }
    
    return error instanceof Error ? error : new Error(String(error));
  }
  
  /**
   * Check if error is client error (4xx)
   */
  private isClientError(error: any): boolean {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.status >= 400 && error.response.status < 500;
    }
    return false;
  }
  
  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Update client configuration
   */
  updateConfig(config: Partial<ADDMConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update axios instance
    this.client.defaults.baseURL = this.config.serviceUrl;
    this.client.defaults.timeout = this.config.requestTimeout;
  }
}
```

#### Verification

- [ ] Client instantiates correctly
- [ ] Health check works
- [ ] Decision requests succeed
- [ ] Retry logic functions properly
- [ ] Errors are handled gracefully
- [ ] Exponential backoff works

---

### Step 3: ADDM Loop Manager

**Purpose:** Manage iteration state and loop execution

**Duration:** 5-6 hours

#### Instructions

Create a manager class that handles loop state, decision history, and aggregation.

#### Code Example: `src/services/ADDMLoopManager.ts`

```typescript
/**
 * ADDM Loop Manager
 * Manages iteration state and loop execution
 */
import { v4 as uuidv4 } from 'uuid';
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
    const loopId = uuidv4();
    
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
      content,
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
    this.currentLoop.aggregatedContent += '\n\n' + content;
    
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
    
    // Keep last 80% of context
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
```

#### Verification

- [ ] Loop initializes correctly
- [ ] Iteration state tracks properly
- [ ] Content aggregation works
- [ ] Context summarization triggers
- [ ] Loop completes on decision or max iterations
- [ ] Execution result returns correct data

---

### Step 4: Swarm-ADDM Bridge

**Purpose:** Coordinate ADDM loop with Hybrid-Swarm orchestrator

**Duration:** 5-7 hours

#### Instructions

Create a bridge that integrates ADDM loop control with the existing swarm coordination.

#### Code Example: `src/services/SwarmADDMBridge.ts`

```typescript
/**
 * Swarm-ADDM Bridge
 * Coordinates ADDM loop with Hybrid-Swarm orchestrator
 */
import type {
  ADDMConfig,
  ADDMDecisionResponse,
  ADDMExecutionResult,
} from '../types/addm.types';
import { ADDMLoopManager } from './ADDMLoopManager';
import type { HybridSwarmOrchestrator } from './HybridSwarmOrchestrator';
import type { CoordinationResult, SwarmResponse } from '../types/swarm.types';

export interface ADDMExecutionOptions {
  /** Initial user prompt */
  initialPrompt: string;
  
  /** Session ID for execution tracking */
  sessionId: string;
  
  /** User ID */
  userId: string;
  
  /** On progress callback */
  onProgress?: (iteration: number, decision: ADDMDecisionResponse) => void;
  
  /** On content callback (for streaming display) */
  onContent?: (content: string, iteration: number) => void;
}

export class SwarmADDMBridge {
  private loopManager: ADDMLoopManager;
  private orchestrator: HybridSwarmOrchestrator;
  
  constructor(
    config: ADDMConfig,
    orchestrator: HybridSwarmOrchestrator
  ) {
    this.loopManager = new ADDMLoopManager(config);
    this.orchestrator = orchestrator;
  }
  
  /**
   * Execute ADDM loop with swarm coordination
   */
  async executeADDMLoop(
    options: ADDMExecutionOptions
  ): Promise<ADDMExecutionResult> {
    const { initialPrompt, sessionId, userId, onProgress, onContent } = options;
    
    console.log('[SwarmADDMBridge] Starting ADDM loop execution', {
      sessionId,
      initialPrompt: initialPrompt.slice(0, 100),
    });
    
    // Check service health before starting
    const isHealthy = await this.loopManager.checkServiceHealth();
    if (!isHealthy) {
      throw new Error(
        'ADDM service is not available. Please check service health.'
      );
    }
    
    // Initialize loop
    const loopState = this.loopManager.initializeLoop();
    
    let currentPrompt = initialPrompt;
    
    try {
      while (loopState.isActive) {
        const iteration = loopState.iteration;
        
        console.log(`[SwarmADDMBridge] Iteration ${iteration} starting`);
        
        // Step 1: Get swarm coordination for this iteration
        const coordination = await this.getSwarmCoordination(
          currentPrompt,
          iteration
        );
        
        console.log(
          `[SwarmADDMBridge] Coordination: ${coordination.specialist.name} + ${coordination.approach.name}`
        );
        
        // Step 2: Execute with selected specialist
        const swarmResponse = await this.executeWithSwarm(
          coordination,
          currentPrompt,
          sessionId,
          userId
        );
        
        // Call content callback
        if (onContent) {
          onContent(swarmResponse.content, iteration);
        }
        
        // Step 3: Make ADDM decision
        const decision = await this.loopManager.makeIterationDecision(
          swarmResponse.content
        );
        
        console.log(
          `[SwarmADDMBridge] ADDM decision: ${decision.decision}` +
          ` (confidence: ${decision.confidence.toFixed(2)})`
        );
        
        // Call progress callback
        if (onProgress) {
          onProgress(iteration, decision);
        }
        
        // Step 4: Check if loop should continue
        if (decision.decision === 'complete') {
          console.log('[SwarmADDMBridge] Loop complete');
          break;
        }
        
        // Step 5: Generate next prompt
        currentPrompt = decision.next_prompt || this.generateContinuationPrompt(
          decision.decision,
          swarmResponse.content,
          iteration
        );
        
        // Safety check for max iterations
        const currentLoop = this.loopManager.getCurrentLoop();
        if (currentLoop && currentLoop.iteration >= currentLoop.maxIterations) {
          console.log('[SwarmADDMBridge] Max iterations reached');
          break;
        }
      }
      
      // Get final result
      const result = this.loopManager.getExecutionResult();
      
      console.log('[SwarmADDMBridge] ADDM loop execution complete', {
        iterations: result.iterations,
        decision: result.finalDecision,
        totalTime: result.totalExecutionTime,
      });
      
      return result;
      
    } catch (error) {
      console.error('[SwarmADDMBridge] ADDM loop execution failed:', error);
      
      // Try to get partial result
      const currentLoop = this.loopManager.getCurrentLoop();
      if (currentLoop) {
        this.loopManager.cancelLoop();
        const partialResult = this.loopManager.getExecutionResult();
        
        return {
          ...partialResult,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Get swarm coordination for iteration
   */
  private async getSwarmCoordination(
    prompt: string,
    iteration: number
  ): Promise<CoordinationResult> {
    // Use orchestrator's standard coordination logic
    const coordination = await this.orchestrator.getCoordination({
      task: prompt,
      context: {
        iteration,
        isADDMLoop: true,
      },
    });
    
    return coordination;
  }
  
  /**
   * Execute with swarm (single specialist)
   */
  private async executeWithSwarm(
    coordination: CoordinationResult,
    prompt: string,
    sessionId: string,
    userId: string
  ): Promise<SwarmResponse> {
    // Execute using the existing swarm execution path
    const response = await this.orchestrator.execute({
      coordination,
      prompt,
      sessionId,
      userId,
    });
    
    // Record execution in history (for learning)
    await this.orchestrator.recordExecutionResult({
      sessionId,
      userId,
      specialist: coordination.specialist,
      approach: coordination.approach,
      prompt,
      response: response.content,
      metadata: {
        isADDMIteration: true,
      },
    });
    
    return response;
  }
  
  /**
   * Generate continuation prompt based on decision
   */
  private generateContinuationPrompt(
    decision: 'enhance' | 'research',
    previousContent: string,
    iteration: number
  ): string {
    if (decision === 'enhance') {
      return (
        `Enhance and refine the previous response. ` +
        `Iteration ${iteration + 1}: Focus on improving quality, ` +
        `clarity, and completeness.\n\n` +
        `Previous response:\n${previousContent.slice(0, 500)}...`
      );
    } else {
      // research
      return (
        `Research and expand on the previous response. ` +
        `Iteration ${iteration + 1}: Gather additional information ` +
        `and provide more comprehensive coverage.\n\n` +
        `Previous response:\n${previousContent.slice(0, 500)}...`
      );
    }
  }
  
  /**
   * Cancel current ADDM loop
   */
  cancelLoop(): void {
    this.loopManager.cancelLoop();
  }
  
  /**
   * Update ADDM configuration
   */
  updateConfig(config: Partial<ADDMConfig>): void {
    this.loopManager.updateConfig(config);
  }
}
```

#### Verification

- [ ] Bridge coordinates with orchestrator
- [ ] Each iteration uses swarm coordination
- [ ] Execution results are recorded
- [ ] Loop continues until ADDM decides to complete
- [ ] Callbacks fire correctly
- [ ] Cancellation works

---

### Step 5: Integration with Existing Stores

**Purpose:** Integrate ADDM state with Zustand stores

**Duration:** 3-4 hours

#### Instructions

Create a Zustand store for ADDM configuration and state management.

#### Code Example: `src/stores/ADDMStore.ts`

```typescript
/**
 * ADDM Store
 * Zustand store for ADDM configuration and state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ADDMConfig,
  ADDMLoopState,
  WorkflowMode,
} from '../types/addm.types';

interface ADDMStore {
  // Configuration
  config: ADDMConfig;
  updateConfig: (updates: Partial<ADDMConfig>) => void;
  resetConfig: () => void;
  
  // Loop state
  currentLoop: ADDMLoopState | null;
  setCurrentLoop: (loop: ADDMLoopState | null) => void;
  
  // UI state
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  
  // Service health
  serviceHealth: boolean;
  setServiceHealth: (healthy: boolean) => void;
  lastHealthCheck: Date | null;
  setLastHealthCheck: (date: Date) => void;
}

const DEFAULT_CONFIG: ADDMConfig = {
  enabled: false,
  workflowMode: 'research_assembly',
  maxIterations: 10,
  confidenceThreshold: 0.85,
  contextSummarizationThreshold: 32000,
  serviceUrl: 'http://localhost:8000',
  requestTimeout: 30000,
  maxRetries: 3,
};

export const useADDMStore = create<ADDMStore>()(
  persist(
    (set, get) => ({
      // Configuration
      config: DEFAULT_CONFIG,
      
      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },
      
      resetConfig: () => {
        set({ config: DEFAULT_CONFIG });
      },
      
      // Loop state
      currentLoop: null,
      
      setCurrentLoop: (loop) => {
        set({ currentLoop: loop });
      },
      
      // UI state
      isExecuting: false,
      
      setIsExecuting: (executing) => {
        set({ isExecuting: executing });
      },
      
      // Service health
      serviceHealth: false,
      
      setServiceHealth: (healthy) => {
        set({ serviceHealth: healthy });
      },
      
      lastHealthCheck: null,
      
      setLastHealthCheck: (date) => {
        set({ lastHealthCheck: date });
      },
    }),
    {
      name: 'addm-store',
      partialize: (state) => ({
        // Only persist configuration
        config: state.config,
      }),
    }
  )
);

// Selector hooks for convenience
export const useADDMConfig = () => useADDMStore((state) => state.config);
export const useADDMEnabled = () => useADDMStore((state) => state.config.enabled);
export const useCurrentLoop = () => useADDMStore((state) => state.currentLoop);
export const useADDMExecuting = () => useADDMStore((state) => state.isExecuting);
export const useADDMServiceHealth = () => useADDMStore((state) => state.serviceHealth);
```

#### Verification

- [ ] Store initializes with defaults
- [ ] Config updates persist
- [ ] Loop state updates reactively
- [ ] Selector hooks work correctly
- [ ] State persists across page reloads

---

### Step 6: Error Handling & Logging

**Purpose:** Comprehensive error handling and logging strategy

**Duration:** 2-3 hours

#### Code Example: `src/utils/addmLogger.ts`

```typescript
/**
 * ADDM Logger
 * Structured logging for ADDM operations
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  loopId?: string;
  iteration?: number;
  decision?: string;
  [key: string]: any;
}

export class ADDMLogger {
  private prefix = '[ADDM]';
  
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.format(LogLevel.DEBUG, message, context));
    }
  }
  
  info(message: string, context?: LogContext): void {
    console.log(this.format(LogLevel.INFO, message, context));
  }
  
  warn(message: string, context?: LogContext): void {
    console.warn(this.format(LogLevel.WARN, message, context));
  }
  
  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.format(LogLevel.ERROR, message, context));
    if (error) {
      console.error(error);
    }
  }
  
  private format(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}${contextStr}`;
  }
}

export const addmLogger = new ADDMLogger();
```

#### Verification

- [ ] Logging works at all levels
- [ ] Context is captured correctly
- [ ] Errors include stack traces
- [ ] Debug logging only in development

---

## Testing Procedures

### Unit Tests

```typescript
// Example: ADDMClient.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ADDMClient } from '../services/ADDMClient';

describe('ADDMClient', () => {
  let client: ADDMClient;
  
  beforeEach(() => {
    client = new ADDMClient({
      serviceUrl: 'http://localhost:8000',
      requestTimeout: 5000,
      maxRetries: 2,
      // ... other config
    });
  });
  
  it('should perform health check', async () => {
    const healthy = await client.healthCheck();
    expect(healthy).toBe(true);
  });
  
  it('should make decision request', async () => {
    const decision = await client.makeDecision({
      content: 'Test content',
      context: '',
      workflow_mode: 'research_assembly',
      iteration: 0,
      confidence_threshold: 0.85,
      max_iterations: 5,
    });
    
    expect(decision.decision).toMatch(/enhance|research|complete/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
});
```

### Integration Tests

```typescript
// Example: SwarmADDMBridge.test.ts
import { describe, it, expect } from 'vitest';
import { SwarmADDMBridge } from '../services/SwarmADDMBridge';

describe('SwarmADDMBridge', () => {
  it('should execute ADDM loop', async () => {
    const bridge = new SwarmADDMBridge(config, orchestrator);
    
    const result = await bridge.executeADDMLoop({
      initialPrompt: 'Test prompt',
      sessionId: 'test-session',
      userId: 'test-user',
    });
    
    expect(result.success).toBe(true);
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.content).toBeTruthy();
  });
});
```

---

## Troubleshooting

### Issue 1: TypeScript Compilation Errors

**Solutions:**
- Verify all types are properly imported
- Check for missing dependencies
- Run `npm run type-check`

### Issue 2: ADDM Client Connection Fails

**Solutions:**
- Verify Python service is running
- Check `serviceUrl` in config
- Test with curl: `curl http://localhost:8000/health`

### Issue 3: Loop Manager State Inconsistent

**Solutions:**
- Check loop initialization
- Verify state updates in dev tools
- Add debug logging

---

## Next Steps

✅ **Phase 2 Complete when:**
- All TypeScript types defined
- ADDMClient works with Python service
- Loop manager tracks state correctly
- Bridge coordinates with orchestrator
- Store integrates with UI
- Tests pass

**Proceed to:** Phase 3 - React Frontend Integration

---

**Phase 2 Character Count:** ~38,000
