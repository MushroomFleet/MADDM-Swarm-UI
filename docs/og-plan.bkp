# ADDM-Hybrid Swarm Integration Handoff Documentation

## Executive Summary

This document provides a comprehensive blueprint for integrating the Python-based **ADDM (Agentic Drift-Diffusion Model) Loop Regulator** with an existing TypeScript React + Vite **Hybrid-Swarm** application. The integration introduces intelligent, evidence-based loop control that governs when AI responses should be enhanced, researched further, or delivered to the user.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [ADDM Core Concepts](#addm-core-concepts)
4. [Integration Architecture](#integration-architecture)
5. [Implementation Phases](#implementation-phases)
6. [API Design](#api-design)
7. [TypeScript Type Definitions](#typescript-type-definitions)
8. [Configuration & Settings](#configuration--settings)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Testing Strategy](#testing-strategy)
11. [Monitoring & Observability](#monitoring--observability)
12. [Migration Considerations](#migration-considerations)

---

## 1. System Overview

### 1.1 Current Hybrid-Swarm System

The existing system implements:

- **Hybrid-Swarm Text Inference**: Multi-agent text processing with adaptive capabilities
- **Adaptive Agent Creation/Selection**: Dynamic spawning and selection of specialized agents
- **Dynamic Approach Creation/Selection/Adaptation**: Runtime strategy modification
- **Stigmergic Coordination**: Signal board-based coordination eliminating orchestrator and inter-agent communication
- **Decentralized Architecture**: No central orchestrator, agents coordinate via shared signal board

### 1.2 ADDM Loop Regulator (Python)

The ADDM system provides:

- **Ternary Decision Making**: Three decision paths:
  1. Enhance Response (continue improving)
  2. Research More (gather additional information)
  3. Complete & Assemble (deliver to user)

- **Cognitive DDM Simulation**: Evidence-based decision making with realistic reaction times
- **Dynamic Context Management**: Automatic summarization at 32K character threshold
- **Workflow Modes**:
  - `research_assembly`: Multi-phase validation for research tasks
  - `news_analysis`: Depth and perspective enhancement for news

- **Confidence-Based Termination**: Parameterized thresholds for automated completion
- **File Chunking**: Automatic 32KB chunking with metadata headers

### 1.3 Integration Goals

The integration will:

1. Route initial swarm responses through ADDM for intelligent loop decisions
2. Provide user feedback/progress notifications during ADDM processing
3. Support configurable ADDM parameters via app settings modal
4. Enable max loops limiting to prevent infinite iterations
5. Handle long response chunking automatically
6. Create a new "ADDM Mode" toggle for the Hybrid-Swarm

---

## 2. Current Architecture Analysis

### 2.1 Hybrid-Swarm Components (Existing)

```typescript
// Conceptual structure - adapt to actual implementation

interface HybridSwarmSystem {
  // Agent Management
  agentPool: Agent[];
  agentFactory: AgentFactory;
  
  // Coordination
  signalBoard: SignalBoard;
  stigmergicCoordinator: StigmergicCoordinator;
  
  // Approach Management
  approachLibrary: ApproachLibrary;
  approachSelector: ApproachSelector;
  
  // Execution
  inferenceEngine: InferenceEngine;
  responseAggregator: ResponseAggregator;
}
```

### 2.2 Signal Board Pattern

The signal board eliminates the need for:
- Central orchestrator
- Direct agent-to-agent communication
- Complex message passing protocols

Agents interact by:
- **Reading signals**: Consuming information from the board
- **Writing signals**: Publishing results/status to the board
- **Reacting to patterns**: Responding to signal combinations

### 2.3 Current Chat Flow

```
User Input
    ↓
Hybrid-Swarm Processing
    ↓
Agent Creation/Selection
    ↓
Approach Selection/Adaptation
    ↓
Signal Board Coordination
    ↓
Response Aggregation
    ↓
User Output ← [Current endpoint]
```

---

## 3. ADDM Core Concepts

### 3.1 Drift-Diffusion Model (DDM)

The DDM simulates cognitive decision-making through evidence accumulation:

```python
# Conceptual Python structure from ADDM

class DDMOutcome:
    selected_action: str          # Which action was chosen
    reaction_time: float          # How long decision took (ms)
    confidence: float            # Decision confidence (0-1)
    evidence_trajectories: list  # Evidence accumulation over time
```

**Key Parameters:**
- **Drift Rate (μ)**: Speed of evidence accumulation
- **Noise (σ)**: Random variability in evidence
- **Threshold (a)**: Evidence level needed for decision
- **Non-decision Time (T₀)**: Base processing time

### 3.2 Ternary Decision Logic

```python
# Decision outcomes
ENHANCE_RESPONSE = "enhance"    # Continue improving current response
RESEARCH_MORE = "research"      # Gather more information
COMPLETE = "complete"           # Deliver to user

# Decision flow
if confidence > threshold:
    if quality_adequate:
        return COMPLETE
    else:
        return ENHANCE_RESPONSE
else:
    return RESEARCH_MORE
```

### 3.3 Workflow Modes

#### Research Assembly Mode
```python
workflow_mode = "research_assembly"

# Assessment Criteria
- Citation density
- Methodology rigor
- Evidence coverage
- Scientific validation

# Enhancement Focus
- Deeper validation
- Comprehensive evidence
- Methodological completeness
```

#### News Analysis Mode
```python
workflow_mode = "news_analysis"

# Assessment Criteria
- Stakeholder perspectives
- Historical context
- Impact analysis
- Factual verification

# Enhancement Focus
- Multiple viewpoints
- Background context
- Balanced coverage
```

### 3.4 Context Management

```python
CONTEXT_THRESHOLD = 32768  # 32K characters

def manage_context(content: str) -> str:
    if len(content) > CONTEXT_THRESHOLD:
        # Trigger LLM-based summarization
        return summarize_content(content)
    return content
```

### 3.5 File Chunking

```python
CHUNK_SIZE = 32768  # 32KB per file

def chunk_response(content: str, workflow_id: str) -> list:
    chunks = []
    for i, chunk in enumerate(split_by_size(content, CHUNK_SIZE)):
        metadata = create_metadata(workflow_id, i + 1, total_chunks)
        chunks.append(format_chunk(chunk, metadata))
    return chunks
```

---

## 4. Integration Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│           React + Vite Frontend                 │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │   UI Layer   │  │  Settings Modal      │   │
│  │  - Chat      │  │  - ADDM Config       │   │
│  │  - Progress  │  │  - Mode Toggle       │   │
│  └──────┬───────┘  └──────────────────────┘   │
│         │                                       │
│  ┌──────▼────────────────────────────────┐    │
│  │     Hybrid-Swarm Controller           │    │
│  │  - Agent Management                   │    │
│  │  - Signal Board                       │    │
│  │  - Response Aggregation               │    │
│  └──────┬────────────────────────────────┘    │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │
          │ HTTP/WebSocket
          │
┌─────────▼───────────────────────────────────────┐
│         TypeScript Backend Service              │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │    ADDM Integration Layer           │       │
│  │  - Request Queue                    │       │
│  │  - Loop State Management            │       │
│  │  - Python Bridge                    │       │
│  └────────┬────────────────────────────┘       │
│           │                                     │
│  ┌────────▼─────────────────────────────┐      │
│  │    Python ADDM Service               │      │
│  │  - DDM Engine                        │      │
│  │  - Workflow Logic                    │      │
│  │  - LLM Integration (OpenRouter)      │      │
│  └──────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.2 Component Responsibilities

#### Frontend (React + Vite)
- User interaction and chat interface
- ADDM mode toggle and configuration
- Progress notifications during loop processing
- Real-time status updates via WebSocket
- Response rendering with chunk support

#### Backend Service (TypeScript/Node.js)
- Request routing and orchestration
- Hybrid-swarm execution
- ADDM decision integration
- State management for loop iterations
- WebSocket server for real-time updates

#### Python ADDM Service
- DDM decision simulation
- Quality assessment
- Enhancement prompt generation
- Context summarization
- Response chunking

### 4.3 Communication Patterns

#### Synchronous: Initial Request
```typescript
POST /api/chat
{
  message: string;
  mode: "standard" | "addm";
  addmConfig?: ADDMConfig;
}
```

#### Asynchronous: Loop Updates
```typescript
WebSocket Message Types:
- "loop:started"
- "loop:iteration"
- "loop:decision"
- "loop:completed"
- "response:chunk"
```

---

## 5. Implementation Phases

### Phase 1: Core ADDM Service Setup (Week 1-2)

**Objectives:**
- Containerize Python ADDM service
- Create REST API wrapper
- Implement health checks and monitoring
- Set up development environment

**Deliverables:**
```
addm-service/
├── src/
│   ├── addm_loopregulator/     # Original Python code
│   ├── api/
│   │   ├── server.py           # FastAPI server
│   │   ├── routes.py           # API endpoints
│   │   └── models.py           # Request/response models
│   ├── bridge/
│   │   ├── converter.py        # TypeScript ↔ Python data conversion
│   │   └── validator.py        # Request validation
│   └── utils/
│       ├── logging.py
│       └── metrics.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── tests/
```

**API Endpoints:**
```python
# FastAPI endpoints

@app.post("/api/addm/decide")
async def decide(request: ADDMRequest) -> ADDMDecision:
    """
    Make a single ADDM decision based on current content
    """
    pass

@app.post("/api/addm/workflow")
async def run_workflow(request: WorkflowRequest) -> WorkflowResult:
    """
    Run complete ADDM workflow with multiple iterations
    """
    pass

@app.get("/health")
async def health_check() -> dict:
    """
    Service health and readiness
    """
    pass
```

### Phase 2: TypeScript Integration Layer (Week 2-3)

**Objectives:**
- Create TypeScript bridge to Python service
- Implement loop state management
- Build request queue system
- Add error handling and retry logic

**Deliverables:**
```typescript
// src/services/addm/

// Client for Python ADDM service
export class ADDMClient {
  async makeDecision(
    content: string,
    config: ADDMConfig
  ): Promise<ADDMDecision>;
  
  async runWorkflow(
    request: WorkflowRequest
  ): Promise<WorkflowResult>;
}

// Loop state management
export class ADDMLoopManager {
  private state: Map<string, LoopState>;
  
  async startLoop(sessionId: string, initialContent: string): Promise<void>;
  async continueLoop(sessionId: string, decision: ADDMDecision): Promise<void>;
  async completeLoop(sessionId: string): Promise<FinalResponse>;
}

// Integration with Hybrid-Swarm
export class SwarmADDMBridge {
  async processWithADDM(
    swarmResponse: SwarmResponse,
    config: ADDMConfig
  ): Promise<ProcessedResponse>;
}
```

### Phase 3: Frontend Integration (Week 3-4)

**Objectives:**
- Add ADDM mode toggle
- Implement settings modal for configuration
- Build progress notification UI
- Add WebSocket event handlers

**Deliverables:**
```typescript
// Components

// Settings modal for ADDM configuration
<ADDMSettingsModal>
  - Workflow mode selection
  - Confidence threshold slider
  - Max iterations input
  - Context threshold setting
</ADDMSettingsModal>

// Progress indicator during loops
<ADDMProgressIndicator>
  - Current iteration count
  - Decision history
  - Estimated completion
  - Cancel button
</ADDMProgressIndicator>

// Mode toggle in chat interface
<SwarmModeSelector>
  - Standard mode
  - ADDM mode
  - Quick settings access
</SwarmModeSelector>
```

### Phase 4: Signal Board Integration (Week 4-5)

**Objectives:**
- Extend signal board for ADDM coordination
- Add new signal types for loop control
- Implement ADDM-aware agent behaviors

**Deliverables:**
```typescript
// New signal types for ADDM

enum ADDMSignalType {
  LOOP_STARTED = "addm:loop:started",
  ITERATION_COMPLETE = "addm:iteration:complete",
  DECISION_MADE = "addm:decision:made",
  ENHANCEMENT_REQUESTED = "addm:enhancement:requested",
  RESEARCH_REQUESTED = "addm:research:requested",
  LOOP_COMPLETED = "addm:loop:completed"
}

// Signal board extensions
export class ADDMSignalBoard extends SignalBoard {
  publishADDMDecision(decision: ADDMDecision): void;
  subscribeToLoopEvents(handler: ADDMEventHandler): void;
  getLoopStatus(sessionId: string): LoopStatus;
}
```

### Phase 5: Testing & Optimization (Week 5-6)

**Objectives:**
- End-to-end testing
- Performance optimization
- Load testing
- Documentation

**Test Scenarios:**
```typescript
// Test cases

describe("ADDM Integration", () => {
  test("Single loop iteration completes successfully");
  test("Multiple loops with enhancement");
  test("Max iterations limit enforced");
  test("Context summarization triggers correctly");
  test("Chunk handling for long responses");
  test("Error recovery and retry logic");
  test("Concurrent loop handling");
  test("WebSocket notification delivery");
});
```

---

## 6. API Design

### 6.1 Python ADDM Service API

#### Decision Endpoint

```python
# POST /api/addm/decide

# Request
{
  "content": str,                    # Current response content
  "workflow_mode": str,              # "research_assembly" | "news_analysis"
  "context": str,                    # Previous iterations context
  "iteration": int,                  # Current iteration number
  "config": {
    "confidence_threshold": float,   # 0.0 - 1.0
    "max_iterations": int,
    "context_threshold": int,        # Character count
    "drift_rate": float,             # Optional DDM parameter
    "noise_sigma": float             # Optional DDM parameter
  }
}

# Response
{
  "decision": str,                   # "enhance" | "research" | "complete"
  "confidence": float,               # 0.0 - 1.0
  "reaction_time": float,            # Milliseconds
  "reasoning": str,                  # Explanation of decision
  "metrics": {
    "quality_score": float,
    "completeness_score": float,
    "improvement_potential": float
  },
  "next_prompt": str | null,         # If decision is not "complete"
  "should_summarize": bool           # Context threshold exceeded
}
```

#### Workflow Endpoint

```python
# POST /api/addm/workflow

# Request
{
  "initial_prompt": str,
  "workflow_mode": str,
  "output_prefix": str,              # For chunked file naming
  "config": {
    "confidence_threshold": float,
    "max_iterations": int,
    "context_threshold": int,
    "chunk_size": int
  },
  "callback_url": str | null         # For async updates
}

# Response (Streaming or Final)
{
  "workflow_id": str,
  "status": str,                     # "running" | "completed" | "failed"
  "iterations": int,
  "current_content": str,
  "decisions": [
    {
      "iteration": int,
      "decision": str,
      "confidence": float,
      "timestamp": str
    }
  ],
  "final_decision": str,
  "total_chars": int,
  "chunked_files": [str],            # If chunking occurred
  "context_summary": str | null
}
```

### 6.2 TypeScript Backend API

#### Chat Endpoint with ADDM

```typescript
// POST /api/chat

interface ChatRequest {
  message: string;
  sessionId: string;
  mode: "standard" | "addm";
  addmConfig?: {
    workflowMode: "research_assembly" | "news_analysis";
    confidenceThreshold: number;
    maxIterations: number;
    contextThreshold: number;
  };
}

interface ChatResponse {
  sessionId: string;
  mode: string;
  // Standard mode response
  response?: string;
  // ADDM mode response
  loopId?: string;
  status?: "processing" | "completed";
  estimatedIterations?: number;
}
```

#### Loop Status Endpoint

```typescript
// GET /api/addm/loop/:loopId

interface LoopStatus {
  loopId: string;
  sessionId: string;
  status: "active" | "completed" | "failed";
  currentIteration: number;
  maxIterations: number;
  decisions: ADDMDecision[];
  currentContent?: string;
  estimatedCompletion?: string;
}
```

### 6.3 WebSocket Events

```typescript
// Client → Server
{
  "type": "loop:cancel",
  "loopId": string
}

// Server → Client
{
  "type": "loop:started",
  "loopId": string,
  "sessionId": string,
  "maxIterations": number
}

{
  "type": "loop:iteration",
  "loopId": string,
  "iteration": number,
  "decision": string,
  "confidence": number,
  "reasoning": string
}

{
  "type": "loop:completed",
  "loopId": string,
  "totalIterations": number,
  "finalDecision": string,
  "response": string,
  "chunks": string[] | null
}

{
  "type": "loop:error",
  "loopId": string,
  "error": string,
  "recoverable": boolean
}
```

---

## 7. TypeScript Type Definitions

```typescript
// types/addm.ts

export enum WorkflowMode {
  RESEARCH_ASSEMBLY = "research_assembly",
  NEWS_ANALYSIS = "news_analysis"
}

export enum ADDMDecision {
  ENHANCE = "enhance",
  RESEARCH = "research",
  COMPLETE = "complete"
}

export interface ADDMConfig {
  workflowMode: WorkflowMode;
  confidenceThreshold: number;    // 0.0 - 1.0
  maxIterations: number;          // 1 - 20
  contextThreshold: number;       // Character count (default: 32768)
  chunkSize: number;              // Bytes (default: 32768)
  driftRate?: number;             // Optional DDM parameter
  noiseSigma?: number;            // Optional DDM parameter
}

export interface ADDMDecisionResult {
  decision: ADDMDecision;
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

export interface LoopState {
  loopId: string;
  sessionId: string;
  status: "active" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  iterations: LoopIteration[];
  currentContent: string;
  contextSummary?: string;
  config: ADDMConfig;
}

export interface LoopIteration {
  iteration: number;
  timestamp: Date;
  decision: ADDMDecisionResult;
  content: string;
  contentLength: number;
  wasEnhanced: boolean;
  wasResearched: boolean;
}

export interface WorkflowResult {
  workflowId: string;
  status: "completed" | "failed" | "max_iterations_reached";
  iterations: number;
  finalDecision: ADDMDecision;
  totalChars: number;
  response: string;
  chunks?: string[];
  contextSummary?: string;
  decisions: ADDMDecisionResult[];
  metrics: {
    totalReactionTime: number;
    averageConfidence: number;
    qualityImprovement: number;
  };
}

export interface ChunkMetadata {
  workflowId: string;
  chunkIndex: number;
  totalChunks: number;
  generatedAt: Date;
  metadata: {
    workflowMode: WorkflowMode;
    iterations: number;
    finalDecision: ADDMDecision;
    confidenceThreshold: number;
    totalChars: number;
  };
}
```

---

## 8. Configuration & Settings

### 8.1 Application Settings Schema

```typescript
// config/addm-settings.ts

export interface ADDMSettings {
  // Global toggles
  enabled: boolean;
  defaultMode: "standard" | "addm";
  
  // Default configurations
  defaultWorkflowMode: WorkflowMode;
  
  // Research Assembly defaults
  researchAssembly: {
    confidenceThreshold: number;     // Default: 0.95
    maxIterations: number;           // Default: 10
    contextThreshold: number;        // Default: 32768
    chunkSize: number;               // Default: 32768
  };
  
  // News Analysis defaults
  newsAnalysis: {
    confidenceThreshold: number;     // Default: 0.70
    maxIterations: number;           // Default: 8
    contextThreshold: number;        // Default: 24576
    chunkSize: number;               // Default: 32768
  };
  
  // Service configuration
  service: {
    pythonServiceUrl: string;
    timeout: number;                 // Milliseconds
    retryAttempts: number;
    retryDelay: number;              // Milliseconds
  };
  
  // UI preferences
  ui: {
    showProgressDetails: boolean;
    enableLoopCancellation: boolean;
    autoScrollToLatest: boolean;
    chunkRenderDelay: number;        // Milliseconds between chunks
  };
}

export const DEFAULT_ADDM_SETTINGS: ADDMSettings = {
  enabled: false,
  defaultMode: "standard",
  defaultWorkflowMode: WorkflowMode.RESEARCH_ASSEMBLY,
  
  researchAssembly: {
    confidenceThreshold: 0.95,
    maxIterations: 10,
    contextThreshold: 32768,
    chunkSize: 32768
  },
  
  newsAnalysis: {
    confidenceThreshold: 0.70,
    maxIterations: 8,
    contextThreshold: 24576,
    chunkSize: 32768
  },
  
  service: {
    pythonServiceUrl: "http://localhost:8000",
    timeout: 120000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  ui: {
    showProgressDetails: true,
    enableLoopCancellation: true,
    autoScrollToLatest: true,
    chunkRenderDelay: 100
  }
};
```

### 8.2 Settings Modal Component

```typescript
// components/ADDMSettingsModal.tsx

interface ADDMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ADDMSettings;
  onSave: (settings: ADDMSettings) => void;
}

export const ADDMSettingsModal: React.FC<ADDMSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>ADDM Configuration</ModalHeader>
      
      <ModalBody>
        {/* Global Settings */}
        <Section title="Global Settings">
          <Toggle
            label="Enable ADDM Mode"
            checked={localSettings.enabled}
            onChange={(enabled) => 
              setLocalSettings({ ...localSettings, enabled })
            }
          />
          
          <Select
            label="Default Mode"
            value={localSettings.defaultMode}
            options={[
              { value: "standard", label: "Standard Swarm" },
              { value: "addm", label: "ADDM Loop" }
            ]}
            onChange={(defaultMode) =>
              setLocalSettings({ ...localSettings, defaultMode })
            }
          />
          
          <Select
            label="Default Workflow"
            value={localSettings.defaultWorkflowMode}
            options={[
              { value: "research_assembly", label: "Research Assembly" },
              { value: "news_analysis", label: "News Analysis" }
            ]}
            onChange={(mode) =>
              setLocalSettings({ 
                ...localSettings, 
                defaultWorkflowMode: mode as WorkflowMode 
              })
            }
          />
        </Section>
        
        {/* Research Assembly Configuration */}
        <Section title="Research Assembly">
          <Slider
            label="Confidence Threshold"
            min={0.5}
            max={1.0}
            step={0.05}
            value={localSettings.researchAssembly.confidenceThreshold}
            onChange={(value) =>
              setLocalSettings({
                ...localSettings,
                researchAssembly: {
                  ...localSettings.researchAssembly,
                  confidenceThreshold: value
                }
              })
            }
            helpText="Higher values require more confidence before completion"
          />
          
          <NumberInput
            label="Max Iterations"
            min={1}
            max={20}
            value={localSettings.researchAssembly.maxIterations}
            onChange={(value) =>
              setLocalSettings({
                ...localSettings,
                researchAssembly: {
                  ...localSettings.researchAssembly,
                  maxIterations: value
                }
              })
            }
            helpText="Maximum number of enhancement loops"
          />
        </Section>
        
        {/* News Analysis Configuration */}
        <Section title="News Analysis">
          {/* Similar to Research Assembly */}
        </Section>
        
        {/* UI Preferences */}
        <Section title="UI Preferences">
          <Toggle
            label="Show Detailed Progress"
            checked={localSettings.ui.showProgressDetails}
            onChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                ui: { ...localSettings.ui, showProgressDetails: checked }
              })
            }
          />
          
          <Toggle
            label="Enable Loop Cancellation"
            checked={localSettings.ui.enableLoopCancellation}
            onChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                ui: { ...localSettings.ui, enableLoopCancellation: checked }
              })
            }
          />
        </Section>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSave(localSettings)}>
          Save Settings
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

### 8.3 Environment Variables

```bash
# .env

# ADDM Service
ADDM_SERVICE_URL=http://localhost:8000
ADDM_SERVICE_TIMEOUT=120000
ADDM_SERVICE_RETRY_ATTEMPTS=3

# OpenRouter API (for Python service)
OPENROUTER_API_KEY=your_key_here

# Feature Flags
ENABLE_ADDM=true
ENABLE_LOOP_CANCELLATION=true

# Performance
MAX_CONCURRENT_LOOPS=5
LOOP_TIMEOUT=300000

# Logging
LOG_ADDM_DECISIONS=true
LOG_LEVEL=info
```

---

## 9. Data Flow Diagrams

### 9.1 Standard Chat Flow (Current)

```
User Input
    ↓
┌───────────────────────┐
│  Frontend React App   │
│   - Chat Interface    │
└──────────┬────────────┘
           │ HTTP POST
           ↓
┌───────────────────────┐
│   Backend Service     │
│  - Request Handler    │
└──────────┬────────────┘
           │
           ↓
┌───────────────────────┐
│   Hybrid-Swarm        │
│  - Agent Spawning     │
│  - Signal Board       │
│  - Aggregation        │
└──────────┬────────────┘
           │
           ↓
┌───────────────────────┐
│   Response            │
│  - Aggregated Result  │
└──────────┬────────────┘
           │ HTTP Response
           ↓
┌───────────────────────┐
│  Frontend React App   │
│   - Display Response  │
└───────────────────────┘
```

### 9.2 ADDM-Enhanced Chat Flow (Proposed)

```
User Input
    ↓
┌───────────────────────────┐
│  Frontend React App       │
│   - ADDM Mode Enabled     │
└──────────┬────────────────┘
           │ HTTP POST + WS Connect
           ↓
┌───────────────────────────┐
│   Backend Service         │
│  - Mode Router            │
└──────────┬────────────────┘
           │
           ↓
┌───────────────────────────┐
│   Hybrid-Swarm            │
│  - Initial Processing     │
└──────────┬────────────────┘
           │
           ↓ Initial Response
┌───────────────────────────┐
│   ADDM Integration Layer  │
│  - Loop State Init        │
└──────────┬────────────────┘
           │
           ↓
      ╔════════════════════════╗
      ║   ADDM Decision Loop   ║
      ╚════════╤═══════════════╝
               │
         ┌─────┴─────┐
         │  Evaluate │
         │  Content  │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │   DDM     │
         │  Decision │
         └─────┬─────┘
               │
         ╔═════▼══════╗
         ║  Decision? ║
         ╚════╤═══╤═══╝
              │   │
     ┌────────┘   └────────┐
     │                     │
┌────▼────┐          ┌────▼─────┐
│ Enhance │          │ Research │
│  More   │          │   More   │
└────┬────┘          └────┬─────┘
     │                    │
     │   Generate         │   Generate
     │   Enhancement      │   Research
     │   Prompt           │   Prompt
     │                    │
     └────────┬───────────┘
              │
              ↓
     ┌────────────────┐
     │  Send to LLM   │
     │  via Swarm     │
     └────────┬───────┘
              │
              ↓ New Content
      ┌───────────────┐
      │  Check Iter.  │
      │  Limit & Size │
      └───────┬───────┘
              │
              ↓
      If < Max Iterations
              │
              ↓
      [Loop Back to Evaluate]
              
      OR
              
      If Max Reached
              ↓
         ┌────────┐
         │Complete│
         └────┬───┘
              │
              ↓
┌─────────────────────────┐
│  Chunk if Necessary     │
│  - 32KB chunks          │
│  - Metadata headers     │
└──────────┬──────────────┘
           │
           ↓ WS: loop:completed
┌───────────────────────┐
│  Frontend React App   │
│   - Display Response  │
│   - Render Chunks     │
└───────────────────────┘
```

### 9.3 Signal Board Coordination with ADDM

```
┌──────────────────────────────────────────────────┐
│              Signal Board                        │
│                                                  │
│  Signals:                                        │
│  ┌─────────────────────────────────────────┐    │
│  │  addm:loop:started                      │    │
│  │  addm:iteration:N                       │    │
│  │  addm:decision:enhance                  │    │
│  │  addm:decision:research                 │    │
│  │  addm:decision:complete                 │    │
│  │  swarm:response:ready                   │    │
│  │  agent:spawned                          │    │
│  │  approach:selected                      │    │
│  └─────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
        ↑                    ↑                ↑
        │ Read               │ Read           │ Write
        │                    │                │
   ┌────┴─────┐      ┌──────┴────┐    ┌─────┴──────┐
   │  Agent   │      │   ADDM    │    │   Swarm    │
   │  Pool    │      │   Loop    │    │   Coord.   │
   └──────────┘      │   Manager │    └────────────┘
                     └───────────┘
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// Test ADDM Client
describe("ADDMClient", () => {
  test("makes decision request successfully", async () => {
    const client = new ADDMClient(config);
    const decision = await client.makeDecision(content, config);
    
    expect(decision.decision).toBeOneOf(["enhance", "research", "complete"]);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
  
  test("handles service unavailable error", async () => {
    const client = new ADDMClient(config);
    // Mock service down
    
    await expect(client.makeDecision(content, config))
      .rejects.toThrow("ADDM service unavailable");
  });
});

// Test Loop Manager
describe("ADDMLoopManager", () => {
  test("starts loop and tracks state", async () => {
    const manager = new ADDMLoopManager();
    await manager.startLoop(sessionId, content);
    
    const state = manager.getLoopState(sessionId);
    expect(state.status).toBe("active");
    expect(state.iterations).toHaveLength(0);
  });
  
  test("enforces max iterations limit", async () => {
    const manager = new ADDMLoopManager();
    const config = { ...defaultConfig, maxIterations: 3 };
    
    // Run loop until max
    const result = await manager.runLoop(sessionId, content, config);
    
    expect(result.iterations).toBeLessThanOrEqual(3);
    expect(result.status).toMatch(/completed|max_iterations_reached/);
  });
  
  test("handles loop cancellation", async () => {
    const manager = new ADDMLoopManager();
    await manager.startLoop(sessionId, content);
    
    await manager.cancelLoop(sessionId);
    
    const state = manager.getLoopState(sessionId);
    expect(state.status).toBe("cancelled");
  });
});

// Test Integration Bridge
describe("SwarmADDMBridge", () => {
  test("routes swarm response through ADDM", async () => {
    const bridge = new SwarmADDMBridge();
    const swarmResponse = await hybridSwarm.process(input);
    
    const result = await bridge.processWithADDM(swarmResponse, config);
    
    expect(result).toHaveProperty("loopId");
    expect(result).toHaveProperty("status");
  });
});
```

### 10.2 Integration Tests

```typescript
// Test end-to-end flow
describe("ADDM Integration E2E", () => {
  test("complete chat flow with ADDM", async () => {
    // Start chat request
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "Explain quantum computing",
        mode: "addm",
        addmConfig: {
          workflowMode: "research_assembly",
          confidenceThreshold: 0.8,
          maxIterations: 5
        }
      })
    });
    
    const { loopId } = await response.json();
    
    // Connect WebSocket
    const ws = new WebSocket(`ws://localhost:3000/ws/${loopId}`);
    const events: any[] = [];
    
    ws.onmessage = (msg) => {
      events.push(JSON.parse(msg.data));
    };
    
    // Wait for completion
    await waitForEvent(ws, "loop:completed");
    
    // Verify event sequence
    expect(events[0].type).toBe("loop:started");
    expect(events.some(e => e.type === "loop:iteration")).toBe(true);
    expect(events[events.length - 1].type).toBe("loop:completed");
    
    // Verify final response
    const finalEvent = events[events.length - 1];
    expect(finalEvent).toHaveProperty("response");
    expect(finalEvent.totalIterations).toBeGreaterThan(0);
  });
  
  test("handles long responses with chunking", async () => {
    // Create request that will generate long response
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "Write comprehensive analysis of...",
        mode: "addm",
        addmConfig: {
          workflowMode: "research_assembly",
          maxIterations: 10
        }
      })
    });
    
    const result = await response.json();
    
    // Check for chunks
    expect(result.chunks).toBeDefined();
    if (result.chunks) {
      expect(result.chunks.length).toBeGreaterThan(1);
      
      // Verify chunk metadata
      for (const chunk of result.chunks) {
        expect(chunk).toContain("ADDM Loop Regulator Response Chunk");
        expect(chunk).toContain("Workflow ID:");
        expect(chunk).toContain("Chunk:");
      }
    }
  });
});
```

### 10.3 Performance Tests

```typescript
// Load testing
describe("ADDM Performance", () => {
  test("handles concurrent loops", async () => {
    const concurrentRequests = 5;
    const requests = Array(concurrentRequests)
      .fill(null)
      .map((_, i) => 
        fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            message: `Test request ${i}`,
            mode: "addm"
          })
        })
      );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // All should complete
    responses.forEach(r => expect(r.ok).toBe(true));
    
    // Should not take more than 2x single request time
    const avgTime = (endTime - startTime) / concurrentRequests;
    expect(avgTime).toBeLessThan(SINGLE_REQUEST_BENCHMARK * 2);
  });
  
  test("Python service response time", async () => {
    const client = new ADDMClient(config);
    
    const startTime = Date.now();
    await client.makeDecision(testContent, testConfig);
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // Should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });
});
```

### 10.4 Resilience Tests

```typescript
// Test error handling and recovery
describe("ADDM Resilience", () => {
  test("retries on service timeout", async () => {
    const client = new ADDMClient({
      ...config,
      retryAttempts: 3,
      timeout: 1000
    });
    
    // Mock intermittent failures
    let attempts = 0;
    mockService.onRequest(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Timeout");
      }
      return validResponse;
    });
    
    const result = await client.makeDecision(content, config);
    
    expect(attempts).toBe(3);
    expect(result).toBeDefined();
  });
  
  test("graceful degradation when ADDM unavailable", async () => {
    // Disable ADDM service
    mockService.shutdown();
    
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "Test",
        mode: "addm"
      })
    });
    
    const result = await response.json();
    
    // Should fall back to standard mode
    expect(result.mode).toBe("standard");
    expect(result.response).toBeDefined();
    expect(result.warning).toContain("ADDM unavailable");
  });
});
```

---

## 11. Monitoring & Observability

### 11.1 Metrics to Track

```typescript
// Metrics collection

interface ADDMMetrics {
  // Loop statistics
  totalLoops: number;
  activeLoops: number;
  completedLoops: number;
  failedLoops: number;
  cancelledLoops: number;
  
  // Iteration statistics
  avgIterationsPerLoop: number;
  maxIterations: number;
  minIterations: number;
  
  // Decision statistics
  enhanceDecisions: number;
  researchDecisions: number;
  completeDecisions: number;
  
  // Confidence statistics
  avgConfidence: number;
  avgReactionTime: number;
  
  // Performance
  avgLoopDuration: number;
  avgIterationDuration: number;
  pythonServiceLatency: number;
  
  // Content statistics
  avgContentLength: number;
  totalChunkedResponses: number;
  avgChunksPerResponse: number;
  
  // Errors
  timeoutErrors: number;
  serviceErrors: number;
  retryAttempts: number;
}
```

### 11.2 Logging Strategy

```typescript
// Structured logging

enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

interface LogContext {
  loopId?: string;
  sessionId?: string;
  iteration?: number;
  decision?: string;
  confidence?: number;
  duration?: number;
}

class ADDMLogger {
  logLoopStart(context: LogContext): void {
    this.log(LogLevel.INFO, "ADDM loop started", context);
  }
  
  logIteration(context: LogContext): void {
    this.log(LogLevel.DEBUG, "ADDM iteration", context);
  }
  
  logDecision(context: LogContext): void {
    this.log(LogLevel.INFO, "ADDM decision made", context);
  }
  
  logLoopComplete(context: LogContext): void {
    this.log(LogLevel.INFO, "ADDM loop completed", context);
  }
  
  logError(error: Error, context: LogContext): void {
    this.log(LogLevel.ERROR, "ADDM error", { ...context, error });
  }
}
```

### 11.3 Dashboard Components

```typescript
// Real-time monitoring dashboard

<ADDMMonitoringDashboard>
  <MetricCard
    title="Active Loops"
    value={metrics.activeLoops}
    trend="stable"
  />
  
  <MetricCard
    title="Avg Iterations"
    value={metrics.avgIterationsPerLoop}
    trend="down"
  />
  
  <MetricCard
    title="Success Rate"
    value={`${metrics.completedLoops / metrics.totalLoops * 100}%`}
    trend="up"
  />
  
  <Chart
    title="Decisions Over Time"
    data={decisionsTimeSeries}
    series={["enhance", "research", "complete"]}
  />
  
  <Chart
    title="Confidence Distribution"
    type="histogram"
    data={confidenceDistribution}
  />
  
  <Table
    title="Recent Loops"
    columns={["Loop ID", "Iterations", "Decision", "Duration", "Status"]}
    data={recentLoops}
  />
</ADDMMonitoringDashboard>
```

---

## 12. Migration Considerations

### 12.1 Backward Compatibility

The integration must maintain full backward compatibility with existing functionality:

```typescript
// Ensure standard mode remains unchanged
if (request.mode === "standard") {
  // Execute existing Hybrid-Swarm flow
  return await hybridSwarm.process(request);
}

// ADDM mode is opt-in
if (request.mode === "addm" && isADDMEnabled()) {
  // Execute ADDM-enhanced flow
  return await addmEnhancedProcess(request);
}
```

### 12.2 Feature Flags

```typescript
// Feature flag system

enum FeatureFlag {
  ADDM_ENABLED = "addm_enabled",
  ADDM_RESEARCH_MODE = "addm_research_mode",
  ADDM_NEWS_MODE = "addm_news_mode",
  ADDM_CHUNKING = "addm_chunking",
  ADDM_LOOP_CANCEL = "addm_loop_cancellation"
}

class FeatureFlagService {
  isEnabled(flag: FeatureFlag): boolean {
    // Check environment, user settings, rollout percentage
    return this.evaluate(flag);
  }
}

// Usage
if (featureFlags.isEnabled(FeatureFlag.ADDM_ENABLED)) {
  // Show ADDM mode toggle
}
```

### 12.3 Gradual Rollout

```typescript
// Phased rollout strategy

Phase 1: Internal Testing (Week 1-2)
- Enable for internal team only
- Test all edge cases
- Gather feedback

Phase 2: Beta Users (Week 3-4)
- Enable for 10% of users
- Monitor metrics closely
- Collect user feedback

Phase 3: Wider Release (Week 5)
- Enable for 50% of users
- Compare metrics between cohorts
- Iterate based on data

Phase 4: Full Release (Week 6)
- Enable for 100% of users
- Continue monitoring
- Optimize based on usage patterns
```

### 12.4 Data Migration

```typescript
// No data migration required for new feature
// Settings stored in user preferences

interface UserPreferences {
  // Existing preferences...
  
  // New ADDM preferences
  addmSettings?: ADDMSettings;
  addmModePreference?: "standard" | "addm";
  addmWorkflowDefault?: WorkflowMode;
}

// Default to standard mode for existing users
function migrateUserPreferences(user: User): void {
  if (!user.preferences.addmSettings) {
    user.preferences.addmSettings = DEFAULT_ADDM_SETTINGS;
    user.preferences.addmModePreference = "standard";
  }
}
```

---

## Appendix A: Code Examples

### Example 1: ADDM Client Implementation

```typescript
// src/services/addm/client.ts

import axios, { AxiosInstance } from 'axios';

export class ADDMClient {
  private client: AxiosInstance;
  private config: ADDMServiceConfig;

  constructor(config: ADDMServiceConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.serviceUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async makeDecision(
    content: string,
    config: ADDMConfig,
    context?: string
  ): Promise<ADDMDecisionResult> {
    try {
      const response = await this.client.post('/api/addm/decide', {
        content,
        workflow_mode: config.workflowMode,
        context: context || '',
        config: {
          confidence_threshold: config.confidenceThreshold,
          max_iterations: config.maxIterations,
          context_threshold: config.contextThreshold,
        },
      });

      return this.transformDecisionResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async runWorkflow(
    request: WorkflowRequest
  ): Promise<WorkflowResult> {
    const response = await this.client.post('/api/addm/workflow', {
      initial_prompt: request.initialPrompt,
      workflow_mode: request.workflowMode,
      output_prefix: request.outputPrefix,
      config: request.config,
    });

    return this.transformWorkflowResponse(response.data);
  }

  private transformDecisionResponse(data: any): ADDMDecisionResult {
    return {
      decision: data.decision as ADDMDecision,
      confidence: data.confidence,
      reactionTime: data.reaction_time,
      reasoning: data.reasoning,
      metrics: data.metrics,
      nextPrompt: data.next_prompt,
      shouldSummarize: data.should_summarize,
    };
  }

  private transformWorkflowResponse(data: any): WorkflowResult {
    return {
      workflowId: data.workflow_id,
      status: data.status,
      iterations: data.iterations,
      finalDecision: data.final_decision as ADDMDecision,
      totalChars: data.total_chars,
      response: data.current_content,
      chunks: data.chunked_files,
      contextSummary: data.context_summary,
      decisions: data.decisions.map(this.transformDecisionResponse),
      metrics: {
        totalReactionTime: data.decisions.reduce(
          (sum: number, d: any) => sum + d.reaction_time, 
          0
        ),
        averageConfidence: data.decisions.reduce(
          (sum: number, d: any) => sum + d.confidence, 
          0
        ) / data.decisions.length,
        qualityImprovement: data.metrics?.quality_improvement || 0,
      },
    };
  }

  private handleError(error: any): Error {
    if (error.code === 'ECONNREFUSED') {
      return new Error('ADDM service unavailable');
    }
    if (error.response?.status === 408) {
      return new Error('ADDM service timeout');
    }
    return new Error(`ADDM error: ${error.message}`);
  }
}
```

### Example 2: Loop Manager Implementation

```typescript
// src/services/addm/loop-manager.ts

export class ADDMLoopManager {
  private loops: Map<string, LoopState> = new Map();
  private client: ADDMClient;
  private swarm: HybridSwarmService;
  private eventEmitter: EventEmitter;

  constructor(
    client: ADDMClient,
    swarm: HybridSwarmService,
    eventEmitter: EventEmitter
  ) {
    this.client = client;
    this.swarm = swarm;
    this.eventEmitter = eventEmitter;
  }

  async startLoop(
    sessionId: string,
    initialContent: string,
    config: ADDMConfig
  ): Promise<string> {
    const loopId = this.generateLoopId();
    
    const state: LoopState = {
      loopId,
      sessionId,
      status: 'active',
      startTime: new Date(),
      iterations: [],
      currentContent: initialContent,
      config,
    };

    this.loops.set(loopId, state);
    
    this.eventEmitter.emit('loop:started', {
      loopId,
      sessionId,
      maxIterations: config.maxIterations,
    });

    // Start loop execution asynchronously
    this.executeLoop(loopId).catch((error) => {
      this.handleLoopError(loopId, error);
    });

    return loopId;
  }

  private async executeLoop(loopId: string): Promise<void> {
    const state = this.loops.get(loopId);
    if (!state) throw new Error('Loop state not found');

    let iteration = 1;
    let currentContent = state.currentContent;
    let context = '';

    while (
      state.status === 'active' && 
      iteration <= state.config.maxIterations
    ) {
      // Make ADDM decision
      const decision = await this.client.makeDecision(
        currentContent,
        state.config,
        context
      );

      // Record iteration
      const iterationData: LoopIteration = {
        iteration,
        timestamp: new Date(),
        decision,
        content: currentContent,
        contentLength: currentContent.length,
        wasEnhanced: decision.decision === ADDMDecision.ENHANCE,
        wasResearched: decision.decision === ADDMDecision.RESEARCH,
      };

      state.iterations.push(iterationData);

      // Emit iteration event
      this.eventEmitter.emit('loop:iteration', {
        loopId,
        iteration,
        decision: decision.decision,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      });

      // Check if complete
      if (decision.decision === ADDMDecision.COMPLETE) {
        await this.completeLoop(loopId, currentContent);
        return;
      }

      // Generate next prompt based on decision
      const nextPrompt = decision.nextPrompt || 
        this.generateEnhancementPrompt(currentContent, decision);

      // Process through swarm
      const swarmResponse = await this.swarm.process({
        message: nextPrompt,
        sessionId: state.sessionId,
        context: currentContent,
      });

      currentContent = swarmResponse.content;

      // Update context (summarize if needed)
      if (decision.shouldSummarize) {
        context = await this.summarizeContext(state);
      } else {
        context += `\n\nIteration ${iteration}:\n${currentContent}`;
      }

      iteration++;
    }

    // Max iterations reached
    if (iteration > state.config.maxIterations) {
      await this.completeLoop(loopId, currentContent, 'max_iterations_reached');
    }
  }

  private async completeLoop(
    loopId: string,
    finalContent: string,
    reason: string = 'completed'
  ): Promise<void> {
    const state = this.loops.get(loopId);
    if (!state) return;

    state.status = 'completed';
    state.endTime = new Date();

    // Handle chunking if necessary
    const chunks = this.shouldChunk(finalContent) 
      ? this.chunkResponse(finalContent, state)
      : null;

    this.eventEmitter.emit('loop:completed', {
      loopId,
      totalIterations: state.iterations.length,
      finalDecision: reason,
      response: finalContent,
      chunks,
      duration: state.endTime.getTime() - state.startTime.getTime(),
    });
  }

  private shouldChunk(content: string): boolean {
    return content.length > 32768; // 32KB
  }

  private chunkResponse(
    content: string,
    state: LoopState
  ): string[] {
    const chunkSize = state.config.chunkSize || 32768;
    const chunks: string[] = [];
    const totalChunks = Math.ceil(content.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, content.length);
      const chunkContent = content.slice(start, end);

      const metadata = this.createChunkMetadata(state, i + 1, totalChunks);
      chunks.push(`${metadata}\n\n${chunkContent}`);
    }

    return chunks;
  }

  private createChunkMetadata(
    state: LoopState,
    chunkIndex: number,
    totalChunks: number
  ): string {
    return `ADDM Loop Regulator Response Chunk
Workflow ID: ${state.loopId}
Chunk: ${chunkIndex}/${totalChunks}
Generated: ${new Date().toISOString()}

Metadata:
workflow_mode: ${state.config.workflowMode}
iterations: ${state.iterations.length}
final_decision: ${state.status}
confidence_threshold: ${state.config.confidenceThreshold}
total_chars: ${state.currentContent.length}

---`;
  }

  async cancelLoop(loopId: string): Promise<void> {
    const state = this.loops.get(loopId);
    if (!state) return;

    state.status = 'cancelled';
    state.endTime = new Date();

    this.eventEmitter.emit('loop:cancelled', { loopId });
  }

  getLoopState(loopId: string): LoopState | undefined {
    return this.loops.get(loopId);
  }

  private generateLoopId(): string {
    return `loop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEnhancementPrompt(
    content: string,
    decision: ADDMDecisionResult
  ): string {
    if (decision.decision === ADDMDecision.ENHANCE) {
      return `Enhance the following content by improving ${decision.reasoning}:\n\n${content}`;
    }
    
    if (decision.decision === ADDMDecision.RESEARCH) {
      return `Research and add more information about ${decision.reasoning}:\n\n${content}`;
    }

    return content;
  }

  private async summarizeContext(state: LoopState): Promise<string> {
    // Use LLM to summarize previous iterations
    const allContent = state.iterations
      .map((it) => `Iteration ${it.iteration}:\n${it.content}`)
      .join('\n\n');

    const summaryPrompt = `Summarize the key points and progress from these iterations:\n\n${allContent}`;

    const summary = await this.swarm.process({
      message: summaryPrompt,
      sessionId: state.sessionId,
      mode: 'standard', // Use fast mode for summarization
    });

    return summary.content;
  }

  private handleLoopError(loopId: string, error: Error): void {
    const state = this.loops.get(loopId);
    if (!state) return;

    state.status = 'failed';
    state.endTime = new Date();

    this.eventEmitter.emit('loop:error', {
      loopId,
      error: error.message,
      recoverable: false,
    });
  }
}
```

---

## Appendix B: Python FastAPI Service Example

```python
# python-service/src/api/server.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.addm_loopregulator import LoopRegulator

app = FastAPI(title="ADDM Loop Regulator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ADDMConfig(BaseModel):
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
    config: ADDMConfig

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
    output_prefix: str
    config: ADDMConfig
    callback_url: Optional[str] = None

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    iterations: int
    current_content: str
    decisions: List[dict]
    final_decision: str
    total_chars: int
    chunked_files: List[str]
    context_summary: Optional[str]

# Initialize regulator (will be configured per request)
def create_regulator(config: ADDMConfig, workflow_mode: str) -> LoopRegulator:
    return LoopRegulator(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        workflow_mode=workflow_mode,
        confidence_threshold=config.confidence_threshold,
        max_iterations=config.max_iterations,
        context_threshold=config.context_threshold
    )

@app.post("/api/addm/decide", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """
    Make a single ADDM decision based on current content
    """
    try:
        regulator = create_regulator(request.config, request.workflow_mode)
        
        # Simulate single decision cycle
        # (In actual implementation, this would call the DDM engine directly)
        decision_result = regulator._make_loop_decision(
            request.content,
            request.context,
            request.iteration
        )
        
        return DecisionResponse(
            decision=decision_result["decision"],
            confidence=decision_result["confidence"],
            reaction_time=decision_result["reaction_time"],
            reasoning=decision_result["reasoning"],
            metrics=decision_result["metrics"],
            next_prompt=decision_result.get("next_prompt"),
            should_summarize=len(request.context) > request.config.context_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/addm/workflow", response_model=WorkflowResponse)
async def run_workflow(request: WorkflowRequest):
    """
    Run complete ADDM workflow with multiple iterations
    """
    try:
        regulator = create_regulator(request.config, request.workflow_mode)
        
        result = regulator.execute_workflow(
            initial_prompt=request.initial_prompt,
            output_prefix=request.output_prefix
        )
        
        return WorkflowResponse(
            workflow_id=result["workflow_id"],
            status="completed",
            iterations=result["iterations"],
            current_content=result["all_responses"][-1] if result["all_responses"] else "",
            decisions=[
                {
                    "iteration": i + 1,
                    "decision": d["decision"],
                    "confidence": d["confidence"],
                    "timestamp": d["timestamp"]
                }
                for i, d in enumerate(result.get("decisions", []))
            ],
            final_decision=result["final_decision"],
            total_chars=result["total_chars"],
            chunked_files=result.get("chunked_files", []),
            context_summary=result.get("context_summary")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Service health and readiness check
    """
    return {
        "status": "healthy",
        "service": "ADDM Loop Regulator",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Appendix C: Docker Configuration

```dockerfile
# Dockerfile

FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY examples/ ./examples/

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
      context: ./python-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - LOG_LEVEL=info
    volumes:
      - ./python-service/src:/app/src
      - ./output:/app/output
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - ADDM_SERVICE_URL=http://addm-service:8000
      - NODE_ENV=production
    depends_on:
      - addm-service
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
    depends_on:
      - backend
    restart: unless-stopped
```

---

## Summary

This handoff documentation provides a comprehensive blueprint for integrating the ADDM Loop Regulator with your Hybrid-Swarm system. The integration preserves the existing stigmergic coordination architecture while adding intelligent loop control through the DDM-based decision framework.

Key integration points:
1. **Modular Python Service**: Containerized ADDM service with REST API
2. **TypeScript Bridge Layer**: Clean integration with existing Hybrid-Swarm
3. **Signal Board Extension**: ADDM events as first-class signals
4. **Progressive Enhancement**: Opt-in ADDM mode with fallback to standard
5. **User Control**: Comprehensive settings for workflow customization

The phased implementation approach ensures smooth rollout with minimal disruption to existing functionality while enabling powerful new capabilities for research-intensive and iterative refinement tasks.
