import { useState, useCallback } from 'react';
import { OpenRouterClient } from '@/api/openrouter-client';
import { CoordinationResult, ParallelCoordinationResult, ParallelExecutionResult, SpecialistExecutionResult, ContentFeatures } from '@/core/types';
import { useApiKey } from './useApiKey';
import { useSystemStore } from '@/stores/system-store';
import { ContentAnalyzer } from '@/core/content-analyzer';
import { DEFAULT_PARALLEL_TIMEOUT } from '@/utils/constants';
import { formatSpecialistNameForDisplay } from '@/utils/specialist-names';
import { SpecialistsStore } from '@/storage/specialists-store';

/**
 * Hook for parallel specialist execution
 * 
 * Executes N specialists concurrently and selects best result via quality voting.
 */
export function useParallelChat() {
  const { apiKey } = useApiKey();
  const getEffectiveModel = useSystemStore(state => state.getEffectiveModel);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentAnalyzer = new ContentAnalyzer();

  /**
   * Estimate quality from content features
   */
  const estimateQualityFromFeatures = (features: ContentFeatures): number => {
    let score = 0.5;

    // Length factor (prefer 500-5000 chars)
    if (features.totalLength > 500) score += 0.1;
    if (features.totalLength > 1000) score += 0.1;
    if (features.totalLength > 10000) score -= 0.1; // Too long

    // Structure factor
    if (features.sectionCount >= 3) score += 0.15;
    if (features.hasCodeBlocks) score += 0.1;
    if (features.hasBullets || features.hasNumberedList) score += 0.05;

    // Balance factor
    if (features.explanationRatio > 0.4 && features.explanationRatio < 0.8) score += 0.1;

    return Math.max(0, Math.min(1, score));
  };

  /**
   * Execute single specialist with streaming
   */
  const executeSingleSpecialist = useCallback(
    async (
      coordination: CoordinationResult,
      prompt: string,
      timeoutMs: number
    ): Promise<SpecialistExecutionResult> => {
      const startTime = Date.now();

      // Validate API key first
      if (!apiKey || apiKey.trim() === '') {
        const specialistsStore = new SpecialistsStore();
        const specialist = await specialistsStore.getSpecialist(coordination.specialistId);
        const displayName = specialist 
          ? formatSpecialistNameForDisplay(coordination.specialistId, specialist)
          : coordination.specialistId;
        console.error(`❌ Specialist ${displayName} failed: API key not configured`);
        return {
          specialistId: coordination.specialistId,
          approachId: coordination.approachId,
          content: '',
          quality: 0,
          executionTimeMs: Date.now() - startTime,
          success: false,
          error: 'API key not configured',
        };
      }

      try {
        // Enforce valid timeout (default to 60s if invalid)
        const effectiveTimeout =
          Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_PARALLEL_TIMEOUT;

        // Create timeout promise with 50s warning
        const warningTimeout = setTimeout(async () => {
          const specialistsStore = new SpecialistsStore();
          const specialist = await specialistsStore.getSpecialist(coordination.specialistId);
          const displayName = specialist 
            ? formatSpecialistNameForDisplay(coordination.specialistId, specialist)
            : coordination.specialistId;
          console.warn(`⚠️ Specialist ${displayName} still executing after 50s...`);
        }, 50000);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            clearTimeout(warningTimeout);
            reject(new Error('Execution timeout'));
          }, effectiveTimeout);
        });

        // Execute with streaming
        const executionPromise = (async () => {
          const effectiveModel = getEffectiveModel();
          const client = new OpenRouterClient(apiKey!, { model: effectiveModel });
          const systemPrompt = client.buildSystemPrompt(coordination.approachMetadata);
          const stream = client.streamChat([{ role: 'user', content: prompt }], systemPrompt);

          const allChunks: string[] = [];
          for await (const chunk of stream) {
            allChunks.push(chunk);
          }

          return allChunks.join('');
        })();

        // Race between execution and timeout
        const content = await Promise.race([executionPromise, timeoutPromise]);
        clearTimeout(warningTimeout);
        const executionTime = Date.now() - startTime;

        // Analyze content quality
        const features = contentAnalyzer.analyzeContent(content);
        const quality = estimateQualityFromFeatures(features);

        return {
          specialistId: coordination.specialistId,
          approachId: coordination.approachId,
          content,
          quality,
          executionTimeMs: executionTime,
          success: true,
        };
      } catch (err) {
        const executionTime = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : 'Execution failed';
        const specialistsStore = new SpecialistsStore();
        const specialist = await specialistsStore.getSpecialist(coordination.specialistId);
        const displayName = specialist 
          ? formatSpecialistNameForDisplay(coordination.specialistId, specialist)
          : coordination.specialistId;
        console.error(`❌ Specialist ${displayName} failed after ${executionTime}ms:`, {
          name: err instanceof Error ? err.name : 'Unknown',
          message: errorMsg,
          stack: err instanceof Error ? err.stack : undefined,
        });

        return {
          specialistId: coordination.specialistId,
          approachId: coordination.approachId,
          content: '',
          quality: 0,
          executionTimeMs: executionTime,
          success: false,
          error: errorMsg,
        };
      }
    },
    [apiKey, getEffectiveModel, contentAnalyzer, estimateQualityFromFeatures]
  );

  /**
   * Execute N specialists in parallel
   */
  const executeParallel = useCallback(
    async (
      coordination: ParallelCoordinationResult,
      prompt: string,
      timeoutMs: number
    ): Promise<ParallelExecutionResult> => {
      if (!apiKey) throw new Error('API key not set');

      setIsExecuting(true);
      setError(null);

      const batchStartTime = Date.now();

      try {
        // Enforce valid timeout (default to 60s if invalid)
        const effectiveTimeout =
          Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_PARALLEL_TIMEOUT;

        // Build array of all coordinations (primary + alternatives)
        const allCoordinations: CoordinationResult[] = [
          coordination,
          ...(coordination.alternativeSpecialists?.map(alt => ({
            taskId: coordination.taskId,
            specialistId: alt.specialistId,
            approachId: coordination.approachId,
            qualityTarget: coordination.qualityTarget,
            taskContext: coordination.taskContext,
          })) || []),
        ];

        // Cold-start improvement: replicate primary if we have fewer than requested
        const requestedCount = coordination.taskContext.estimatedDuration ? 3 : 3; // Default to 3
        if (allCoordinations.length < requestedCount) {
          const needed = requestedCount - allCoordinations.length;
          console.log(`   🔄 Cold-start: replicating primary specialist ${needed} times`);
          
          for (let i = 0; i < needed; i++) {
            allCoordinations.push(coordination);
          }
        }

        console.log(`\n⚡ Executing ${allCoordinations.length} specialists in parallel`);

        // Execute all specialists concurrently
        const results = await Promise.all(
          allCoordinations.map(coord => 
            executeSingleSpecialist(coord, prompt, effectiveTimeout)
          )
        );

        const totalTime = Date.now() - batchStartTime;

        console.log(`\n✅ Parallel execution complete (${totalTime}ms)`);
        const specialistsStore = new SpecialistsStore();
        for (const r of results) {
          const specialist = await specialistsStore.getSpecialist(r.specialistId);
          const displayName = specialist 
            ? formatSpecialistNameForDisplay(r.specialistId, specialist)
            : r.specialistId;
          console.log(
            `   - ${displayName}: quality=${r.quality.toFixed(2)} time=${r.executionTimeMs}ms success=${r.success}`
          );
        }

        // Select best result
        const { bestResult, reason } = selectBestResult(results);
        
        const winnerSpecialist = await specialistsStore.getSpecialist(bestResult.specialistId);
        const winnerDisplayName = winnerSpecialist 
          ? formatSpecialistNameForDisplay(bestResult.specialistId, winnerSpecialist)
          : bestResult.specialistId;

        console.log(`\n🏆 Selected winner: ${winnerDisplayName} (${reason})`);

        return {
          results,
          selectedResult: bestResult,
          selectionReason: reason,
          totalExecutionTimeMs: totalTime,
          parallelCount: results.length,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Parallel execution failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsExecuting(false);
      }
    },
    [apiKey, executeSingleSpecialist]
  );

  /**
   * Select best result via quality voting
   * 
   * Strategy:
   * 1. Filter successful results
   * 2. Sort by quality descending
   * 3. Return highest quality result
   */
  const selectBestResult = (
    results: SpecialistExecutionResult[]
  ): { bestResult: SpecialistExecutionResult; reason: string } => {
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      // All failed - return first result (will show error)
      return {
        bestResult: results[0],
        reason: 'All specialists failed - showing first result',
      };
    }

    // Sort by quality descending
    successfulResults.sort((a, b) => b.quality - a.quality);

    const best = successfulResults[0];
    return {
      bestResult: best,
      reason: `Highest quality score: ${best.quality.toFixed(2)}`,
    };
  };

  const reset = useCallback(() => {
    setIsExecuting(false);
    setError(null);
  }, []);

  return {
    executeParallel,
    isExecuting,
    error,
    reset,
  };
}
