/**
 * useADDMLoop Hook
 * React hook for ADDM loop execution
 */
import { useState, useCallback, useRef } from 'react';
import { useADDMStore, useADDMConfig } from '../stores';
import { SwarmADDMBridge } from '../services/SwarmADDMBridge';
import { useOrchestrator } from './useOrchestrator';
import type {
  ADDMDecisionResponse,
  ADDMExecutionResult,
} from '../types/addm.types';

export interface ADDMLoopOptions {
  onIterationComplete?: (iteration: number, decision: ADDMDecisionResponse) => void;
  onContentUpdate?: (content: string, iteration: number) => void;
  onError?: (error: Error) => void;
}

export interface ADDMLoopState {
  isLoading: boolean;
  currentIteration: number;
  maxIterations: number;
  lastDecision: ADDMDecisionResponse | null;
  aggregatedContent: string;
  error: string | null;
}

export const useADDMLoop = (options: ADDMLoopOptions = {}) => {
  const config = useADDMConfig();
  const { setCurrentLoop, setIsExecuting } = useADDMStore();
  const orchestrator = useOrchestrator();

  const [state, setState] = useState<ADDMLoopState>({
    isLoading: false,
    currentIteration: 0,
    maxIterations: config.maxIterations,
    lastDecision: null,
    aggregatedContent: '',
    error: null,
  });

  const bridgeRef = useRef<SwarmADDMBridge | null>(null);
  const abortRef = useRef<boolean>(false);

  // Initialize bridge with orchestrator (execution handled internally)
  if (!bridgeRef.current) {
    bridgeRef.current = new SwarmADDMBridge(config, orchestrator);
  }

  const executeADDMLoop = useCallback(
    async (prompt: string, sessionId: string, userId: string): Promise<ADDMExecutionResult> => {
      abortRef.current = false;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        aggregatedContent: '',
        currentIteration: 0,
      }));

      setIsExecuting(true);

      try {
        const result = await bridgeRef.current!.executeADDMLoop({
          initialPrompt: prompt,
          sessionId,
          userId,
          onProgress: (iteration, decision) => {
            if (abortRef.current) return;

            setState((prev) => ({
              ...prev,
              currentIteration: iteration + 1,
              lastDecision: decision,
            }));

            options.onIterationComplete?.(iteration, decision);
          },
          onContent: (content, iteration) => {
            if (abortRef.current) return;

            setState((prev) => ({
              ...prev,
              aggregatedContent: prev.aggregatedContent + '\n\n' + content,
            }));

            options.onContentUpdate?.(content, iteration);
          },
        });

        setState((prev) => ({
          ...prev,
          isLoading: false,
          aggregatedContent: result.content,
        }));

        setCurrentLoop(null);
        setIsExecuting(false);

        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        setIsExecuting(false);
        options.onError?.(error as Error);

        throw error;
      }
    },
    [config, orchestrator, options, setCurrentLoop, setIsExecuting]
  );

  const cancelLoop = useCallback(() => {
    abortRef.current = true;
    bridgeRef.current?.cancelLoop();

    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: 'Loop cancelled by user',
    }));

    setIsExecuting(false);
  }, [setIsExecuting]);

  return {
    ...state,
    executeADDMLoop,
    cancelLoop,
  };
};
