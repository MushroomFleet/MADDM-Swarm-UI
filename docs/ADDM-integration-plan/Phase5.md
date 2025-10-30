# Phase 5: Testing & Validation

## Phase Overview

**Goal:** Comprehensive testing of ADDM integration across all layers

**Prerequisites:**
- Phases 1-4 complete
- Testing frameworks installed (pytest, vitest, playwright)
- Test data prepared

**Estimated Duration:** 7-10 days

**Key Deliverables:**
- Unit tests for all components
- Integration tests across layers
- End-to-end tests for user flows
- Performance benchmarks
- Token cost validation
- Bug fixes and refinements

## Testing Strategy

### Testing Pyramid

```
      E2E Tests (10%)
    ─────────────────
   Integration Tests (30%)
  ─────────────────────────
 Unit Tests (60%)
```

## Step-by-Step Implementation

### Step 1: Python Service Unit Tests

**Duration:** 1 day

#### Tests: `addm-service/tests/test_regulator.py`

```python
import pytest
from src.core.regulator import LoopRegulator
from src.models.schemas import DecisionRequest

@pytest.fixture
async def regulator():
    reg = LoopRegulator()
    yield reg
    await reg.close()

@pytest.mark.asyncio
async def test_content_assessment(regulator):
    """Test content quality assessment"""
    request = DecisionRequest(
        content="This is a test response about AI.",
        context="",
        workflow_mode="research_assembly",
        iteration=0,
        confidence_threshold=0.85,
        max_iterations=5
    )
    
    metrics = await regulator._assess_content(request)
    
    assert 0.0 <= metrics.quality_score <= 1.0
    assert 0.0 <= metrics.completeness_score <= 1.0
    assert 0.0 <= metrics.improvement_potential <= 1.0

@pytest.mark.asyncio
async def test_max_iterations_forces_complete(regulator):
    """Test that max iterations forces complete decision"""
    request = DecisionRequest(
        content="Test content",
        context="",
        workflow_mode="research_assembly",
        iteration=19,  # At max
        confidence_threshold=0.85,
        max_iterations=20
    )
    
    decision = await regulator.make_decision(request)
    
    assert decision.decision == "complete"
    assert decision.confidence == 1.0
```

### Step 2: TypeScript Unit Tests

**Duration:** 2 days

#### Tests: `src/services/__tests__/ADDMClient.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ADDMClient } from '../ADDMClient';
import type { ADDMConfig } from '../../types/addm.types';

describe('ADDMClient', () => {
  let client: ADDMClient;
  let config: ADDMConfig;
  
  beforeEach(() => {
    config = {
      enabled: true,
      workflowMode: 'research_assembly',
      maxIterations: 5,
      confidenceThreshold: 0.85,
      contextSummarizationThreshold: 32000,
      serviceUrl: 'http://localhost:8000',
      requestTimeout: 5000,
      maxRetries: 2,
    };
    
    client = new ADDMClient(config);
  });
  
  it('should make health check request', async () => {
    const healthy = await client.healthCheck();
    expect(typeof healthy).toBe('boolean');
  });
  
  it('should retry on server error', async () => {
    const spy = vi.spyOn(client['client'], 'post');
    
    // Mock first call fails, second succeeds
    spy.mockRejectedValueOnce(new Error('Server error'))
       .mockResolvedValueOnce({
         data: {
           decision: 'enhance',
           confidence: 0.7,
           reaction_time: 150,
           reasoning: 'Test',
           metrics: {
             quality_score: 0.6,
             completeness_score: 0.5,
             improvement_potential: 0.7
           },
           next_prompt: null,
           should_summarize: false,
           timestamp: new Date().toISOString()
         }
       });
    
    const decision = await client.makeDecision({
      content: 'Test',
      context: '',
      workflow_mode: 'research_assembly',
      iteration: 0,
      confidence_threshold: 0.85,
      max_iterations: 5
    });
    
    expect(decision.decision).toBe('enhance');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
```

#### Tests: `src/services/__tests__/ADDMLoopManager.test.ts`

```typescript
describe('ADDMLoopManager', () => {
  let manager: ADDMLoopManager;
  
  beforeEach(() => {
    manager = new ADDMLoopManager(config);
  });
  
  it('should initialize loop state', () => {
    const loop = manager.initializeLoop();
    
    expect(loop.loopId).toBeTruthy();
    expect(loop.iteration).toBe(0);
    expect(loop.isActive).toBe(true);
    expect(loop.aggregatedContent).toBe('');
  });
  
  it('should update loop state after decision', async () => {
    manager.initializeLoop();
    
    // Mock decision response
    const decision: ADDMDecisionResponse = {
      decision: 'enhance',
      confidence: 0.8,
      reaction_time: 120,
      reasoning: 'Test reasoning',
      metrics: {
        quality_score: 0.7,
        completeness_score: 0.6,
        improvement_potential: 0.8
      },
      next_prompt: 'Continue...',
      should_summarize: false,
      timestamp: new Date().toISOString()
    };
    
    await manager.makeIterationDecision('Test content');
    
    const loop = manager.getCurrentLoop();
    expect(loop?.iteration).toBe(1);
    expect(loop?.decisionHistory).toHaveLength(1);
  });
});
```

### Step 3: React Component Tests

**Duration:** 2 days

#### Tests: `src/hooks/__tests__/useADDMLoop.test.tsx`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useADDMLoop } from '../useADDMLoop';

describe('useADDMLoop', () => {
  it('should execute loop and update state', async () => {
    const { result } = renderHook(() => useADDMLoop());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentIteration).toBe(0);
    
    act(() => {
      result.current.executeADDMLoop('Test prompt', 'session-1', 'user-1');
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });
    
    expect(result.current.currentIteration).toBeGreaterThan(0);
    expect(result.current.aggregatedContent).toBeTruthy();
  });
  
  it('should handle cancellation', async () => {
    const { result } = renderHook(() => useADDMLoop());
    
    act(() => {
      result.current.executeADDMLoop('Test', 'session-1', 'user-1');
    });
    
    act(() => {
      result.current.cancelLoop();
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toContain('cancelled');
  });
});
```

### Step 4: Integration Tests

**Duration:** 2 days

#### Test: End-to-end Python → TypeScript → React

```typescript
describe('ADDM Integration', () => {
  it('should complete full ADDM loop', async () => {
    // 1. Verify Python service is running
    const client = new ADDMClient(config);
    const healthy = await client.healthCheck();
    expect(healthy).toBe(true);
    
    // 2. Initialize loop manager
    const manager = new ADDMLoopManager(config);
    manager.initializeLoop();
    
    // 3. Make decision
    const decision = await manager.makeIterationDecision('Test content for analysis');
    
    expect(decision.decision).toMatch(/enhance|research|complete/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.metrics).toBeDefined();
    
    // 4. Get result
    if (decision.decision === 'complete') {
      const result = manager.getExecutionResult();
      expect(result.success).toBe(true);
    }
  });
});
```

### Step 5: E2E Tests with Playwright

**Duration:** 2 days

#### Test: `e2e/addm-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('ADDM loop execution flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Enable ADDM
  await page.click('[aria-label="Settings"]');
  await page.click('[aria-label="Enable ADDM Mode"]');
  await page.fill('[aria-label="Max Iterations"]', '5');
  await page.click('[aria-label="Close Settings"]');
  
  // Send message
  await page.fill('[placeholder="Type a message..."]', 'Explain quantum computing');
  await page.click('[aria-label="Send"]');
  
  // Wait for progress indicator
  await expect(page.locator('text=ADDM Loop Executing')).toBeVisible();
  
  // Wait for completion (with timeout)
  await expect(page.locator('text=ADDM Loop Executing')).not.toBeVisible({ timeout: 60000 });
  
  // Check response appears
  await expect(page.locator('[data-role="assistant-message"]')).toBeVisible();
  
  // Check SwarmTrace shows ADDM data
  await page.click('[aria-label="Show Trace"]');
  await expect(page.locator('text=ADDM Decision Timeline')).toBeVisible();
});

test('ADDM service offline handling', async ({ page }) => {
  // Stop Python service first (manual step)
  
  await page.goto('http://localhost:3000');
  await page.click('[aria-label="Settings"]');
  await page.click('[aria-label="Enable ADDM Mode"]');
  
  // Try to send message
  await page.fill('[placeholder="Type a message..."]', 'Test');
  await page.click('[aria-label="Send"]');
  
  // Check error message
  await expect(page.locator('text=ADDM service is not available')).toBeVisible();
});
```

### Step 6: Performance Benchmarks

**Duration:** 1 day

#### Benchmark Test

```typescript
describe('ADDM Performance', () => {
  it('should complete loop within acceptable time', async () => {
    const start = Date.now();
    
    const manager = new ADDMLoopManager(config);
    const bridge = new SwarmADDMBridge(config, orchestrator);
    
    const result = await bridge.executeADDMLoop({
      initialPrompt: 'Explain machine learning',
      sessionId: 'perf-test',
      userId: 'test-user'
    });
    
    const duration = Date.now() - start;
    
    // Should complete in reasonable time
    expect(duration).toBeLessThan(120000); // 2 minutes max
    expect(result.totalExecutionTime).toBeLessThan(120000);
    
    // Should not use excessive iterations
    expect(result.iterations).toBeLessThanOrEqual(config.maxIterations);
  });
});
```

### Step 7: Token Cost Validation

**Duration:** 1 day

#### Validation Script

```typescript
const validateTokenCosts = async () => {
  const testCases = [
    { maxIterations: 5, expectedMultiplier: 3-7 },
    { maxIterations: 10, expectedMultiplier: 5-12 },
    { maxIterations: 20, expectedMultiplier: 8-20 },
  ];
  
  for (const testCase of testCases) {
    const config = { ...defaultConfig, maxIterations: testCase.maxIterations };
    const result = await runADDMLoop(config);
    
    const tokenMultiplier = result.totalTokens / baselineTokens;
    
    console.log(`Max Iterations: ${testCase.maxIterations}`);
    console.log(`Actual Iterations: ${result.iterations}`);
    console.log(`Token Multiplier: ${tokenMultiplier.toFixed(1)}x`);
    console.log(`Within Expected Range: ${
      tokenMultiplier >= testCase.expectedMultiplier[0] &&
      tokenMultiplier <= testCase.expectedMultiplier[1]
    }`);
  }
};
```

## Test Coverage Goals

- **Python Service:** 80%+ coverage
- **TypeScript Services:** 80%+ coverage
- **React Components:** 70%+ coverage
- **Integration:** All critical paths tested
- **E2E:** All user flows tested

## Troubleshooting

**Issue:** Tests timing out
**Solution:** Increase timeouts, use mocks for slow operations

**Issue:** Flaky E2E tests
**Solution:** Add explicit waits, use data-testid attributes

**Issue:** Mock data not realistic
**Solution:** Use real API responses captured from logs

## Next Steps

✅ **Phase 5 Complete when:**
- All tests passing
- Coverage goals met
- Performance acceptable
- No critical bugs
- Documentation updated

**Proceed to:** Phase 6 - Deployment & Documentation

---

**Phase 5 Character Count:** ~11,000
