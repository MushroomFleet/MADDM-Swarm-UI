# Phase 1: Structured Output Design & Labeling System

## Overview

This phase establishes the foundation for a structured markdown output system that eliminates content merging issues by explicitly labeling each ADDM iteration's contribution. Instead of attempting to deduplicate AI-generated content, we structure the output to clearly show the progressive development through different decision phases.

## Core Problem Statement

Current ADDM loops produce multiple overlapping sections that require complex AI-powered deduplication, often resulting in:
- Content loss during merging
- Unpredictable output quality
- Difficult debugging of pipeline stages
- User confusion about what changed in each iteration

## Solution Approach

Structure the output with clear markdown separations and dynamic labeling based on ADDM decisions, allowing users to:
- See exactly what each iteration contributed
- Understand the decision-making flow
- Extract specific sections if needed
- Debug pipeline issues easily

## Output Structure Template

```
[Agent Notes and Decision History]
---
name: output_[timestamp]_[session_id]_Initial

[Complete initial response content here]

---
name: output_[timestamp]_[session_id]_Research_1

[First research iteration content]

---
name: output_[timestamp]_[session_id]_Research_2

[Second research iteration content (if applicable)]

---
name: output_[timestamp]_[session_id]_Enhance

[Enhancement/synthesis content]

---
[Swarm Statistics and Performance Metrics]
```

## Section Definitions

### Agent Notes Section
- Contains: ADDM decision history, confidence scores, reasoning
- Format: JSON structure with timestamped decisions
- Purpose: Audit trail of pipeline decisions

### Initial Section
- Content: First complete AI-generated response
- Decision Type: Always present (iteration 0)
- Label: `_Initial`

### Research Sections
- Content: Expanded information added during research decisions
- Decision Type: ADDM decides "research" for more depth
- Label: `_Research_[iteration_number]`
- May have multiple: Each research decision creates new section

### Enhance Section
- Content: Synthesized/refined content from enhance decision
- Decision Type: ADDM decides "enhance" for consolidation
- Label: `_Enhance`
- Typically replaces previous content in new section

### Swarm Stats Section
- Content: Performance metrics from SwarmADDMBridge
- Format: Key-value pairs or structured JSON
- Includes: Specialists used, signals processed, quality scores

## Dynamic Labeling System

### ID Generation
- `[timestamp]`: Unix timestamp at loop start (milliseconds)
- `[session_id]`: UUID or incrementing counter for uniqueness
- Combined: `output_1643723400000_abc123`

### Decision-Based Labels
- `_Initial`: Always first section
- `_Research_N`: Where N is sequential research iteration count
- `_Enhance`: Final enhancement/synthesis section

### Edge Cases
- **No Research Iterations**: Skip research sections, go directly to enhance
- **Multiple Research Decrees**: Increment counter for each research
- **Direct Complete**: Skip enhance, end after research sections
- **Cancelled Loop**: Include all completed sections up to cancellation

## Implementation Steps

### 1. Define Labeling Schema
Create `labeling-schema.ts` to handle ID generation and section naming logic.

### 2. Create Output Accumulator
Implement content accumulation system that adds section breaks instead of merging.

### 3. Update Bridge Logic
Modify SwarmADDMBridge to collect sectioned content rather than merged content.

### 4. Update Prompts
Modify PromptAssembler to generate content aware of section structure.

### 5. Add Agent Notes
Capture and format ADDM decisions and reasoning for transparency.

## Benefits

- **Transparency**: Users see the full development process
- **Debugging**: Easy to identify which iteration contributed what content
- **Reliability**: Eliminates unpredictable AI deduplication
- **Flexibility**: Users can extract specific sections as needed
- **Audit-ability**: Complete decision and content history preserved

## Migration Strategy

- **Backward Compatibility**: Option to fall back to merged output
- **Gradual Rollout**: Start with research_assembly tasks
- **Feature Flag**: Enable structured output per task type
- **User Choice**: Allow users to request merged vs. structured output

## Next Phase Preparation

Phase 2 will implement the core accumulation logic in SwarmADDMBridge.ts, replacing the current merging system with section collection and labeling.
