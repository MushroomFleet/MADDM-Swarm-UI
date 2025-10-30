import { ApproachesStore } from '@/storage/approaches-store';
import { ApproachPattern } from './types';
import { nanoid } from 'nanoid';

/**
 * Bootstrap Approaches
 * 
 * Creates default template approaches (A/B/C) for immediate use before pattern discovery.
 * These provide sensible out-of-the-box behavior during the bootstrap phase.
 */

/**
 * Ensure bootstrap approaches exist
 * 
 * Creates ApproachA (Essay/Report), ApproachB (Step-by-step Plan), and ApproachC (Conversational Summary)
 * if no approaches exist in the system.
 */
export async function ensureBootstrapApproaches(): Promise<void> {
  const store = new ApproachesStore();
  
  // Test database connection first
  const connected = await store.testConnection();
  if (!connected) {
    throw new Error('Database connection failed - IndexedDB may be unavailable');
  }
  
  const existing = await store.getAllApproaches();

  if (existing.length > 0) {
    console.log(`✅ Bootstrap: ${existing.length} approaches already exist`);
    return;
  }

  console.log(`\n🌱 Bootstrap: Creating template approaches A/B/C...`);

  const approaches: ApproachPattern[] = [
    // ApproachA: Essay/Report Style
    {
      id: `approach_essay_${nanoid(8)}`,
      name: 'Essay & Report Writer',
      patternSignature: {
        domainWeights: { general: 0.5, writing: 0.3, research: 0.2 },
        complexityMin: 0.4,
        complexityMax: 0.9,
        keywordPatterns: ['explain', 'describe', 'analyze', 'report', 'overview'],
        keywordWeights: { explain: 0.8, describe: 0.7, analyze: 0.6 },
        outputTypes: ['explanation', 'report'],
        requiresCode: false,
        requiresExamples: false,
        requiresTheory: true,
      },
      styleCharacteristics: {
        structureType: 'hierarchical',
        sectionCount: [3, 6],
        tone: 'neutral',
        voice: 'third_person',
        depthLevel: 'comprehensive',
        explanationStyle: 'conceptual',
        exampleDensity: 'low',
        codeStyle: null,
        useHeaders: true,
        useBullets: true,
        useNumberedLists: false,
        useTables: false,
        includeSummary: true,
        includeTldr: false,
        includePrerequisites: false,
        includeNextSteps: false,
      },
      performanceMetrics: {
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        avgQuality: 0.75,
        minQuality: 0.75,
        maxQuality: 0.75,
        qualityStdDev: 0,
        successRate: 1.0,
        qualityHistory: [],
        recentQualityTrend: 'new',
        firstUsed: new Date(),
        lastUsed: new Date(),
      },
      version: 1,
      createdAt: new Date(),
      lastUpdated: new Date(),
      parentId: null,
      generation: 0,
      tags: ['bootstrap', 'essay', 'report'],
      active: true,
    },

    // ApproachB: Step-by-step Plan
    {
      id: `approach_plan_${nanoid(8)}`,
      name: 'Step-by-Step Planner',
      patternSignature: {
        domainWeights: { general: 0.4, writing: 0.3, coding: 0.3 },
        complexityMin: 0.3,
        complexityMax: 0.8,
        keywordPatterns: ['how', 'steps', 'guide', 'tutorial', 'implement', 'create'],
        keywordWeights: { how: 0.9, steps: 0.8, guide: 0.7 },
        outputTypes: ['tutorial', 'list'],
        requiresCode: false,
        requiresExamples: true,
        requiresTheory: false,
      },
      styleCharacteristics: {
        structureType: 'sequential_steps',
        sectionCount: [2, 5],
        tone: 'educational',
        voice: 'second_person',
        depthLevel: 'moderate',
        explanationStyle: 'practical',
        exampleDensity: 'high',
        codeStyle: 'minimal',
        useHeaders: true,
        useBullets: false,
        useNumberedLists: true,
        useTables: false,
        includeSummary: false,
        includeTldr: false,
        includePrerequisites: true,
        includeNextSteps: true,
      },
      performanceMetrics: {
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        avgQuality: 0.75,
        minQuality: 0.75,
        maxQuality: 0.75,
        qualityStdDev: 0,
        successRate: 1.0,
        qualityHistory: [],
        recentQualityTrend: 'new',
        firstUsed: new Date(),
        lastUsed: new Date(),
      },
      version: 1,
      createdAt: new Date(),
      lastUpdated: new Date(),
      parentId: null,
      generation: 0,
      tags: ['bootstrap', 'plan', 'steps', 'tutorial'],
      active: true,
    },

    // ApproachC: Conversational Summary
    {
      id: `approach_summary_${nanoid(8)}`,
      name: 'Conversational Summarizer',
      patternSignature: {
        domainWeights: { general: 0.7, writing: 0.3 },
        complexityMin: 0.2,
        complexityMax: 0.6,
        keywordPatterns: ['summarize', 'quick', 'brief', 'overview', 'simple'],
        keywordWeights: { summarize: 0.8, quick: 0.7, brief: 0.7 },
        outputTypes: ['explanation', 'list'],
        requiresCode: false,
        requiresExamples: false,
        requiresTheory: false,
      },
      styleCharacteristics: {
        structureType: 'prose',
        sectionCount: [1, 3],
        tone: 'casual',
        voice: 'second_person',
        depthLevel: 'concise',
        explanationStyle: 'mixed',
        exampleDensity: 'medium',
        codeStyle: null,
        useHeaders: false,
        useBullets: true,
        useNumberedLists: false,
        useTables: false,
        includeSummary: true,
        includeTldr: true,
        includePrerequisites: false,
        includeNextSteps: false,
      },
      performanceMetrics: {
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        avgQuality: 0.7,
        minQuality: 0.7,
        maxQuality: 0.7,
        qualityStdDev: 0,
        successRate: 1.0,
        qualityHistory: [],
        recentQualityTrend: 'new',
        firstUsed: new Date(),
        lastUsed: new Date(),
      },
      version: 1,
      createdAt: new Date(),
      lastUpdated: new Date(),
      parentId: null,
      generation: 0,
      tags: ['bootstrap', 'summary', 'conversational'],
      active: true,
    },
  ];

  // Save all approaches
  for (const approach of approaches) {
    try {
      const success = await store.saveApproach(approach);
      if (!success) {
        console.error(`   ❌ Failed to save: ${approach.name} (returned false)`);
        throw new Error(`Failed to save approach: ${approach.name}`);
      }
      console.log(`   ✓ Created: ${approach.name}`);
    } catch (error) {
      console.error(`   ❌ Error saving ${approach.name}:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Bootstrap complete: Created ${approaches.length} template approaches`);
}
