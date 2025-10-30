import { useMutation } from '@tanstack/react-query';
import { PatternAnalyzer } from '@/core/pattern-analyzer';
import { ApproachEvolution } from '@/core/approach-evolution';
import { DynamicApproachManager } from '@/core/dynamic-approaches';
import { ApproachesStore } from '@/storage/approaches-store';
import { useToast } from '@/hooks/use-toast';
import { useSystemStore } from '@/stores/system-store';

/**
 * Hook for triggering pattern discovery
 * 
 * Analyzes execution history and creates new approaches from patterns
 */
export function usePatternDiscovery() {
  const { toast } = useToast();
  const patternConfig = useSystemStore(state => state.patternDiscoveryConfig);

  return useMutation({
    mutationFn: async () => {
      const analyzer = new PatternAnalyzer();
      const manager = new DynamicApproachManager();
      const evolution = new ApproachEvolution(manager);
      const approachesStore = new ApproachesStore();

      console.log(`\n🔍 Pattern Discovery with config:`, patternConfig);

      // First attempt with user config
      let clusters = await analyzer.discoverPatterns(patternConfig);

      // Adaptive fallback: relax thresholds if no clusters found
      if (clusters.length === 0) {
        console.log(`   ⚠️ No clusters with current config, trying adaptive fallback...`);
        
        // Attempt 2: Relax by 0.1
        const relaxed1 = {
          minQuality: Math.max(0.5, patternConfig.minQuality - 0.1),
          minClusterSize: Math.max(3, patternConfig.minClusterSize - 1),
          similarityThreshold: Math.max(0.4, patternConfig.similarityThreshold - 0.1),
        };
        console.log(`   🔄 Attempt 2:`, relaxed1);
        clusters = await analyzer.discoverPatterns(relaxed1);

        // Attempt 3: Relax further if still no clusters
        if (clusters.length === 0) {
          const relaxed2 = {
            minQuality: Math.max(0.5, patternConfig.minQuality - 0.2),
            minClusterSize: Math.max(3, patternConfig.minClusterSize - 2),
            similarityThreshold: Math.max(0.4, patternConfig.similarityThreshold - 0.2),
          };
          console.log(`   🔄 Attempt 3:`, relaxed2);
          clusters = await analyzer.discoverPatterns(relaxed2);
        }
      }

      if (clusters.length === 0) {
        console.log(`   ❌ No patterns discovered even with relaxed thresholds`);
        return {
          discovered: 0,
          novel: 0,
          created: 0,
        };
      }

      console.log(`   ✅ Discovered ${clusters.length} clusters`);

      // Get existing approaches for novelty check
      const existingApproaches = await approachesStore.getAllApproaches();

      let novelCount = 0;
      let createdCount = 0;

      for (const cluster of clusters) {
        // Check novelty
        const isNovel = await analyzer.checkNovelty(cluster, existingApproaches, 0.85);

        if (!isNovel) continue;
        novelCount++;

        // Extract pattern signature and style
        const signature = await analyzer.extractPatternSignature(cluster);
        const style = await analyzer.extractStyleCharacteristics(cluster);

        // Create approach
        const approach = await evolution.createApproachFromCluster(cluster, signature, style);

        if (approach) {
          await manager.createApproach(approach);
          createdCount++;
        }
      }

      return {
        discovered: clusters.length,
        novel: novelCount,
        created: createdCount,
      };
    },
    onSuccess: (data) => {
      if (data.created > 0) {
        toast({
          title: 'Pattern Discovery Complete',
          description: `Discovered ${data.discovered} clusters • ${data.novel} novel • Created ${data.created} new approaches`,
        });
      } else if (data.discovered > 0) {
        toast({
          title: 'Patterns Found',
          description: `Discovered ${data.discovered} clusters but all similar to existing approaches`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'No Patterns Discovered',
          description: 'Try lowering thresholds in settings or executing more tasks',
          variant: 'default',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Pattern Discovery Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
