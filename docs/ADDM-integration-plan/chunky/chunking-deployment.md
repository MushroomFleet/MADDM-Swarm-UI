# ADDM-Swarm Instruction Leakage: Solution Guide

I'll provide comprehensive guidance to solve the instruction leakage problem and address the secondary issues. This will include architectural changes, pseudocode, and implementation steps.

## 🎯 Problem Analysis

**Root Cause:** ADDM-generated meta-instructions (e.g., "Enhance and refine...") are being passed to OpenRouter as **user content** instead of **system directives**, causing the LLM to treat them as content requirements rather than operational instructions.

**Critical Distinction Needed:**
- **User Content**: The actual query/topic the user wants answered
- **System Instructions**: Meta-directives for how to process/refine content
- **Context Content**: Previous iteration results (clean, without prompts)

---

## 🔧 Solution Architecture

### Strategy 1: Prompt Separation & Routing (Recommended)

Create a clear separation between operational instructions and content:

```
┌─────────────────────────────────────────────────────┐
│  ADDM Decision Layer                                 │
│  ├─ Analyze: content quality, completeness          │
│  └─ Output: decision + refinement_strategy          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Prompt Assembly Layer (NEW)                         │
│  ├─ Map refinement_strategy → system instructions   │
│  ├─ Preserve original user query                    │
│  └─ Include clean previous content as reference     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  LLM Execution                                       │
│  ├─ System: "You are refining. Focus on X, Y, Z"   │
│  └─ User: [original query] + [clean context]       │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### Phase 1: Modify ADDM Response Structure

**File: `addm-service/src/core/regulator.py`**

**Change 1:** Replace `next_prompt` with structured `refinement_strategy`

```python
# BEFORE (Current Implementation)
def _generate_next_prompt(self, decision: str, content: str, workflow_mode: str) -> str:
    if decision == "enhance":
        return "Enhance and refine the previous response. Focus on improving clarity, structure, and depth."
    # ... more string prompts

# AFTER (Proposed Implementation)
def _generate_refinement_strategy(
    self, 
    decision: str, 
    content: str, 
    workflow_mode: str,
    iteration: int
) -> Dict[str, Any]:
    """
    Generate structured refinement strategy instead of raw prompt text.
    Returns directives that will be converted to system instructions.
    """
    
    if decision == "enhance":
        return {
            "type": "enhance",
            "focus_areas": [
                "clarity and coherence",
                "structural organization",
                "depth and detail"
            ],
            "constraints": [
                "maintain factual accuracy",
                "preserve key insights from previous iteration",
                "expand on underdeveloped sections"
            ],
            "target_improvements": self._analyze_gaps(content),
            "iteration": iteration
        }
    
    elif decision == "research":
        return {
            "type": "research",
            "focus_areas": [
                "additional evidence and examples",
                "alternative perspectives",
                "supporting data and citations"
            ],
            "constraints": [
                "build upon existing content",
                "avoid redundancy",
                "prioritize credible sources"
            ],
            "research_directions": self._identify_research_gaps(content, workflow_mode),
            "iteration": iteration
        }
    
    return None  # for "complete" decision

def _analyze_gaps(self, content: str) -> List[str]:
    """
    Analyze content to identify specific areas needing enhancement.
    Returns concrete improvement targets.
    """
    gaps = []
    
    # Check content depth
    if len(content.split('\n\n')) < 3:
        gaps.append("expand sectional coverage")
    
    # Check for examples
    if "for example" not in content.lower() and "such as" not in content.lower():
        gaps.append("add concrete examples")
    
    # Check for structure
    if not any(marker in content for marker in ['##', '**', '1.', '•']):
        gaps.append("improve structural organization")
    
    return gaps if gaps else ["general refinement"]

def _identify_research_gaps(self, content: str, workflow_mode: str) -> List[str]:
    """
    Identify specific research directions based on content analysis.
    """
    research_areas = []
    
    if workflow_mode == "research_assembly":
        # Check for citations/sources
        if "according to" not in content.lower() and "research shows" not in content.lower():
            research_areas.append("add authoritative sources and citations")
        
        # Check for data
        if not any(char.isdigit() for char in content):
            research_areas.append("include relevant statistics and data")
    
    elif workflow_mode == "news_analysis":
        # Check for multiple perspectives
        if "however" not in content.lower() and "alternatively" not in content.lower():
            research_areas.append("explore alternative viewpoints")
        
        # Check for context
        if "background" not in content.lower() and "context" not in content.lower():
            research_areas.append("provide historical context")
    
    return research_areas if research_areas else ["expand topical coverage"]

# Update make_decision to return strategy instead of prompt
def make_decision(self, request: ADDMRequest) -> ADDMDecision:
    # ... existing decision logic ...
    
    refinement_strategy = None
    if decision in ["enhance", "research"]:
        refinement_strategy = self._generate_refinement_strategy(
            decision=decision,
            content=request.content,
            workflow_mode=request.workflow_mode,
            iteration=request.iteration
        )
    
    return ADDMDecision(
        decision=decision,
        confidence=confidence,
        reaction_time=reaction_time,
        reasoning=reasoning,
        refinement_strategy=refinement_strategy,  # NEW: structured data
        next_prompt=None,  # DEPRECATED: remove this field
        should_summarize=should_summarize
    )
```

---

### Phase 2: Create Prompt Assembly Layer

**File: `swarm-forge/src/services/PromptAssembler.ts` (NEW FILE)**

```typescript
interface RefinementStrategy {
  type: 'enhance' | 'research';
  focus_areas: string[];
  constraints: string[];
  target_improvements?: string[];
  research_directions?: string[];
  iteration: number;
}

interface AssembledPrompt {
  systemPrompt: string;
  userPrompt: string;
  includesPreviousContent: boolean;
}

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
      refinementStrategy.iteration
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
    const baseSystemPrompt = buildSystemPrompt(approachMetadata);
    
    const strategyInstructions = `

## REFINEMENT DIRECTIVE (Iteration ${strategy.iteration})

You are refining a previous response. Your task is to ${strategy.type === 'enhance' ? 'ENHANCE' : 'RESEARCH AND EXPAND'} the content.

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
- DO NOT reference that you are iterating or refining
- Produce content that stands on its own as a complete, polished response
- Seamlessly integrate improvements with existing content structure
- The user should see ONLY the improved content, not the refinement process

---
`;
    
    return baseSystemPrompt + strategyInstructions;
  }
  
  private static buildUserPromptWithContext(
    originalUserQuery: string,
    previousContent: string,
    iteration: number
  ): string {
    // Extract first 500 chars as context (avoid overwhelming)
    const contentPreview = previousContent.length > 500 
      ? previousContent.slice(0, 500) + '...'
      : previousContent;
    
    // Structure: Original query + Clean context reference
    // NO meta-instructions here!
    return `${originalUserQuery}

${iteration > 1 ? `
---
**Context from previous analysis:**
${contentPreview}

Continue building upon this foundation.
` : ''}`.trim();
  }
  
  /**
   * For initial iteration (no refinement needed)
   */
  static assembleInitialPrompt(
    userQuery: string,
    approachMetadata: any
  ): AssembledPrompt {
    return {
      systemPrompt: buildSystemPrompt(approachMetadata),
      userPrompt: userQuery,
      includesPreviousContent: false
    };
  }
}
```

---

### Phase 3: Update Bridge to Use Prompt Assembler

**File: `swarm-forge/src/services/SwarmADDMBridge.ts`**

```typescript
import { PromptAssembler } from './PromptAssembler';

export class SwarmADDMBridge {
  // Store original user query for all iterations
  private originalUserQuery: string = '';
  
  async executeADDMLoop(/* ... params */): Promise<string> {
    // Store original query at loop start
    this.originalUserQuery = userMessage;
    
    let currentPrompt = userMessage;
    let iteration = 0;
    let aggregatedContent = '';
    
    while (iteration < maxIterations) {
      // ... coordination logic ...
      
      // ===== KEY CHANGE: Use PromptAssembler =====
      let assembledPrompt;
      
      if (iteration === 0) {
        // Initial iteration: standard prompting
        assembledPrompt = PromptAssembler.assembleInitialPrompt(
          this.originalUserQuery,
          approachMetadata
        );
      } else {
        // Refinement iterations: use ADDM strategy
        if (!addmDecision.refinement_strategy) {
          throw new Error('Missing refinement strategy for non-initial iteration');
        }
        
        assembledPrompt = PromptAssembler.assembleRefinementPrompts(
          this.originalUserQuery,
          aggregatedContent,  // Previous clean content
          addmDecision.refinement_strategy,
          approachMetadata
        );
      }
      
      // Execute with properly separated prompts
      const response = await this.streamingChat.executeWithStreaming({
        systemPrompt: assembledPrompt.systemPrompt,  // Contains ADDM directives
        userContent: assembledPrompt.userPrompt,      // Contains ONLY content
        // ... other params
      });
      
      // ===== KEY CHANGE: Extract clean content only =====
      const cleanContent = this.extractCleanContent(response.content);
      
      // Update aggregation with clean content
      if (iteration === 0) {
        aggregatedContent = cleanContent;
      } else {
        // Smart merging (see Phase 4)
        aggregatedContent = this.mergeIterationContent(
          aggregatedContent,
          cleanContent,
          addmDecision.refinement_strategy.type
        );
      }
      
      // Get ADDM decision
      addmDecision = await this.getADDMDecision({
        content: cleanContent,
        // ... other params
      });
      
      if (addmDecision.decision === 'complete') {
        break;
      }
      
      iteration++;
    }
    
    return aggregatedContent;  // Clean, no leaked instructions
  }
  
  /**
   * Extract only the actual content, filtering out any meta-commentary
   */
  private extractCleanContent(rawResponse: string): string {
    // Remove common meta-phrases that might slip through
    const metaPhrases = [
      /^Here is the (refined|enhanced|improved) (version|response|content):/i,
      /^I(?:'ve| have) (refined|enhanced|improved|expanded)/i,
      /^(Based on|Building upon|Continuing from) the previous (response|content|iteration)/i,
      /^Iteration \d+:/i,
      /^Let me (refine|enhance|expand)/i
    ];
    
    let cleaned = rawResponse.trim();
    
    for (const pattern of metaPhrases) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // Remove leading/trailing artifacts
    cleaned = cleaned.replace(/^[-=]+\s*/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }
  
  /**
   * Intelligently merge iteration content (Phase 4 enhancement)
   */
  private mergeIterationContent(
    existingContent: string,
    newContent: string,
    strategyType: 'enhance' | 'research'
  ): string {
    if (strategyType === 'enhance') {
      // Enhancement: new content should be a refinement, replace old
      return newContent;
    } else {
      // Research: new content adds information, append intelligently
      return this.intelligentAppend(existingContent, newContent);
    }
  }
  
  private intelligentAppend(existing: string, addition: string): string {
    // Avoid duplication of section headers
    const existingSections = this.extractSections(existing);
    const newSections = this.extractSections(addition);
    
    // Only append truly new sections
    const uniqueNewContent = newSections
      .filter(section => !this.isDuplicateSection(section, existingSections))
      .map(s => s.content)
      .join('\n\n');
    
    if (uniqueNewContent.trim()) {
      return `${existing}\n\n${uniqueNewContent}`;
    }
    
    return existing;  // Nothing new to add
  }
  
  // Helper methods for content analysis
  private extractSections(content: string): Array<{header: string, content: string}> {
    // Simple section extraction based on markdown headers
    const sections: Array<{header: string, content: string}> = [];
    const lines = content.split('\n');
    
    let currentSection = { header: '', content: '' };
    
    for (const line of lines) {
      if (line.match(/^#+\s+/)) {
        if (currentSection.content) {
          sections.push(currentSection);
        }
        currentSection = { header: line, content: line + '\n' };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.content) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  private isDuplicateSection(
    section: {header: string, content: string},
    existingSections: Array<{header: string, content: string}>
  ): boolean {
    // Check for header similarity
    const normalizedHeader = section.header.toLowerCase().replace(/[#\s]/g, '');
    
    return existingSections.some(existing => {
      const existingNormalized = existing.header.toLowerCase().replace(/[#\s]/g, '');
      return this.similarity(normalizedHeader, existingNormalized) > 0.8;
    });
  }
  
  private similarity(s1: string, s2: string): number {
    // Simple Levenshtein-based similarity
    // (Implementation details omitted for brevity - use existing library)
    // Return value between 0-1
    return 0.5; // Placeholder
  }
}
```

---

### Phase 4: Update API Response Structure

**File: `addm-service/src/models/schemas.py`**

```python
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RefinementStrategy(BaseModel):
    """Structured refinement strategy to replace raw prompt strings"""
    type: str = Field(..., description="'enhance' or 'research'")
    focus_areas: List[str] = Field(..., description="Areas to focus refinement on")
    constraints: List[str] = Field(..., description="Constraints to maintain")
    target_improvements: Optional[List[str]] = Field(None, description="Specific improvements needed")
    research_directions: Optional[List[str]] = Field(None, description="Research directions to pursue")
    iteration: int = Field(..., description="Current iteration number")

class ADDMDecision(BaseModel):
    """Response from ADDM decision endpoint"""
    decision: str = Field(..., description="'complete', 'enhance', or 'research'")
    confidence: float = Field(..., description="Decision confidence score")
    reaction_time: float = Field(..., description="DDM reaction time in ms")
    reasoning: str = Field(..., description="Human-readable decision reasoning")
    
    # NEW: Structured strategy replaces raw prompt
    refinement_strategy: Optional[RefinementStrategy] = Field(
        None, 
        description="Structured refinement strategy (only for enhance/research decisions)"
    )
    
    # DEPRECATED: Remove in next major version
    next_prompt: Optional[str] = Field(
        None, 
        deprecated=True,
        description="DEPRECATED: Use refinement_strategy instead"
    )
    
    should_summarize: bool = Field(
        False, 
        description="Whether context should be summarized for next iteration"
    )
```

---

## 🧪 Testing & Validation

### Test Case 1: Verify No Leakage

```typescript
// Test file: swarm-forge/tests/addm-leakage.test.ts

describe('ADDM Instruction Leakage Prevention', () => {
  it('should not include meta-instructions in final response', async () => {
    const result = await executeADDMLoop({
      userMessage: "Explain quantum computing",
      maxIterations: 3
    });
    
    // Assertions: final content should NOT contain:
    expect(result).not.toMatch(/enhance and refine/i);
    expect(result).not.toMatch(/iteration \d+/i);
    expect(result).not.toMatch(/focus on improving/i);
    expect(result).not.toMatch(/conduct additional research/i);
    expect(result).not.toMatch(/here is the refined version/i);
    
    // Assertions: final content SHOULD contain:
    expect(result).toMatch(/quantum/i);
    expect(result.length).toBeGreaterThan(500); // Substantial content
  });
  
  it('should properly separate system and user prompts', () => {
    const strategy = {
      type: 'enhance',
      focus_areas: ['clarity', 'depth'],
      constraints: ['maintain accuracy'],
      iteration: 2
    };
    
    const assembled = PromptAssembler.assembleRefinementPrompts(
      "Explain AI",
      "AI is about machines...",
      strategy,
      {}
    );
    
    // System prompt should contain directives
    expect(assembled.systemPrompt).toMatch(/REFINEMENT DIRECTIVE/);
    expect(assembled.systemPrompt).toMatch(/clarity/);
    
    // User prompt should NOT contain directives
    expect(assembled.userPrompt).not.toMatch(/enhance/i);
    expect(assembled.userPrompt).not.toMatch(/refine/i);
    expect(assembled.userPrompt).toMatch(/Explain AI/); // Original query
  });
});
```

### Test Case 2: Content Quality

```python
# Test file: addm-service/tests/test_refinement_strategy.py

def test_refinement_strategy_structure():
    """Verify refinement strategy is properly structured"""
    regulator = SingleDecisionRegulator(config)
    
    strategy = regulator._generate_refinement_strategy(
        decision="enhance",
        content="Short content here.",
        workflow_mode="research_assembly",
        iteration=1
    )
    
    assert strategy is not None
    assert strategy["type"] == "enhance"
    assert len(strategy["focus_areas"]) > 0
    assert len(strategy["constraints"]) > 0
    assert "iteration" in strategy
    
    # Should NOT be a string prompt
    assert not isinstance(strategy, str)

def test_no_raw_prompts_in_response():
    """Ensure response doesn't contain legacy prompt strings"""
    decision = regulator.make_decision(request)
    
    # New field should be present
    assert decision.refinement_strategy is not None
    
    # Old field should be None or empty
    assert decision.next_prompt is None
```

---

## 📊 Monitoring & Metrics

Add logging to track improvement:

```typescript
// In SwarmADDMBridge.executeADDMLoop()

// After each iteration
logger.info('ADDM Iteration Complete', {
  iteration,
  decision: addmDecision.decision,
  contentLength: cleanContent.length,
  hasMetaInstructions: this.detectMetaInstructions(cleanContent),
  strategyType: addmDecision.refinement_strategy?.type,
  focusAreas: addmDecision.refinement_strategy?.focus_areas
});

// Helper method
private detectMetaInstructions(content: string): boolean {
  const metaPatterns = [
    /enhance and refine/i,
    /iteration \d+/i,
    /focus on improving/i,
    /conduct additional research/i
  ];
  
  return metaPatterns.some(pattern => pattern.test(content));
}
```

---

## 🚀 Migration Path

### Phase 1 (Immediate - Week 1)
1. ✅ Update `ADDMDecision` schema with `refinement_strategy` field
2. ✅ Implement `_generate_refinement_strategy()` in Python
3. ✅ Keep `next_prompt` for backward compatibility (deprecated)

### Phase 2 (Core Fix - Week 1-2)
4. ✅ Create `PromptAssembler.ts`
5. ✅ Update `SwarmADDMBridge` to use assembler
6. ✅ Implement `extractCleanContent()` filtering

### Phase 3 (Enhancement - Week 2-3)
7. ✅ Implement intelligent content merging
8. ✅ Add section deduplication logic
9. ✅ Enhance ADDM gap analysis

### Phase 4 (Validation - Week 3)
10. ✅ Write comprehensive tests
11. ✅ Add monitoring/logging
12. ✅ Conduct user acceptance testing

### Phase 5 (Cleanup - Week 4)
13. ✅ Remove deprecated `next_prompt` field
14. ✅ Update documentation
15. ✅ Performance optimization

---

## 🎯 Expected Outcomes

**Before Fix:**
```
User Query: "Explain French night culture"

Iteration 1: [Clean content about French nightlife]
Iteration 2: "Enhance and refine the previous response. Focus on improving clarity...
             [Some enhanced content mixed with instructions]"
Iteration 3: "Iteration 3: Conduct additional research...
             [More content with meta-commentary]"

Final Output: [Contaminated with "Enhance and refine", "Iteration X", etc.]
```

**After Fix:**
```
User Query: "Explain French night culture"

Iteration 1: [Clean content about French nightlife]
Iteration 2: [Enhanced content with better structure - NO meta-instructions]
Iteration 3: [Additional research perspectives - NO meta-instructions]

Final Output: [Pure, polished content about French night culture]
```

---

## 💡 Additional Recommendations

### 1. Parallel Processing (Secondary Issue)
```typescript
// Future enhancement: parallel specialist execution
async executeParallelRefinement(
  strategies: RefinementStrategy[]
): Promise<string[]> {
  return Promise.all(
    strategies.map(strategy => 
      this.executeWithStrategy(strategy)
    )
  );
}
```

### 2. Semantic Quality Scoring (Replace Heuristics)
```python
# Future: Use embeddings for quality assessment
from sentence_transformers import SentenceTransformer

def assess_content_quality(self, content: str) -> float:
    # Semantic completeness, coherence, depth
    model = SentenceTransformer('all-MiniLM-L6-v2')
    # ... implementation
    return quality_score
```

### 3. Content Summarization (Long Context)
```typescript
// When context exceeds threshold, summarize instead of truncate
if (aggregatedContent.length > 2000) {
  const summarized = await this.summarizeContent(aggregatedContent);
  // Use summarized version in next iteration context
}
```

---

This solution guide provides a complete path to eliminating instruction leakage while setting up architecture for future enhancements. The key insight is **separating operational directives (system prompt) from content context (user prompt)**, ensuring the LLM never sees meta-instructions as content to reproduce.