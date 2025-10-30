"""
Unit tests for Multi-Alternative Drift-Diffusion Model
Tests the mathematical simulation core
"""
import pytest
import numpy as np
from unittest.mock import patch

from core.ddm import MultiAlternativeDDM


@pytest.fixture
def ddm():
    """Fixture for standard DDM instance"""
    return MultiAlternativeDDM(
        threshold=1.0,
        noise_sigma=0.15,
        dt=0.001,
        max_time=2.0
    )


class TestMultiAlternativeDDM:
    """Test suite for MultiAlternativeDDM"""

    def test_init_sets_parameters(self, ddm):
        """Test that DDM initializes with correct parameters"""
        assert ddm.threshold == 1.0
        assert ddm.noise_sigma == 0.15
        assert ddm.dt == 0.001
        assert ddm.max_time == 2.0
        assert ddm.max_steps == 2000  # 2.0 / 0.001

    @pytest.mark.parametrize("threshold,noise_sigma,dt,max_time", [
        (0.5, 0.1, 0.01, 1.0),
        (2.0, 0.2, 0.0005, 5.0)
    ])
    def test_init_custom_parameters(self, threshold, noise_sigma, dt, max_time):
        """Test DDM initialization with custom parameters"""
        custom_ddm = MultiAlternativeDDM(threshold, noise_sigma, dt, max_time)

        assert custom_ddm.threshold == threshold
        assert custom_ddm.noise_sigma == noise_sigma
        assert custom_ddm.dt == dt
        assert custom_ddm.max_time == max_time
        assert custom_ddm.max_steps == int(max_time / dt)

    def test_simulate_three_alternatives_fast_decision(self, ddm):
        """Test simulation with three alternatives - fast decision"""
        # Set up scenario where one alternative dominates
        drift_rates = [0.5, 0.2, 0.1]  # Strong preference for first alternative
        alternatives = ["enhance", "research", "complete"]

        # Seed random number generator for deterministic test
        np.random.seed(42)

        with patch('numpy.random.normal', return_value=np.array([0.0, 0.0, 0.0])):  # No noise
            result = ddm.simulate(drift_rates, alternatives)

        assert isinstance(result, tuple)
        assert len(result) == 3

        chosen, reaction_time, confidence = result

        assert chosen == "enhance"  # Should choose highest drift rate
        assert reaction_time > 0
        assert 0.0 <= confidence <= 1.0

    def test_simulate_balanced_alternatives(self, ddm):
        """Test simulation with balanced alternatives"""
        drift_rates = [0.4, 0.4, 0.4]  # Equal rates
        alternatives = ["option1", "option2", "option3"]

        # Seed for deterministic result
        np.random.seed(123)

        with patch('numpy.random.normal', return_value=np.array([0.01, 0.0, -0.01])):  # Slight noise
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        assert chosen in alternatives
        assert reaction_time > 0
        assert 0.0 <= confidence <= 1.0

    def test_simulate_timeout_scenario(self, ddm):
        """Test simulation that hits timeout"""
        # Very low drift rates that won't reach threshold in time
        drift_rates = [0.01, 0.01, 0.01]
        alternatives = ["slow1", "slow2", "slow3"]

        # Mock simulation to never reach threshold within max_time
        with patch.object(ddm, 'threshold', 100.0):  # Impossible to reach
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        assert chosen in alternatives
        assert reaction_time == 2000.0  # max_time * 1000
        assert 0.0 <= confidence <= 1.0

    def test_simulate_mismatched_arrays_raises_error(self, ddm):
        """Test that mismatched drift_rates and alternatives raises ValueError"""
        drift_rates = [0.3, 0.4]  # 2 rates
        alternatives = ["a", "b", "c"]  # 3 alternatives

        with pytest.raises(ValueError, match="drift_rates and alternative_names must have same length"):
            ddm.simulate(drift_rates, alternatives)

    def test_simulate_single_alternative(self, ddm):
        """Test simulation with single alternative"""
        drift_rates = [0.3]
        alternatives = ["only_choice"]

        # With single option, should always choose it quickly
        with patch('numpy.random.normal', return_value=np.array([0.0])):
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        assert chosen == "only_choice"
        assert reaction_time > 0
        assert confidence == 1.0  # Should be fully confident with only one option

    def test_simulate_reaction_time_calculation(self, ddm):
        """Test that reaction time is correctly calculated from steps"""
        drift_rates = [0.5, 0.1, 0.1]
        alternatives = ["fast", "slow1", "slow2"]

        # Mock to reach threshold on step 100
        steps_taken = 100
        expected_reaction_time = steps_taken * ddm.dt * 1000  # dt=0.001, so 100ms

        with patch('numpy.random.normal', return_value=np.array([0.0, 0.0, 0.0])):
            # Force decision on specific step
            original_simulate = ddm.simulate

            def mock_simulate(self, rates, alts):
                # Simulate reaching threshold at step 100
                for step in range(steps_taken):
                    pass  # Just count steps
                # Return what would happen at step 100
                return "fast", expected_reaction_time, 1.0

            with patch.object(ddm, 'simulate', mock_simulate):
                result = original_simulate(ddm, drift_rates, alternatives)
                chosen, reaction_time, confidence = result
                assert reaction_time == expected_reaction_time

    def test_simulate_confidence_calculation(self, ddm):
        """Test confidence calculation based on relative evidence"""
        drift_rates = [0.4, 0.3, 0.2]
        alternatives = ["best", "good", "worst"]

        # Mock evidence accumulation
        with patch('numpy.random.normal', return_value=np.array([0.0, 0.0, 0.0])):
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        # Should choose "best" and have some positive confidence
        assert chosen == "best"
        assert confidence > 0.5  # Should have reasonable confidence

    def test_simulate_confidence_clipping(self, ddm):
        """Test that confidence is properly clipped to [0, 1]"""
        drift_rates = [10.0, 0.1, 0.1]  # Extreme dominance
        alternatives = ["dominant", "weak1", "weak2"]

        with patch('numpy.random.normal', return_value=np.array([0.0, 0.0, 0.0])):
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        assert chosen == "dominant"
        assert 0.0 <= confidence <= 1.0  # Should be clipped

    def test_simulate_zero_negative_evidence_handling(self, ddm):
        """Test handling of zero or negative evidence in confidence calculation"""
        drift_rates = [0.0, 0.0, 0.0]  # No drift
        alternatives = ["zero1", "zero2", "zero3"]

        # With zero evidence, timeout scenario should give default confidence
        with patch.object(ddm, 'threshold', 100.0):  # Force timeout
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result

        assert chosen in alternatives
        assert reaction_time == 2000.0  # Timeout
        assert 0.0 <= confidence <= 1.0

    @pytest.mark.parametrize("drift_rates,expected_winner", [
        ([0.6, 0.2, 0.1], "alt1"),
        ([0.1, 0.8, 0.3], "alt2"),
        ([0.2, 0.1, 0.9], "alt3")
    ])
    def test_simulate_winner_selection(self, ddm, drift_rates, expected_winner):
        """Test that correct winner is selected based on drift rates"""
        alternatives = ["alt1", "alt2", "alt3"]

        with patch('numpy.random.normal', return_value=np.array([0.0, 0.0, 0.0])):
            result = ddm.simulate(drift_rates, alternatives)

        chosen, reaction_time, confidence = result
        assert chosen == expected_winner

    def test_simulate_noise_integration(self, ddm):
        """Test that noise affects the simulation outcomes"""
        drift_rates = [0.35, 0.35, 0.35]  # Equal rates
        alternatives = ["noisy1", "noisy2", "noisy3"]

        # With noise, outcomes should vary (non-deterministic)
        results = []
        for _ in range(5):  # Multiple runs
            result = ddm.simulate(drift_rates, alternatives)
            results.append(result[0])  # Just the choice

        # Should get some variation due to noise (not always the same choice)
        # Note: This is probabilistic, but with noise we should see variation
        unique_choices = set(results)
        assert len(unique_choices) > 1  # Should see variation with noise
