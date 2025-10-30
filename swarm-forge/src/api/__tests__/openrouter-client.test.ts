import { describe, it, expect } from 'vitest';
import { OpenRouterClient } from '../openrouter-client';
import type { PatternSignature, StyleCharacteristics } from '@/core/types';

describe('OpenRouterClient', () => {
  it('should build system prompt correctly', () => {
    const client = new OpenRouterClient('test-key');
    
    const metadata = {
      name: 'Test Approach',
      signature: {
        domainWeights: { coding: 0.8 },
        complexityMin: 0.5,
        complexityMax: 0.8,
        keywordPatterns: ['test', 'example'],
        keywordWeights: { test: 0.8, example: 0.6 },
        outputTypes: ['tutorial'],
        requiresCode: true,
        requiresExamples: false,
        requiresTheory: false,
      } as PatternSignature,
      style: {
        structureType: 'bulleted',
        sectionCount: [3, 5],
        tone: 'technical',
        voice: 'second_person',
        depthLevel: 'moderate',
        explanationStyle: 'practical',
        exampleDensity: 'medium',
        codeStyle: 'annotated',
        useHeaders: true,
        useBullets: true,
        useNumberedLists: false,
        useTables: false,
        includeSummary: true,
        includeTldr: false,
        includePrerequisites: false,
        includeNextSteps: false,
      } as StyleCharacteristics,
      expectedQuality: 0.85,
    };

    const prompt = client.buildSystemPrompt(metadata);
    
    expect(prompt).toContain('Test Approach');
    expect(prompt).toContain('bulleted');
    expect(prompt).toContain('technical');
    expect(prompt).toContain('code examples');
    expect(prompt).toContain('Use bullet points extensively');
  });

  it('should return default prompt when no metadata provided', () => {
    const client = new OpenRouterClient('test-key');
    const prompt = client.buildSystemPrompt();
    
    expect(prompt).toBe('You are a helpful AI assistant.');
  });
});
