import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveResonanceOrchestrator } from '../adaptive-resonance';
import { TaskContext } from '../types';

describe('AdaptiveResonanceOrchestrator', () => {
  let orchestrator: AdaptiveResonanceOrchestrator;

  beforeEach(() => {
    orchestrator = new AdaptiveResonanceOrchestrator({
      vigilanceThreshold: 0.75,
      maxSpecialists: 3,
    });
  });

  const createTestTask = (domain: string, outputType: string): TaskContext => ({
    id: `task_${Date.now()}_${Math.random()}`,
    prompt: `Test task for ${domain}`,
    domainWeights: { [domain]: 1.0 },
    complexity: 0.6,
    keywords: ['test'],
    outputType,
    estimatedDuration: 1.0,
  });

  it('should create specialist for new task', async () => {
    const task = createTestTask('coding', 'tutorial');
    const specialistId = await orchestrator.matchOrCreateSpecialist(task);

    expect(specialistId).toBeTruthy();
    expect(specialistId).toContain('specialist_');
  });

  it('should reuse specialist for similar task', async () => {
    const task1 = createTestTask('coding', 'tutorial');
    const specialist1 = await orchestrator.matchOrCreateSpecialist(task1);

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = createTestTask('coding', 'tutorial');
    const specialist2 = await orchestrator.matchOrCreateSpecialist(task2);

    expect(specialist2).toBe(specialist1);
  });

  it('should create new specialist for different task', async () => {
    const task1 = createTestTask('coding', 'tutorial');
    const specialist1 = await orchestrator.matchOrCreateSpecialist(task1);

    const task2 = createTestTask('writing', 'report');
    const specialist2 = await orchestrator.matchOrCreateSpecialist(task2);

    expect(specialist2).not.toBe(specialist1);
  });
});
