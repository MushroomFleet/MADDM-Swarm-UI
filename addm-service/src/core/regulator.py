"""
ADDM Loop Regulator
Core decision-making logic for intelligent loop control
"""
import logging
from typing import Tuple, List, Dict, Any

from core.ddm import MultiAlternativeDDM

logger = logging.getLogger(__name__)


class SingleDecisionRegulator:
    """
    ADDM Decision Regulator for single API calls

    Makes individual enhance/research/complete decisions
    based on content analysis for the Swarm integration
    """

    def __init__(self):
        self.ddm = MultiAlternativeDDM(
            threshold=1.0,
            noise_sigma=0.1,
            dt=0.001,
            max_time=2.0
        )

    def make_decision(
        self,
        content: str,
        context: str,
        workflow_mode: str,
        iteration: int,
        confidence_threshold: float,
        max_iterations: int
    ) -> Tuple[str, float, float, str, str, dict]:
        """
        Make a single ADDM decision based on content analysis

        Args:
            content: Current response content to evaluate
            context: Previous iteration context
            workflow_mode: "research_assembly" or "news_analysis"
            iteration: Current iteration number
            confidence_threshold: Minimum confidence to allow completion
            max_iterations: Maximum allowed iterations

        Returns:
            Tuple of (decision, confidence, reaction_time, reasoning, next_prompt, refinement_strategy)
        """
        logger.info(f"Making ADDM decision for iteration {iteration} (mode: {workflow_mode})")

        # Step 1: Assess content quality and generate evidence scores
        enhance_score, research_score, complete_score = self._assess_content_quality(
            content, context, workflow_mode, iteration, confidence_threshold
        )

        # Step 2: Adjust scores based on iteration context
        enhance_score, research_score, complete_score = self._adjust_scores_for_context(
            enhance_score, research_score, complete_score, iteration, max_iterations
        )

        # Step 3: Run DDM simulation
        alternatives = ["enhance", "research", "complete"]
        drift_rates = [enhance_score, research_score, complete_score]

        chosen_decision, reaction_time, confidence = self.ddm.simulate(
            drift_rates, alternatives
        )

        # Step 4: Generate reasoning
        reasoning = self._generate_reasoning(
            chosen_decision, confidence, workflow_mode, iteration
        )

        # Step 5: Generate next prompt (if continuing)
        next_prompt = self._generate_next_prompt(
            chosen_decision, content, workflow_mode
        ) if chosen_decision != "complete" else None

        # Step 6: Generate structured refinement strategy
        refinement_strategy = self._generate_refinement_strategy(
            chosen_decision, content, workflow_mode, iteration
        ) if chosen_decision != "complete" else None

        logger.info(
            f"Decision: {chosen_decision} (confidence: {confidence:.2f}, "
            f"RT: {reaction_time:.1f}ms), refinement_strategy: {type(refinement_strategy).__name__ if refinement_strategy else 'None'}"
        )

        # Debug: Ensure refinement strategy is properly constructed
        if refinement_strategy:
            logger.info(f"Refinement strategy: {refinement_strategy.get('type', 'NoType')} for iteration {refinement_strategy.get('iteration', 'NoIter')}")

        return chosen_decision, confidence, reaction_time, reasoning, next_prompt, refinement_strategy

    def _assess_content_quality(
        self,
        content: str,
        context: str,
        workflow_mode: str,
        iteration: int,
        confidence_threshold: float
    ) -> Tuple[float, float, float]:
        """
        Assess content quality and generate evidence scores for DDM

        Returns evidence scores for (enhance, research, complete)
        """

        # Base scores
        base_enhance = 0.4
        base_research = 0.3
        base_complete = 0.3

        content_length = len(content)
        context_length = len(context)

        # Content length affects completion tendency
        if content_length < 200:  # Too short, needs enhancement
            base_enhance += 0.3
            base_complete -= 0.2
        elif content_length > 1000:  # Substantial content
            base_complete += 0.2
            base_enhance -= 0.1

        # High confidence threshold increases tendency to complete early
        if confidence_threshold > 0.9:
            base_complete += 0.2
            base_enhance -= 0.1

        # Research mode prioritizes depth
        if workflow_mode == "research_assembly":
            if iteration < 3:  # Early iterations favor research
                base_research += 0.3
                base_enhance += 0.2
                base_complete -= 0.3
            else:  # Later iterations focus on completion
                base_research -= 0.1
                base_enhance -= 0.1
                base_complete += 0.4
        else:  # news_analysis
            if iteration < 2:  # News needs quick perspective checks
                base_research += 0.2
                base_enhance += 0.2
                base_complete -= 0.2
            else:  # News can complete faster
                base_research -= 0.2
                base_enhance -= 0.1
                base_complete += 0.5

        # Ensure scores stay in valid range
        enhance_score = max(0.0, min(1.0, base_enhance))
        research_score = max(0.0, min(1.0, base_research))
        complete_score = max(0.0, min(1.0, base_complete))

        return enhance_score, research_score, complete_score

    def _adjust_scores_for_context(
        self,
        enhance_score: float,
        research_score: float,
        complete_score: float,
        iteration: int,
        max_iterations: int
    ) -> Tuple[float, float, float]:
        """
        Adjust evidence scores based on iteration context
        """

        # Prevent infinite loops by forcing complete near max iterations
        if iteration >= max_iterations - 2:
            complete_score = max(complete_score, 0.8)
            enhance_score *= 0.3
            research_score *= 0.3

        # First iteration rarely completes
        if iteration == 0:
            complete_score *= 0.2

        return enhance_score, research_score, complete_score

    def _generate_reasoning(
        self,
        decision: str,
        confidence: float,
        workflow_mode: str,
        iteration: int
    ) -> str:
        """
        Generate human-readable reasoning for the decision
        """

        base_reasoning = f"Iteration {iteration + 1}: "

        if decision == "enhance":
            base_reasoning += "Content needs enhancement and refinement. "
        elif decision == "research":
            base_reasoning += "Additional research is required. "
        else:  # complete
            base_reasoning += "Content quality is sufficient. "

        base_reasoning += f"Decision confidence: {confidence:.2f}"

        return base_reasoning

    def _generate_refinement_strategy(
        self,
        decision: str,
        content: str,
        workflow_mode: str,
        iteration: int
    ) -> dict:
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

    def _generate_next_prompt(
        self,
        decision: str,
        content: str,
        workflow_mode: str
    ) -> str:
        """
        Generate the next prompt for continuation (DEPRECATED - kept for compatibility)
        """

        if decision == "enhance":
            return "Enhance and refine the previous response. Focus on improving clarity, structure, and depth."

        elif decision == "research":
            if workflow_mode == "research_assembly":
                return "Conduct additional research to support and expand on the previous findings. Add more evidence and examples."
            else:
                return "Add additional perspectives and background to provide more comprehensive coverage."

        return None
