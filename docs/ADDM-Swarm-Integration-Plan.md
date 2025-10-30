# ADDM-Swarm Integration Plan

**Integration of ADDM Loop Regulator with Hybrid-Swarm System**

**Date:** 2025-01-24  
**Status:** Planning Phase  
**Version:** 2.0 (Corrected)

---

## Executive Summary

This document provides a comprehensive integration plan for adding the **ADDM (Agentic Drift-Diffusion Model) Loop Regulator** to the existing **Hybrid-Swarm** TypeScript/React application. The integration adds intelligent loop control that decides when LLM responses should be enhanced, researched further, or delivered to the user.

**Key Integration Principles:**
- Preserve stigmergic architecture (no central orchestrator changes)
- Add ADDM as optional enhancement mode (like existing parallel execution)
- Leverage existing quality analysis infrastructure
- Integrate with existing UI patterns (SwarmTrace, Settings)
- Maintain backward compatibility with standard execution modes

---

## Table of Contents

1. [System Architecture Analysis](#1-system-architecture-analysis)
2. [ADDM Core Concepts](#2-addm-core-concepts)
3. [Integration Architecture](#3-integration-architecture)
4. [Implementation Phases](#4-implementation-phases)
5. [TypeScript Type Definitions](#5-typescript-type-definitions)
6. [Execution Flow](#6-execution-flow)
7. [UI Integration](#7-ui-integration)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. System Architecture Analysis

### 1.1 Current Hybrid-Swarm Architecture

**Core Components:**
```typescript
HybridSwarmOrchestrator
├── AdaptiveResonanceOrchestrator  // Specialist matching via resonance
├── StigmergicBoard                // Signal-based coordination
├── DynamicApproachManager         // Pattern-based approach selection
└── ExecutionHistoryStore          // Learning from past executions
```

**Key Storage Layers:**
- `SpecialistsStore` - Manages specialist profiles (NOT "agents")
- `ApproachesStore` - Manages approach patterns
- `SignalsStore` - Manages stigmergic signals
- `ExecutionHistoryStore` - Execution records with content analysis

**Execution Hooks:**
- `useCoordination()` - Gets coordination decision (specialist + approach)
- `useStreamingChat()` - Executes single specialist with streaming
- `useParallelChat()` - Executes N specialists concurrently
- `useSystemStats()` - Real-time system statistics

### 1.2 Current Chat Flow

```typescript
ChatInterface.handleSendMessage(prompt)
    ↓
[Branch: config.parallelConfig.enabled?]
    ↓
├─ YES → handleParallelExecution()
│         ├─ orchestrator.getParallelCoordination(task, N)
│         ├─ executeParallel(coordination, prompt, timeout)
│         └─ Record ALL results + display winner
│
└─ NO → handleSequentialExecution()
          ├─ getCoordination(prompt)
          ├─ executeWithStreaming(coordination, prompt)
          └─ Record result + display
```

### 1.3 Stigmergic Coordination Pattern

**Signal Board Mechanism:**
- Specialists deposit signals: `{ approach, strength, successMetric }`
- Signals decay over time (configurable `decayRate`)
- Approach selection blends: 70% pattern match + 30% signal strength
- No direct specialist-to-specialist communication
- Emergent coordination through shared signal space

**ADDM Integration Constraint:** ADDM loop control must not break stigmergic independence. Each loop iteration must go through proper coordination flow.

---

## 2. ADDM Core Concepts

### 2.1 Ternary Decision Framework

```python
# ADDM provides three decision outcomes:

ENHANCE_RESPONSE     # Continue improving current response
RESEARCH_MORE        # Gather additional information  
COMPLETE_ASSEMBLY    # Deliver to user
```

### 2.2 Decision Inputs

```python
ADDMDecision(
    content: str,              # Current response content
    context: str,              # Previous iteration context
    workflow_mode: str,        # "research_assembly" | "news_analysis"
    iteration: int,            # Current loop count
    confidence_threshold: float # 0.0 - 1.0
)
```

### 2.3 Decision Outputs

```python
ADDMResult {
    decision: str,             # "enhance" | "research" | "complete"
    confidence: float,         # 0.0 - 1.0
    reaction_time: float,      # Milliseconds (DDM simulation)
    reasoning: str,            # Human-readable explanation
    metrics: {
        quality_score: float,
        completeness_score: float,
        improvement_potential: float
    },
    next_prompt: str | null,   # Generated enhancement prompt
    should_summarize: bool     # Context > 32K threshold
}
```

### 2.4 Workflow Modes

**Research Assembly Mode:**
- Assessment: Citation density, methodology rigor, evidence coverage
- Enhancement: Deeper validation, comprehensive evidence
- Termination: High confidence in scientific completeness

**News Analysis Mode:**
- Assessment: Stakeholder perspectives, historical context, impact
- Enhancement: Multiple viewpoints, background context
- Termination: Balanced coverage achieved

---

## 3. Integration Architecture

### 3.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│           React Frontend (Vite)                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │      ChatInterface Component             │  │
│  │   - handleSendMessage()                  │  │
│  │   - handleSequentialExecution()          │  │
│  │   - handleParallelExecution()            │  │
│  │   - handleADDMExecution() [NEW]          │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                   │
│  ┌──────────▼───────────────────────────────┐  │
│  │     Execution Hooks                      │  │
│  │  - useCoordination()                     │  │
│  │  - useStreamingChat()                    │  │
│  │  - useParallelChat()                     │  │
│  │  - useADDMLoop() [NEW]                   │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                   │
└─────────────┼───────────────────────────────────┘
              │
              │ REST API / WebSocket
              │
┌─────────────▼───────────────────────────────────┐
│         Backend Service (Node.js/TS)            │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │    HybridSwarmOrchestrator               │  │
│  │  - getCoordination()                     │  │
│  │  - getParallelCoordination()             │  │
│  │  - recordExecutionResult()               │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                   │
│  ┌──────────▼───────────────────────────────┐  │
│  │    ADDM Integration Service [NEW]        │  │
│  │  - ADDMClient (calls Python service)     │  │
│  │  - ADDMLoopManager (state management)    │  │
│  │  - SwarmADDMBridge (coordination)        │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                   │
└─────────────┼───────────────────────────────────┘
              │
              │ HTTP
              │
┌─────────────▼───────────────────────────────────┐
│         Python ADDM Service                     │
│  - FastAPI REST endpoints                      │
│  - LoopRegulator (ADDM engine)                 │
│  - MultiAlternativeDDM (decision simulation)   │
└─────────────────────────────────────────────────┘
```

### 3.2 Integration Strategy: ADDM as Enhancement Layer

ADDM operates **above** the Hybrid-Swarm, not within it:

```typescript
// ADDM Loop (simplified)
async function addmLoop(initialPrompt: string) {
  let content = "";
  let iteration = 0;
  
  while (iteration < maxIterations) {
    // Step 1: Get swarm coordination & execute
    const coordination = await orchestrator.getCoordination(taskContext);
    const swarmResponse = await executeWithStreaming(coordination, currentPrompt);
    
    content += swarmResponse;
    
    // Step 2: ADDM decision
    const decision = await addmClient.makeDecision(content, config, context);
    
    // Step 3: Act on decision
    if (decision.decision === "complete") {
      return { content, iterations: iteration, decision };
    }
    
    // Generate next prompt for enhancement/research
    currentPrompt = decision.nextPrompt || generatePrompt(decision, content);
    iteration++;
  }
  
  return { content, iterations: maxIterations, decision: "max_reached" };
}
```

### 3.3 Key Design Decisions

**Decision 1: ADDM Sits Above Swarm Layer**
- Each ADDM iteration uses full swarm coordination
- Preserves stigmergic independence per iteration
- No changes to specialist/signal architecture

**Decision 2: Leverage Existing Quality Analysis**
- Use `ContentAnalyzer.analyzeContent()` for quality metrics
- Feed content features to ADDM decision making
- Combine swarm quality scores with ADDM assessment

**Decision 3: Third Execution Mode**
- Standard mode: Single specialist execution
- Parallel mode: N specialists, quality voting
- ADDM mode: Single specialist, iterative enhancement ← NEW

---

## 4. Implementation Phases

### Phase 1: ADDM Service Setup (Backend) ✓

**Objective:** Containerize Python ADDM service with REST API

**Components:**
```
addm-service/
├── src/
│   ├── addm_loopregulator/          # From ADDM-Agentic-Loop-Regulator
│   ├── api/
│   │   ├── server.py                # FastAPI app
│   │   ├── routes.py                # Endpoint handlers
│   │   └── models.py                # Pydantic request/response
│   └── bridge/
│       └── converter.py             # TypeScript ↔ Python data
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

**API Endpoints:**
```python
POST /api/addm/decide
# Make single decision based on current content

POST /api/addm/workflow  
# Run complete iterative workflow (optional full automation)

GET /health
# Service health check
```

**Deliverables:**
- [ ] FastAPI service with ADDM endpoints
- [ ] Docker container configuration
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Health check endpoint

---

### Phase 2: TypeScript ADDM Client (Frontend)

**Objective:** Create TypeScript client for ADDM service

**Files to Create:**
```typescript
src/services/addm/
├── client.ts              // ADDMClient class
├── loop-manager.ts        // ADDMLoopManager class
├── bridge.ts              // SwarmADDMBridge class
└── types.ts               // ADDM-specific types
```

**Key Classes:**

```typescript
// src/services/addm/client.ts
export class ADDMClient {
  async makeDecision(
    content: string,
    config: ADDMConfig,
    context?: string
  ): Promise<ADDMDecisionResult>;
  
  async runWorkflow(
    request: WorkflowRequest
  ): Promise<WorkflowResult>;
  
  async healthCheck(): Promise<boolean>;
}

// src/services/addm/loop-manager.ts
export class ADDMLoopManager {
  async startLoop(
    sessionId: string,
    initialContent: string,
    config: ADDMConfig
  ): Promise<string>; // Returns loopId
  
  async executeLoop(loopId: string): Promise<WorkflowResult>;
  
  async cancelLoop(loopId: string): Promise<void>;
  
  getLoopState(loopId: string): ADDMLoopState | undefined;
}

// src/services/addm/bridge.ts
export class SwarmADDMBridge {
  async processWithADDM(
    initialPrompt: string,
    config: ADDMConfig,
    orchestrator: HybridSwarmOrchestrator
  ): Promise<ADDMWorkflowResult>;
}
```

**Deliverables:**
- [ ] ADDMClient with retry logic and timeout handling
- [ ] ADDMLoopManager for state tracking
- [ ] SwarmADDMBridge for integration
- [ ] Type definitions aligned with Python service

---

### Phase 3: Core Type Extensions

**Objective:** Extend existing types for ADDM support

**Files to Modify:**
```typescript
src/core/types.ts
src/stores/system-store.ts
```

**Type Additions:**

```typescript
// src/core/types.ts

/**
 * ADDM configuration
 */
export interface ADDMConfig {
  enabled: boolean;
  workflowMode: 'research_assembly' | 'news_analysis';
  confidenceThreshold: number;      // 0.0 - 1.0
  maxIterations: number;            // 1 - 20
  contextThreshold: number;         // Characters (default: 32768)
  chunkSize: number;                // Bytes (default: 32768)
}

/**
 * ADDM decision result
 */
export interface ADDMDecisionResult {
  decision: 'enhance' | 'research' | 'complete';
  confidence: number;
  reactionTime: number;
  reasoning: string;
  metrics: {
    qualityScore: number;
    completenessScore: number;
    improvementPotential: number;
  };
  nextPrompt?: string;
  shouldSummarize: boolean;
}

/**
 * ADDM loop iteration
 */
export interface ADDMLoopIteration {
  iteration: number;
  timestamp: Date;
  decision: ADDMDecisionResult;
  content: string;
  contentLength: number;
  executionTimeMs: number;
  swarmCoordination: CoordinationResult;
}

/**
 * ADDM workflow result
 */
export interface ADDMWorkflowResult {
  loopId: string;
  sessionId: string;
  status: 'completed' | 'max_iterations' | 'cancelled' | 'failed';
  iterations: ADDMLoopIteration[];
  finalContent: string;
  totalIterations: number;
  totalExecutionTimeMs: number;
  averageConfidence: number;
  chunks?: string[];
}

/**
 * Extended SwarmTraceData with ADDM metadata
 */
export interface SwarmTraceData {
  // ... existing fields ...
  
  // ADDM loop metadata (optional)
  addmExecution?: {
    enabled: boolean;
    loopId: string;
    totalIterations: number;
    decisions: Array<{
      iteration: number;
      decision: string;
      confidence: number;
      reactionTime: number;
    }>;
    averageConfidence: number;
    finalDecision: string;
  };
}

/**
 * Extended SystemConfig with ADDM
 */
export interface SystemConfig {
  // ... existing fields ...
  addmConfig: ADDMConfig;
}
```

**Deliverables:**
- [ ] Add ADDM types to `src/core/types.ts`
- [ ] Extend `SwarmTraceData` with `addmExecution` field
- [ ] Extend `SystemConfig` with `addmConfig` field
- [ ] Update `system-store.ts` with ADDM defaults

---

### Phase 4: ADDM Execution Hook

**Objective:** Create hook for ADDM-enhanced execution

**File to Create:**
```typescript
src/hooks/useADDMLoop.ts
```

**Implementation:**

```typescript
// src/hooks/useADDMLoop.ts

import { useState, useCallback } from 'react';
import { ADDMClient } from '@/services/addm/client';
import { ADDMLoopManager } from '@/services/addm/loop-manager';
import { HybridSwarmOrchestrator } from '@/core/hybrid-orchestrator';
import { useSystemStore } from '@/stores/system-store';
import { useApiKey } from './useApiKey';
import { useStreamingChat } from './useStreamingChat';
import { analyzePrompt } from '@/core/prompt-analyzer';
import { ContentAnalyzer } from '@/core/content-analyzer';
import { ADDMWorkflowResult, ADDMLoopIteration } from '@/core/types';

export function useADDMLoop() {
  const { apiKey } = useApiKey();
  const config = useSystemStore(state => state.config);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [loopState, setLoopState] = useState<'idle' | 'coordinating' | 'executing' | 'deciding'>('idle');
  const { executeWithStreaming } = useStreamingChat();

  const executeADDMLoop = useCallback(
    async (
      initialPrompt: string,
      orchestrator: HybridSwarmOrchestrator
    ): Promise<ADDMWorkflowResult> => {
      if (!apiKey) throw new Error('API key not set');
      
      setIsExecuting(true);
      setCurrentIteration(0);
      
      const loopId = `addm_${Date.now()}`;
      const iterations: ADDMLoopIteration[] = [];
      const addmClient = new ADDMClient(config.addmConfig);
      const analyzer = new ContentAnalyzer();
      
      let accumulatedContent = '';
      let currentPrompt = initialPrompt;
      let iteration = 0;
      let context = '';
      
      try {
        // ADDM Loop
        while (iteration < config.addmConfig.maxIterations) {
          iteration++;
          setCurrentIteration(iteration);
          console.log(`\n🔄 ADDM Iteration ${iteration}/${config.addmConfig.maxIterations}`);
          
          // Step 1: Get swarm coordination
          setLoopState('coordinating');
          const taskContext = await analyzePrompt(currentPrompt);
          const coordination = await orchestrator.getCoordination(taskContext);
          
          // Step 2: Execute specialist with streaming
          setLoopState('executing');
          const startTime = Date.now();
          const swarmResponse = await executeWithStreaming(coordination, currentPrompt);
          const executionTimeMs = Date.now() - startTime;
          
          accumulatedContent += (iteration > 1 ? '\n\n' : '') + swarmResponse;
          
          // Step 3: Assess quality using existing analyzer
          const contentFeatures = analyzer.analyzeContent(swarmResponse);
          const qualityScore = assessQualityFromFeatures(contentFeatures);
          
          // Step 4: ADDM decision
          setLoopState('deciding');
          const decision = await addmClient.makeDecision(
            swarmResponse,
            config.addmConfig,
            context
          );
          
          // Record iteration
          iterations.push({
            iteration,
            timestamp: new Date(),
            decision,
            content: swarmResponse,
            contentLength: swarmResponse.length,
            executionTimeMs,
            swarmCoordination: coordination,
          });
          
          console.log(`   Decision: ${decision.decision} (confidence: ${decision.confidence.toFixed(2)})`);
          console.log(`   Quality: ${qualityScore.toFixed(2)}`);
          
          // Step 5: Check termination
          if (decision.decision === 'complete') {
            console.log(`✅ ADDM completed after ${iteration} iterations`);
            break;
          }
          
          if (decision.confidence > config.addmConfig.confidenceThreshold) {
            console.log(`✅ High confidence (${decision.confidence.toFixed(2)}) - completing`);
            break;
          }
          
          // Step 6: Generate next prompt
          currentPrompt = decision.nextPrompt || 
            generateEnhancementPrompt(decision.decision, swarmResponse, decision.reasoning);
          
          // Step 7: Update context (summarize if needed)
          if (decision.shouldSummarize) {
            context = await summarizeContext(accumulatedContent, orchestrator);
          } else {
            context += `\n\nIteration ${iteration}:\n${swarmResponse}`;
          }
        }
        
        // Calculate metrics
        const totalExecutionTimeMs = iterations.reduce((sum, it) => sum + it.executionTimeMs, 0);
        const averageConfidence = iterations.reduce((sum, it) => sum + it.decision.confidence, 0) / iterations.length;
        const finalDecision = iterations[iterations.length - 1]?.decision.decision || 'max_iterations';
        
        // Handle chunking for long responses
        const chunks = accumulatedContent.length > config.addmConfig.chunkSize
          ? chunkContent(accumulatedContent, loopId, config.addmConfig)
          : undefined;
        
        return {
          loopId,
          sessionId: taskContext.id,
          status: iteration >= config.addmConfig.maxIterations ? 'max_iterations' : 'completed',
          iterations,
          finalContent: accumulatedContent,
          totalIterations: iteration,
          totalExecutionTimeMs,
          averageConfidence,
          chunks,
        };
        
      } finally {
        setIsExecuting(false);
        setCurrentIteration(0);
        setLoopState('idle');
      }
    },
    [apiKey, config, executeWithStreaming]
  );

  return {
    executeADDMLoop,
    isExecuting,
    currentIteration,
    loopState,
  };
}

/**
 * Assess quality from content features
 */
function assessQualityFromFeatures(features: ContentFeatures): number {
  let score = 0.5;
  
  if (features.sectionCount >= 3) score += 0.1;
  if (features.hasCodeBlocks) score += 0.15;
  if (features.hasBullets || features.hasNumberedList) score += 0.1;
  if (features.totalLength > 500) score += 0.1;
  if (features.totalLength > 1000) score += 0.05;
  if (features.explanationRatio > 0.4 && features.explanationRatio < 0.8) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Generate enhancement prompt based on decision
 */
function generateEnhancementPrompt(
  decision: string,
  content: string,
  reasoning: string
): string {
  if (decision === 'enhance') {
    return `Enhance the following response by ${reasoning}:\n\n${content}`;
  }
  
  if (decision === 'research') {
    return `Research and add more depth to ${reasoning}:\n\n${content}`;
  }
  
  return content;
}

/**
 * Summarize context using swarm
 */
async function summarizeContext(
  content: string,
  orchestrator: HybridSwarmOrchestrator
): Promise<string> {
  const summaryTask = await analyzePrompt(
    `Summarize the key points and progress from this content:\n\n${content.slice(0, 10000)}`
  );
  
  const coordination = await orchestrator.getCoordination(summaryTask);
  // Use fast execution for summarization (no streaming needed)
  
  // Simplified - in practice would need a non-streaming execution method
  return `Summary of ${content.length} characters...`;
}

/**
 * Chunk long content
 */
function chunkContent(
  content: string,
  loopId: string,
  config: ADDMConfig
): string[] {
  const chunkSize = config.chunkSize;
  const totalChunks = Math.ceil(content.length / chunkSize);
  const chunks: string[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, content.length);
    const chunkContent = content.slice(start, end);
    
    const metadata = `ADDM Loop Regulator Response Chunk
Loop ID: ${loopId}
Chunk: ${i + 1}/${totalChunks}
Generated: ${new Date().toISOString()}

Metadata:
workflow_mode: ${config.workflowMode}
iterations: ${/* track this */}
confidence_threshold: ${config.confidenceThreshold}

---

`;
    
    chunks.push(metadata + chunkContent);
  }
  
  return chunks;
}
```

**Deliverables:**
- [ ] `useADDMLoop()` hook with iteration tracking
- [ ] Integration with existing `useStreamingChat()`
- [ ] Quality assessment using `ContentAnalyzer`
- [ ] Context summarization logic
- [ ] Content chunking with metadata

---

### Phase 3: ChatInterface Integration

**Objective:** Add ADDM execution mode to ChatInterface

**File to Modify:**
```typescript
src/components/Chat/ChatInterface.tsx
```

**Changes:**

```typescript
export function ChatInterface() {
  // ... existing hooks ...
  const { executeADDMLoop, isExecuting: isADDMExecuting, currentIteration, loopState } = useADDMLoop();
  
  const handleSendMessage = async (prompt: string) => {
    addMessage({
      id: nanoid(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    try {
      // Three-way branch: ADDM | Parallel | Sequential
      if (config.addmConfig.enabled) {
        await handleADDMExecution(prompt);
      } else if (config.parallelConfig.enabled) {
        await handleParallelExecution(prompt);
      } else {
        await handleSequentialExecution(prompt);
      }
    } catch (error) {
      // ... error handling ...
    }
  };

  /**
   * Handle ADDM loop execution (NEW)
   */
  const handleADDMExecution = async (prompt: string) => {
    const startTime = Date.now();
    
    // Add placeholder for assistant message
    const assistantId = nanoid();
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    });

    // Execute ADDM loop
    const result = await executeADDMLoop(prompt, orchestrator);
    
    const totalTime = Date.now() - startTime;

    // Build swarm trace with ADDM metadata
    const lastIteration = result.iterations[result.iterations.length - 1];
    const finalCoordination = lastIteration.swarmCoordination;
    
    // Get specialist and approach details
    const specialist = await specialistsStore.getSpecialist(finalCoordination.specialistId);
    const approach = await approachesStore.getApproach(finalCoordination.approachId);

    const swarmTrace: SwarmTraceData = {
      specialistId: finalCoordination.specialistId,
      specialistStats: specialist ? {
        totalExecutions: specialist.totalExecutions,
        successRate: specialist.successCount / specialist.totalExecutions,
        avgQuality: specialist.averageQuality,
        specializationStrength: specialist.specializationStrength,
      } : { totalExecutions: 0, successRate: 0, avgQuality: 0, specializationStrength: 0 },
      approachId: finalCoordination.approachId,
      approachName: approach?.name || 'Unknown',
      approachStats: approach ? {
        usageCount: approach.performanceMetrics.usageCount,
        avgQuality: approach.performanceMetrics.avgQuality,
        trend: approach.performanceMetrics.recentQualityTrend,
      } : { usageCount: 0, avgQuality: 0, trend: 'new' },
      qualityTarget: finalCoordination.qualityTarget,
      actualQuality: lastIteration.decision.metrics.qualityScore,
      swarmCounts: {
        totalSpecialists: systemStats?.specialistCount || 0,
        activeSpecialists: systemStats?.activeSpecialistCount || 0,
        totalApproaches: systemStats?.approachCount || 0,
        activeApproaches: systemStats?.activeApproachCount || 0,
        totalSignals: systemStats?.signalCount || 0,
      },
      waveCounts: {
        executionCount: systemStats?.executionCount || 0,
        patternDiscoveryReady: systemStats?.patternDiscoveryReady || false,
      },
      taskContext: {
        complexity: finalCoordination.taskContext.complexity,
        primaryDomain: Object.keys(finalCoordination.taskContext.domainWeights)[0],
        keywords: finalCoordination.taskContext.keywords,
        outputType: finalCoordination.taskContext.outputType,
      },
      // ADDM-specific metadata
      addmExecution: {
        enabled: true,
        loopId: result.loopId,
        totalIterations: result.totalIterations,
        decisions: result.iterations.map(it => ({
          iteration: it.iteration,
          decision: it.decision.decision,
          confidence: it.decision.confidence,
          reactionTime: it.decision.reactionTime,
        })),
        averageConfidence: result.averageConfidence,
        finalDecision: result.status,
      },
    };

    // Update message with final content
    updateLastMessage(result.finalContent);
    updateMessage(assistantId, {
      swarmTrace,
      quality: lastIteration.decision.metrics.qualityScore,
      isStreaming: false,
    });

    // Show ADDM completion toast
    toast({
      title: `ADDM Loop Complete (${result.totalIterations} iterations)`,
      description: `Quality: ${(lastIteration.decision.metrics.qualityScore * 100).toFixed(0)}% • Avg Confidence: ${(result.averageConfidence * 100).toFixed(0)}%`,
    });
  };

  // ... rest of component ...
  
  return (
    <div className="flex flex-col h-full bg-background">
      <ConversationHeader />
      <MessageList messages={messages} />
      
      {/* ADDM Progress Indicator */}
      {isADDMExecuting && (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ADDM Loop: Iteration {currentIteration}/{config.addmConfig.maxIterations} ({loopState})
        </div>
      )}
      
      {isStreaming && chunks.length > 0 && (
        <StreamingMessage chunks={chunks} />
      )}
      
      {isCoordinating && (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Coordinating specialist and approach...
        </div>
      )}
      
      <MessageInput 
        onSend={handleSendMessage} 
        disabled={isStreaming || isCoordinating || isParallelExecuting || isADDMExecuting} 
      />
    </div>
  );
}
```

**Deliverables:**
- [ ] Add `handleADDMExecution()` method to ChatInterface
- [ ] Import and use `useADDMLoop()` hook
- [ ] Add ADDM progress indicator UI
- [ ] Extend disabled state to include ADDM execution
- [ ] Build SwarmTrace with ADDM metadata

---

### Phase 5: Settings UI Integration

**Objective:** Add ADDM configuration to Settings > System

**File to Modify:**
```typescript
src/components/Settings/SystemConfig.tsx
```

**UI Components to Add:**

```typescript
// ADDM Configuration Section

<div className="space-y-4 border rounded-lg p-4 bg-card">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <RotateCw className="w-4 h-4" />
      <Label className="text-base font-semibold">ADDM Loop Mode</Label>
      <Badge variant="outline" className="text-xs">BETA</Badge>
    </div>
    <Switch
      checked={config.addmConfig.enabled}
      onCheckedChange={(checked) =>
        updateADDMConfig({ enabled: checked })
      }
    />
  </div>
  
  <p className="text-sm text-muted-foreground">
    Intelligent loop regulation with evidence-based enhancement decisions
  </p>

  {config.addmConfig.enabled && (
    <>
      {/* Workflow Mode Select */}
      <div className="space-y-2">
        <Label>Workflow Mode</Label>
        <Select
          value={config.addmConfig.workflowMode}
          onValueChange={(value) =>
            updateADDMConfig({ workflowMode: value })
          }
        >
          <SelectItem value="research_assembly">Research Assembly</SelectItem>
          <SelectItem value="news_analysis">News Analysis</SelectItem>
        </Select>
        <p className="text-xs text-muted-foreground">
          {config.addmConfig.workflowMode === 'research_assembly' 
            ? 'Multi-phase validation for research tasks'
            : 'Depth and perspective enhancement for news'}
        </p>
      </div>

      {/* Confidence Threshold Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Confidence Threshold</Label>
          <span className="text-sm text-muted-foreground">
            {(config.addmConfig.confidenceThreshold * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          min={50}
          max={100}
          step={5}
          value={[config.addmConfig.confidenceThreshold * 100]}
          onValueChange={([value]) =>
            updateADDMConfig({ confidenceThreshold: value / 100 })
          }
        />
        <p className="text-xs text-muted-foreground">
          Higher values require more confidence before completion
        </p>
      </div>

      {/* Max Iterations Input */}
      <div className="space-y-2">
        <Label>Max Iterations</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={config.addmConfig.maxIterations}
          onChange={(e) =>
            updateADDMConfig({ maxIterations: parseInt(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">
          Maximum enhancement loops (1-20)
        </p>
      </div>

      {/* Cost Warning */}
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-sm">
          <strong>Token Usage Warning:</strong> ADDM mode may consume {config.addmConfig.maxIterations}x more tokens through iterative enhancement.
        </AlertDescription>
      </Alert>

      {/* Benefits */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">Benefits:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Intelligent enhancement decisions via DDM simulation</li>
          <li>Progressive quality improvement through iteration</li>
          <li>Cognitive-plausible decision timing and confidence</li>
          <li>Automatic completion when quality threshold met</li>
        </ul>
      </div>
    </>
  )}
</div>
```

**Store Methods to Add:**

```typescript
// src/stores/system-store.ts

export interface SystemState {
  // ... existing fields ...
  
  updateADDMConfig: (updates: Partial<ADDMConfig>) => void;
}

// In create() function:
updateADDMConfig: (updates) =>
  set((state) => ({
    config: {
      ...state.config,
      addmConfig: {
        ...state.config.addmConfig,
        ...updates,
      },
    },
  })),
```

**Deliverables:**
- [ ] Add ADDM settings section to SystemConfig component
- [ ] Add `updateADDMConfig()` method to system-store
- [ ] Include workflow mode selector
- [ ] Add confidence threshold slider
- [ ] Add max iterations input
- [ ] Include token usage warning

---

### Phase 6: SwarmTrace UI Enhancement

**Objective:** Display ADDM loop metadata in SwarmTraceBubble

**File to Modify:**
```typescript
src/components/Chat/SwarmTraceBubble.tsx
```

**UI Section to Add:**

```typescript
{/* ADDM Loop Execution Section */}
{trace.addmExecution && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <RotateCw className="w-4 h-4 text-purple-500" />
        <h4 className="text-sm font-semibold">ADDM Loop Regulation</h4>
        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30">
          {trace.addmExecution.totalIterations} iterations
        </Badge>
      </div>
    </div>

    {/* Final Decision */}
    <div className="text-xs text-muted-foreground">
      Final Decision: <span className="font-medium">{trace.addmExecution.finalDecision}</span>
      {' • '}
      Avg Confidence: <span className="font-medium">{(trace.addmExecution.averageConfidence * 100).toFixed(0)}%</span>
    </div>

    {/* Decision Timeline */}
    <div className="space-y-1 border-l-2 border-purple-500/30 pl-3">
      {trace.addmExecution.decisions.map((decision, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">#{decision.iteration}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                decision.decision === 'complete' 
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : decision.decision === 'enhance'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              }`}
            >
              {decision.decision}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            {(decision.confidence * 100).toFixed(0)}% • {decision.reactionTime.toFixed(0)}ms
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**Deliverables:**
- [ ] Add ADDM execution section to SwarmTraceBubble
- [ ] Display iteration timeline with decisions
- [ ] Show confidence scores and reaction times
- [ ] Color-code decisions (complete=green, enhance=blue, research=amber)
- [ ] Display final decision and average confidence

---

### Phase 7: System Store Configuration

**Objective:** Add ADDM defaults to system configuration

**File to Modify:**
```typescript
src/stores/system-store.ts
src/utils/constants.ts
```

**Constants to Add:**

```typescript
// src/utils/constants.ts

// ADDM Loop Regulation defaults
export const DEFAULT_ADDM_ENABLED = false;
export const DEFAULT_ADDM_WORKFLOW_MODE = 'research_assembly';
export const DEFAULT_ADDM_CONFIDENCE_THRESHOLD = 0.75;
export const DEFAULT_ADDM_MAX_ITERATIONS = 10;
export const DEFAULT_ADDM_CONTEXT_THRESHOLD = 32768;
export const DEFAULT_ADDM_CHUNK_SIZE = 32768;
export const ADDM_SERVICE_URL = 'http://localhost:8000';
```

**Store Configuration:**

```typescript
// src/stores/system-store.ts

const defaultConfig: SystemConfig = {
  // ... existing defaults ...
  
  addmConfig: {
    enabled: DEFAULT_ADDM_ENABLED,
    workflowMode: DEFAULT_ADDM_WORKFLOW_MODE,
    confidenceThreshold: DEFAULT_ADDM_CONFIDENCE_THRESHOLD,
    maxIterations: DEFAULT_ADDM_MAX_ITERATIONS,
    contextThreshold: DEFAULT_ADDM_CONTEXT_THRESHOLD,
    chunkSize: DEFAULT_ADDM_CHUNK_SIZE,
  },
};
```

**Deliverables:**
- [ ] Add ADDM constants to `constants.ts`
- [ ] Add ADDM defaults to system-store
- [ ] Include ADDM config in reset logic
- [ ] Ensure localStorage persistence

---

### Phase 8: Python ADDM Service API

**Objective:** Create FastAPI wrapper for ADDM Loop Regulator

**File Structure:**

```python
addm-service/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── server.py       # FastAPI app
│   │   ├── routes.py       # Endpoints
│   │   └── models.py       # Pydantic models
│   ├── addm_loopregulator/ # Original ADDM code
│   └── bridge/
│       └── converter.py    # Data conversion
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

**API Implementation:**

```python
# src/api/server.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import sys

# Add addm_loopregulator to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from addm_loopregulator import LoopRegulator

app = FastAPI(
    title="ADDM Loop Regulator API",
    version="1.0.0",
    description="Cognitive loop regulation for LLM response enhancement"
)

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ADDMConfigModel(BaseModel):
    confidence_threshold: float = 0.75
    max_iterations: int = 10
    context_threshold: int = 32768
    drift_rate: Optional[float] = None
    noise_sigma: Optional[float] = None

class DecisionRequest(BaseModel):
    content: str
    workflow_mode: str
    context: str = ""
    iteration: int = 1
    config: ADDMConfigModel

class DecisionResponse(BaseModel):
    decision: str
    confidence: float
    reaction_time: float
    reasoning: str
    metrics: dict
    next_prompt: Optional[str]
    should_summarize: bool

class WorkflowRequest(BaseModel):
    initial_prompt: str
    workflow_mode: str
    output_prefix: str = "addm_response"
    config: ADDMConfigModel

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    iterations: int
    final_decision: str
    total_chars: int
    chunked_files: List[str]

@app.post("/api/addm/decide", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """Make single ADDM decision based on current content"""
    try:
        # Create regulator instance
        regulator = LoopRegulator(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            workflow_mode=request.workflow_mode,
            confidence_threshold=request.config.confidence_threshold,
            max_iterations=request.config.max_iterations,
            context_threshold=request.config.context_threshold
        )
        
        # Generate loop control actions
        actions = regulator._generate_loop_decisions(
            current_content=request.content,
            accumulated_content=request.context,
            iteration=request.iteration
        )
        
        # Simulate DDM decision
        outcome = regulator.ddm.simulate_decision(actions, mode="racing")
        
        # Map to response
        selected_action = actions[outcome.selected_index]
        
        # Generate next prompt if not complete
        next_prompt = None
        if selected_action.name.lower() != "complete":
            next_prompt = regulator._generate_enhancement_prompt(
                selected_action.name,
                request.content,
                request.iteration
            )
        
        return DecisionResponse(
            decision=map_decision_name(selected_action.name),
            confidence=outcome.confidence,
            reaction_time=outcome.reaction_time,
            reasoning=f"Selected: {selected_action.name}",
            metrics={
                "quality_score": selected_action.evidence_score,
                "completeness_score": outcome.confidence,
                "improvement_potential": 1.0 - outcome.confidence
            },
            next_prompt=next_prompt,
            should_summarize=len(request.context) > request.config.context_threshold
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/addm/workflow", response_model=WorkflowResponse)
async def run_workflow(request: WorkflowRequest):
    """Run complete ADDM workflow with multiple iterations"""
    try:
        regulator = LoopRegulator(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            workflow_mode=request.workflow_mode,
            confidence_threshold=request.config.confidence_threshold,
            max_iterations=request.config.max_iterations,
            context_threshold=request.config.context_threshold
        )
        
        result = regulator.execute_workflow(
            initial_prompt=request.initial_prompt,
            output_prefix=request.output_prefix
        )
        
        return WorkflowResponse(
            workflow_id=result["workflow_id"],
            status="completed",
            iterations=result["iterations"],
            final_decision=result["final_decision"],
            total_chars=result["total_chars"],
            chunked_files=result.get("chunked_files", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "ADDM Loop Regulator API",
        "version": "1.0.0"
    }

def map_decision_name(action_name: str) -> str:
    """Map ADDM action names to decision types"""
    name_lower = action_name.lower()
    
    if "complete" in name_lower:
        return "complete"
    elif "enhance" in name_lower:
        return "enhance"
    elif "research" in name_lower:
        return "research"
    else:
        return "enhance"  # Default fallback

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

**Docker Configuration:**

```dockerfile
# Dockerfile

FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY .env.example .env

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run server
CMD ["uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  addm-service:
    build:
      context: ./addm-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LOG_LEVEL=info
    volumes:
      - ./addm-service/output:/app/output
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Deliverables:**
- [ ] FastAPI server with ADDM endpoints
- [ ] Pydantic models for request/response validation
- [ ] Decision name mapping logic
- [ ] Dockerfile with health checks
- [ ] docker-compose.yml configuration

---

## 5. TypeScript Type Definitions

### 5.1 Complete Type System

```typescript
// src/services/addm/types.ts

export enum WorkflowMode {
  RESEARCH_ASSEMBLY = 'research_assembly',
  NEWS_ANALYSIS = 'news_analysis',
}

export enum ADDMDecisionType {
  ENHANCE = 'enhance',
  RESEARCH = 'research',
  COMPLETE = 'complete',
}

export interface ADDMConfig {
  enabled: boolean;
  workflowMode: WorkflowMode;
  confidenceThreshold: number;
  maxIterations: number;
  contextThreshold: number;
  chunkSize: number;
  serviceUrl?: string;
  timeout?: number;
}

export interface ADDMDecisionResult {
  decision: ADDMDecisionType;
  confidence: number;
  reactionTime: number;
  reasoning: string;
  metrics: {
    qualityScore: number;
    completenessScore: number;
    improvementPotential: number;
  };
  nextPrompt?: string;
  shouldSummarize: boolean;
}

export interface ADDMLoopIteration {
  iteration: number;
  timestamp: Date;
  decision: ADDMDecisionResult;
  content: string;
  contentLength: number;
  executionTimeMs: number;
  swarmCoordination: CoordinationResult;
  qualityScore: number;
}

export interface ADDMLoopState {
  loopId: string;
  sessionId: string;
  status: 'active' | 'completed' | 'max_iterations' | 'cancelled' | 'failed';
  startTime: Date;
  endTime?: Date;
  iterations: ADDMLoopIteration[];
  currentIteration: number;
  config: ADDMConfig;
}

export interface ADDMWorkflowResult {
  loopId: string;
  sessionId: string;
  status: 'completed' | 'max_iterations' | 'cancelled' | 'failed';
  iterations: ADDMLoopIteration[];
  finalContent: string;
  totalIterations: number;
  totalExecutionTimeMs: number;
  averageConfidence: number;
  averageQuality: number;
  chunks?: string[];
}

export interface ADDMServiceConfig {
  serviceUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
```

---

## 6. Execution Flow

### 6.1 Standard Execution Flow (Existing)

```
User Input
    ↓
ChatInterface.handleSendMessage()
    ↓
handleSequentialExecution()
    ↓
1. useCoordination() → HybridSwarmOrchestrator.getCoordination()
    ├─ AdaptiveResonanceOrchestrator.matchOrCreateSpecialist()
    ├─ DynamicApproachManager.matchApproaches()
    └─ StigmergicBoard signal blending (70% match + 30% signals)
    ↓
2. useStreamingChat.executeWithStreaming()
    └─ OpenRouterClient.streamChat() with system prompt
    ↓
3. ContentAnalyzer.analyzeContent() → quality assessment
    ↓
4. orchestrator.recordExecutionResult()
    ├─ Update specialist profile
    ├─ Deposit signal to board
    ├─ Update approach metrics
    └─ Save to ExecutionHistoryStore
    ↓
5. Display response with SwarmTrace
```

### 6.2 ADDM Loop Execution Flow (New)

```
User Input
    ↓
ChatInterface.handleSendMessage()
    ↓
[config.addmConfig.enabled = true]
    ↓
handleADDMExecution()
    ↓
useADDMLoop.executeADDMLoop()
    ↓
╔════════════════════════════════════╗
║      ADDM ENHANCEMENT LOOP         ║
╚════════════════════════════════════╝
    ↓
Iteration 1:
    ├─ 1. Get Coordination (full swarm coordination)
    │   └─ HybridSwarmOrchestrator.getCoordination(taskContext)
    ├─ 2. Execute Specialist (streaming)
    │   └─ useStreamingChat.executeWithStreaming(coordination, prompt)
    ├─ 3. Assess Quality
    │   └─ ContentAnalyzer.analyzeContent(response)
    ├─ 4. ADDM Decision
    │   └─ ADDMClient.makeDecision(response, config, context)
    │       ├─ POST → Python Service: /api/addm/decide
    │       └─ LoopRegulator._generate_loop_decisions()
    │           └─ MultiAlternativeDDM.simulate_decision()
    ├─ 5. Check Decision
    │   ├─ "complete" → Exit loop ✓
    │   ├─ "enhance" → Generate enhancement prompt
    │   └─ "research" → Generate research prompt
    ├─ 6. Update Context
    │   ├─ If len(context) > 32K: Summarize with swarm
    │   └─ Else: Append iteration content
    └─ 7. Record Iteration
        └─ iterations.push({ decision, content, coordination })
    ↓
[Loop back if decision != "complete" && iteration < maxIterations]
    ↓
Iteration 2, 3, ... N
    ↓
╔════════════════════════════════════╗
║      LOOP TERMINATION              ║
╚════════════════════════════════════╝
    ├─ Triggered by:
    │   ├─ ADDM decision = "complete"
    │   ├─ Confidence > threshold
    │   └─ Max iterations reached
    ↓
Post-Processing:
    ├─ 1. Calculate Metrics
    │   ├─ totalExecutionTimeMs
    │   ├─ averageConfidence
    │   └─ averageQuality
    ├─ 2. Chunk if Necessary
    │   └─ If content.length > chunkSize
    ├─ 3. Build SwarmTrace with ADDM metadata
    │   └─ addmExecution { loopId, iterations, decisions, ... }
    ├─ 4. Record ALL Iterations
    │   └─ Each iteration recorded to ExecutionHistoryStore
    └─ 5. Display Final Response
        ├─ Update chat message with content
        ├─ Show SwarmTrace with ADDM section
        └─ Toast notification with loop summary
```

### 6.3 Stigmergic Preservation

**Each ADDM iteration maintains stigmergic independence:**

```
Iteration 1:
  Specialist A selected → Approach X chosen via signals → Signal deposited
  
Iteration 2:
  [New coordination from scratch]
  Specialist B selected → Approach Y chosen via signals → Signal deposited
  
Iteration 3:
  [New coordination, influenced by previous signals]
  Specialist A selected again → Approach Z chosen (signals from iter 1-2) → Signal deposited
```

**Key Points:**
- Each iteration is independent coordination event
- Stigmergic board accumulates signals across iterations
- Specialists may be reused across iterations (normal behavior)
- No hardcoded "ADDM specialist" - emergent selection

---

## 7. UI Integration

### 7.1 Settings Panel - ADDM Configuration

**Location:** Settings > System (below Parallel Execution section)

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│ 🔄 ADDM Loop Mode                [BETA]    [ON] │
│ Intelligent loop regulation with evidence-based │
│ enhancement decisions                           │
│                                                 │
│ Workflow Mode: [Research Assembly ▼]           │
│ Multi-phase validation for research tasks      │
│                                                 │
│ Confidence Threshold: 75%        (50%-100%)    │
│ ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━           │
│                                                 │
│ Max Iterations: [10]             (1-20)        │
│                                                 │
│ ⚠️  Token Usage Warning: May consume 10x       │
│     more tokens through iterative enhancement  │
│                                                 │
│ Benefits:                                       │
│ • Intelligent enhancement decisions             │
│ • Progressive quality improvement               │
│ • Cognitive-plausible decision timing           │
│ • Automatic completion at quality threshold     │
└─────────────────────────────────────────────────┘
```

### 7.2 Chat Interface - ADDM Progress Indicator

**During ADDM execution:**
```
┌─────────────────────────────────────────────────┐
│ 🔄 ADDM Loop: Iteration 3/10 (deciding)         │
│                                                 │
│ [Animated spinner] Making enhancement decision...│
└─────────────────────────────────────────────────┘
```

**Loop States:**
- `coordinating`: "Coordinating specialist and approach..."
- `executing`: "Executing specialist response..."
- `deciding`: "Making enhancement decision..."

### 7.3 SwarmTrace - ADDM Execution Section

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│ 🔄 ADDM Loop Regulation        [5 iterations]   │
│                                                 │
│ Final Decision: completed • Avg Confidence: 87% │
│                                                 │
│ ├─ #1 [enhance]        78% • 234ms             │
│ ├─ #2 [enhance]        82% • 198ms             │
│ ├─ #3 [research]       85% • 256ms             │
│ ├─ #4 [enhance]        91% • 189ms             │
│ └─ #5 [complete]       94% • 145ms             │
└─────────────────────────────────────────────────┘
```

**Color Coding:**
- **Purple theme:** ADDM loop section border/icons
- **Green badge:** "complete" decision
- **Blue badge:** "enhance" decision
- **Amber badge:** "research" decision

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// Test ADDM Client
describe('ADDMClient', () => {
  test('makes decision request successfully', async () => {
    const client = new ADDMClient(config);
    const decision = await client.makeDecision(content, config);
    
    expect(decision.decision).toMatch(/enhance|research|complete/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
  
  test('handles service timeout gracefully', async () => {
    const client = new ADDMClient({ ...config, timeout: 100 });
    
    await expect(client.makeDecision(content, config))
      .rejects.toThrow('timeout');
  });
});

// Test ADDM Loop Hook
describe('useADDMLoop', () => {
  test('executes single iteration successfully', async () => {
    const { executeADDMLoop } = renderHook(() => useADDMLoop()).result.current;
    
    const result = await executeADDMLoop('test prompt', mockOrchestrator);
    
    expect(result.totalIterations).toBeGreaterThan(0);
    expect(result.finalContent).toBeDefined();
  });
  
  test('respects max iterations limit', async () => {
    const { executeADDMLoop } = renderHook(() => useADDMLoop()).result.current;
    
    const result = await executeADDMLoop('test prompt', mockOrchestrator);
    
    expect(result.totalIterations).toBeLessThanOrEqual(config.addmConfig.maxIterations);
  });
  
  test('accumulates context correctly', async () => {
    const { executeADDMLoop } = renderHook(() => useADDMLoop()).result.current;
    
    const result = await executeADDMLoop('test prompt', mockOrchestrator);
    
    expect(result.iterations.length).toBeGreaterThan(0);
    result.iterations.forEach((it, idx) => {
      expect(it.iteration).toBe(idx + 1);
      expect(it.content).toBeDefined();
    });
  });
});

// Test Integration
describe('ADDM-Swarm Integration', () => {
  test('each iteration uses proper swarm coordination', async () => {
    const mockOrchestrator = createMockOrchestrator();
    const { executeADDMLoop } = renderHook(() => useADDMLoop()).result.current;
    
    const result = await executeADDMLoop('test prompt', mockOrchestrator);
    
    // Verify each iteration has swarmCoordination
    result.iterations.forEach(it => {
      expect(it.swarmCoordination).toBeDefined();
      expect(it.swarmCoordination.specialistId).toBeDefined();
      expect(it.swarmCoordination.approachId).toBeDefined();
    });
  });
  
  test('stigmergic signals deposited per iteration', async () => {
    const signalsSpy = jest.spyOn(StigmergicBoard.prototype, 'depositSignal');
    
    const { executeADDMLoop } = renderHook(() => useADDMLoop()).result.current;
    await executeADDMLoop('test prompt', mockOrchestrator);
    
    // Should have multiple signal deposits (one per iteration)
    expect(signalsSpy).toHaveBeenCalled();
  });
});
```

### 8.2 Integration Tests

```typescript
// Test end-to-end ADDM flow
describe('ADDM E2E', () => {
  test('complete chat flow with ADDM mode', async () => {
    const { result } = renderHook(() => ({
      chat: useChatStore(),
      system: useSystemStore(),
    }));
    
    // Enable ADDM mode
    act(() => {
      result.current.system.updateADDMConfig({ enabled: true });
    });
    
    // Send message
    await act(async () => {
      await result.current.chat.handleSendMessage('Explain quantum computing');
    });
    
    // Verify ADDM execution occurred
    const messages = result.current.chat.messages;
    const lastMessage = messages[messages.length - 1];
    
    expect(lastMessage.swarmTrace?.addmExecution).toBeDefined();
    expect(lastMessage.swarmTrace?.addmExecution?.totalIterations).toBeGreaterThan(0);
  });
  
  test('ADDM works with parallel mode disabled', async () => {
    const { result } = renderHook(() => useSystemStore());
    
    act(() => {
      result.current.updateADDMConfig({ enabled: true });
      result.current.updateParallelConfig({ enabled: false });
    });
    
    // Should use ADDM mode (takes precedence)
    expect(result.current.config.addmConfig.enabled).toBe(true);
    expect(result.current.config.parallelConfig.enabled).toBe(false);
  });
});
```

### 8.3 Python Service Tests

```python
# test_api.py

import pytest
from fastapi.testclient import TestClient
from src.api.server import app

client = TestClient(app)

def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_make_decision():
    """Test decision endpoint"""
    request_data = {
        "content": "Test response content",
        "workflow_mode": "research_assembly",
        "context": "",
        "iteration": 1,
        "config": {
            "confidence_threshold": 0.75,
            "max_iterations": 10,
            "context_threshold": 32768
        }
    }
    
    response = client.post("/api/addm/decide", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["decision"] in ["enhance", "research", "complete"]
    assert 0 <= data["confidence"] <= 1
    assert data["reaction_time"] > 0

def test_workflow_execution():
    """Test complete workflow endpoint"""
    request_data = {
        "initial_prompt": "Explain quantum computing basics",
        "workflow_mode": "research_assembly",
        "output_prefix": "test",
        "config": {
            "confidence_threshold": 0.95,
            "max_iterations": 3,
            "context_threshold": 32768
        }
    }
    
    response = client.post("/api/addm/workflow", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["workflow_id"]
    assert data["iterations"] > 0
    assert data["final_decision"] in ["complete", "max_iterations_reached"]
```

---

## 9. Implementation Checklist

### Phase 1: Backend Service ✓
- [ ] Create FastAPI server structure
- [ ] Implement `/api/addm/decide` endpoint
- [ ] Implement `/api/addm/workflow` endpoint
- [ ] Add health check endpoint
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Add CORS middleware
- [ ] Test endpoints with Postman/curl

### Phase 2: TypeScript Client
- [ ] Create `src/services/addm/client.ts`
- [ ] Create `src/services/addm/types.ts`
- [ ] Implement retry logic with exponential backoff
- [ ] Add timeout handling
- [ ] Add error mapping
- [ ] Write unit tests for client

### Phase 3: Type Extensions
- [ ] Add ADDM types to `src/core/types.ts`
- [ ] Extend `SwarmTraceData` interface
- [ ] Extend `SystemConfig` interface
- [ ] Add ADDM constants to `src/utils/constants.ts`
- [ ] Update `system-store.ts` with defaults
- [ ] Add `updateADDMConfig()` method

### Phase 4: ADDM Hook
- [ ] Create `src/hooks/useADDMLoop.ts`
- [ ] Implement `executeADDMLoop()` method
- [ ] Add iteration state tracking
- [ ] Integrate with `useStreamingChat()`
- [ ] Add quality assessment logic
- [ ] Implement context summarization
- [ ] Add content chunking
- [ ] Write hook tests

### Phase 5: ChatInterface
- [ ] Import `useADDMLoop()` hook
- [ ] Add `handleADDMExecution()` method
- [ ] Update branching logic in `handleSendMessage()`
- [ ] Add ADDM progress indicator
- [ ] Update disabled state logic
- [ ] Build ADDM SwarmTrace metadata
- [ ] Add ADDM toast notifications

### Phase 6: Settings UI
- [ ] Add ADDM section to `SystemConfig.tsx`
- [ ] Add enable/disable toggle
- [ ] Add workflow mode selector
- [ ] Add confidence threshold slider
- [ ] Add max iterations input
- [ ] Add token usage warning
- [ ] Add benefits description

### Phase 7: SwarmTrace UI
- [ ] Add ADDM section to `SwarmTraceBubble.tsx`
- [ ] Display iteration timeline
- [ ] Show decision badges (color-coded)
- [ ] Display confidence scores
- [ ] Show reaction times
- [ ] Add RotateCw icon for ADDM section

### Phase 8: Testing & Documentation
- [ ] Write unit tests for all new components
- [ ] Write integration tests for ADDM flow
- [ ] Test Python service endpoints
- [ ] Manual testing with real prompts
- [ ] Update README with ADDM documentation
- [ ] Create troubleshooting guide

---

## 10. Configuration Examples

### 10.1 Research Assembly Configuration

```typescript
// High-quality research mode
const researchConfig: ADDMConfig = {
  enabled: true,
  workflowMode: 'research_assembly',
  confidenceThreshold: 0.95,      // Very high for research
  maxIterations: 12,              // Allow deep iterations
  contextThreshold: 32768,        // 32K context
  chunkSize: 32768,
};
```

### 10.2 News Analysis Configuration

```typescript
// Fast news analysis mode
const newsConfig: ADDMConfig = {
  enabled: true,
  workflowMode: 'news_analysis',
  confidenceThreshold: 0.70,      // Lower for speed
  maxIterations: 6,               // Fewer iterations
  contextThreshold: 24576,        // 24K context
  chunkSize: 32768,
};
```

### 10.3 Environment Variables

```bash
# .env

# ADDM Python Service
ADDM_SERVICE_URL=http://localhost:8000
ADDM_SERVICE_TIMEOUT=120000

# OpenRouter (for Python service)
OPENROUTER_API_KEY=your_key_here

# Feature Flags
ENABLE_ADDM=true
```

---

## 11. Key Differences from Original Plan

### Terminology Corrections

| Original (Incorrect) | Corrected | Source |
|---------------------|-----------|--------|
| Agent | **Specialist** | `SpecialistProfile`, `SpecialistsStore` |
| AgentPool | **SpecialistsStore** | `src/storage/specialists-store.ts` |
| AgentFactory | **AdaptiveResonanceOrchestrator.matchOrCreateSpecialist()** | `src/core/adaptive-resonance.ts` |
| SignalBoard | **StigmergicBoard** | `src/core/stigmergic-board.ts` |
| ResponseAggregator | **SwarmTrace display logic** | `src/components/Chat/SwarmTraceBubble.tsx` |
| InferenceEngine | **OpenRouterClient + useStreamingChat** | `src/api/openrouter-client.ts` |

### Architecture Corrections

1. **No Central "Orchestrator" for Specialists**
   - Original plan implied central coordination
   - Reality: Stigmergic board enables decentralized coordination
   - ADDM must respect this by calling full coordination per iteration

2. **Existing Parallel Execution System**
   - Original plan didn't account for existing parallel mode
   - Reality: Already has N-specialist parallel execution
   - ADDM becomes third mode alongside standard and parallel

3. **Quality Analysis Already Exists**
   - Original plan proposed new quality assessment
   - Reality: `ContentAnalyzer` already provides quality metrics
   - ADDM should leverage existing infrastructure

4. **SwarmTrace Pattern Established**
   - Original plan proposed new UI patterns
   - Reality: Collapsible bubble system already exists
   - ADDM metadata fits naturally into existing SwarmTrace

---

## 12. Success Criteria

### 12.1 Functional Requirements

- ✅ ADDM mode can be enabled/disabled in Settings
- ✅ Each ADDM iteration uses full swarm coordination
- ✅ Loop terminates on "complete" decision or max iterations
- ✅ Context summarizes automatically at 32K threshold
- ✅ Long responses chunk into 32KB files with metadata
- ✅ SwarmTrace displays ADDM loop metrics
- ✅ All iterations recorded to ExecutionHistoryStore
- ✅ Stigmergic signals deposited per iteration

### 12.2 Non-Functional Requirements

- ✅ No breaking changes to existing standard/parallel modes
- ✅ Python service runs in Docker container
- ✅ API response time < 5s per decision
- ✅ Graceful degradation if ADDM service unavailable
- ✅ Clear user feedback during loop execution
- ✅ Settings persist across browser sessions

### 12.3 User Experience

- ✅ Progress indicator shows current iteration and state
- ✅ Toast notifications on loop completion
- ✅ Token usage warnings prominent in settings
- ✅ Decision timeline visible in SwarmTrace
- ✅ Can cancel loop mid-execution (future enhancement)

---

## 13. Risk Mitigation

### 13.1 Identified Risks

**Risk 1: Python Service Availability**
- **Impact:** High - ADDM mode unusable if service down
- **Mitigation:** 
  - Health check before enabling ADDM
  - Graceful fallback to standard mode
  - Clear error messages to user

**Risk 2: Token Cost**
- **Impact:** High - Users may not realize cost multiplier
- **Mitigation:**
  - Prominent warning in settings (orange alert)
  - Default disabled
  - Clear iteration count display

**Risk 3: Infinite Loops**
- **Impact:** Medium - Could run indefinitely without safeguards
- **Mitigation:**
  - Hard max iterations limit (1-20)
  - Confidence threshold termination
  - User can cancel (future enhancement)

**Risk 4: Context Overflow**
- **Impact:** Medium - Large contexts may exceed limits
- **Mitigation:**
  - Automatic summarization at 32K
  - Context threshold configurable
  - Monitor context size per iteration

### 13.2 Rollback Plan

```typescript
// Quick disable via feature flag
ENABLE_ADDM=false

// Or in UI
updateADDMConfig({ enabled: false })

// Python service can be stopped independently
docker-compose stop addm-service
```

---

## 14. Future Enhancements (Not in Scope)

1. **ADDM + Parallel Hybrid Mode**
   - Run N specialists per iteration
   - ADDM decides if any need further enhancement
   - Complex but potentially powerful

2. **Adaptive Iteration Limits**
   - ADDM adjusts maxIterations based on task complexity
   - Learn optimal iteration counts per domain

3. **Quality Prediction**
   - Predict final quality before starting loop
   - Estimate token costs upfront

4. **WebSocket Streaming**
   - Stream ADDM decisions in real-time
   - Show intermediate content during loops

5. **Loop Cancellation**
   - User can cancel mid-loop
   - Return partial results

6. **Context Compression**
   - More sophisticated than summarization
   - Preserve key insights while reducing tokens

---

## 15. Implementation Timeline

### Week 1-2: Backend Foundation
- Day 1-3: Python FastAPI service setup
- Day 4-5: Docker containerization
- Day 6-7: API endpoint implementation
- Day 8-10: Testing and debugging

### Week 3-4: Frontend Integration
- Day 1-3: TypeScript client and types
- Day 4-6: useADDMLoop hook implementation
- Day 7-8: ChatInterface integration
- Day 9-10: Testing and refinement

### Week 5: UI & Polish
- Day 1-3: Settings UI implementation
- Day 4-5: SwarmTrace UI enhancement
- Day 6-7: Final testing
- Day 8-10: Documentation and deployment

**Total Estimated Time:** 5-6 weeks

---

## 16. Deployment Strategy

### 16.1 Development Environment

```bash
# Start Python ADDM service
cd addm-service
docker-compose up -d

# Start React frontend
cd ../swarm-forge
npm run dev

# Verify connection
curl http://localhost:8000/health
```

### 16.2 Production Deployment

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  addm-service:
    build: ./addm-service
    ports:
      - "8000:8000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LOG_LEVEL=warning
    restart: always
    
  frontend:
    build: ./swarm-forge
    ports:
      - "8080:8080"
    environment:
      - VITE_ADDM_SERVICE_URL=http://addm-service:8000
    depends_on:
      - addm-service
    restart: always
```

---

## 17. Monitoring & Metrics

### 17.1 ADDM Metrics to Track

```typescript
interface ADDMMetrics {
  // Loop statistics
  totalLoops: number;
  activeLoops: number;
  completedLoops: number;
  cancelledLoops: number;
  maxIterationsReached: number;
  
  // Decision statistics
  enhanceDecisions: number;
  researchDecisions: number;
  completeDecisions: number;
  
  // Performance
  avgIterationsPerLoop: number;
  avgConfidencePerLoop: number;
  avgExecutionTimeMs: number;
  
  // Content statistics
  avgContentLength: number;
  chunkedResponses: number;
  avgChunksPerResponse: number;
}
```

### 17.2 Logging Strategy

```typescript
// Structured logging for ADDM events

logger.info('ADDM loop started', {
  loopId,
  sessionId,
  workflowMode: config.workflowMode,
  maxIterations: config.maxIterations,
});

logger.info('ADDM iteration completed', {
  loopId,
  iteration,
  decision: decision.decision,
  confidence: decision.confidence,
  quality: qualityScore,
});

logger.info('ADDM loop completed', {
  loopId,
  totalIterations,
  finalDecision,
  averageConfidence,
  totalExecutionTimeMs,
});
```

---

## 18. Summary

### Key Integration Points

1. **ADDM operates ABOVE the Hybrid-Swarm layer**
   - Each iteration uses full swarm coordination
   - Preserves stigmergic independence
   - No changes to specialist/approach architecture

2. **Three execution modes:**
   - Standard: Single specialist, single execution
   - Parallel: N specialists, quality voting
   - ADDM: Single specialist per iteration, intelligent looping

3. **Leverages existing infrastructure:**
   - `ContentAnalyzer` for quality assessment
   - `SwarmTrace` for metadata display
   - `SystemConfig` settings pattern
   - `ExecutionHistoryStore` for learning

4. **User-friendly integration:**
   - Settings UI follows parallel execution pattern
   - Progress indicator shows iteration state
   - SwarmTrace enhanced with ADDM section
   - Toast notifications for completion

### Implementation Strategy

The integration follows an **additive enhancement pattern** similar to the parallel execution feature:
- Default disabled for backward compatibility
- Optional mode users can enable
- Separate execution path in ChatInterface
- Dedicated settings section
- Enhanced SwarmTrace display
- No changes to core swarm architecture

### Next Steps

1. Review this corrected plan with team
2. Approve architecture and terminology
3. Set up development environment
4. Begin Phase 1: Python service setup
5. Iterate through phases with testing

---

**Document Version:** 2.0 (Corrected with accurate swarm-forge terminology)  
**Last Updated:** 2025-01-24  
**Prepared By:** Integration Planning Team  
**Status:** Ready for Implementation
