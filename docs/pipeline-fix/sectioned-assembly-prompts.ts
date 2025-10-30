/**
 * Sectioned Assembly Prompts for Structured ADDM Output
 * New prompt generation methods that support labeled sections instead of content merging
 */

export interface PromptAssemblyConfig {
  maxPreviousContentLength: number;
  includeSectionMarkers: boolean;
  enableAgentNotes: boolean;
}

/**
 * New prompt assembler for structured sectioned output
 * Replaces content merging with clear section-specific instructions
 */
export class SectionedPromptAssembler {
  private config: PromptAssemblyConfig;

  constructor(config: Partial<PromptAssemblyConfig> = {}) {
    this.config = {
      maxPreviousContentLength: 1000,
      includeSectionMarkers: true,
      enableAgentNotes: true,
      ...config,
    };
  }

  /**
   * Create initial section prompt (replaces assembleInitialPrompt)
   */
  static assembleInitialSectionPrompt(
    userQuery: string,
    approachMetadata: any
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = this.buildBaseSectionSystemPrompt(approachMetadata, {
      sectionType: 'initial',
      sectionLabel: 'Initial Section',
      contentRole: 'foundation',
      instructions: [
        'Create a comprehensive initial response to establish the foundation',
        'Structure your content for 1000-2000 words',
        'Include all major concepts that will be expanded later',
        'DO NOT mention that this is part of an iterative process',
        'Write as if this is a complete standalone response'
      ]
    });

    return {
      systemPrompt,
      userPrompt: userQuery
    };
  }

  /**
   * Create research section prompt (replaces assembleRefinementPrompts for research)
   */
  static assembleStructuredResearchPrompt(
    userQuery: string,
    refinementStrategy: any,
    approachMetadata: any,
    researchIterationCount: number
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = this.buildBaseSectionSystemPrompt(approachMetadata, {
      sectionType: 'research',
      sectionLabel: `Research Section ${researchIterationCount}`,
      contentRole: 'expansion',
      instructions: [
        `You are creating an additional research section (Section ${researchIterationCount}) that adds new information`,
        'Focus on research and expansion, not refinement of previous content',
        'Provide new insights, examples, and data not covered in other sections',
        `Specifically target: ${refinementStrategy.focus_areas.join(', ')}` ,
        'DO NOT reference or modify content from other sections',
        'Write as if this section stands alone while adding value to the overall topic'
      ]
    });

    const truncatedQuery = userQuery.length > 200 ? userQuery.substring(0, 200) + '...' : userQuery;

    const userPrompt = `
Original Query: ${truncatedQuery}

QUALITY REQUIREMENTS:
- Add substantial new research and insights to the topic
- Introduce fresh perspectives or examples not covered elsewhere
- Maintain depth and quality comparable to the initial response
- Focus specifically on: ${refinementStrategy.focus_areas.join(', ')}
- Provide concrete facts, examples, and analysis

Write a comprehensive research section that expands the topic with new information.`;

    return {
      systemPrompt,
      userPrompt: userPrompt.trim()
    };
  }

  /**
   * Create enhance section prompt (replaces assembleRefinementPrompts for enhance)
   */
  static assembleStructuredEnhancePrompt(
    userQuery: string,
    accumulatedResearch: string,
    approachMetadata: any
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = this.buildBaseSectionSystemPrompt(approachMetadata, {
      sectionType: 'enhance',
      sectionLabel: 'Enhancement Section',
      contentRole: 'synthesis',
      instructions: [
        'You are creating the final enhancement section that synthesizes all research',
        'Take all previous research and initial content into account',
        'Create a polished, comprehensive synthesis - NOT another separate response',
        'Ensure smooth narrative flow that connects all the ideas',
        'Eliminate any redundant information across sections',
        'Structure the final response as one cohesive, enhanced piece',
        'DO NOT indicate that this is an "enhancement" - present it as the complete authoritative response'
      ]
    });

    const truncatedQuery = userQuery.length > 200 ? userQuery.substring(0, 200) + '...' : userQuery;
    const researchPreview = accumulatedResearch.length > 1000
      ? accumulatedResearch.substring(0, 1000) + '...'
      : accumulatedResearch;

    const userPrompt = `
Original Query: ${truncatedQuery}

ACCUMULATED RESEARCH OVERVIEW:
${researchPreview}

CRITICAL REQUIREMENTS:
- Create ONE comprehensive, polished final response
- Synthesize ALL the research and initial content into a single cohesive piece
- Eliminate redundancies and organize information logically
- Ensure the final result reads as a complete, authoritative response
- Structure with appropriate sections and subsections
- Provide concrete recommendations, conclusions, and insights

Deliver the final comprehensive synthesis that represents the complete research outcome.`;

    return {
      systemPrompt,
      userPrompt: userPrompt.trim()
    };
  }

  /**
   * Create assembly prompt for section compilation (updates assembleAssemblyPrompts)
   */
  static assembleStructuredAssemblyPrompt(
    sectionedContent: string,
    approachMetadata: any
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = this.buildAssemblySystemPrompt(approachMetadata);

    const userPrompt = `
SECTIONS TO COMPILE:
${sectionedContent}

COMPILATION REQUIREMENTS:
- Combine all sections into one final comprehensive document
- Eliminate any duplicate information across sections
- Maintain the most detailed and accurate version of repeated concepts
- Structure the final document with proper hierarchy and formatting
- Ensure logical flow from introduction through research to conclusions
- Remove any section artifacts or repetitive transitions

Produce the final unified document that represents the complete research synthesis.`;

    return {
      systemPrompt,
      userPrompt: userPrompt.trim()
    };
  }

  /**
   * Build base system prompt for different section types
   */
  private static buildBaseSectionSystemPrompt(
    approachMetadata: any,
    sectionConfig: {
      sectionType: string;
      sectionLabel: string;
      contentRole: string;
      instructions: string[];
    }
  ): string {
    const basePrompt = this.buildApproachBasePrompt(approachMetadata);

    const sectionInstructions = `
---

SECTION-SPECIFIC INSTRUCTIONS - ${sectionConfig.sectionLabel.toUpperCase()}

Section Type: ${sectionConfig.sectionType} (${sectionConfig.contentRole})

Guidelines:
${sectionConfig.instructions.map(instruction => `- ${instruction}`).join('\n')}

IMPORTANT FORMAT REQUIREMENTS:
- Write clear, comprehensive content targeted for this section
- DO NOT reference other sections or iterations
- Maintain consistent quality and depth across the response
- Structure your content logically with appropriate subsections if needed
- End naturally without meta-commentary about the section structure

---
`;

    return basePrompt + sectionInstructions;
  }

  /**
   * Build approach-based system prompt
   */
  private static buildApproachBasePrompt(approachMetadata: any): string {
    if (!approachMetadata) {
      return "You are a helpful AI assistant providing comprehensive, well-structured content.";
    }

    const { name, style, signature } = approachMetadata;

    let prompt = "You are an AI assistant coordinated by a hybrid swarm intelligence system.\n\n";

    if (name) {
      prompt += `APPROACH: ${name}\n\n`;
    }

    if (style) {
      prompt += `CONTENT GUIDANCE:\n`;
      prompt += `- Structure: ${style.structureType || 'flexible'} (${style.sectionCount || '3-5'} sections)\n`;
      prompt += `- Tone: ${style.tone || 'professional'}\n`;
      prompt += `- Voice: ${style.voice || 'informative'}\n`;
      if (style.depthLevel) {
        prompt += `- Depth: ${style.depthLevel}\n`;
      }
      if (style.explanationStyle) {
        prompt += `- Style: ${style.explanationStyle}\n`;
      }
      prompt += `\n`;
    }

    if (signature) {
      prompt += `REQUIREMENTS:\n`;
      if (signature.requiresCode) {
        prompt += `- Include substantial code examples\n`;
      }
      if (signature.requiresExamples) {
        prompt += `- Provide practical examples\n`;
      }
      if (signature.requiresTheory) {
        prompt += `- Include theoretical explanation\n`;
      }
      prompt += `\n`;
    }

    prompt += `Follow this guidance flexibly to create high-quality content that matches the discovered pattern.`;
    prompt += `\n`;

    return prompt;
  }

  /**
   * Build assembly system prompt
   */
  private static buildAssemblySystemPrompt(approachMetadata: any): string {
    const basePrompt = this.buildApproachBasePrompt(approachMetadata);

    return basePrompt + `

---

COMPILATION SPECIALIST

You are a content assembly specialist. Your task is to compile multiple research sections into one cohesive, comprehensive final document.

COMPILATION METHODOLOGY:
- **INTEGRATE** related information from different sections
- **ELIMINATE** redundant facts, repeated ideas, and overlapping content
- **MERGE** compatible perspectives into unified explanations
- **STRUCTURE** the final document with logical flow and hierarchy
- **MAINTAIN** the highest quality information from all sections
- **REMOVE** section artifacts and redundant transitions

OUTPUT REQUIREMENTS:
- Create EXACTLY ONE comprehensive document
- Ensure smooth transitions between different areas
- Preserve all unique insights while eliminating duplication
- Structure appropriately with sections and subsections
- The final result should read as a single, expertly composed response

---
`;
  }
}

/**
 * Prompt Assembly Factory for easy integration
 */
export class PromptAssemblyFactory {
  /**
   * Get prompt assembler based on decision type
   */
  static getAssemblerForDecision(
    decision: 'initial' | 'research' | 'enhance',
    userQuery: string,
    approachMetadata: any,
    additionalContext?: any
  ): { systemPrompt: string; userPrompt: string } {
    switch (decision) {
      case 'initial':
        return SectionedPromptAssembler.assembleInitialSectionPrompt(userQuery, approachMetadata);

      case 'research':
        if (!additionalContext?.refinementStrategy || !additionalContext?.researchCount) {
          throw new Error('Research prompt requires refinementStrategy and researchCount');
        }
        return SectionedPromptAssembler.assembleStructuredResearchPrompt(
          userQuery,
          additionalContext.refinementStrategy,
          approachMetadata,
          additionalContext.researchCount
        );

      case 'enhance':
        if (!additionalContext?.accumulatedResearch) {
          throw new Error('Enhance prompt requires accumulatedResearch');
        }
        return SectionedPromptAssembler.assembleStructuredEnhancePrompt(
          userQuery,
          additionalContext.accumulatedResearch,
          approachMetadata
        );

      default:
        throw new Error(`Unknown decision type: ${decision}`);
    }
  }
}

/**
 * Migration Helper Functions
 * For updating existing PromptAssembler.ts with these new methods
 */
export class MigrationHelper {
  /**
   * Generate code snippet to add to existing PromptAssembler.ts
   */
  static generateMigrationCode(): string {
    return `
// START: Add these new methods to the existing PromptAssembler class

/**
 * NEW: Assemble structured research prompt - replaces research refinement logic
 */
static assembleStructuredResearchPrompt(
  userQuery: string,
  refinementStrategy: any,
  approachMetadata: any,
  researchIterationCount: number
): AssembledPrompt {
  const prompts = SectionedPromptAssembler.assembleStructuredResearchPrompt(
    userQuery,
    refinementStrategy,
    approachMetadata,
    researchIterationCount
  );

  return {
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    includesPreviousContent: false
  };
}

/**
 * NEW: Assemble structured enhance prompt - replaces enhance refinement logic
 */
static assembleStructuredEnhancePrompt(
  userQuery: string,
  accumulatedResearch: string,
  approachMetadata: any
): AssembledPrompt {
  const prompts = SectionedPromptAssembler.assembleStructuredEnhancePrompt(
    userQuery,
    accumulatedResearch,
    approachMetadata
  );

  return {
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    includesPreviousContent: true
  };
}

/**
 * UPDATED: Modify assembleAssemblyPrompts for section compilation
 */
static assembleAssemblyPrompts(
  sectionedContent: string,  // Changed from accumulatedContent
  approachMetadata: any
): AssembledPrompt {
  const prompts = SectionedPromptAssembler.assembleStructuredAssemblyPrompt(
    sectionedContent,
    approachMetadata
  );

  return {
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    includesPreviousContent: false
  };
}

// END: New methods for structured section handling
    `;
  }

  /**
   * Generate deprecated method warnings
   */
  static generateDeprecationNotices(): string {
    return `
// DEPRECATED METHODS - DO NOT USE IN NEW CODE

/**
 * @deprecated Use assembleStructuredResearchPrompt and assembleStructuredEnhancePrompt instead
 * The old assembleRefinementPrompts attempted AI-powered deduplication which was unreliable
 */
static assembleRefinementPrompts(
  originalUserQuery: string,
  previousContent: string,
  refinementStrategy: RefinementStrategy,
  approachMetadata: any
): AssembledPrompt {
  console.warn('assembleRefinementPrompts is deprecated. Use sectioned assembly methods instead.');
  // Fallback implementation or throw error
  throw new Error('This method is deprecated - use structured section prompts');
}
    `;
  }
}

/**
 * TESTING UTILITIES
 */
export class PromptTestingUtilities {
  /**
   * Validate that prompts align with sectioning requirements
   */
  static validateSectionPromptConsistency(
    systemPrompt: string,
    userPrompt: string,
    expectedSectionType: string
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for forbidden deduplication language
    const forbiddenPatterns = [
      /eliminate.*duplicate/i,
      /remove.*redundant/i,
      /merge.*content/i,
      /combine.*responses/i,
      /detect.*overlap/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(systemPrompt) || pattern.test(userPrompt)) {
        issues.push(`Contains forbidden deduplication language: ${pattern}`);
      }
    }

    // Check for required section identification
    if (!systemPrompt.includes(expectedSectionType.toUpperCase())) {
      issues.push(`Missing clear section type identification: ${expectedSectionType}`);
    }

    // Check for section-specific instructions
    const instructionIndicators = ['specifically', 'focus on', 'target:', 'section:'];
    const hasInstructions = instructionIndicators.some(indicator =>
      systemPrompt.toLowerCase().includes(indicator) ||
      userPrompt.toLowerCase().includes(indicator)
    );

    if (!hasInstructions) {
      issues.push('Missing specific section instructions');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate test prompts for different scenarios
   */
  static generateAllTestPrompts(
    userQuery: string,
    approachMetadata: any
  ): Record<string, { systemPrompt: string; userPrompt: string }> {
    return {
      initial: SectionedPromptAssembler.assembleInitialSectionPrompt(userQuery, approachMetadata),

      research_1: SectionedPromptAssembler.assembleStructuredResearchPrompt(
        userQuery,
        {
          focus_areas: ['technical details', 'examples'],
          constraints: ['factual accuracy'],
          target_improvements: ['depth of analysis']
        },
        approachMetadata,
        1
      ),

      research_2: SectionedPromptAssembler.assembleStructuredResearchPrompt(
        userQuery,
        {
          focus_areas: ['applications', 'trends'],
          constraints: ['relevance'],
          target_improvements: ['practical utility']
        },
        approachMetadata,
        2
      ),

      enhance: SectionedPromptAssembler.assembleStructuredEnhancePrompt(
        userQuery,
        'Simulated accumulated research content from previous sections...',
        approachMetadata
      )
    };
  }
}

/**
 * USAGE EXAMPLES:
 *
 * // For initial section (iteration 0)
 * const initialPrompts = PromptAssemblyFactory.getAssemblerForDecision(
 *   'initial',
 *   'Explain quantum computing',
 *   approachMetadata
 * );
 *
 * // For research section (iterations 1+ when ADDM decides 'research')
 * const researchPrompts = PromptAssemblyFactory.getAssemblerForDecision(
 *   'research',
 *   'Explain quantum computing',
 *   approachMetadata,
 *   { refinementStrategy: { focus_areas: ['algorithms', 'hardware'] }, researchCount: 1 }
 * );
 *
 * // For enhance section (when ADDM decides 'enhance')
 * const enhancePrompts = PromptAssemblyFactory.getAssemblerForDecision(
 *   'enhance',
 *   'Explain quantum computing',
 *   approachMetadata,
 *   { accumulatedResearch: 'all previous sections combined...' }
 * );
 */
