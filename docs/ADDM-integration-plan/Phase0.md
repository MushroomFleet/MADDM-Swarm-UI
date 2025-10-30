# ADDM-Swarm Integration - Phase 0: Project Overview

## Project Summary

This project integrates the **ADDM (Agentic Drift-Diffusion Model) Loop Regulator** with the existing **Hybrid-Swarm** TypeScript/React application. The integration adds intelligent loop control that decides when LLM responses should be enhanced with additional research, refined for quality, or delivered to the user.

**Integration Type:** Additive enhancement layer (preserves existing architecture)

**Technology Stack:**
- Frontend: React + TypeScript (Vite)
- Backend: Node.js/TypeScript
- ADDM Service: Python FastAPI (containerized)
- Communication: REST API
- Storage: Existing Zustand stores + new ADDM state management

## Architecture Overview

### Three-Layer Integration Architecture

```
┌─────────────────────────────────────────────────┐
│           React Frontend (Vite)                 │
│  - ChatInterface with ADDM execution mode       │
│  - useADDMLoop() hook                           │
│  - ADDM Settings UI                             │
│  - Enhanced SwarmTrace display                  │
└─────────────┬───────────────────────────────────┘
              │ REST API / WebSocket
┌─────────────▼───────────────────────────────────┐
│         Backend Service (Node.js/TS)            │
│  - HybridSwarmOrchestrator (unchanged)          │
│  - ADDMClient (Python service connector)        │
│  - ADDMLoopManager (iteration state)            │
│  - SwarmADDMBridge (coordination layer)         │
└─────────────┬───────────────────────────────────┘
              │ HTTP
┌─────────────▼───────────────────────────────────┐
│         Python ADDM Service                     │
│  - FastAPI REST endpoints                       │
│  - LoopRegulator (decision engine)              │
│  - MultiAlternativeDDM (DDM simulation)         │
└─────────────────────────────────────────────────┘
```

### Key Integration Principles

1. **Stigmergic Independence Preserved**
   - ADDM operates ABOVE the Hybrid-Swarm layer
   - Each iteration uses full swarm coordination
   - No changes to specialist/signal architecture

2. **Third Execution Mode**
   - Standard: Single specialist, single execution
   - Parallel: N specialists, quality voting
   - ADDM: Single specialist per iteration, intelligent looping (NEW)

3. **Leverage Existing Infrastructure**
   - Uses `ContentAnalyzer` for quality metrics
   - Integrates with `SwarmTrace` for metadata
   - Follows `SystemConfig` settings patterns
   - Records in `ExecutionHistoryStore` for learning

## Phase Breakdown

### Phase 1: ADDM Backend Service Setup
**Goal:** Create containerized Python FastAPI service for ADDM decision-making

**Duration:** 7-10 days

**Dependencies:** None

**Key Deliverables:**
- Python FastAPI service with REST endpoints
- Docker containerization with docker-compose
- LoopRegulator implementation (ternary decision logic)
- Health check and error handling
- API documentation

**Success Criteria:**
- Service responds to health checks
- `/decide` endpoint returns valid ADDMResult
- Docker container runs stably
- API documentation complete

---

### Phase 2: TypeScript Integration Layer
**Goal:** Build TypeScript client and bridge between Node.js backend and Python ADDM service

**Duration:** 7-10 days

**Dependencies:** Phase 1 complete

**Key Deliverables:**
- ADDMClient (HTTP client for Python service)
- Complete TypeScript type definitions
- ADDMLoopManager (iteration state management)
- SwarmADDMBridge (coordination layer)
- Error handling and retry logic

**Success Criteria:**
- ADDMClient successfully calls Python service
- Type safety across all ADDM interfaces
- Loop state properly managed
- Graceful error handling with fallbacks

---

### Phase 3: React Frontend Integration
**Goal:** Implement React hooks and execution logic for ADDM loop mode

**Duration:** 7-10 days

**Dependencies:** Phase 2 complete

**Key Deliverables:**
- useADDMLoop() custom hook
- ChatInterface ADDM execution path
- Loop state management in React
- Streaming content aggregation
- Iteration progress tracking

**Success Criteria:**
- ADDM loop executes from ChatInterface
- Streaming content displays properly
- Loop terminates on ADDM "complete" decision
- State updates tracked in real-time

---

### Phase 4: UI Components & Enhanced Trace
**Goal:** Create user-facing UI for ADDM configuration and enhanced trace display

**Duration:** 5-7 days

**Dependencies:** Phase 3 complete

**Key Deliverables:**
- ADDM Settings panel in SystemConfig
- Iteration progress indicator
- Enhanced SwarmTrace with ADDM section
- Toast notifications for loop completion
- Token usage warnings

**Success Criteria:**
- Users can enable/configure ADDM mode
- Progress indicator shows current iteration
- SwarmTrace displays all ADDM decisions
- Warnings clearly communicate token costs

---

### Phase 5: Testing & Validation
**Goal:** Comprehensive testing of ADDM integration across all layers

**Duration:** 7-10 days

**Dependencies:** Phase 4 complete

**Key Deliverables:**
- Unit tests for Python service
- Integration tests for TypeScript layer
- End-to-end tests for React UI
- Performance benchmarks
- Token cost validation

**Success Criteria:**
- 80%+ code coverage on new components
- All edge cases handled (max iterations, errors, timeouts)
- No regressions in existing swarm functionality
- Performance metrics documented

---

### Phase 6: Deployment & Documentation
**Goal:** Deploy to production and create comprehensive documentation

**Duration:** 5-7 days

**Dependencies:** Phase 5 complete

**Key Deliverables:**
- Production Docker Compose configuration
- Deployment runbook
- User documentation (how to use ADDM mode)
- Developer documentation (API reference)
- Monitoring and logging setup

**Success Criteria:**
- Service deployed and accessible
- Documentation complete and reviewed
- Monitoring dashboards operational
- Rollback plan tested

## Technology Stack Details

### Frontend Technologies
- **React 18+** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management
- **TailwindCSS** for styling
- **lucide-react** for icons

### Backend Technologies
- **Node.js 18+** with TypeScript
- **Express** or similar REST framework
- **Axios** for HTTP client
- Existing **HybridSwarmOrchestrator** (unchanged)

### ADDM Service Technologies
- **Python 3.11+**
- **FastAPI** for REST API
- **Pydantic** for data validation
- **NumPy** for DDM simulation
- **Docker** for containerization

### Communication
- **REST API** between layers
- **Server-Sent Events (SSE)** for streaming (optional Phase 7+)
- **Health checks** for service availability

## Success Criteria

### Functional Requirements
✅ ADDM mode can be enabled/disabled via settings  
✅ Loop executes iteratively with swarm coordination per iteration  
✅ ADDM makes ternary decisions: enhance, research, or complete  
✅ Progress indicator shows current iteration and state  
✅ Final response aggregates all iterations  
✅ SwarmTrace displays complete decision history  
✅ Graceful fallback to standard mode on ADDM service failure  

### Non-Functional Requirements
✅ Each phase document < 45,000 characters  
✅ No breaking changes to existing Hybrid-Swarm  
✅ Stigmergic coordination preserved  
✅ Token usage clearly communicated to users  
✅ Response time < 500ms per ADDM decision  
✅ Docker service stable with automatic restart  

### Quality Requirements
✅ TypeScript strict mode compliance  
✅ 80%+ test coverage on new components  
✅ Error handling at all integration points  
✅ Logging for debugging and monitoring  
✅ Documentation for users and developers  

## Risk Assessment

### High-Impact Risks

**Risk 1: Python Service Availability**
- **Impact:** ADDM mode unusable if service down
- **Mitigation:** Health checks, graceful fallback, clear error messages

**Risk 2: Token Cost Surprise**
- **Impact:** Users may not realize 5-20x cost multiplier
- **Mitigation:** Prominent warnings, default disabled, iteration display

### Medium-Impact Risks

**Risk 3: Infinite Loops**
- **Impact:** Could run indefinitely without safeguards
- **Mitigation:** Hard max iterations (1-20), confidence threshold, cancellation

**Risk 4: Context Overflow**
- **Impact:** Large contexts may exceed LLM limits
- **Mitigation:** Automatic summarization at 32K, configurable threshold

### Rollback Plan

```bash
# Quick disable via environment variable
ENABLE_ADDM=false

# Or via UI
updateADDMConfig({ enabled: false })

# Stop Python service independently
docker-compose stop addm-service
```

## Estimated Timeline

### Week 1-2: Backend Foundation (Phase 1)
- Days 1-3: Python FastAPI service setup
- Days 4-5: Docker containerization
- Days 6-7: API endpoint implementation
- Days 8-10: Testing and debugging

### Week 3-4: Integration Layer (Phase 2-3)
- Days 1-3: TypeScript client and types (Phase 2)
- Days 4-6: Loop manager and bridge (Phase 2)
- Days 7-8: React hooks (Phase 3)
- Days 9-10: ChatInterface integration (Phase 3)

### Week 5: UI & Testing (Phase 4-5)
- Days 1-3: Settings UI and trace enhancement (Phase 4)
- Days 4-5: Progress indicators (Phase 4)
- Days 6-7: Integration testing (Phase 5)
- Days 8-10: End-to-end validation (Phase 5)

### Week 6: Deployment (Phase 6)
- Days 1-3: Production configuration
- Days 4-5: Documentation
- Days 6-7: Deployment and monitoring
- Days 8-10: Buffer for issues

**Total Estimated Time:** 5-6 weeks

## Key Metrics to Track

### ADDM Performance Metrics
- Total loops executed
- Average iterations per loop
- Average confidence per completion
- Decision distribution (enhance vs research vs complete)
- Token usage per loop
- Execution time per iteration

### Quality Metrics
- User satisfaction with ADDM results
- Comparison: ADDM vs standard vs parallel mode quality
- Success rate (loops completing vs max iterations)
- Context overflow occurrences

### System Health Metrics
- Python service uptime
- API response time
- Error rate by layer
- Resource usage (CPU, memory)

## Team Structure Recommendation

**Full-Stack Developer(s):** 1-2 developers
- Responsible for all phases
- Coordinate between Python and TypeScript
- End-to-end feature ownership

**OR**

**Backend Developer:** 1 developer
- Phase 1: Python service
- Phase 2: TypeScript integration
- Phase 6: Deployment

**Frontend Developer:** 1 developer
- Phase 3: React hooks
- Phase 4: UI components
- Phase 5: Frontend testing

**QA/Testing:** 1 developer or shared
- Phase 5: Testing coordination
- Validate across all layers

## Getting Started

1. **Read this Phase 0** to understand the project
2. **Proceed to Phase 1** for backend service implementation
3. **Create `/docs/instruct/` directory** for substage documents if needed
4. **Track progress** using validation checklists in each phase
5. **Complete phases sequentially** (some parallelization possible between 2A/2B)

## Document Navigation

- **Current:** Phase 0 (Overview)
- **Next:** Phase 1 (ADDM Backend Service Setup)
- **Related:** See original ADDM-Swarm-Integration-Plan.md for detailed context

---

**Document Version:** 1.0  
**Created:** 2025-10-28  
**Status:** Ready for Phase 1  
**Character Count:** ~9,500
