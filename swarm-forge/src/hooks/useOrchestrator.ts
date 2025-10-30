/**
 * Hook for access to the Hybrid Swarm Orchestrator
 * Maintains a singleton orchestrator instance per component
 */
import { useMemo } from 'react';
import { useSystemStore } from '@/stores/system-store';
import { HybridSwarmOrchestrator } from '@/core/hybrid-orchestrator';

/**
 * Hook that provides access to the shared orchestrator instance
 *
 * Uses system config from store for consistent behavior
 */
export function useOrchestrator() {
  const config = useSystemStore(state => state.config);

  // Create orchestrator instance with current config
  // Memoized to avoid recreating on every render
  const orchestrator = useMemo(() => {
    return new HybridSwarmOrchestrator({
      vigilanceThreshold: config.vigilanceThreshold,
      decayRate: config.decayRate,
      patternDiscoveryThreshold: config.patternDiscoveryThreshold,
    });
  }, [
    config.vigilanceThreshold,
    config.decayRate,
    config.patternDiscoveryThreshold,
  ]);

  return orchestrator;
}
