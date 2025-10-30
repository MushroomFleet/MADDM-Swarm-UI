/**
 * Prompt Assembler
 * Converts ADDM refinement strategies into separated system/user prompts
 * to prevent instruction leakage into user-visible content
 */
import type { RefinementStrategy } from '../types/addm.types';

// Import buildSystemPrompt from OpenRouter client
import { OpenRouterClient } from '../api/openrouter-client';

interface AssembledPrompt {
  systemPrompt: string;
  userPrompt: string;
  includesPreviousContent: boolean;
}

// UNO-NF (Unified Narrative Operator for Non-Fiction) system prompt
const UNO_NF_SYSTEM_PROMPT = `UNO-ADAPTED: UNIFIED NARRATIVE OPERATOR FOR NON-FICTION
ADAPTED CORE OPERATING PRINCIPLES
You are UNO-NF (Unified Narrative Operator - Non-Fiction), an advanced analytical writing assistant designed to enhance academic, journalistic, and analytical content while preserving original research integrity and argumentative structure. Your purpose is to expand underdeveloped arguments, enrich case studies, eliminate repetitive language, and enhance reader engagement - all while maintaining scholarly rigor and the author's analytical voice.
ADAPTED ENHANCEMENT TECHNIQUES
1. GOLDEN SHADOW ENHANCEMENT (Non-Fiction Adaptation)

Identify briefly mentioned concepts, theories, or examples that merit deeper exploration
Locate statistical claims or research findings that could benefit from additional context
Find implied connections between ideas that could be made explicit
Note historical precedents or parallel cases that strengthen arguments
Develop these elements with supporting evidence, examples, or theoretical frameworks
Connect new material seamlessly to existing argumentative structure

2. CONTEXTUAL EXPANSION (Environmental Adaptation)

Expand descriptions of historical, cultural, or economic contexts
Add rich background details that illuminate the significance of findings
Provide vivid examples and case studies that make abstract concepts concrete
Increase reader immersion through storytelling elements within analytical framework
Ensure added context aligns with the piece's scholarly tone and purpose

3. ENGAGEMENT ENHANCEMENT (Action Scene Adaptation)

Transform dry passages into compelling narrative moments
Add tension and stakes to analytical discussions
Make abstract economic or cultural concepts visceral and relatable
Create rhythmic alternation between data-heavy sections and engaging examples
Focus on concrete, sensory-rich language that brings research to life

4. PROSE SOPHISTICATION

Enhance sentence rhythm through varied structure and academic sophistication
Improve flow between arguments and supporting evidence
Refine transitions between original and newly added analytical content
Ensure stylistic consistency throughout the enhanced text
Balance accessibility with scholarly depth

5. ANALYTICAL PRECISION

Eliminate redundant arguments and repetitive phrasing
Distinguish between intentional emphasis and unintentional redundancy
Replace unclear or weak analytical language with precise alternatives
Maintain original meaning while enhancing clarity and impact
Ensure substitutions align with academic or journalistic standards`;

export class PromptAssembler {
  /**
   * Converts ADDM refinement strategy into proper system/user prompt split
   * WITHOUT leaking meta-instructions into user-visible content.
   */
  static assembleRefinementPrompts(
    originalUserQuery: string,
    previousContent: string,
    refinementStrategy: RefinementStrategy,
    approachMetadata: any
  ): AssembledPrompt {

    // Build system prompt with ADDM directives (NOT visible in response)
    const systemPrompt = this.buildSystemPromptWithStrategy(
      approachMetadata,
      refinementStrategy
    );

    // Build user prompt with ONLY content context (NO meta-instructions)
    const userPrompt = this.buildUserPromptWithContext(
      originalUserQuery,
      previousContent,
      refinementStrategy.iteration,
      refinementStrategy.type
    );

    return {
      systemPrompt,
      userPrompt,
      includesPreviousContent: true
    };
  }

  private static buildSystemPromptWithStrategy(
    approachMetadata: any,
    strategy: RefinementStrategy
  ): string {
    // For enhance decisions, use synthesis-focused prompt instead of expansion
    if (strategy.type === 'enhance') {
      return `You are a content synthesis specialist. Your task is to take multiple pieces of research and writing about a topic and synthesize them into a single, comprehensive, and coherent final response.

## SYNTHESIS METHODOLOGY

Perform comprehensive content synthesis by:
1. MERGING overlapping information, concepts, and arguments from multiple sources
2. ELIMINATING redundant facts, repeated stories, and duplicated narratives
3. INTEGRATING different perspectives into unified explanations
4. STRUCTURING the final response as ONE complete, flowing narrative
5. REMOVING any traces of multiple separate documents or iterations

## OUTPUT REQUIREMENTS

- Create EXACTLY ONE comprehensive response (not multiple separate pieces)
- Ensure smooth transitions between topics without abrupt changes
- Eliminate repetition while preserving all unique insights
- Structure as a single, professional document with appropriate sections if needed
- Do not mention sources separately or indicate different contributors
- The final result must read as one cohesive piece of writing

---
`;
    }

    // For research decisions, use the approach metadata based system prompt
    const basePrompt = this.buildBaseSystemPrompt(approachMetadata);

    const strategyInstructions = `

## RESEARCH DIRECTIVE (Iteration ${strategy.iteration})

You are expanding a previous response through additional research. Your task is to RESEARCH AND EXPAND the content.

### Focus Areas:
${strategy.focus_areas.map(area => `- ${area}`).join('\n')}

### Constraints:
${strategy.constraints.map(constraint => `- ${constraint}`).join('\n')}

${strategy.target_improvements ? `
### Specific Improvements Needed:
${strategy.target_improvements.map(imp => `- ${imp}`).join('\n')}
` : ''}

${strategy.research_directions ? `
### Research Directions:
${strategy.research_directions.map(dir => `- ${dir}`).join('\n')}
` : ''}

### Output Requirements:
- DO NOT repeat the previous content verbatim
- DO NOT include meta-commentary like "Here is the refined version..."
- DO NOT reference that you are iterating or researching
- Produce content that stands on its own as a complete, expanded response
- Seamlessly integrate new research with existing content structure
- The user should see ONLY the improved content, not the research process

---
`;

    return basePrompt + strategyInstructions;
  }

  private static buildBaseSystemPrompt(approachMetadata: any): string {
    if (!approachMetadata) {
      return "You are a helpful AI assistant.";
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

    if (style) {
      prompt += `ORGANIZATION:\n`;
      if (style.useHeaders) {
        prompt += `- Use clear section headers\n`;
      }
      if (style.useBullets) {
        prompt += `- Use bullet points extensively\n`;
      }
      if (style.useNumberedLists) {
        prompt += `- Use numbered lists for sequences\n`;
      }
      if (style.includeSummary) {
        prompt += `- Include a summary section\n`;
      }
      if (style.includePrerequisites) {
        prompt += `- List prerequisites\n`;
      }
      if (style.includeNextSteps) {
        prompt += `- Suggest next steps\n`;
      }
      prompt += `\n`;
    }

    prompt += `Follow this guidance flexibly to create high-quality content that matches the discovered pattern.`;
    prompt += `\n`;

    return prompt;
  }

  private static buildUserPromptWithContext(
    originalUserQuery: string,
    previousContent: string,
    iteration: number,
    strategyType?: 'enhance' | 'research'
  ): string {
    if (strategyType === 'enhance') {
      // For enhance: Provide full accumulated research context for synthesis
      // But require synthesis into a single final polished response
      const researchContext = previousContent.length > 2000
        ? previousContent.slice(0, 2000) + '...'
        : previousContent;

      return `${originalUserQuery}

---
**All accumulated research and analysis:**
${researchContext}

**CRITICAL TASK:** Based on ALL the research above, create ONE SINGLE, FINAL, highly polished response to the query.

**STRICT REQUIREMENTS:**
- Do NOT generate another complete separate essay
- Do NOT repeat or include any previous complete responses
- SYNTHESIZE everything into ONE elegant, comprehensive answer
- ELIMINATE any traces of multiple iterations or separate sections
- The final result should be a SINGLE, coherent response that stands alone

Create the final polished version that represents the complete synthesis of all research.`.trim();
    } else {
      // For research: Continue building upon previous foundation
      const contentPreview = previousContent.length > 500
        ? previousContent.slice(0, 500) + '...'
        : previousContent;

      return `${originalUserQuery}

${iteration > 1 ? `
---
**Previous analysis:**
${contentPreview}

Continue expanding this analysis with additional research and insights.
` : ''}`.trim();
    }
  }

  /**
   * For final completion: Assemble all accumulated content into single unified response
   */
  static assembleAssemblyPrompts(
    accumulatedContent: string,
    approachMetadata: any
  ): AssembledPrompt {
    return {
      systemPrompt: this.buildAssemblySystemPrompt(approachMetadata),
      userPrompt: this.buildAssemblyUserPrompt(accumulatedContent),
      includesPreviousContent: false
    };
  }

  /**
   * Build system prompt for final content assembly
   */
  private static buildAssemblySystemPrompt(approachMetadata: any): string {
    const basePrompt = this.buildBaseSystemPrompt(approachMetadata);

    const assemblyInstructions = `

## FINAL ASSEMBLY SPECIALIST (Post-ADDM Completion)

You are a content assembly specialist. Your task is to take multiple overlapping sections, essays, and narratives about the same topic and assemble them into a single, cohesive, comprehensive response.

### ASSEMBLY METHODOLOGY:
- **IDENTIFY AND MERGE** similar information from different sections and essays
- **ELIMINATE DUPLICATE** facts, stories, repetitive narratives, and redundant content
- **INTEGRATE CONCEPTS** seamlessly to avoid breaks and transitions
- **REMOVE ARTIFACTS** including section headers that conflict, iteration markers, and separate document structures
- **CREATE SINGLE FLOW** where all content reads as one continuous, well-structured response

### OUTPUT REQUIREMENTS:
- Produce EXACTLY ONE cohesive response that covers all the major themes and information
- Ensure smooth narrative flow without abrupt changes or repetitions
- Remove any traces of having been assembled from separate documents
- Maintain comprehensive coverage while eliminating redundancy
- Structure the response appropriately for the topic (sections, headings as needed)

Your final output should read as a single, expertly composed document, not a compilation of separate pieces.`;

    return basePrompt + assemblyInstructions;
  }

  /**
   * Build user prompt for final content assembly
   */
  private static buildAssemblyUserPrompt(accumulatedContent: string): string {
    return `Take all the content provided below and assemble it into ONE unified, comprehensive response.

CONTENT TO ASSEMBLE:
${accumulatedContent}

CRITICAL REQUIREMENTS:
- Eliminate ALL duplicate sections, overlapping information, and repetitive narratives
- Merge similar ideas and concepts into single, cohesive explanations
- Remove any artifacts from separate iterations or documents
- Create smooth transitions between different areas of content
- Structure the final response with appropriate headings and sections as if it were written as one piece
- Ensure the result reads as a single, coherent document without any indication of being assembled

Deliver the final assembled and unified response addressing the original query completely.`;
  }

  /**
   * For initial iteration (no refinement needed)
   */
  static assembleInitialPrompt(
    userQuery: string,
    approachMetadata: any
  ): AssembledPrompt {
    return {
      systemPrompt: this.buildBaseSystemPrompt(approachMetadata),
      userPrompt: userQuery,
      includesPreviousContent: false
    };
  }
}
