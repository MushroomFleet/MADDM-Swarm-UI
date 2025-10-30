# Phase 1: ADDM Backend Service Setup

## Phase Overview

**Goal:** Create a containerized Python FastAPI service that provides ADDM (Agentic Drift-Diffusion Model) decision-making via REST API

**Prerequisites:** 
- Python 3.11+ installed
- Docker and docker-compose installed
- Basic understanding of FastAPI and REST APIs
- OpenRouter API key for LLM access

**Estimated Duration:** 7-10 days

**Key Deliverables:**
- Python FastAPI service with `/health` and `/decide` endpoints
- LoopRegulator implementation with ternary decision logic
- Docker container with docker-compose configuration
- API documentation (auto-generated via FastAPI)
- Basic error handling and logging

## Step-by-Step Implementation

### Step 1: Project Structure Setup

**Purpose:** Establish the directory structure and initial files for the ADDM service

**Duration:** 1-2 hours

#### Instructions

1. Create the project directory structure:

```bash
mkdir -p addm-service/src/{core,api,models}
mkdir -p addm-service/tests
touch addm-service/requirements.txt
touch addm-service/Dockerfile
touch addm-service/docker-compose.yml
touch addm-service/.env.example
```

2. Create the main application entry point:

#### Code Example: `addm-service/src/main.py`

```python
"""
ADDM FastAPI Service
Main application entry point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys

from api.routes import router as decision_router
from core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.LOG_LEVEL == "info" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    logger.info("ADDM Service starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"OpenRouter API configured: {bool(settings.OPENROUTER_API_KEY)}")
    yield
    logger.info("ADDM Service shutting down...")


# Create FastAPI application
app = FastAPI(
    title="ADDM Loop Regulator Service",
    description="Agentic Drift-Diffusion Model for intelligent loop control",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(decision_router, prefix="/api/v1", tags=["decisions"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "addm-regulator",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ADDM Loop Regulator Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
```

#### Configuration: `addm-service/src/core/config.py`

```python
"""
Configuration management for ADDM service
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal


class Settings(BaseSettings):
    """Application settings"""
    
    # API Keys
    OPENROUTER_API_KEY: str = Field(..., description="OpenRouter API key")
    
    # Environment
    ENVIRONMENT: Literal["development", "production"] = Field(
        default="development",
        description="Application environment"
    )
    
    # Logging
    LOG_LEVEL: Literal["info", "warning", "error"] = Field(
        default="info",
        description="Logging level"
    )
    
    # ADDM Parameters
    MAX_ITERATIONS: int = Field(default=20, description="Maximum loop iterations")
    DEFAULT_CONFIDENCE_THRESHOLD: float = Field(
        default=0.85,
        description="Default confidence threshold for completion"
    )
    CONTEXT_SUMMARIZATION_THRESHOLD: int = Field(
        default=32000,
        description="Character count for automatic context summarization"
    )
    
    # OpenRouter Configuration
    OPENROUTER_MODEL: str = Field(
        default="anthropic/claude-sonnet-4-20250514",
        description="Model to use for ADDM decisions"
    )
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1",
        description="OpenRouter API base URL"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
```

#### Verification

- [ ] Directory structure created
- [ ] `main.py` runs without errors
- [ ] `config.py` loads environment variables
- [ ] Health check endpoint responds

---

### Step 2: Pydantic Models

**Purpose:** Define data models for requests and responses

**Duration:** 2-3 hours

#### Instructions

Create Pydantic models that match the TypeScript interfaces defined in the integration plan.

#### Code Example: `addm-service/src/models/schemas.py`

```python
"""
Pydantic models for ADDM requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional, Dict
from datetime import datetime


class DecisionRequest(BaseModel):
    """Request model for ADDM decision endpoint"""
    
    content: str = Field(
        ...,
        description="Current response content to evaluate",
        min_length=1
    )
    
    context: str = Field(
        default="",
        description="Previous iteration context (can be empty for first iteration)"
    )
    
    workflow_mode: Literal["research_assembly", "news_analysis"] = Field(
        ...,
        description="Workflow mode for tailored assessment"
    )
    
    iteration: int = Field(
        ...,
        ge=0,
        description="Current iteration number (0-indexed)"
    )
    
    confidence_threshold: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for completion decision"
    )
    
    max_iterations: int = Field(
        default=20,
        ge=1,
        le=20,
        description="Maximum allowed iterations"
    )
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return v


class QualityMetrics(BaseModel):
    """Quality assessment metrics"""
    
    quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall quality score"
    )
    
    completeness_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Completeness assessment"
    )
    
    improvement_potential: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Potential for improvement"
    )


class DecisionResponse(BaseModel):
    """Response model for ADDM decision endpoint"""
    
    decision: Literal["enhance", "research", "complete"] = Field(
        ...,
        description="Ternary decision outcome"
    )
    
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence in the decision"
    )
    
    reaction_time: float = Field(
        ...,
        ge=0.0,
        description="Simulated reaction time in milliseconds"
    )
    
    reasoning: str = Field(
        ...,
        description="Human-readable explanation of the decision"
    )
    
    metrics: QualityMetrics = Field(
        ...,
        description="Quality metrics for the content"
    )
    
    next_prompt: Optional[str] = Field(
        None,
        description="Generated prompt for next iteration (if enhance/research)"
    )
    
    should_summarize: bool = Field(
        default=False,
        description="Whether context exceeds summarization threshold"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Decision timestamp"
    )


class ErrorResponse(BaseModel):
    """Error response model"""
    
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: Optional[Dict] = Field(None, description="Additional error details")
```

#### Verification

- [ ] All models validate correctly
- [ ] Validators work as expected
- [ ] Field constraints are enforced
- [ ] Models match TypeScript interfaces

---

### Step 3: Multi-Alternative DDM Implementation

**Purpose:** Implement the drift-diffusion model for decision simulation

**Duration:** 4-6 hours

#### Instructions

The DDM provides reaction time simulation and confidence scores based on evidence accumulation.

#### Code Example: `addm-service/src/core/ddm.py`

```python
"""
Multi-Alternative Drift-Diffusion Model (DDM)
Simulates decision-making with evidence accumulation
"""
import numpy as np
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


class MultiAlternativeDDM:
    """
    Multi-alternative drift-diffusion model for decision-making
    
    Simulates evidence accumulation across multiple alternatives
    and provides reaction time + confidence scores
    """
    
    def __init__(
        self,
        threshold: float = 1.0,
        noise_sigma: float = 0.1,
        dt: float = 0.001,
        max_time: float = 5.0
    ):
        """
        Initialize DDM
        
        Args:
            threshold: Evidence threshold for decision
            noise_sigma: Noise standard deviation
            dt: Time step for simulation
            max_time: Maximum simulation time in seconds
        """
        self.threshold = threshold
        self.noise_sigma = noise_sigma
        self.dt = dt
        self.max_time = max_time
        self.max_steps = int(max_time / dt)
        
    def simulate(
        self,
        drift_rates: List[float],
        alternative_names: List[str]
    ) -> Tuple[str, float, float]:
        """
        Simulate decision process with evidence accumulation
        
        Args:
            drift_rates: Evidence strength for each alternative (e.g., [0.3, 0.5, 0.2])
            alternative_names: Names of alternatives (e.g., ["enhance", "research", "complete"])
            
        Returns:
            Tuple of (chosen_alternative, reaction_time_ms, confidence)
        """
        if len(drift_rates) != len(alternative_names):
            raise ValueError("drift_rates and alternative_names must have same length")
            
        n_alternatives = len(drift_rates)
        evidence = np.zeros(n_alternatives)
        
        for step in range(self.max_steps):
            # Add drift and noise
            evidence += np.array(drift_rates) * self.dt
            evidence += np.random.normal(0, self.noise_sigma * np.sqrt(self.dt), n_alternatives)
            
            # Check if any alternative reached threshold
            max_evidence = np.max(evidence)
            if max_evidence >= self.threshold:
                chosen_idx = np.argmax(evidence)
                reaction_time_ms = step * self.dt * 1000  # Convert to milliseconds
                
                # Calculate confidence (relative evidence strength)
                evidence_sum = np.sum(np.maximum(evidence, 0))
                confidence = evidence[chosen_idx] / evidence_sum if evidence_sum > 0 else 0.5
                confidence = np.clip(confidence, 0.0, 1.0)
                
                logger.debug(
                    f"DDM decision: {alternative_names[chosen_idx]} "
                    f"(RT: {reaction_time_ms:.1f}ms, conf: {confidence:.2f})"
                )
                
                return alternative_names[chosen_idx], reaction_time_ms, confidence
        
        # Timeout: choose alternative with most evidence
        chosen_idx = np.argmax(evidence)
        reaction_time_ms = self.max_time * 1000
        
        evidence_sum = np.sum(np.maximum(evidence, 0))
        confidence = evidence[chosen_idx] / evidence_sum if evidence_sum > 0 else 0.33
        confidence = np.clip(confidence, 0.0, 1.0)
        
        logger.warning(f"DDM timeout after {self.max_time}s, choosing {alternative_names[chosen_idx]}")
        
        return alternative_names[chosen_idx], reaction_time_ms, confidence
```

#### Verification

- [ ] DDM simulates decisions correctly
- [ ] Reaction times are realistic (50-2000ms)
- [ ] Confidence scores are reasonable (0.0-1.0)
- [ ] Handles edge cases (timeout, equal evidence)

---

### Step 4: Loop Regulator Core Logic

**Purpose:** Implement the main ADDM decision logic

**Duration:** 6-8 hours

#### Instructions

The LoopRegulator orchestrates LLM calls for content assessment and generates decisions.

#### Code Example: `addm-service/src/core/regulator.py`

```python
"""
ADDM Loop Regulator
Core decision-making logic for intelligent loop control
"""
import logging
from typing import Dict, Optional
import httpx
from datetime import datetime

from models.schemas import DecisionRequest, DecisionResponse, QualityMetrics
from core.ddm import MultiAlternativeDDM
from core.config import settings

logger = logging.getLogger(__name__)


class LoopRegulator:
    """
    ADDM Loop Regulator
    
    Analyzes content and context to make ternary decisions:
    - ENHANCE: Improve current response
    - RESEARCH: Gather additional information
    - COMPLETE: Deliver to user
    """
    
    def __init__(self):
        self.ddm = MultiAlternativeDDM(
            threshold=1.0,
            noise_sigma=0.1,
            dt=0.001,
            max_time=2.0
        )
        
        self.client = httpx.AsyncClient(
            base_url=settings.OPENROUTER_BASE_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://addm-service",
                "X-Title": "ADDM Loop Regulator"
            },
            timeout=30.0
        )
    
    async def make_decision(self, request: DecisionRequest) -> DecisionResponse:
        """
        Make ternary decision based on content analysis
        
        Args:
            request: Decision request with content and context
            
        Returns:
            DecisionResponse with decision, confidence, and reasoning
        """
        logger.info(
            f"Making ADDM decision for iteration {request.iteration} "
            f"(mode: {request.workflow_mode})"
        )
        
        # Step 1: Assess content quality
        metrics = await self._assess_content(request)
        
        # Step 2: Generate decision with LLM
        decision_analysis = await self._generate_decision_analysis(request, metrics)
        
        # Step 3: Parse decision and scores
        decision_type, enhancement_score, research_score, complete_score = (
            self._parse_decision_scores(decision_analysis, request)
        )
        
        # Step 4: Simulate DDM with drift rates
        drift_rates = [enhancement_score, research_score, complete_score]
        alternatives = ["enhance", "research", "complete"]
        
        chosen_decision, reaction_time, confidence = self.ddm.simulate(
            drift_rates, alternatives
        )
        
        # Override if max iterations reached
        if request.iteration >= request.max_iterations - 1:
            logger.warning(f"Max iterations ({request.max_iterations}) reached, forcing complete")
            chosen_decision = "complete"
            confidence = 1.0
        
        # Step 5: Generate reasoning and next prompt
        reasoning = self._generate_reasoning(
            chosen_decision, confidence, metrics, decision_analysis
        )
        
        next_prompt = None
        if chosen_decision in ["enhance", "research"]:
            next_prompt = self._generate_next_prompt(
                chosen_decision, request, decision_analysis
            )
        
        # Step 6: Check if context should be summarized
        should_summarize = (
            len(request.context) + len(request.content) 
            > settings.CONTEXT_SUMMARIZATION_THRESHOLD
        )
        
        return DecisionResponse(
            decision=chosen_decision,
            confidence=confidence,
            reaction_time=reaction_time,
            reasoning=reasoning,
            metrics=metrics,
            next_prompt=next_prompt,
            should_summarize=should_summarize,
            timestamp=datetime.utcnow()
        )
    
    async def _assess_content(self, request: DecisionRequest) -> QualityMetrics:
        """Assess content quality using LLM"""
        
        assessment_prompt = self._build_assessment_prompt(request)
        
        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a content quality assessor. Analyze the provided content and return scores."
                        },
                        {
                            "role": "user",
                            "content": assessment_prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500
                }
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse scores from LLM response
            scores = self._parse_quality_scores(content)
            
            logger.debug(f"Quality assessment: {scores}")
            return scores
            
        except Exception as e:
            logger.error(f"Content assessment failed: {e}")
            # Return conservative scores on failure
            return QualityMetrics(
                quality_score=0.5,
                completeness_score=0.5,
                improvement_potential=0.5
            )
    
    def _build_assessment_prompt(self, request: DecisionRequest) -> str:
        """Build prompt for content quality assessment"""
        
        mode_specific_criteria = {
            "research_assembly": """
Assess the content based on:
- Citation density and source quality
- Methodology rigor and reproducibility
- Evidence coverage and comprehensiveness
- Scientific accuracy and clarity
""",
            "news_analysis": """
Assess the content based on:
- Multiple stakeholder perspectives
- Historical context and background
- Impact analysis completeness
- Balanced viewpoint representation
"""
        }
        
        criteria = mode_specific_criteria.get(
            request.workflow_mode,
            "Assess overall quality, completeness, and improvement potential"
        )
        
        return f"""Analyze this content and provide scores (0.0-1.0):

{criteria}

Content to assess:
{request.content[:2000]}...

Provide three scores:
1. quality_score: Overall quality (0.0-1.0)
2. completeness_score: How complete the response is (0.0-1.0)
3. improvement_potential: Potential for improvement (0.0-1.0)

Format your response as:
QUALITY: X.XX
COMPLETENESS: X.XX
IMPROVEMENT: X.XX
"""
    
    def _parse_quality_scores(self, content: str) -> QualityMetrics:
        """Parse quality scores from LLM response"""
        
        try:
            lines = content.strip().split('\n')
            scores = {}
            
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().upper()
                    value = float(value.strip())
                    scores[key] = value
            
            return QualityMetrics(
                quality_score=scores.get('QUALITY', 0.5),
                completeness_score=scores.get('COMPLETENESS', 0.5),
                improvement_potential=scores.get('IMPROVEMENT', 0.5)
            )
        except Exception as e:
            logger.error(f"Failed to parse quality scores: {e}")
            return QualityMetrics(
                quality_score=0.5,
                completeness_score=0.5,
                improvement_potential=0.5
            )
    
    async def _generate_decision_analysis(
        self,
        request: DecisionRequest,
        metrics: QualityMetrics
    ) -> str:
        """Generate decision analysis using LLM"""
        
        decision_prompt = f"""Based on the current iteration ({request.iteration}) and quality metrics:
- Quality Score: {metrics.quality_score:.2f}
- Completeness Score: {metrics.completeness_score:.2f}
- Improvement Potential: {metrics.improvement_potential:.2f}

Should we:
1. ENHANCE: Improve and refine the current response
2. RESEARCH: Gather additional information
3. COMPLETE: Deliver to the user

Provide scores (0.0-1.0) for each option and explain your reasoning.

Content preview:
{request.content[:1000]}...

Format:
ENHANCE: X.XX
RESEARCH: X.XX
COMPLETE: X.XX
REASONING: [explanation]
"""
        
        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an ADDM decision analyzer for loop control."
                        },
                        {
                            "role": "user",
                            "content": decision_prompt
                        }
                    ],
                    "temperature": 0.4,
                    "max_tokens": 800
                }
            )
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Decision analysis failed: {e}")
            return "ENHANCE: 0.3\nRESEARCH: 0.3\nCOMPLETE: 0.4\nREASONING: Default decision due to error"
    
    def _parse_decision_scores(
        self,
        analysis: str,
        request: DecisionRequest
    ) -> tuple[str, float, float, float]:
        """Parse decision scores from LLM analysis"""
        
        try:
            lines = analysis.strip().split('\n')
            scores = {}
            
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().upper()
                    if key in ['ENHANCE', 'RESEARCH', 'COMPLETE']:
                        scores[key] = float(value.strip())
            
            enhance_score = scores.get('ENHANCE', 0.33)
            research_score = scores.get('RESEARCH', 0.33)
            complete_score = scores.get('COMPLETE', 0.33)
            
            # Determine primary decision
            max_score = max(enhance_score, research_score, complete_score)
            if complete_score == max_score:
                decision = "complete"
            elif research_score == max_score:
                decision = "research"
            else:
                decision = "enhance"
            
            return decision, enhance_score, research_score, complete_score
            
        except Exception as e:
            logger.error(f"Failed to parse decision scores: {e}")
            return "complete", 0.33, 0.33, 0.34
    
    def _generate_reasoning(
        self,
        decision: str,
        confidence: float,
        metrics: QualityMetrics,
        analysis: str
    ) -> str:
        """Generate human-readable reasoning"""
        
        reasoning_base = {
            "enhance": f"Continuing to refine response (confidence: {confidence:.2f}). ",
            "research": f"Gathering additional information (confidence: {confidence:.2f}). ",
            "complete": f"Response ready for delivery (confidence: {confidence:.2f}). "
        }
        
        reasoning = reasoning_base.get(decision, "")
        reasoning += f"Quality: {metrics.quality_score:.2f}, "
        reasoning += f"Completeness: {metrics.completeness_score:.2f}. "
        
        # Extract reasoning from analysis
        for line in analysis.split('\n'):
            if line.strip().startswith('REASONING:'):
                reasoning += line.split(':', 1)[1].strip()
                break
        
        return reasoning
    
    def _generate_next_prompt(
        self,
        decision: str,
        request: DecisionRequest,
        analysis: str
    ) -> str:
        """Generate prompt for next iteration"""
        
        if decision == "enhance":
            return f"Enhance and refine the previous response. Focus on improving quality and clarity based on iteration {request.iteration + 1}."
        elif decision == "research":
            return f"Research additional information to complement the previous response. Iteration {request.iteration + 1}: expand on key points."
        else:
            return None
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
```

#### Verification

- [ ] LoopRegulator makes decisions successfully
- [ ] LLM API calls work correctly
- [ ] Quality metrics are assessed
- [ ] Next prompts are generated appropriately
- [ ] Edge cases handled (API failures, parsing errors)

---

### Step 5: API Routes

**Purpose:** Create REST API endpoints for health checks and decisions

**Duration:** 2-3 hours

#### Code Example: `addm-service/src/api/routes.py`

```python
"""
API routes for ADDM service
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict
import logging

from models.schemas import DecisionRequest, DecisionResponse, ErrorResponse
from core.regulator import LoopRegulator

logger = logging.getLogger(__name__)

router = APIRouter()

# Global regulator instance
regulator = LoopRegulator()


@router.post(
    "/decide",
    response_model=DecisionResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def make_decision(request: DecisionRequest) -> DecisionResponse:
    """
    Make ADDM decision based on content analysis
    
    Analyzes the provided content and context to determine if the loop should:
    - **enhance**: Continue improving the current response
    - **research**: Gather additional information
    - **complete**: Deliver to the user
    """
    try:
        logger.info(f"Received decision request for iteration {request.iteration}")
        
        decision = await regulator.make_decision(request)
        
        logger.info(
            f"Decision made: {decision.decision} "
            f"(confidence: {decision.confidence:.2f}, RT: {decision.reaction_time:.1f}ms)"
        )
        
        return decision
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "ValidationError", "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Decision error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "InternalError", "message": "Failed to make decision"}
        )


@router.get("/status")
async def get_status() -> Dict:
    """Get service status and configuration"""
    return {
        "service": "addm-regulator",
        "status": "operational",
        "model": "anthropic/claude-sonnet-4-20250514",
        "max_iterations": 20,
        "default_confidence_threshold": 0.85
    }
```

#### Verification

- [ ] `/api/v1/decide` endpoint accepts POST requests
- [ ] `/api/v1/status` endpoint returns service info
- [ ] Validation errors return 400
- [ ] Server errors return 500
- [ ] Logging captures all requests

---

### Step 6: Docker Containerization

**Purpose:** Package the service in a Docker container

**Duration:** 2-3 hours

#### Code Example: `addm-service/Dockerfile`

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Set Python path
ENV PYTHONPATH=/app/src

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Configuration: `addm-service/docker-compose.yml`

```yaml
version: '3.8'

services:
  addm-service:
    build:
      context: .
      dockerfile: Dockerfile
    
    ports:
      - "8000:8000"
    
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - ENVIRONMENT=development
      - LOG_LEVEL=info
    
    env_file:
      - .env
    
    volumes:
      - ./src:/app/src  # Hot reload for development
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

#### Configuration: `addm-service/requirements.txt`

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
numpy==1.26.3
python-dotenv==1.0.0
```

#### Configuration: `addm-service/.env.example`

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here

# Environment
ENVIRONMENT=development

# Logging
LOG_LEVEL=info

# ADDM Parameters
MAX_ITERATIONS=20
DEFAULT_CONFIDENCE_THRESHOLD=0.85
CONTEXT_SUMMARIZATION_THRESHOLD=32000

# OpenRouter Model
OPENROUTER_MODEL=anthropic/claude-sonnet-4-20250514
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

#### Verification

- [ ] Docker image builds successfully
- [ ] Container starts and runs healthcheck
- [ ] Environment variables loaded correctly
- [ ] API accessible on localhost:8000
- [ ] Hot reload works in development

---

### Step 7: Basic Testing

**Purpose:** Verify the service works end-to-end

**Duration:** 2-3 hours

#### Code Example: `addm-service/tests/test_decision.py`

```python
"""
Basic integration tests for ADDM service
"""
import pytest
import httpx
from src.models.schemas import DecisionRequest


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_decide_endpoint():
    """Test decision endpoint with sample request"""
    
    request_data = {
        "content": "This is a sample response about AI that needs evaluation.",
        "context": "",
        "workflow_mode": "research_assembly",
        "iteration": 0,
        "confidence_threshold": 0.85,
        "max_iterations": 5
    }
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/api/v1/decide", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "decision" in data
        assert data["decision"] in ["enhance", "research", "complete"]
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["reaction_time"] >= 0
        assert "reasoning" in data
        assert "metrics" in data


@pytest.mark.asyncio
async def test_decide_max_iterations():
    """Test that max iterations forces complete"""
    
    request_data = {
        "content": "Sample content",
        "context": "",
        "workflow_mode": "news_analysis",
        "iteration": 19,  # Max iteration
        "confidence_threshold": 0.85,
        "max_iterations": 20
    }
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/api/v1/decide", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["decision"] == "complete"  # Should force complete


@pytest.mark.asyncio
async def test_decide_validation_error():
    """Test validation error handling"""
    
    request_data = {
        "content": "",  # Empty content should fail
        "context": "",
        "workflow_mode": "research_assembly",
        "iteration": 0
    }
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/api/v1/decide", json=request_data)
        assert response.status_code == 422  # Validation error
```

#### Manual Testing

```bash
# Start the service
docker-compose up -d

# Check health
curl http://localhost:8000/health

# Test decision endpoint
curl -X POST http://localhost:8000/api/v1/decide \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test response that needs evaluation.",
    "context": "",
    "workflow_mode": "research_assembly",
    "iteration": 0,
    "confidence_threshold": 0.85,
    "max_iterations": 10
  }'

# Check logs
docker-compose logs -f addm-service
```

#### Verification

- [ ] Health check passes
- [ ] Decision endpoint returns valid responses
- [ ] Max iterations logic works
- [ ] Validation errors handled
- [ ] Logs show request flow

---

## Testing Procedures

### Unit Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
cd addm-service
pytest tests/ -v
```

### Integration Testing

1. Start service: `docker-compose up -d`
2. Run manual curl tests (see above)
3. Verify responses match expected schemas
4. Check logs for errors: `docker-compose logs`

### Load Testing

```bash
# Simple load test with multiple requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/decide \
    -H "Content-Type: application/json" \
    -d @test_request.json &
done
wait
```

---

## Troubleshooting

### Issue 1: Service Won't Start

**Symptoms:** Container exits immediately

**Solutions:**
- Check `.env` file exists with `OPENROUTER_API_KEY`
- Verify Python syntax: `python -m py_compile src/main.py`
- Check Docker logs: `docker-compose logs addm-service`

### Issue 2: OpenRouter API Errors

**Symptoms:** 401 or 403 errors from OpenRouter

**Solutions:**
- Verify API key is correct
- Check API key has credits
- Test API key with curl:
  ```bash
  curl https://openrouter.ai/api/v1/models \
    -H "Authorization: Bearer $OPENROUTER_API_KEY"
  ```

### Issue 3: Decision Timeouts

**Symptoms:** 500 errors or very slow responses

**Solutions:**
- Increase timeout in `regulator.py` (default 30s)
- Check network connectivity to OpenRouter
- Reduce content length in test requests

### Issue 4: Quality Score Parsing Fails

**Symptoms:** Default scores (0.5) always returned

**Solutions:**
- Check LLM response format in logs
- Adjust `_parse_quality_scores()` regex
- Add more robust parsing fallbacks

---

## Next Steps

✅ **Phase 1 Complete when:**
- Health check responds successfully
- Decision endpoint works with test data
- Docker container runs stably
- API documentation accessible at `/docs`
- Basic tests pass

**Proceed to:** Phase 2 - TypeScript Integration Layer

---

**Phase 1 Character Count:** ~40,000
