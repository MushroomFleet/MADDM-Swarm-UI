import { useMutation } from '@tanstack/react-query';
import { HybridSwarmOrchestrator } from '@/core/hybrid-orchestrator';
import { analyzePrompt } from '@/core/prompt-analyzer';
import { useSystemStore } from '@/stores/system-store';

/**
 * Hook for getting coordination decisions
 * 
 * Takes user prompt and returns specialist + approach selection
 */
export function useCoordination() {
  const config = useSystemStore(state => state.config);

  return useMutation({
    mutationFn: async (prompt: string) => {
      const orchestrator = new HybridSwarmOrchestrator(config);
      const taskContext = await analyzePrompt(prompt);
      const coordination = await orchestrator.getCoordination(taskContext);
      
      // Clean up orchestrator resources
      orchestrator.dispose();
      
      return coordination;
    },
  });
}
