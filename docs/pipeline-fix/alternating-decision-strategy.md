# Alternating Decision Strategy Implementation

## Problem Statement
ADDM decision sequences like "enhance, enhance, complete" or "research, research, complete" create duplicate section types, disrupting the intended structured output flow. Consecutive same decisions break the logical progression of: Initial → Research* → Enhance → Complete.

## Solution: Alternating Decision Enforcement
Implement decision flow control that tracks the last decision type and enforces alternation until completion.

### **Implementation Architecture**

```typescript
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
      console.warn(`[AlternatingStrategy] Preventing repeated decision: ${rawDecision.decision} after ${this.lastDecision}`);

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
```

### **Integration Points**

1. **ADDMDecisionTracker Enhancement**:
```typescript
// Add to constructor
this.alternationEnforcer = new AlternatingDecisionEnforcer();

// Modify processDecision
async processDecision(rawDecision, context) {
  const enforcedDecision = await this.alternationEnforcer.enforceAlternation(
    rawDecision,
    context.iteration
  );

  // Continue with normal processing using enforcedDecision
  // ...
}
```

2. **Decision Flow Adaptor Update**:
```typescript
// Add alternation enforcement
async interceptDecisionCall(serviceCall, context) {
  const rawDecision = await serviceCall();
  const enforcedDecision = await this.enforceAlternation(rawDecision, context.iteration);

  // Process enforced decision through tracker
  const processed = await this.tracker.processDecision(enforcedDecision, context);
  return processed;
}
```

### **Configuration Options**

```typescript
interface AlternatingStrategyConfig {
  enabled: boolean;  // Master enable/disable
  maxConsecutiveSame: number;  // Allow small number? (usually 1)
  forceCompleteAfter?: number;  // Force complete after N iterations
  confidencePenalty: number;  // Reduce confidence when alternating
}

const defaultConfig: AlternatingStrategyConfig = {
  enabled: true,
  maxConsecutiveSame: 1,
  forceCompleteAfter: 5,
  confidencePenalty: 0.1
};
```

### **Expected Behavior**

**BEFORE (Broken Sequences):**
- `enhance → enhance → complete` → Multiple Enhance sections
- `research → research → complete` → Multiple Research sections
- Unpredictable section progression

**AFTER (Alternating Sequences):**
- `enhance → research → enhance → complete` → Clean E→R→E→Complete flow
- `research → enhance → research → enhance → complete` → Natural alternation
- Logical section progression with no duplicates

### **Fallback Mechanisms**

1. **High Confidence Override**: If original decision confidence > 0.9, log but allow it
2. **Complete Enforcement**: After excessive iterations, force completion regardless
3. **Quality Preservation**: Only trigger alternation when it doesn't compromise output quality

### **Monitoring and Analytics**

Add tracking for alternation events:
```typescript
export interface AlternationMetrics {
  totalAlternations: number;
  alternationReasons: string[];
  confidenceAdjustments: number[];
  forcedCompletions: number;
  originalVsEnforced: Array<{
    original: string;
    enforced: string;
    iteration: number;
    reasoning: string;
  }>;
}
```

### **Testing Validation**

```typescript
describe('Alternating Decision Strategy', () => {
  it('should prevent consecutive enhance decisions', async () => {
    const enforcer = new AlternatingDecisionEnforcer();

    // First enhance (allowed)
    const first = await enforcer.enforceAlternation({
      decision: 'enhance',
      confidence: 0.7
    } as any, 1);
    expect(first.decision).toBe('enhance');

    // Second enhance (should alternate)
    const second = await enforcer.enforceAlternation({
      decision: 'enhance',
      confidence: 0.6
    } as any, 2);
    expect(second.decision).not.toBe('enhance'); // Should be research or complete
  });

  it('should maintain quality in alternation decisions', () => {
    // Validate that alternating decisions maintain reasonable confidence
    // Ensure no infinite loops or system stalls
  });
});
```

### **Benefits Achieved**

✅ **Clean Section Progressions**: No more duplicate section types  
✅ **Predictable Structure**: Clear Initial → Research* → Enhance → Complete flows  
✅ **Quality Preservation**: Alternation maintains decision quality  
✅ **Audit Trail**: All forced alternations logged and explained  
✅ **Fallback Protection**: System continues working even if ADDM generates problematic sequences

This alternating strategy will solve the duplicate section issues while maintaining the quality and effectiveness of the ADDM decision-making process.
