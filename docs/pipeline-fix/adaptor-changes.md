# Phase 4: Adaptor Changes for ADDM Decision Flow Integration

## Overview

This document outlines the specific code modifications needed to integrate the enhanced ADDM decision tracking system into the existing SwarmADDMBridge and related components. The goal is to intercept ADDM decisions, process them through the new tracking system, and ensure they properly map to section creation and labeling.

## Key Integration Points

1. **SwarmADDMBridge.makeIterationDecision()** - Primary interception point
2. **ADDMLoopManager.loop()** - Decision processing integration
3. **PromptAssembler.assembleRefinementPrompts()** - Decision-based prompt routing
4. **Error handling and fallbacks** - Graceful degradation for decision failures

## Modification Details

### 1. SwarmADDMBridge Enhanced Decision Processing

**File:** `swarm-forge/src/services/SwarmADDMBridge.ts`

**Changes Required:**

```typescript
// ADD to imports section
import { DecisionFlowAdaptor, ProcessedDecision, ADDMIntegrationHelpers } from '../../../docs/pipeline-fix/phase4-decision-tracking';

// REPLACE the existing makeIterationDecision method
async makeIterationDecision(
  content: string
): Promise<ADDMDecisionResponse> {
  console.log('[SwarmADDMBridge] Making iteration decision with content length:', content.length);

  try {
    // NEW: Initialize decision tracking if not already done
    if (!this.decisionAdaptor) {
      this.decisionAdaptor = new DecisionFlowAdaptor();
      this.decisionAdaptor.initializeSession(
        this.loopManager?.getCurrentLoop()?.loopId || 'default-session',
        this.originalUserQuery
      );
    }

    // NEW: Create decision context
    const decisionContext = {
      iteration: this.loopManager?.getCurrentLoop()?.iteration || 0,
      previousContent: content,
      sessionId: this.loopManager?.getCurrentLoop()?.loopId || 'default-session',
      userQuery: this.originalUserQuery,
      approachMetadata: {} // Would populate with actual approach data
    };

    // NEW: Intercept ADDM call with tracking
    const processedDecision = await this.decisionAdaptor.interceptDecisionCall(
      async () => {
        // ORIGINAL ADDM SERVICE CALL - KEEP THIS
        const decisionRequest = this.buildDecisionRequest(content);
        return await this.addmClient.makeDecision(decisionRequest);
      },
      decisionContext
    );

    // NEW: Store processed decision for later section creation
    this.lastProcessedDecision = processedDecision;

    // RETURN original decision for backward compatibility
    return processedDecision.originalDecision;

  } catch (error) {
    console.error('[SwarmADDMBridge] Decision processing failed:', error);

    // NEW: Fallback handling with basic mapping
    return this.createFallbackDecision(content);
  }
}

// ADD these new properties to the class
private decisionAdaptor: DecisionFlowAdaptor | null = null;
private lastProcessedDecision: ProcessedDecision | null = null;

// ADD helper method for fallbacks
private createFallbackDecision(content: string): ADDMDecisionResponse {
  const qualityScore = this.calculateContentQuality(content);

  // Fallback decision logic based on content analysis
  let decision: 'research' | 'enhance' | 'complete' = 'enhance';
  if (qualityScore < 0.6) {
    decision = 'research';
  } else if (qualityScore > 0.85) {
    decision = 'complete';
  }

  return {
    decision,
    confidence: Math.min(qualityScore + 0.1, 0.9), // Add some optimism
    reaction_time: 100,
    reasoning: `Fallback decision due to service unavailability. Content quality: ${(qualityScore * 100).toFixed(1)}%`,
    metrics: {
      quality_score: qualityScore,
      completeness_score: qualityScore * 0.8,
      improvement_potential: 1 - qualityScore
    },
    should_summarize: false,
    timestamp: new Date().toISOString()
  };
}

// ADD method to get last processed decision for section creation
getLastProcessedDecision(): ProcessedDecision | null {
  return this.lastProcessedDecision;
}

// ADD method to complete decision tracking
completeDecisionTracking(): any {
  return this.decisionAdaptor?.completeSession();
}
```

### 2. ADDMLoopManager Decision Flow Integration

**File:** `swarm-forge/src/services/ADDMLoopManager.ts`

**Changes Required:**

```typescript
// ADD new method to handle processed decisions
async makeIterationDecisionWithProcessing(
  content: string
): Promise<{
  decision: ADDMDecisionResponse;
  processedDecision: ProcessedDecision;
}> {
  // Get the original decision
  const decision = await this.makeIterationDecision(content);

  // Check if decision tracking is available (would come from SwarmADDMBridge)
  const context = {
    iteration: this.getCurrentLoop()?.iteration || 0,
    previousContent: content,
    sessionId: this.getCurrentLoop()?.loopId || 'default',
    userQuery: this.originalUserQuery,
    approachMetadata: {}
  };

  // Process decision through tracking system
  if (window.decisionTracker) { // Assuming global access to decision tracker
    const processedDecision = await window.decisionTracker.processDecision(decision, context);

    return {
      decision,
      processedDecision
    };
  }

  // Fallback: create basic processed decision
  const processedDecision: ProcessedDecision = {
    originalDecision: decision,
    sectionType: this.mapDecisionToSectionType(decision.decision),
    sectionLabel: `fallback-${decision.decision}`,
    contentStrategy: decision.decision === 'research' ? 'expand' : 'synthesize',
    metadata: {
      decisionTimestamp: decision.timestamp,
      processingTimestamp: new Date().toISOString(),
      confidenceCategory: decision.confidence > 0.8 ? 'high' : decision.confidence > 0.6 ? 'medium' : 'low',
      improvementScore: decision.metrics.improvement_potential,
      sectionPurpose: `Automatic ${decision.decision} decision`
    }
  };

  return {
    decision,
    processedDecision
  };
}

// ADD helper method for section type mapping
private mapDecisionToSectionType(decision: string): 'initial' | 'research' | 'enhance' {
  switch (decision) {
    case 'research': return 'research';
    case 'enhance':
    case 'complete': return 'enhance'; // Complete maps to enhance section
    default: return 'enhance';
  }
}
```

### 3. StructuredSwarmADDMBridge Usage Pattern

**Integration Pattern:** Replace generic SwarmADDMBridge usage with structured version

```typescript
// BEFORE (in hook or caller)
const bridge = new SwarmADDMBridge(config, orchestrator);
const result = await bridge.executeADDMLoop(options);

// AFTER (with structured output)
import { StructuredSwarmADDMBridge } from '../docs/pipeline-fix/phase2-bridge-changes';

const structuredBridge = new StructuredSwarmADDMBridge(config, orchestrator);
await structuredBridge.initializeStructuredLoop(options.initialPrompt);

// Execute with section tracking
for (let i = 0; i < maxIterations; i++) {
  const coordination = await structuredBridge.getSwarmCoordination(...);
  const decision = await structuredBridge.makeIterationDecision(...);
  const processed = await structuredBridge.processDecisionWithSections(decision, coordination);
  await structuredBridge.executeStructuredIteration(i, coordination, processed);
}

// Get final structured output
const finalOutput = structuredBridge.finalizeStructuredLoop();
```

### 4. PromptAssembler Decision-Based Routing

**File:** `swarm-forge/src/services/PromptAssembler.ts`

**Integration Changes:**

```typescript
// ADD method to route prompts based on processed decisions
static assemblePromptForProcessedDecision(
  processedDecision: ProcessedDecision,
  userQuery: string,
  contextContent: string,
  approachMetadata: any
): AssembledPrompt {
  // Route to appropriate new method based on decision
  switch (processedDecision.originalDecision.decision) {
    case 'research':
      return this.assembleStructuredResearchPrompt(
        userQuery,
        processedDecision.originalDecision.refinement_strategy,
        approachMetadata,
        processedDecision.researchIterationCount || 1
      );

    case 'enhance':
    case 'complete':
      return this.assembleStructuredEnhancePrompt(
        userQuery,
        contextContent,
        approachMetadata
      );

    default:
      // Fallback to enhance
      return this.assembleStructuredEnhancePrompt(
        userQuery,
        contextContent,
        approachMetadata
      );
  }
}

// UPDATE existing assembleRefinementPrompts to be deprecated
static assembleRefinementPrompts(
  originalUserQuery: string,
  previousContent: string,
  refinementStrategy: RefinementStrategy,
  approachMetadata: any
): AssembledPrompt {
  // DEPRECATED - Issue warning
  console.warn('assembleRefinementPrompts is deprecated. Use assemblePromptForProcessedDecision instead.');

  // Fallback mapping for backward compatibility
  const mockProcessedDecision: ProcessedDecision = {
    originalDecision: {
      decision: refinementStrategy.type,
      confidence: 0.8,
      reaction_time: 100,
      reasoning: 'Legacy fallback',
      refinement_strategy: refinementStrategy,
      metrics: { quality_score: 0.7, completeness_score: 0.6, improvement_potential: 0.5 },
      should_summarize: false,
      timestamp: new Date().toISOString()
    },
    sectionType: refinementStrategy.type === 'research' ? 'research' : 'enhance',
    sectionLabel: `legacy-${refinementStrategy.type}`,
    contentStrategy: refinementStrategy.type === 'research' ? 'expand' : 'synthesize',
    metadata: {
      decisionTimestamp: new Date().toISOString(),
      processingTimestamp: new Date().toISOString(),
      confidenceCategory: 'medium',
      improvementScore: 0.5,
      sectionPurpose: 'Legacy compatibility mode'
    }
  };

  return this.assemblePromptForProcessedDecision(mockProcessedDecision, originalUserQuery, previousContent, approachMetadata);
}
```

### 5. Content Accumulator Integration

**File:** Integration with `docs/pipeline-fix/content-accumulator.ts`

```typescript
// ADD to SwarmADDMBridge or create new method
private contentAccumulator: ContentAccumulator | null = null;

// Initialize in executeADDMLoop
this.contentAccumulator = new ContentAccumulator(
  this.decisionAdaptor?.getSessionStats()?.sessionId || 'default',
  { enableAgentNotes: true, enableSwarmStats: true }
);

// Add sections as they are created
if (this.lastProcessedDecision && content) {
  const section = ADDMIntegrationHelpers.createSectionForDecision(
    this.lastProcessedDecision,
    content,
    this.contentAccumulator.getOutputId()
  );
  this.contentAccumulator.addSection(content, section.type, section.iteration, this.lastProcessedDecision.originalDecision.decision);

  // Store section reference
  this.generatedSections.push(section);
}
```

## Error Handling and Validation

### Decision Validation
```typescript
// ADD validation before processing
validateADDMDecision(decision: ADDMDecisionResponse): boolean {
  return !!(decision.decision &&
           typeof decision.confidence === 'number' &&
           decision.reasoning &&
           decision.metrics);
}

// ADD error recovery
handleDecisionFailure(error: Error, context: DecisionContext): ProcessedDecision {
  console.warn('[DecisionIntegration] Decision processing failed, using fallback:', error.message);

  return {
    originalDecision: this.createFallbackDecision(''),
    sectionType: 'enhance',
    sectionLabel: 'fallback-error-recovery',
    contentStrategy: 'synthesize',
    metadata: {
      decisionTimestamp: new Date().toISOString(),
      processingTimestamp: new Date().toISOString(),
      confidenceCategory: 'low',
      improvementScore: 0.3,
      sectionPurpose: 'Error recovery fallback'
    }
  };
}
```

## Testing Integration

### Unit Tests Addition
```typescript
// ADD to test suite
describe('ADDM Decision Integration', () => {
  it('should intercept and process ADDM decisions', async () => {
    const adaptor = new DecisionFlowAdaptor();
    adaptor.initializeSession('test-session', 'Test query');

    const mockDecisionResponse: ADDMDecisionResponse = {
      decision: 'research',
      confidence: 0.85,
      // ... other fields
    };

    const context: DecisionContext = {
      iteration: 1,
      sessionId: 'test-session',
      userQuery: 'Test query'
    };

    const processed = await adaptor.interceptDecisionCall(
      () => Promise.resolve(mockDecisionResponse),
      context
    );

    expect(processed.sectionType).toBe('research');
    expect(processed.metadata.confidenceCategory).toBe('high');
  });
});
```

## Migration Strategy

### Gradual Rollout
1. **Phase 1:** Add decision tracking alongside existing logic (no breaking changes)
2. **Phase 2:** Update prompt assembly to use new methods (backward compatible)
3. **Phase 3:** Enable structured section output (opt-in feature flag)
4. **Phase 4:** Remove deprecated methods (breaking change with advance notice)

### Feature Flags
```typescript
const ENABLE_STRUCTURED_OUTPUT = process.env.ENABLE_STRUCTURED_ADDM_OUTPUT === 'true';
const ENABLE_DECISION_TRACKING = process.env.ENABLE_ADDM_DECISION_TRACKING !== 'false';
```

## Migration Checklist

- [ ] Add DecisionFlowAdaptor to SwarmADDMBridge
- [ ] Update makeIterationDecision to use processed decisions
- [ ] Integrate ContentAccumulator for section management
- [ ] Update PromptAssembler method calls
- [ ] Add error handling and fallbacks
- [ ] Update ADDMLoopManager to support new decision processing
- [ ] Add comprehensive tests for decision flow
- [ ] Enable feature flag for production rollout
- [ ] Monitor decision processing accuracy
- [ ] Update documentation with new flow

## Rollback Plan

If integration issues arise:
1. Feature flags can disable structured output entirely
2. Decision tracking can be bypassed with fallback logic
3. Original SwarmADDMBridge methods remain unaltered
4. Database schema changes are additive (no destructive migrations)

This integration ensures ADDM decisions are properly captured and mapped to the structured output system while maintaining backward compatibility during the transition period.
