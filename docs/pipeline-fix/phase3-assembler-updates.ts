/**
 * Phase 3 Implementation: PromptAssembler Integration Guide
 * Step-by-step modifications to update existing PromptAssembler.ts for structured section handling
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ModificationStep {
  id: string;
  description: string;
  location: string;
  code: string;
  dependencies?: string[];
}

export interface Deprecation {
  id: string;
  method: string;
  reason: string;
  replacement: string;
  action: string;
}

export interface TestCase {
  id: string;
  description: string;
  code: string;
}

export interface AssemblerUpdatePlan {
  modifications: ModificationStep[];
  supportingMethods: ModificationStep[];
  deprecations: Deprecation[];
  tests: TestCase[];
}

// =============================================================================
// EXISTING PROMPTASSEMBLER.TS ANALYSIS & MODIFICATION PLAN
// =============================================================================

/**
 * CURRENT STATE ANALYSIS:
 * The existing PromptAssembler.ts contains AI-powered deduplication logic that attempts
 * complex content merging. This is unreliable and causes the merging issues we're solving.
 *
 * Problems with current approach:
 * 1. assembleRefinementPrompts() tries to merge generated content AI-powers
 * 2. UNO-NF system prompts include sophisticated but unreliable deduplication instructions
 * 3. Final assembly prompts attempt content integration instead of section compilation
 */

/**
 * STEP-BY-STEP MODIFICATION GUIDE
 * For updating swarm-forge/src/services/PromptAssembler.ts
 */

// =============================================================================
// MODIFICATION #1: Add New Structured Methods
// =============================================================================

// ADD these new static methods to the existing PromptAssembler class
// Insert after the existing assembleAssemblyPrompts method

export function generatePhase3Updates(): AssemblerUpdatePlan {
  return {
    modifications: [
      {
        id: 'add-structured-research-method',
        description: 'Adding new assembleStructuredResearchPrompt method',
        location: 'After assembleRefinementPrompts method',
        code: `
/**
 * NEW: Assemble structured research prompt for sectioned output
 * Replaces the merging logic in assembleRefinementPrompts for research decisions
 */
static assembleStructuredResearchPrompt(
  userQuery: string,
  refinementStrategy: any,
  approachMetadata: any,
  researchIterationCount: number
): AssembledPrompt {
  // Import the new sectioned assembler logic
  // NOTE: In actual implementation, this would import from the new sectioned-assembly-prompts.ts
  // For now, inline the logic or reference the new class

  const systemPrompt = this.buildStructuredResearchSystemPrompt(
    approachMetadata,
    refinementStrategy,
    researchIterationCount
  );

  const userPrompt = this.buildStructuredResearchUserPrompt(
    userQuery,
    refinementStrategy
  );

  return {
    systemPrompt,
    userPrompt,
    includesPreviousContent: false  // Research sections don't need previous content
  };
}`,
        dependencies: ['buildStructuredResearchSystemPrompt', 'buildStructuredResearchUserPrompt']
      },

      {
        id: 'add-structured-enhance-method',
        description: 'Adding new assembleStructuredEnhancePrompt method',
        location: 'After assembleStructuredResearchPrompt method',
        code: `
/**
 * NEW: Assemble structured enhance prompt for final synthesis
 * Replaces enhance decision logic in assembleRefinementPrompts
 */
static assembleStructuredEnhancePrompt(
  userQuery: string,
  accumulatedResearch: string,
  approachMetadata: any
): AssembledPrompt {
  const systemPrompt = this.buildStructuredEnhanceSystemPrompt(approachMetadata);

  const userPrompt = this.buildStructuredEnhanceUserPrompt(
    userQuery,
    accumulatedResearch
  );

  return {
    systemPrompt,
    userPrompt,
    includesPreviousContent: true  // Enhance needs all previous research content
  };
}`,
        dependencies: ['buildStructuredEnhanceSystemPrompt', 'buildStructuredEnhanceUserPrompt']
      },

      {
        id: 'update-assembly-prompts',
        description: 'Update existing assembleAssemblyPrompts to handle sectioned content',
        location: 'Modify existing assembleAssemblyPrompts method',
        code: `
/**
 * UPDATED: Modified to handle sectioned content instead of merged content
 * Now compiles labeled sections rather than attempting AI-powered deduplication
 */
static assembleAssemblyPrompts(
  sectionedContent: string,  // CHANGED: Now expects sectioned content, not accumulatedContent
  approachMetadata: any
): AssembledPrompt {
  const systemPrompt = this.buildSectionCompilationSystemPrompt(approachMetadata);

  const userPrompt = this.buildSectionCompilationUserPrompt(sectionedContent);

  return {
    systemPrompt,
    userPrompt,
    includesPreviousContent: false  // Compilation doesn't include previous content directly
  };
}`,
        dependencies: ['buildSectionCompilationSystemPrompt', 'buildSectionCompilationUserPrompt']
      }
    ],

    // =============================================================================
    // MODIFICATION #2: Add Supporting Helper Methods
    // =============================================================================

    supportingMethods: [
      {
        id: 'research-system-prompt-builder',
        description: 'Build system prompt for structured research sections',
        location: 'After buildBaseSystemPrompt method',
        code: `
private static buildStructuredResearchSystemPrompt(
  approachMetadata: any,
  refinementStrategy: any,
  iterationCount: number
): string {
  const basePrompt = this.buildBaseSystemPrompt(approachMetadata);

  return basePrompt + \`

---

STRUCTURED RESEARCH SPECIALIST - Section \${iterationCount}

You are creating a labeled research section that expands the topic with NEW information.
This section will be clearly identified and presented separately from other content.

RESEARCH FOCUS:
- Add substantial new research and insights
- Target specific areas: \${refinementStrategy.focus_areas?.join(', ') || 'general expansion'}
- Maintain high quality comparable to initial responses
- DO NOT reference or modify content from other sections

SECTION REQUIREMENTS:
- Write comprehensive content for this research section only
- Provide fresh perspectives not covered elsewhere
- Structure logically with appropriate subsections
- End naturally as a complete section

---
\`;
}`,
      },

      {
        id: 'research-user-prompt-builder',
        description: 'Build user prompt for structured research sections',
        location: 'After buildStructuredResearchSystemPrompt method',
        code: `
private static buildStructuredResearchUserPrompt(
  userQuery: string,
  refinementStrategy: any
): string {
  const truncatedQuery = userQuery.length > 200 ? userQuery.substring(0, 200) + '...' : userQuery;

  return \`ORIGINAL QUERY: \${truncatedQuery}

SECTION RESEARCH ASSIGNMENT:
Create a comprehensive research section that expands the topic with new information.

REQUIRED FOCUS AREAS:
\${refinementStrategy.focus_areas?.map(area => \`- \${area}\`).join('\\n') || '- General topic expansion'}

QUALITY STANDARDS:
- Add substantial new insights and examples
- Maintain factual accuracy and depth
- Provide specific, actionable information
- Structure content logically

Write the research section content now.\`;
}`,
      },

      {
        id: 'enhance-system-prompt-builder',
        description: 'Build system prompt for enhance/final synthesis sections',
        location: 'After buildStructuredResearchUserPrompt method',
        code: `
private static buildStructuredEnhanceSystemPrompt(approachMetadata: any): string {
  const basePrompt = this.buildBaseSystemPrompt(approachMetadata);

  return basePrompt + \`

---

STRUCTURED SYNTHESIS SPECIALIST

You are creating the final enhancement section that synthesizes ALL research.
This labeled section represents the complete, authoritative response to the query.

SYNTHESIS REQUIREMENTS:
- Take ALL previous research and initial content into account
- Create ONE comprehensive, polished final response
- Eliminate redundancies and organize information logically
- Structure as a complete, standalone piece of writing
- DO NOT present this as an "enhancement" - present it as the final complete answer

SECTION FORMAT:
- Synthesize all insights into cohesive narrative
- Ensure smooth flow and logical progression
- Include comprehensive conclusions
- Present as definitive, authoritative response

---
\`;
}`,
      },

      {
        id: 'enhance-user-prompt-builder',
        description: 'Build user prompt for enhance sections',
        location: 'After buildStructuredEnhanceSystemPrompt method',
        code: `
private static buildStructuredEnhanceUserPrompt(
  userQuery: string,
  accumulatedResearch: string
): string {
  const truncatedQuery = userQuery.length > 200 ? userQuery.substring(0, 200) + '...' : userQuery;
  const researchPreview = accumulatedResearch.length > 1000
    ? accumulatedResearch.substring(0, 1000) + '...'
    : accumulatedResearch;

  return \`ORIGINAL QUERY: \${truncatedQuery}

ACCUMULATED RESEARCH OVERVIEW:
\${researchPreview}

SYNTHESIS TASK:
Create the comprehensive final response that represents the complete research outcome.

CRITICAL REQUIREMENTS:
- Synthesize ALL research into ONE cohesive, polished response
- Eliminate redundancies while preserving all unique insights
- Structure logically with appropriate sections and subsections
- Ensure the result reads as a complete, authoritative answer

Produce the final comprehensive synthesis now.\`;
}`,
      },

      {
        id: 'section-compilation-system-prompt',
        description: 'Build system prompt for final section compilation',
        location: 'After buildStructuredEnhanceUserPrompt method',
        code: `
private static buildSectionCompilationSystemPrompt(approachMetadata: any): string {
  const basePrompt = this.buildBaseSystemPrompt(approachMetadata);

  return basePrompt + \`

---

SECTION COMPILATION SPECIALIST

You are compiling multiple labeled sections into one final document.
Each section was created with specific purposes and contains unique content.

COMPILATION METHODOLOGY:
- **COMPILE** sections into logical document structure
- **PRESERVE** the integrity and labeling of each section
- **MAINTAIN** separation between different types of content
- **REMOVE** any cross-section redundancies while keeping unique insights
- **CREATE** coherent document flow

PRESERVE SECTION IDENTITY:
- Keep clear section boundaries and purposes
- Maintain research section additions as valuable expansions
- Ensure enhance section provides authoritative synthesis
- Show the progressive development through different phases

---
\`;
}`,
      },

      {
        id: 'section-compilation-user-prompt',
        description: 'Build user prompt for section compilation',
        location: 'After buildSectionCompilationSystemPrompt method',
        code: `
private static buildSectionCompilationUserPrompt(sectionedContent: string): string {
  return \`LABELED SECTIONS TO COMPILE:
\${sectionedContent}

COMPILATION REQUIREMENTS:
- Combine all labeled sections into one coherent document
- Preserve the identity and purpose of each section
- Maintain section separation and labeling
- Eliminate any genuine redundancies across sections
- Create logical flow from initial through research to final sections
- Keep the most comprehensive information from overlapping areas

Produce the final compiled document with clear section progression.\`;
}`,
      }
    ],

    // =============================================================================
    // MODIFICATION #3: Deprecate Old Methods
    // =============================================================================

    deprecations: [
      {
        id: 'deprecate-refinement-prompts',
        method: 'assembleRefinementPrompts',
        reason: 'Uses unreliable AI-powered deduplication that causes merging issues',
        replacement: 'Use assembleStructuredResearchPrompt or assembleStructuredEnhancePrompt',
        action: 'Mark as @deprecated and consider logging warnings when called'
      },
      {
        id: 'update-assembly-prompts-signature',
        method: 'assembleAssemblyPrompts parameter',
        reason: 'Need to change from accumulatedContent to sectionedContent',
        replacement: 'Update callers to provide labeled section content instead of merged content',
        action: 'Change parameter name and add JSDoc clarification'
      }
    ],

    // =============================================================================
    // MODIFICATION #4: Integration Testing
    // =============================================================================

    tests: [
      {
        id: 'test-structured-research-prompt',
        description: 'Verify research prompt creates section-specific content',
        code: `
// Test that research prompts don't contain deduplication language
const researchPrompt = PromptAssembler.assembleStructuredResearchPrompt(
  'Test query',
  { focus_areas: ['examples', 'applications'] },
  mockApproachMetadata,
  1
);

// Should NOT contain forbidden patterns
assert(!researchPrompt.systemPrompt.includes('eliminate duplicate'));
assert(!researchPrompt.systemPrompt.includes('merge content'));

// Should contain section-specific instructions
assert(researchPrompt.systemPrompt.includes('SECTION REQUIREMENTS'));
        `,
      },

      {
        id: 'test-enhance-prompt-synthesis',
        description: 'Verify enhance prompt focuses on final synthesis',
        code: `
// Test that enhance prompts focus on synthesis, not merging
const enhancePrompt = PromptAssembler.assembleStructuredEnhancePrompt(
  'Test query',
  'Mock accumulated research...',
  mockApproachMetadata
);

// Should contain synthesis language
assert(enhancePrompt.systemPrompt.includes('SYNTHESIS'));
assert(enhancePrompt.systemPrompt.includes('comprehensive final response'));

// Should not contain per-section merging instructions
assert(!enhancePrompt.systemPrompt.includes('eliminate section'));
        `,
      },

      {
        id: 'test-assembly-sectioned-input',
        description: 'Verify assembly method works with labeled sections',
        code: `
// Test assembly with labeled sections instead of merged content
const mockLabeledContent = \`---
name: output_12345_ABC_Initial
Initial content here...

---
name: output_12345_ABC_Research_1
Research content here...
\`;

const assemblyPrompt = PromptAssembler.assembleAssemblyPrompts(
  mockLabeledContent,
  mockApproachMetadata
);

// Should focus on compilation, not deduplication
assert(assemblyPrompt.systemPrompt.includes('COMPILATION'));
assert(assemblyPrompt.systemPrompt.includes('PRESERVE'));
        `,
      }
    ]
  };
}

/**
 * STEP-BY-STEP INTEGRATION:
 *
 * 1. Start with adding the new static methods at the end of PromptAssembler class
 * 2. Implement supporting helper methods
 * 3. Update SwarmADDMBridge to use new methods for research/enhance decisions
 * 4. Update ADDM loop caller to use new assembleAssemblyPrompts signature
 * 5. Add deprecation warnings to old methods
 * 6. Update all existing tests to use new method signatures
 */

/**
 * BACKWARD COMPATIBILITY NOTES:
 *
 * - Keep assembleRefinementPrompts for now but mark deprecated
 * - Add wrapper that routes to appropriate new method based on decision type
 * - Update existing callers gradually
 * - Test all decision flows with new structured prompts
 */

/**
 * PERFORMANCE CONSIDERATIONS:
 *
 * - New approach reduces token usage by avoiding complex deduplication instructions
 * - Clear section roles reduce AI confusion about task requirements
 * - Structured prompts are more predictable and testable
 * - Section compilation is more reliable than AI-powered content merging
 */

// =============================================================================
// VERIFICATION CHECKLIST
// =============================================================================

export const Phase3VerificationChecklist = [
  '✓ Added assembleStructuredResearchPrompt static method',
  '✓ Added assembleStructuredEnhancePrompt static method',
  '✓ Updated assembleAssemblyPrompts to handle sectioned content',
  '✓ Added all required helper methods',
  '✓ Deprecated assembleRefinementPrompts with warnings',
  '✓ Updated all SwarmADDMBridge calls to use new methods',
  '✓ Added tests for new prompt generation',
  '✓ Verified no deduplication language in new prompts',
  '✓ Confirmed section-specific instructions are clear',
  '✓ Updated method signatures in calling code'
];

/**
 * ROLLBACK PLAN:
 * If issues arise, can easily rollback by:
 * 1. Commenting out new methods
 * 2. Removing deprecation warnings
 * 3. Reverting SwarmADDMBridge to use old methods
 * 4. No data migration needed - prompts are generated fresh each time
 */
