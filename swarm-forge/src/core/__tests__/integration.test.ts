import { describe, it, expect } from 'vitest';
import { HybridSwarmOrchestrator } from '../hybrid-orchestrator';
import { analyzePrompt } from '../prompt-analyzer';

describe('Hybrid Coordination Integration', () => {
  it('should complete full coordination flow', async () => {
    const orchestrator = new HybridSwarmOrchestrator();

    // 1. Analyze prompt
    const task = await analyzePrompt('How do I use Python async/await?');
    expect(task.domainWeights.coding).toBeGreaterThan(0);

    // 2. Get coordination
    const coordination = await orchestrator.getCoordination(task);
    expect(coordination.specialistId).toBeTruthy();
    expect(coordination.approachId).toBeTruthy();
    expect(coordination.qualityTarget).toBeGreaterThan(0);

    // 3. Record result
    await orchestrator.recordExecutionResult({
      taskId: coordination.taskId,
      specialistId: coordination.specialistId,
      approachId: coordination.approachId,
      quality: 0.85,
      success: true,
      taskContext: task,
    });

    // 4. Verify learning
    const executionCount = orchestrator.getExecutionCount();
    expect(executionCount).toBe(1);

    orchestrator.dispose();
  });

  it('should trigger pattern discovery at threshold', async () => {
    const orchestrator = new HybridSwarmOrchestrator({
      patternDiscoveryThreshold: 3,
    });

    for (let i = 0; i < 3; i++) {
      const task = await analyzePrompt(`Test question ${i}`);
      const coord = await orchestrator.getCoordination(task);
      await orchestrator.recordExecutionResult({
        ...coord,
        quality: 0.8,
        success: true,
        taskContext: task,
      });
    }

    expect(orchestrator.isPatternDiscoveryReady()).toBe(true);

    orchestrator.dispose();
  });
});
