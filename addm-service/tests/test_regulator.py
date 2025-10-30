"""
Unit tests for ADDM Loop Regulator
Tests core decision-making logic
"""
import pytest
from unittest.mock import MagicMock, patch
import numpy as np

from core.regulator import SingleDecisionRegulator
from models.schemas import DecisionRequest


@pytest.fixture
def regulator():
    """Fixture for SingleDecisionRegulator instance"""
    return SingleDecisionRegulator()


@pytest.fixture
def sample_decision_request():
    """Fixture for a typical decision request"""
    return DecisionRequest(
        content="This is a test response about machine learning algorithms.",
        context="Previous iterations discussed basic concepts.",
        workflow_mode="research_assembly",
        iteration=1,
        confidence_threshold=0.85,
        max_iterations=10
    )


class TestSingleDecisionRegulator:
    """Test suite for SingleDecisionRegulator"""

    def test_init_creates_ddm_instance(self, regulator):
        """Test that regulator initializes with DDM instance"""
        assert hasattr(regulator, 'ddm')
        assert regulator.ddm is not None

    def test_make_decision_returns_valid_structure(self, regulator, sample_decision_request):
        """Test that make_decision returns properly structured tuple"""
        decision, confidence, reaction_time, reasoning, next_prompt = regulator.make_decision(
            content=sample_decision_request.content,
            context=sample_decision_request.context,
            workflow_mode=sample_decision_request.workflow_mode,
            iteration=sample_decision_request.iteration,
            confidence_threshold=sample_decision_request.confidence_threshold,
            max_iterations=sample_decision_request.max_iterations
        )

        # Validate return types
        assert isinstance(decision, str)
        assert isinstance(confidence, float)
        assert isinstance(reaction_time, float)
        assert isinstance(reasoning, str)

        # Validate value ranges
        assert decision in ["enhance", "research", "complete"]
        assert 0.0 <= confidence <= 1.0
        assert reaction_time >= 0.0

        # Validate reasoning structure
        assert "Iteration" in reasoning
        assert f"{confidence:.2f}" in reasoning

        # Next prompt should be None for complete, string otherwise
        if decision == "complete":
            assert next_prompt is None
        else:
            assert isinstance(next_prompt, str)

    @pytest.mark.parametrize("workflow_mode", ["research_assembly", "news_analysis"])
    def test_make_decision_handles_workflow_modes(self, regulator, workflow_mode):
        """Test decision making for different workflow modes"""
        decision, confidence, reaction_time, reasoning, next_prompt = regulator.make_decision(
            content="Test content",
            context="",
            workflow_mode=workflow_mode,
            iteration=1,
            confidence_threshold=0.85,
            max_iterations=10
        )

        assert decision in ["enhance", "research", "complete"]
        assert workflow_mode in reasoning

    @pytest.mark.parametrize("iteration,max_iterations,expected_force_complete",
                             [(18, 20, True), (10, 20, False), (0, 20, False)])
    def test_iteration_context_adjustments(self, regulator, iteration, max_iterations, expected_force_complete):
        """Test that iteration context properly adjusts scores"""
        # Mock DDM to return specific values for testing score adjustments
        regulator.ddm.simulate = MagicMock(return_value=("enhance", 150.0, 0.8))

        regulator.make_decision(
            content="x" * 100,  # Short content
            context="",
            workflow_mode="research_assembly",
            iteration=iteration,
            confidence_threshold=0.85,
            max_iterations=max_iterations
        )

        # Verify DDM was called
        regulator.ddm.simulate.assert_called_once()
        drift_rates = regulator.ddm.simulate.call_args[0][0]

        if expected_force_complete:
            # Complete score should be boosted near max iterations
            assert drift_rates[2] > drift_rates[0]  # complete > enhance
            assert drift_rates[2] > drift_rates[1]  # complete > research

    def test_content_length_assessment_short_content(self, regulator):
        """Test that very short content favors enhancement"""
        regulator.ddm.simulate = MagicMock(return_value=("enhance", 150.0, 0.8))

        regulator.make_decision(
            content="Short",  # Very short content
            context="",
            workflow_mode="research_assembly",
            iteration=1,
            confidence_threshold=0.85,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]
        # Enhancement should have highest score for short content
        assert drift_rates[0] > drift_rates[1]  # enhance > research
        assert drift_rates[0] > drift_rates[2]  # enhance > complete

    def test_content_length_assessment_long_content(self, regulator):
        """Test that long content favors completion"""
        regulator.ddm.simulate = MagicMock(return_value=("complete", 150.0, 0.8))

        long_content = "x" * 1500  # Very long content

        regulator.make_decision(
            content=long_content,
            context="",
            workflow_mode="research_assembly",
            iteration=1,
            confidence_threshold=0.85,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]
        # Complete should have highest score for long content
        assert drift_rates[2] >= drift_rates[0]  # complete >= enhance
        assert drift_rates[2] >= drift_rates[1]  # complete >= research

    @pytest.mark.parametrize("confidence_threshold,expected_complete_boost",
                             [(0.95, True), (0.75, False)])
    def test_confidence_threshold_effects(self, regulator, confidence_threshold, expected_complete_boost):
        """Test that high confidence threshold favors completion"""
        regulator.ddm.simulate = MagicMock(return_value=("complete", 150.0, 0.8))

        regulator.make_decision(
            content="Test content",
            context="",
            workflow_mode="research_assembly",
            iteration=1,
            confidence_threshold=confidence_threshold,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]

        if expected_complete_boost:
            # High threshold should boost complete score
            assert drift_rates[2] > drift_rates[0]  # complete > enhance

    def test_workflow_mode_research_assembly_early(self, regulator):
        """Test research_assembly mode in early iterations"""
        regulator.ddm.simulate = MagicMock(return_value=("research", 150.0, 0.8))

        regulator.make_decision(
            content="Test content",
            context="",
            workflow_mode="research_assembly",
            iteration=0,  # Early iteration
            confidence_threshold=0.85,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]
        # Research should be favored in early iterations for research mode
        assert drift_rates[1] >= drift_rates[0]  # research >= enhance
        assert drift_rates[1] >= drift_rates[2]  # research >= complete

    def test_workflow_mode_news_analysis_late(self, regulator):
        """Test news_analysis mode in late iterations"""
        regulator.ddm.simulate = MagicMock(return_value=("complete", 150.0, 0.8))

        regulator.make_decision(
            content="Test news content",
            context="",
            workflow_mode="news_analysis",
            iteration=3,  # Later iteration
            confidence_threshold=0.85,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]
        # Complete should be favored in later iterations for news mode
        assert drift_rates[2] >= drift_rates[0]  # complete >= enhance
        assert drift_rates[2] >= drift_rates[1]  # complete >= research

    def test_first_iteration_prevents_completion(self, regulator):
        """Test that first iteration rarely allows completion"""
        regulator.ddm.simulate = MagicMock(return_value=("enhance", 150.0, 0.8))

        regulator.make_decision(
            content="Perfect content that should complete",
            context="",
            workflow_mode="research_assembly",
            iteration=0,  # First iteration
            confidence_threshold=0.85,
            max_iterations=10
        )

        drift_rates = regulator.ddm.simulate.call_args[0][0]
        # Complete score should be reduced on first iteration
        assert drift_rates[2] < drift_rates[0]  # complete < enhance

    def test_generate_reasoning_formats_correctly(self, regulator):
        """Test that reasoning is properly formatted"""
        reasoning = regulator._generate_reasoning("enhance", 0.87, "research_assembly", 2)

        assert "Iteration 3:" in reasoning
        assert "enhancement and refinement" in reasoning
        assert "0.87" in reasoning

    def test_generate_next_prompt_enhance(self, regulator):
        """Test next prompt generation for enhance decision"""
        prompt = regulator._generate_next_prompt("enhance", "Test content", "research_assembly")

        assert "Enhance and refine" in prompt
        assert "clarity, structure, and depth" in prompt

    def test_generate_next_prompt_research(self, regulator):
        """Test next prompt generation for research decision"""
        prompt = regulator._generate_next_prompt("research", "Test content", "research_assembly")

        assert "Conduct additional research" in prompt
        assert "evidence and examples" in prompt

    def test_generate_next_prompt_research_news_mode(self, regulator):
        """Test next prompt generation for research in news mode"""
        prompt = regulator._generate_next_prompt("research", "Test news", "news_analysis")

        assert "perspectives and background" in prompt

    def test_generate_next_prompt_complete(self, regulator):
        """Test that complete decision returns no next prompt"""
        prompt = regulator._generate_next_prompt("complete", "Test content", "research_assembly")

        assert prompt is None

    @pytest.mark.parametrize("decision,reaction_time,confidence",
                             [("enhance", 150.0, 0.8), ("research", 200.0, 0.9), ("complete", 100.0, 0.95)])
    def test_ddm_integration(self, regulator, decision, reaction_time, confidence):
        """Test integration with actual DDM simulation"""
        # Mock DDM with specific return values
        regulator.ddm.simulate = MagicMock(return_value=(decision, reaction_time, confidence))

        result_decision, result_confidence, result_rt, reasoning, prompt = regulator.make_decision(
            content="Test",
            context="",
            workflow_mode="research_assembly",
            iteration=1,
            confidence_threshold=0.85,
            max_iterations=10
        )

        assert result_decision == decision
        assert result_confidence == confidence
        assert result_rt == reaction_time

    def test_assess_content_quality_range_validation(self, regulator):
        """Test that content quality assessment keeps scores in valid range"""
        enhance, research, complete = regulator._assess_content_quality(
            content="x" * 10000,  # Extremely long
            context="",
            workflow_mode="research_assembly",
            iteration=10,
            confidence_threshold=0.95
        )

        assert 0.0 <= enhance <= 1.0
        assert 0.0 <= research <= 1.0
        assert 0.0 <= complete <= 1.0

    def test_adjust_scores_for_context_range_validation(self, regulator):
        """Test that score adjustments keep values in valid range"""
        enhance, research, complete = regulator._adjust_scores_for_context(
            enhance_score=0.5,
            research_score=0.5,
            complete_score=0.5,
            iteration=50,  # Extreme iteration
            max_iterations=50
        )

        assert 0.0 <= enhance <= 1.0
        assert 0.0 <= research <= 1.0
        assert 0.0 <= complete <= 1.0
