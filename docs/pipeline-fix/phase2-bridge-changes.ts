// Phase 2 Implementation: Bridge Changes for Sectioned Content Accumulation
// This file contains the modified SwarmADDMBridge logic for structured output

import { OutputLabelingSchema, OutputSection, AgentNotes, SwarmStats } from './labeling-schema';
import { PromptAssembler } from '../../swarm-forge/src/services/PromptAssembler';

export interface StructuredLoopState {
  outputId: string;
  sections: OutputSection[];
  agentNotes: AgentNotes;
  iterationMetadata: Map<number, IterationMetadata>;
  researchIterationCount: number;
}

export interface IterationMetadata {
  decision: 'research' | 'enhance' | 'complete';
  confidence: number;
  reasoning: string;
  startTime: number;
  endTime?: number;
  contentLength?: number;
  refinementStrategy?: any;
}

/**
 * Enhanced SwarmADDMBridge with sectioned content accumulation
 * REPLACES existing merging logic with section collection
 */
export class StructuredSwarmADDMBridge {
  private currentState: StructuredLoopState | null = null;

  /**
   * Initialize structured loop state
   */
  initializeStructuredLoop(initialPrompt: string): void {
    const outputId = OutputLabelingSchema.generateOutputId();
    const sessionStart = new Date().toISOString();

    this.currentState = {
      outputId,
      sections: [],
      agentNotes: {
        sessionStart,
        totalIterations: 0,
        decisions: [],
        finalOutcome: {
          success: false,
          qualityScore: 0,
          executionTime: 0,
        },
      },
      iterationMetadata: new Map(),
      researchIterationCount: 0,
    };

    // Add initial prompt to original query storage
    this.originalUserQuery = initialPrompt;

    console.log(`[StructuredBridge] Initialized loop with ID: ${outputId}`);
  }

  /**
   * Core execution loop with sectioned accumulation
   */
  async executeStructuredIteration(
    iteration: number,
    coordination: any, // CoordinationResult from orchestrator
    decision: any    // ADDMDecisionResponse
  ): Promise<string> {
    if (!this.currentState) {
      throw new Error('Loop not initialized. Call initializeStructuredLoop first.');
    }

    const startTime = Date.now();
    this.currentState.agentNotes.totalIterations = iteration + 1;

    // Track iteration metadata
    const metadata: IterationMetadata = {
      decision: decision.decision,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      startTime,
      refinementStrategy: decision.refinement_strategy,
    };
    this.currentState.iterationMetadata.set(iteration, metadata);

    // Assemble prompts based on iteration
    let assembledPrompt;
    let sectionType: 'initial' | 'research' | 'enhance' = 'initial';

    if (iteration === 0) {
      sectionType = 'initial';
      assembledPrompt = PromptAssembler.assembleInitialPrompt(
        this.originalUserQuery,
        coordination.approachMetadata
      );
    } else if (decision.decision === 'enhance') {
      sectionType = 'enhance';
      assembledPrompt = PromptAssembler.assembleStructuredEnhancePrompt(
        this.originalUserQuery,
        this.getAccumulatedResearchContent(),
        coordination.approachMetadata
      );
    } else if (decision.decision === 'research') {
      sectionType = 'research';
      this.currentState.researchIterationCount++;
      assembledPrompt = PromptAssembler.assembleStructuredResearchPrompt(
        this.originalUserQuery,
        decision.refinement_strategy,
        coordination.approachMetadata,
        iteration
      );
    }

    // Execute with swarm
    const swarmResponse = await this.executeWithPromptAssembler(
      coordination,
      assembledPrompt,
      `session-${Date.now()}`,
      'user-id'
    );

    const cleanContent = this.extractCleanContent(swarmResponse.content);

    // Create and store section
    const section = OutputLabelingSchema.createSection(
      this.currentState.outputId,
      sectionType,
      iteration,
      decision.decision,
      sectionType === 'research' ? this.currentState.researchIterationCount : undefined
    );

    section.content = cleanContent;
    section.timestamp = Date.now();

    this.currentState.sections.push(section);

    // Update metadata
    metadata.endTime = Date.now();
    metadata.contentLength = cleanContent.length;

    // Record decision in agent notes
    this.currentState.agentNotes.decisions.push({
      iteration,
      decision: decision.decision,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      timestamp: new Date().toISOString(),
      refinementStrategy: decision.refinement_strategy,
    });

    console.log(`[StructuredBridge] Completed iteration ${iteration}: ${sectionType} (${cleanContent.length} chars)`);

    return cleanContent;
  }

  /**
   * Finalize structured loop and generate complete output
   */
  finalizeStructuredLoop(): string {
    if (!this.currentState) {
      throw new Error('No structured loop active');
    }

    const state = this.currentState;

    // Update final outcome
    const totalTime = state.iterationMetadata.size > 0
      ? Date.now() - (state.iterationMetadata.get(0)?.startTime || Date.now())
      : 0;

    // Calculate quality from last section (would normally come from ADDM)
    const finalQuality = 85; // Placeholder - would be calculated from ADDM response

    state.agentNotes.finalOutcome = {
      success: true,
      qualityScore: finalQuality,
      executionTime: totalTime,
    };

    // Format complete output
    let output = '';

    // 1. Agent Notes
    output += OutputLabelingSchema.formatAgentNotes(state.agentNotes);

    // 2. Content Sections (Initial, Research, Enhance)
    for (const section of state.sections) {
      output += OutputLabelingSchema.formatSection(section);
    }

    // 3. Swarm Statistics (would be populated from actual SwarmADDMBridge metrics)
    const swarmStats: SwarmStats = {
      specialistsActive: 3,
      specialistsTotal: 3,
      approachesActive: 6,
      approachesTotal: 6,
      signalsProcessed: 7,
      wavesCompleted: 7,
      qualityTarget: 60,
      qualityActual: finalQuality,
      patternDiscoveryReady: false,
      executionTime: totalTime,
    };
    output += OutputLabelingSchema.formatSwarmStats(swarmStats);

    console.log(`[StructuredBridge] Finalized loop: ${state.sections.length} sections, ${totalTime}ms total`);

    return output.trim();
  }

  /**
   * Get all research content for enhance iteration
   */
  private getAccumulatedResearchContent(): string {
    if (!this.currentState) return '';

    const researchSections = this.currentState.sections.filter(s => s.type === 'research');
    return researchSections.map(s => s.content).join('\n\n---\n\n');
  }

  // Placeholder methods - would be implemented with actual SwarmADDMBridge logic
  private originalUserQuery: string = '';
  private extractCleanContent(content: string): string {
    // Would use actual SwarmADDMBridge.extractCleanContent
    return content.replace(/^I(?:'ve| have) (refined|enhanced)/i, '').trim();
  }

  private async executeWithPromptAssembler(coordination: any, prompt: any, sessionId: string, userId: string): Promise<any> {
    // Placeholder - would delegate to actual SwarmADDMBridge.executeWithPromptAssembler
    return {
      content: 'Mock swarm response - would contain actual AI-generated content',
      specialistId: coordination.specialistId,
      qualityScore: 0.85,
    };
  }
}

// Phase 2 Integration Points:
// 1. Replace LoopManager.initializeLoop() with StructuredLoopState
// 2. Modify content accumulation from merged strings to section array
// 3. Update decision handling to create sections instead of refine content
// 4. Change final assembly to section compilation rather than AI deduplication
// 5. Add agent notes collection during iteration execution
