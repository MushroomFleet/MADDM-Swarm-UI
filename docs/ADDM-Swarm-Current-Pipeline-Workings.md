---
title: ADDM-Swarm Pipeline - Current Implementation
description: Current workings of the ADDM-Swarm hybrid system with clean instruction flow
date: 2025-10-29
author: Cline
---

# ADDM-Swarm Pipeline: Current Implementation

## Overview

The ADDM-Swarm pipeline implements intelligent loop regulation for multi-specialist content refinement, where the ADDM (Adaptive Decision-Making) service decides when to enhance, research, or complete responses through orchestrated specialist coordination.

**Key Status**: ✅ **IMPLEMENTED AND WORKING** - Phase 1 (schemas + ADDM generation) + Phase 2 (prompt assembler + bridge updates) completed.

## Architecture

```
User Query → Swarm Coordination → First Specialist Response
                           ↓
ADDM Analysis → Decision (enhance/research/complete)
                           ↓
If continue → Refinement Strategy → Next Specialist → Merge Results
If complete → Final Response
```

## Pipeline Flow (ADDM Enabled, Parallel Disabled)

### Step 1: Initial Query Processing

**Original user query** → **Swarm Coordinator**

- **Coordination Logic**: Uses pattern discovery to select optimal specialist + approach
- **Approaches**: Generated dynamically or bootstrapped black-box approaches
- **Specialists**: Selected by relevance scoring (stigmergic table)

### Step 2: First Iteration (Iteration 0)

```
User Query + Specialist Coordination → RunAI
                                                                 ↓
Response Generation → Content Filtering
                                           ↓
Clean Response → ADDM Decision Analysis
```

**Key Components:**
- **Prompt Assembly**: `PromptAssembler.assembleInitialPrompt()` - Clean user query with approach guidance in system prompt
- **Content Extraction**: Removes meta-commentary like "Here is the enhanced version..."
- **ADDM Input**: Receives clean content for unbiased quality assessment

### Step 3: ADDM Decision Process

```
Clean Content → ADDM Analysis
                                    ↓
Decision Generation → Response (decision, confidence, reasoning, refinement_strategy)
```

**ADDM Decision Types:**
- **enhance**: Content needs refinement but has good foundation
- **research**: Lacks depth - needs additional investigation
- **complete**: Quality threshold met - deliver to user

### Step 4: Refinement Loop (If enhancing/researching)

For each subsequent iteration (1, 2, 3...):

```
Previous Decision Strategy → Prompt Assembly
                                                     ↓
System Prompt + User Context → New Specialist Coordination
                                                                   ↓
Response → Content Filter → Content Merge
                                      ↓
ADDM Re-analysis → Continue/Complete Decision
```

**Critical Components:**

#### 4.1 Prompt Assembler (`src/services/PromptAssembler.ts`)

**Purpose**: Separates ADDM directives into system prompts while keeping user-prompt content clean.

```typescript
// Enhancement Strategy Example
{
  "type": "enhance",
  "focus_areas": ["clarity and coherence", "structural organization"],
  "constraints": ["maintain factual accuracy", "preserve key insights"],
  "target_improvements": ["add concrete examples", "improve structural organization"]
}
```

**Generated Prompts:**
- **System Prompt**: Contains ADDM directive + approach metadata (NEVER visible in user response)
- **User Prompt**: Original query + clean context reference (ONLY this visible)

#### 4.2 Content Filtering

**Prevents Meta-commentary Leaks:**
- Removes phrases like "Here is the refined version..."
- Strips iteration references: "Based on previous iteration..."
- Filters out ADDM meta-instructions that might slip through

#### 4.3 Intelligent Content Merging

**Smart Content Aggregation:**
- **Enhancement**: Replaces content with refined version
- **Research**: Appends new information avoiding section duplication
- **Section Awareness**: Prevents header conflicts during merging

### Step 5: Loop Termination

**Termination Conditions:**
- **Decision**: `complete` (confidence > threshold)
- **Iteration Limit**: Max iterations reached (prevents infinite loops)
- **Error**: Service failures or timeout

### Step 6: Final Response Delivery

**Output Processing:**
- Aggregated clean content
- Metadata: iterations completed, total time, final decision
- Learning: Execution results recorded for future improvements

## Technical Implementation

### Key Files Modified

| Component | File | Purpose |
|-----------|------|---------|
| ADDM Service | `addm-service/src/core/regulator.py` | Generates structured refinement strategies |
| API Schema | `addm-service/src/models/schemas.py` | Added `RefinementStrategy` model |
| Frontend Types | `swarm-forge/src/types/addm.types.ts` | TypeScript interfaces |
| Prompt Assembly | `swarm-forge/src/services/PromptAssembler.ts` | System/user prompt separation |
| Bridge Logic | `swarm-forge/src/services/SwarmADDMBridge.ts` | Orchestrates prompt assembly + content filtering |
| Client Validation | `swarm-forge/src/services/ADDMClient.ts` | Updated to handle new response fields |

### Critical Fixes Implemented

1. **Phase 1**: Structured ADDM Response
   - ADDM service returns `RefinementStrategy` object instead of raw prompt text
   - Frontend types updated to match

2. **Phase 2**: Prompt Separation & Content Cleaning
   - `PromptAssembler` prevents instruction leakage by putting ADDM directives in system prompts
   - Content filtering removes any meta-instructions from responses
   - Intelligent merging prevents duplicate content

## Benefits Achieved

✅ **Instruction Leakage Eliminated**: Meta-instructions now stay in system prompts
✅ **Clean User Experience**: Responses contain only requested content
✅ **Maintained Compatibility**: Backward compatibility with existing functionality
✅ **Structured Intelligence**: ADDM strategies are formally defined and reusable
✅ **Content Quality**: Filtered and merged content provides cohesive results

## Current Status

**Phase 1, 2 & 3: ✅ COMPLETE**
- ADDM service generates structured strategies (Phase 1)
- Frontend properly separates prompts and filters content (Phase 2)
- React UI hooks and components integrated for ADDM loop mode (Phase 3)
- No instruction leakage in final outputs
- ADDM mode accessible via chat interface toggle
- Real-time progress indicators and toast notifications

**Ready for Phase 4**: Advanced content analysis, parallel execution integration, settings UI enhancements
