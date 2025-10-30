"""
API routes for ADDM service
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict
import logging

from models.schemas import DecisionRequest, DecisionResponse, ErrorResponse, QualityMetrics
from core.regulator import SingleDecisionRegulator
from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Global regulator instance
regulator = SingleDecisionRegulator()


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

        decision, confidence, reaction_time, reasoning, next_prompt, refinement_strategy = regulator.make_decision(
            content=request.content,
            context=request.context,
            workflow_mode=request.workflow_mode,
            iteration=request.iteration,
            confidence_threshold=request.confidence_threshold,
            max_iterations=request.max_iterations
        )

        # Check if context should be summarized (placeholder - would need more logic)
        should_summarize = len(request.context) + len(request.content) > settings.CONTEXT_SUMMARIZATION_THRESHOLD

        # Create mock quality metrics (would be enhanced in production)
        metrics = QualityMetrics(
            quality_score=confidence,  # Using confidence as quality proxy
            completeness_score=0.7 if decision == "complete" else 0.5,
            improvement_potential=0.3 if decision == "complete" else 0.7
        )

        # Debug output
        logger.info(f"refinement_strategy returned: {refinement_strategy}")
        logger.info(f"decision type: {type(decision)}, confidence: {type(confidence)}")

        response = DecisionResponse(
            decision=decision,
            confidence=confidence,
            reaction_time=reaction_time,
            reasoning=reasoning,
            metrics=metrics,
            refinement_strategy=refinement_strategy,
            next_prompt=next_prompt,
            should_summarize=should_summarize
        )

        # Force FastAPI to include the field even if None
        response_dict = response.dict()
        logger.info(f"Response dict keys: {list(response_dict.keys())}")
        logger.info(f"refinement_strategy in response: {response_dict.get('refinement_strategy', 'MISSING')}")

        logger.info(
            f"Decision made: {decision} "
            f"(confidence: {confidence:.2f}, RT: {reaction_time:.1f}ms)"
        )

        return response

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
        "version": "1.0.0",
        "model": settings.OPENROUTER_MODEL,
        "max_iterations": settings.MAX_ITERATIONS,
        "default_confidence_threshold": settings.DEFAULT_CONFIDENCE_THRESHOLD
    }
