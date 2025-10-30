import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StreamingMessage } from './StreamingMessage';
import { ConversationHeader } from './ConversationHeader';
import { useCoordination } from '@/hooks/useCoordination';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useParallelChat } from '@/hooks/useParallelChat';
import { useChatStore } from '@/stores/chat-store';
import { HybridSwarmOrchestrator } from '@/core/hybrid-orchestrator';
import { ContentAnalyzer } from '@/core/content-analyzer';
import { useSystemStore } from '@/stores/system-store';
import { useADDMConfig, useADDMServiceHealth } from '@/stores/ADDMStore';
import { useADDMLoop } from '@/hooks/useADDMLoop';
import { useADDMServiceHealth as useADDMHealthHook } from '@/hooks/useADDMServiceHealth';
import { analyzePrompt } from '@/core/prompt-analyzer';
import { useSystemStats } from '@/hooks/useSystemStats';
import { DEFAULT_PARALLEL_TIMEOUT } from '@/utils/constants';
import { SwarmTraceData } from '@/core/types';
import { SpecialistsStore } from '@/storage/specialists-store';
import { ApproachesStore } from '@/storage/approaches-store';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Cpu } from 'lucide-react';
import { formatSpecialistNameForDisplay } from '@/utils/specialist-names';
import { ADDMProgressIndicator } from '../ADDMProgressIndicator';

/**
 * Main chat interface component
 * 
 * Handles the full coordination -> streaming -> feedback loop
 */
export function ChatInterface() {
  const { messages, addMessage, updateLastMessage, updateMessage } = useChatStore();
  const config = useSystemStore(state => state.config);
  const addmConfig = useADDMConfig();
  const { isHealthy, isEnabled } = useADDMHealthHook();
  const { mutateAsync: getCoordination, isPending: isCoordinating } = useCoordination();
  const { executeWithStreaming, chunks, isStreaming, reset } = useStreamingChat();
  const { executeParallel, isExecuting: isParallelExecuting, reset: resetParallel } = useParallelChat();
  const { data: systemStats } = useSystemStats();
  const { toast } = useToast();

  // ADDM loop hook
  const {
    isLoading: isADDMLoading,
    currentIteration,
    lastDecision,
    executeADDMLoop,
    cancelLoop
  } = useADDMLoop({
    onIterationComplete: (iteration, decision) => {
      toast({
        title: `ADDM Iteration ${iteration + 1}`,
        description: `Decision: ${decision.decision} (${(decision.confidence * 100).toFixed(0)}%)`,
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'ADDM Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const [orchestrator] = useState(() => new HybridSwarmOrchestrator(config));

  const handleSendMessage = async (prompt: string) => {
    // Add user message
    addMessage({
      id: nanoid(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    try {
      // Branch: ADDM -> Parallel -> Sequential execution
      if (addmConfig.enabled) {
        // Check service health first
        if (!isHealthy) {
          throw new Error('ADDM service is not available. Please check service health.');
        }
        await handleADDMExecution(prompt);
      } else if (config.parallelConfig.enabled) {
        await handleParallelExecution(prompt);
      } else {
        await handleSequentialExecution(prompt);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      addMessage({
        id: nanoid(),
        role: 'assistant',
        content: `❌ Error: ${errorMsg}`,
        timestamp: new Date(),
      });

      toast({
        title: 'Execution Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle sequential execution (original flow)
   */
  const handleSequentialExecution = async (prompt: string) => {
    // Layer 1-3: Get coordination decision
    const coordination = await getCoordination(prompt);

      // Add placeholder for assistant message
      const assistantId = nanoid();
      addMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        coordination,
        isStreaming: true,
      });

      // Execute with streaming and measure time
      const startTime = Date.now();
      const content = await executeWithStreaming(coordination, prompt);
      const executionTimeMs = Date.now() - startTime;

      // Assess quality
      const quality = assessQuality(content);

      // Record execution for learning with rich data
      await orchestrator.recordExecutionResult({
        taskId: coordination.taskId,
        specialistId: coordination.specialistId,
        approachId: coordination.approachId,
        quality,
        success: quality >= 0.7,
        taskContext: coordination.taskContext,
        content,
        executionTimeMs,
        qualityTarget: coordination.qualityTarget,
      });

      // Get specialist and approach details for trace
      const specialistsStore = new SpecialistsStore();
      const approachesStore = new ApproachesStore();
      
      const specialist = await specialistsStore.getSpecialist(coordination.specialistId);
      const approach = await approachesStore.getApproach(coordination.approachId);

      // Build swarm trace data
      const swarmTrace: SwarmTraceData = {
        specialistId: coordination.specialistId,
        specialistStats: specialist ? {
          totalExecutions: specialist.totalExecutions,
          successRate: specialist.totalExecutions > 0 
            ? specialist.successCount / specialist.totalExecutions 
            : 0,
          avgQuality: specialist.averageQuality,
          specializationStrength: specialist.specializationStrength,
        } : {
          totalExecutions: 0,
          successRate: 0,
          avgQuality: 0,
          specializationStrength: 0,
        },
        approachId: coordination.approachId,
        approachName: approach?.name || 'Unknown',
        approachStats: approach ? {
          usageCount: approach.performanceMetrics.usageCount,
          avgQuality: approach.performanceMetrics.avgQuality,
          trend: approach.performanceMetrics.recentQualityTrend,
        } : {
          usageCount: 0,
          avgQuality: 0,
          trend: 'new',
        },
        qualityTarget: coordination.qualityTarget,
        actualQuality: quality,
        swarmCounts: {
          totalSpecialists: systemStats?.specialistCount || 0,
          activeSpecialists: systemStats?.activeSpecialistCount || 0,
          totalApproaches: systemStats?.approachCount || 0,
          activeApproaches: systemStats?.activeApproachCount || 0,
          totalSignals: systemStats?.signalCount || 0,
        },
        waveCounts: {
          executionCount: systemStats?.executionCount || 0,
          patternDiscoveryReady: systemStats?.patternDiscoveryReady || false,
        },
        taskContext: {
          complexity: coordination.taskContext.complexity,
          primaryDomain: Object.keys(coordination.taskContext.domainWeights)
            .reduce((a, b) => 
              coordination.taskContext.domainWeights[a] > coordination.taskContext.domainWeights[b] ? a : b
            ),
          keywords: coordination.taskContext.keywords,
          outputType: coordination.taskContext.outputType,
        },
      };

      // Update final message with content and swarm trace
      updateLastMessage(content);
      updateMessage(assistantId, {
        swarmTrace,
        quality,
        isStreaming: false,
      });

      // Show quality feedback
      if (quality >= 0.8) {
        const displayName = specialist 
          ? formatSpecialistNameForDisplay(coordination.specialistId, specialist)
          : coordination.specialistId;
        toast({
          title: 'High Quality Response',
          description: `Quality: ${(quality * 100).toFixed(0)}% • Specialist: ${displayName}`,
        });
      }

      reset();
  };

  /**
   * Handle parallel execution (NEW)
   */
  const handleParallelExecution = async (prompt: string) => {
    // Analyze prompt to get task context
    const taskContext = await analyzePrompt(prompt);
    
    // Get parallel coordination (top N specialists)
    const parallelCoordination = await orchestrator.getParallelCoordination(
      taskContext,
      config.parallelConfig?.parallelCount ?? 3
    );

    // Add placeholder for assistant message
    const assistantId = nanoid();
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      coordination: parallelCoordination,
      isStreaming: true,
    });

    // Execute all specialists in parallel
    const parallelResult = await executeParallel(
      parallelCoordination,
      prompt,
      config.parallelConfig?.timeoutMs ?? DEFAULT_PARALLEL_TIMEOUT
    );

    // Get winner's content
    const { selectedResult, results, selectionReason, totalExecutionTimeMs, parallelCount } = parallelResult;

    // Record ALL results for distributed learning with execution time
    for (const result of results) {
      await orchestrator.recordExecutionResult({
        taskId: parallelCoordination.taskId,
        specialistId: result.specialistId,
        approachId: result.approachId,
        quality: result.quality,
        success: result.success,
        taskContext: parallelCoordination.taskContext,
        content: result.content,
        executionTimeMs: result.executionTimeMs,
        qualityTarget: parallelCoordination.qualityTarget,
      });
    }

    // Get specialist and approach details for trace
    const specialistsStore = new SpecialistsStore();
    const approachesStore = new ApproachesStore();
    
    const specialist = await specialistsStore.getSpecialist(selectedResult.specialistId);
    const approach = await approachesStore.getApproach(selectedResult.approachId);

    // Build swarm trace data with parallel execution info
    const swarmTrace: SwarmTraceData = {
      specialistId: selectedResult.specialistId,
      specialistStats: specialist ? {
        totalExecutions: specialist.totalExecutions,
        successRate: specialist.totalExecutions > 0 
          ? specialist.successCount / specialist.totalExecutions 
          : 0,
        avgQuality: specialist.averageQuality,
        specializationStrength: specialist.specializationStrength,
      } : {
        totalExecutions: 0,
        successRate: 0,
        avgQuality: 0,
        specializationStrength: 0,
      },
      approachId: selectedResult.approachId,
      approachName: approach?.name || 'Unknown',
      approachStats: approach ? {
        usageCount: approach.performanceMetrics.usageCount,
        avgQuality: approach.performanceMetrics.avgQuality,
        trend: approach.performanceMetrics.recentQualityTrend,
      } : {
        usageCount: 0,
        avgQuality: 0,
        trend: 'new',
      },
      qualityTarget: parallelCoordination.qualityTarget,
      actualQuality: selectedResult.quality,
      swarmCounts: {
        totalSpecialists: systemStats?.specialistCount || 0,
        activeSpecialists: systemStats?.activeSpecialistCount || 0,
        totalApproaches: systemStats?.approachCount || 0,
        activeApproaches: systemStats?.activeApproachCount || 0,
        totalSignals: systemStats?.signalCount || 0,
      },
      waveCounts: {
        executionCount: systemStats?.executionCount || 0,
        patternDiscoveryReady: systemStats?.patternDiscoveryReady || false,
      },
      taskContext: {
        complexity: parallelCoordination.taskContext.complexity,
        primaryDomain: Object.keys(parallelCoordination.taskContext.domainWeights)
          .reduce((a, b) => 
            parallelCoordination.taskContext.domainWeights[a] > parallelCoordination.taskContext.domainWeights[b] ? a : b
          ),
        keywords: parallelCoordination.taskContext.keywords,
        outputType: parallelCoordination.taskContext.outputType,
      },
      parallelExecution: {
        enabled: true,
        parallelCount,
        allResults: results.map(r => ({
          specialistId: r.specialistId,
          quality: r.quality,
          executionTimeMs: r.executionTimeMs,
        })),
        selectionReason,
      },
    };

    // Update final message with winner's content and swarm trace
    updateLastMessage(selectedResult.content);
    updateMessage(assistantId, {
      swarmTrace,
      quality: selectedResult.quality,
      isStreaming: false,
    });

    // Show parallel execution feedback
    const winnerDisplayName = specialist 
      ? formatSpecialistNameForDisplay(selectedResult.specialistId, specialist)
      : selectedResult.specialistId;
    toast({
      title: `Parallel Execution Complete (${parallelCount} specialists)`,
      description: `Winner: ${winnerDisplayName} (${(selectedResult.quality * 100).toFixed(0)}% quality) • ${selectionReason}`,
    });

    resetParallel();
  };

  /**
   * Handle ADDM execution (NEW)
   */
  const handleADDMExecution = async (prompt: string) => {
    const sessionId = nanoid();

    try {
      const result = await executeADDMLoop(prompt, sessionId, nanoid()); // User ID from context

      // Get specialist and approach details for trace
      const specialistsStore = new SpecialistsStore();
      const approachesStore = new ApproachesStore();

      const specialist = await specialistsStore.getSpecialist('addm-final');
      const approach = await approachesStore.getApproach('addm-final');

      // Build swarm trace data with ADDM execution info
      const swarmTrace: SwarmTraceData = {
        specialistId: 'addm-final',
        specialistStats: specialist ? {
          totalExecutions: specialist.totalExecutions,
          successRate: specialist.totalExecutions > 0
            ? specialist.successCount / specialist.totalExecutions
            : 0,
          avgQuality: specialist.averageQuality,
          specializationStrength: specialist.specializationStrength,
        } : {
          totalExecutions: 0,
          successRate: 0,
          avgQuality: 0,
          specializationStrength: 0,
        },
        approachId: 'addm-final',
        approachName: 'ADDM Integrated Response',
        approachStats: approach ? {
          usageCount: approach.performanceMetrics.usageCount,
          avgQuality: approach.performanceMetrics.avgQuality,
          trend: approach.performanceMetrics.recentQualityTrend,
        } : {
          usageCount: 0,
          avgQuality: 0,
          trend: 'new',
        },
        qualityTarget: addmConfig.confidenceThreshold,
        actualQuality: 0.85, // ADDM handles quality internally
        swarmCounts: {
          totalSpecialists: systemStats?.specialistCount || 0,
          activeSpecialists: systemStats?.activeSpecialistCount || 0,
          totalApproaches: systemStats?.approachCount || 0,
          activeApproaches: systemStats?.activeApproachCount || 0,
          totalSignals: systemStats?.signalCount || 0,
        },
        waveCounts: {
          executionCount: systemStats?.executionCount || 0,
          patternDiscoveryReady: systemStats?.patternDiscoveryReady || false,
        },
        taskContext: {
          complexity: 0.8, // High complexity due to ADDM loop
          primaryDomain: 'research_assembly', // Default ADDM mode
          keywords: ['addm', 'intelligent', 'loop', 'regulator'],
          outputType: 'comprehensive_response',
        },
      };

      // Add final message with ADDM metadata
      addMessage({
        id: nanoid(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        metadata: {
          type: 'addm',
          iterations: result.iterations,
          finalDecision: result.finalDecision,
          totalExecutionTime: result.totalExecutionTime,
          reasoning: result.decisionHistory?.[result.decisionHistory.length - 1]?.reasoning,
        },
        swarmTrace,
      });

      // Success toast
      toast({
        title: 'ADDM Loop Completed',
        description: `${result.iterations} iterations • ${(result.totalExecutionTime / 1000).toFixed(1)}s • Final: ${result.finalDecision}`,
        duration: 5000,
      });

    } catch (error) {
      // Error will be caught by handleSendMessage wrapper
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ConversationHeader />
      <MessageList messages={messages} />

      {/* ADDM Progress Indicator */}
      <ADDMProgressIndicator
        loopState={{
          currentIteration,
          maxIterations: addmConfig.maxIterations,
          lastDecision,
          isLoading: isADDMLoading,
          aggregatedContent: '',
          error: null,
        }}
        isExecuting={isADDMLoading}
      />

      {isStreaming && chunks.length > 0 && (
        <StreamingMessage chunks={chunks} />
      )}

      {isCoordinating && (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Coordinating specialist and approach...
        </div>
      )}

      {isADDMLoading && (
        <div className="flex items-center justify-center p-4 text-purple-600">
          <Cpu className="w-4 h-4 animate-spin mr-2" />
          ADDM Loop executing iteration {currentIteration + 1}...
        </div>
      )}

      <MessageInput
        onSend={handleSendMessage}
        disabled={isStreaming || isCoordinating || isParallelExecuting || isADDMLoading}
      />
    </div>
  );
}

/**
 * Assess response quality using content analysis
 */
function assessQuality(content: string): number {
  const analyzer = new ContentAnalyzer();
  const features = analyzer.analyzeContent(content);

  let score = 0.5; // Base score

  // Structure quality
  if (features.sectionCount >= 3) score += 0.1;
  if (features.hasCodeBlocks) score += 0.15;
  if (features.hasBullets || features.hasNumberedList) score += 0.1;

  // Content depth
  if (features.totalLength > 500) score += 0.1;
  if (features.totalLength > 1000) score += 0.05;

  // Balance
  if (features.explanationRatio > 0.4 && features.explanationRatio < 0.8) score += 0.1;

  return Math.min(score, 1.0);
}
