"""
Pydantic models for ADDM requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional, Dict, List, Any
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


class RefinementStrategy(BaseModel):
    """Structured refinement strategy to replace raw prompt strings"""
    type: Literal["enhance", "research"] = Field(
        ...,
        description="'enhance' or 'research'"
    )

    focus_areas: List[str] = Field(
        ...,
        description="Areas to focus refinement on"
    )

    constraints: List[str] = Field(
        ...,
        description="Constraints to maintain during refinement"
    )

    target_improvements: Optional[List[str]] = Field(
        None,
        description="Specific improvements needed"
    )

    research_directions: Optional[List[str]] = Field(
        None,
        description="Research directions to pursue (research mode only)"
    )

    iteration: int = Field(
        ...,
        description="Current iteration number"
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

    # NEW: Structured strategy replaces raw prompt
    refinement_strategy: Optional[RefinementStrategy] = Field(
        None,
        description="Structured refinement strategy (only for enhance/research decisions)"
    )

    # DEPRECATED: Keep for backward compatibility, remove in next major version
    next_prompt: Optional[str] = Field(
        None,
        description="Generated prompt for next iteration (if enhance/research) - DEPRECATED: Use refinement_strategy instead",
        deprecated=True
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
