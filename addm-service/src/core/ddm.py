"""
Multi-Alternative Drift-Diffusion Model (DDM)
Simulates decision-making with evidence accumulation
"""
import numpy as np
from typing import Tuple, List, Literal
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
        noise_sigma: float = 0.15,
        dt: float = 0.001,
        max_time: float = 2.0
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
