import { useQuery } from '@tanstack/react-query';
import { SpecialistsStore } from '@/storage/specialists-store';
import { ApproachesStore } from '@/storage/approaches-store';
import { ExecutionHistoryStore } from '@/storage/history-store';
import { SignalsStore } from '@/storage/signals-store';
import { SystemStats } from '@/core/types';

/**
 * Hook for fetching system statistics
 * 
 * Returns counts and metrics from all storage layers
 */
export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const specialistsStore = new SpecialistsStore();
      const approachesStore = new ApproachesStore();
      const historyStore = new ExecutionHistoryStore();
      const signalsStore = new SignalsStore();

      // Get counts
      const specialistCount = await specialistsStore.count();
      const { active: activeApproaches, inactive: inactiveApproaches } = 
        await approachesStore.countByStatus();
      const executionCount = await historyStore.count();
      const signalCount = await signalsStore.count();

      // Get execution stats
      const execStats = await historyStore.getStatistics();

      // Get top performers
      const topSpecialists = await specialistsStore.getTopPerformers(5);
      const topApproaches = await approachesStore.getTopPerformers(5);

      // Get active specialists
      const activeSpecialists = await specialistsStore.getActiveSpecialists(7);

      // Get recent signals
      const recentSignals = await signalsStore.getRecentSignals(30);

      return {
        specialistCount,
        activeSpecialistCount: activeSpecialists.length,
        approachCount: activeApproaches + inactiveApproaches,
        activeApproachCount: activeApproaches,
        signalCount,
        executionCount,
        avgQuality: execStats.avgQuality,
        patternDiscoveryReady: executionCount >= 10,
        specialists: topSpecialists.map(s => ({
          id: s.id,
          executions: s.totalExecutions,
          successRate: s.totalExecutions > 0 ? s.successCount / s.totalExecutions : 0,
          avgQuality: s.averageQuality,
          specialization: s.specializationStrength,
        })),
        approaches: topApproaches.map(a => ({
          id: a.id,
          name: a.name,
          usageCount: a.performanceMetrics.usageCount,
          avgQuality: a.performanceMetrics.avgQuality,
          trend: a.performanceMetrics.recentQualityTrend,
        })),
        signals: recentSignals.slice(0, 10).map(s => ({
          taskId: s.taskId,
          approach: s.approach,
          strength: s.strength,
          age: Math.floor((Date.now() - s.timestamp) / 1000),
        })),
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
