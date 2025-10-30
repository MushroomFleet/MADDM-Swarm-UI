#!/usr/bin/env python3
"""
Simple test version of ADDM service
Combines everything in one file to sidestep import issues
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import logging
from typing import Tuple
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class DecisionRequest(BaseModel):
    content: str
    context: str = ""
    workflow_mode: str = "research_assembly"
    iteration: int = 0
    confidence_threshold: float = 0.85
    max_iterations: int = 10

class QualityMetrics(BaseModel):
    quality_score: float
    completeness_score: float
    improvement_potential: float

class DecisionResponse(BaseModel):
    decision: str
    confidence: float
    reaction_time: float
    reasoning: str
    metrics: QualityMetrics
    next_prompt: str | None = None
    should_summarize: bool = False

# DDM Implementation (simplified)
class MultiAlternativeDDM:
    def __init__(self, threshold: float = 1.0, noise_sigma: float = 0.1, dt: float = 0.001, max_time: float = 2.0):
        self.threshold = threshold
        self.noise_sigma = noise_sigma
        self.dt = dt
        self.max_time = max_time
        self.max_steps = int(max_time / dt)

    def simulate(self, drift_rates: list[float], alternatives: list[str]) -> Tuple[str, float, float]:
        if len(drift_rates) != len(alternatives):
            raise ValueError("drift_rates and alternatives must have same length")

        n_alternatives = len(drift_rates)
        evidence = np.zeros(n_alternatives)

        for step in range(self.max_steps):
            evidence += np.array(drift_rates) * self.dt
            evidence += np.random.normal(0, self.noise_sigma * np.sqrt(self.dt), n_alternatives)

            max_evidence = np.max(evidence)
            if max_evidence >= self.threshold:
                chosen_idx = np.argmax(evidence)
                reaction_time = step * self.dt * 1000

                evidence_sum = np.sum(np.maximum(evidence, 0))
                confidence = evidence[chosen_idx] / evidence_sum if evidence_sum > 0 else 0.5
                confidence = np.clip(confidence, 0.0, 1.0)

                return alternatives[chosen_idx], reaction_time, confidence

        # Timeout: choose largest evidence
        chosen_idx = np.argmax(evidence)
        reaction_time = self.max_time * 1000

        evidence_sum = np.sum(np.maximum(evidence, 0))
        confidence = evidence[chosen_idx] / evidence_sum if evidence_sum > 0 else 0.33
        confidence = np.clip(confidence, 0.0, 1.0)

        return alternatives[chosen_idx], reaction_time, confidence

# Decision regulator
class SingleDecisionRegulator:
    def __init__(self):
        self.ddm = MultiAlternativeDDM(
            threshold=1.0,
            noise_sigma=0.1,
            dt=0.001,
            max_time=2.0
        )

    def make_decision(self, content: str, context: str, workflow_mode: str, iteration: int, confidence_threshold: float, max_iterations: int) -> Tuple[str, float, float, str, str]:
        logger.info(f"Making ADDM decision for iteration {iteration} (mode: {workflow_mode})")

        # Generate evidence scores based on content analysis
        enhance_score, research_score, complete_score = self._assess_content_quality(content, context, workflow_mode, iteration, confidence_threshold)

        # Adjust for iteration context
        enhance_score, research_score, complete_score = self._adjust_scores_for_context(enhance_score, research_score, complete_score, iteration, max_iterations)

        # Run DDM
        alternatives = ["enhance", "research", "complete"]
        drift_rates = [enhance_score, research_score, complete_score]

        chosen_decision, reaction_time, confidence = self.ddm.simulate(drift_rates, alternatives)

        # Generate responses
        reasoning = self._generate_reasoning(chosen_decision, confidence, workflow_mode, iteration)
        next_prompt = self._generate_next_prompt(chosen_decision, content, workflow_mode) if chosen_decision != "complete" else None

        return chosen_decision, confidence, reaction_time, reasoning, next_prompt

    def _assess_content_quality(self, content: str, context: str, workflow_mode: str, iteration: int, confidence_threshold: float) -> Tuple[float, float, float]:
        # Simple content-based scoring
        content_length = len(content)

        base_enhance = 0.4
        base_research = 0.3
        base_complete = 0.3

        if content_length < 200:
            base_enhance += 0.3
        elif content_length > 1000:
            base_complete += 0.2

        # Workflow mode adjustments
        if workflow_mode == "research_assembly":
            if iteration < 2:
                base_research += 0.3
                base_complete -= 0.2
        else:  # news_analysis
            if iteration >= 2:
                base_complete += 0.4

        return base_enhance, base_research, base_complete

    def _adjust_scores_for_context(self, enhance_score: float, research_score: float, complete_score: float, iteration: int, max_iterations: int) -> Tuple[float, float, float]:
        # Force completion near max iterations
        if iteration >= max_iterations - 1:
            complete_score = max(complete_score, 0.9)
            enhance_score *= 0.2
            research_score *= 0.2

        return enhance_score, research_score, complete_score

    def _generate_reasoning(self, decision: str, confidence: float, workflow_mode: str, iteration: int) -> str:
        reasoning_map = {
            "enhance": "Content needs enhancement and refinement.",
            "research": "Additional research is required.",
            "complete": "Content quality is sufficient."
        }
        return f"Iteration {iteration + 1}: {reasoning_map.get(decision, 'Decision made')} (confidence: {confidence:.2f})"

    def _generate_next_prompt(self, decision: str, content: str, workflow_mode: str) -> str:
        if decision == "enhance":
            return "Enhance and refine the previous response. Focus on improving clarity, structure, and depth."
        elif decision == "research":
            if workflow_mode == "research_assembly":
                return "Conduct additional research to support and expand on the previous findings."
            else:
                return "Add additional perspectives and background information."
        return None

# FastAPI app
app = FastAPI(
    title="ADDM Loop Regulator Service",
    description="Agentic Drift-Diffusion Model for intelligent loop control",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global regulator instance
regulator = SingleDecisionRegulator()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "addm-regulator", "version": "1.0.0"}

@app.post("/api/v1/decide")
async def make_decision(request: DecisionRequest) -> DecisionResponse:
    try:
        logger.info(f"Decision request for iteration {request.iteration}")

        decision, confidence, reaction_time, reasoning, next_prompt = regulator.make_decision(
            content=request.content,
            context=request.context,
            workflow_mode=request.workflow_mode,
            iteration=request.iteration,
            confidence_threshold=request.confidence_threshold,
            max_iterations=request.max_iterations
        )

        # Mock metrics
        metrics = QualityMetrics(
            quality_score=confidence,
            completeness_score=0.7 if decision == "complete" else 0.5,
            improvement_potential=0.3 if decision == "complete" else 0.7
        )

        response = DecisionResponse(
            decision=decision,
            confidence=confidence,
            reaction_time=reaction_time,
            reasoning=reasoning,
            metrics=metrics,
            next_prompt=next_prompt,
            should_summarize=(len(request.context) + len(request.content)) > 32000
        )

        logger.info(f"Decision: {decision} (confidence: {confidence:.2f})")
        return response

    except Exception as e:
        logger.error(f"Decision error: {e}")
        raise

@app.get("/api/v1/status")
async def get_status():
    return {
        "service": "addm-regulator",
        "status": "operational",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("test_service:app", host="0.0.0.0", port=8000, reload=True)
