// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Task signature - key characteristics of a task
 * Used for specialist matching via vector similarity
 */
export interface TaskSignature {
  domain: string;
  domainWeights: Record<string, number>;
  complexity: number;
  keywords: string[];
  outputType: string;
  estimatedDuration: number;
}

/**
 * Parallel execution configuration
 */
export interface ParallelConfig {
  enabled: boolean;
  parallelCount: number; // 2-5
  selectionStrategy: 'quality_voting' | 'first_complete' | 'consensus';
  timeoutMs: number; // per specialist
}

/**
 * Specialist profile - emergent agent expertise
 */
export interface SpecialistProfile {
  id: string;
  taskSignatures: TaskSignature[];
  successCount: number;
  failureCount: number;
  averageQuality: number;
  totalExecutions: number;
  specializationStrength: number;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Pattern signature - defines what tasks an approach handles well
 */
export interface PatternSignature {
  domainWeights: Record<string, number>;
  complexityMin: number;
  complexityMax: number;
  keywordPatterns: string[];
  keywordWeights: Record<string, number>;
  outputTypes: string[];
  requiresCode: boolean;
  requiresExamples: boolean;
  requiresTheory: boolean;
}

/**
 * Style characteristics - how to generate content
 */
export interface StyleCharacteristics {
  structureType: 'sequential_steps' | 'hierarchical' | 'prose' | 'bulleted';
  sectionCount: [number, number];
  tone: 'formal' | 'casual' | 'technical' | 'educational' | 'neutral';
  voice: 'first_person' | 'second_person' | 'third_person';
  depthLevel: 'concise' | 'moderate' | 'comprehensive' | 'exhaustive';
  explanationStyle: 'conceptual' | 'practical' | 'mixed';
  exampleDensity: 'low' | 'medium' | 'high';
  codeStyle: 'minimal' | 'annotated' | 'production' | null;
  useHeaders: boolean;
  useBullets: boolean;
  useNumberedLists: boolean;
  useTables: boolean;
  includeSummary: boolean;
  includeTldr: boolean;
  includePrerequisites: boolean;
  includeNextSteps: boolean;
}

/**
 * Performance metrics - approach effectiveness tracking
 */
export interface PerformanceMetrics {
  usageCount: number;
  firstUsed: Date;
  lastUsed: Date;
  avgQuality: number;
  minQuality: number;
  maxQuality: number;
  qualityStdDev: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  recentQualityTrend: 'improving' | 'stable' | 'declining' | 'new';
  qualityHistory: Array<{ timestamp: string; quality: number }>;
}

/**
 * Approach pattern - complete dynamic approach definition
 */
export interface ApproachPattern {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  lastUpdated: Date;
  patternSignature: PatternSignature;
  styleCharacteristics: StyleCharacteristics;
  performanceMetrics: PerformanceMetrics;
  parentId: string | null;
  generation: number;
  tags: string[];
  active: boolean;
}

/**
 * Signal - stigmergic coordination primitive
 */
export interface Signal {
  taskId: string;
  approach: string;
  strength: number;
  timestamp: number;
  depositedBy: string;
  successMetric: number;
}

/**
 * Task context - input for coordination
 */
export interface TaskContext {
  id: string;
  prompt: string;
  domainWeights: Record<string, number>;
  complexity: number;
  keywords: string[];
  outputType: string;
  estimatedDuration: number;
}

/**
 * Content features - extracted from generated content
 */
export interface ContentFeatures {
  sectionCount: number;
  hasCodeBlocks: boolean;
  codeBlockCount: number;
  hasNumberedList: boolean;
  hasBullets: boolean;
  hasTables: boolean;
  totalLength: number;
  avgSectionLength: number;
  detectedTone: string;
  formalityScore: number;
  explanationRatio: number;
  exampleRatio: number;
  codeRatio: number;
}

/**
 * Execution record - complete execution history entry
 */
export interface ExecutionRecord {
  recordId: string;
  timestamp: Date;
  taskContext: TaskContext;
  specialistId: string;
  approachId: string;
  qualityTarget: number;
  actualQuality: number;
  success: boolean;
  executionTimeMs: number;
  contentFeatures: ContentFeatures | null;
  fullContent?: string;
}

/**
 * Pattern cluster - discovered execution pattern
 */
export interface PatternCluster {
  clusterId: string;
  records: ExecutionRecord[];
  avgQuality: number;
  featureCentroid: Record<string, number>;
  isNovel: boolean;
  isConsistent: boolean;
}

/**
 * Coordination result - output of hybrid orchestrator
 */
export interface CoordinationResult {
  taskId: string;
  specialistId: string;
  approachId: string;
  qualityTarget: number;
  taskContext: TaskContext;
  approachMetadata?: {
    name: string;
    signature: PatternSignature;
    style: StyleCharacteristics;
    expectedQuality: number;
  };
}

/**
 * Single specialist execution result
 */
export interface SpecialistExecutionResult {
  specialistId: string;
  approachId: string;
  content: string;
  quality: number;
  success: boolean;
  executionTimeMs: number;
  error?: string;
}

/**
 * Parallel execution result
 */
export interface ParallelExecutionResult {
  results: SpecialistExecutionResult[];
  selectedResult: SpecialistExecutionResult;
  selectionReason: string;
  totalExecutionTimeMs: number;
  parallelCount: number;
}

/**
 * Extended coordination result with parallel support
 */
export interface ParallelCoordinationResult extends CoordinationResult {
  alternativeSpecialists?: Array<{
    specialistId: string;
    resonance: number;
  }>;
}

/**
 * System configuration
 */
export interface SystemConfig {
  vigilanceThreshold: number;
  decayRate: number;
  maxSpecialists: number;
  learningRate: number;
  patternDiscoveryThreshold: number;
  enablePatternDiscovery: boolean;
  parallelConfig: ParallelConfig;
}

/**
 * Swarm trace data - detailed execution metadata
 */
export interface SwarmTraceData {
  specialistId: string;
  specialistStats: {
    totalExecutions: number;
    successRate: number;
    avgQuality: number;
    specializationStrength: number;
  };
  approachId: string;
  approachName: string;
  approachStats: {
    usageCount: number;
    avgQuality: number;
    trend: string;
  };
  qualityTarget: number;
  actualQuality: number;
  swarmCounts: {
    totalSpecialists: number;
    activeSpecialists: number;
    totalApproaches: number;
    activeApproaches: number;
    totalSignals: number;
  };
  waveCounts: {
    executionCount: number;
    patternDiscoveryReady: boolean;
  };
  taskContext: {
    complexity: number;
    primaryDomain: string;
    keywords: string[];
    outputType: string;
  };
  parallelExecution?: {
    enabled: boolean;
    parallelCount: number;
    allResults: Array<{
      specialistId: string;
      quality: number;
      executionTimeMs: number;
    }>;
    selectionReason: string;
  };
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  coordination?: CoordinationResult;
  quality?: number;
  isStreaming?: boolean;
  swarmTrace?: SwarmTraceData;
  metadata?: Record<string, any>; // ADDM loop metadata and other extensions
}

/**
 * System statistics
 */
export interface SystemStats {
  specialistCount: number;
  activeSpecialistCount: number;
  approachCount: number;
  activeApproachCount: number;
  signalCount: number;
  executionCount: number;
  avgQuality: number;
  patternDiscoveryReady: boolean;
  specialists: Array<{
    id: string;
    executions: number;
    successRate: number;
    avgQuality: number;
    specialization: number;
  }>;
  approaches: Array<{
    id: string;
    name: string;
    usageCount: number;
    avgQuality: number;
    trend: string;
  }>;
  signals: Array<{
    taskId: string;
    approach: string;
    strength: number;
    age: number;
  }>;
}
