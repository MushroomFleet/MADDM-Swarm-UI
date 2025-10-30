/**
 * ADDM Progress Indicator
 * Shows current iteration and decision status
 */
import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ADDMDecisionResponse } from '../types/addm.types';

interface ADDMLoopState {
  isLoading: boolean;
  currentIteration: number;
  maxIterations: number;
  lastDecision: ADDMDecisionResponse | null;
  aggregatedContent: string;
  error: string | null;
}

interface ADDMProgressIndicatorProps {
  loopState: ADDMLoopState | null;
  isExecuting: boolean;
}

export const ADDMProgressIndicator: React.FC<ADDMProgressIndicatorProps> = ({
  loopState,
  isExecuting,
}) => {
  if (!isExecuting || !loopState) {
    return null;
  }

  const progress = loopState.currentIteration / loopState.maxIterations * 100;
  const lastDecision = loopState.lastDecision;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="font-semibold text-gray-100 dark:text-gray-200">ADDM Loop Executing</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-300 dark:text-gray-400">
          <span>Iteration {loopState.currentIteration} of {loopState.maxIterations}</span>
          <span className="text-gray-500 dark:text-gray-600">{progress.toFixed(0)}%</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {lastDecision && (
          <div className="flex items-center gap-2 text-sm mt-3 text-gray-300 dark:text-gray-400">
            {lastDecision.decision === 'complete' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="capitalize">{lastDecision.decision}</span>
            <span className="text-gray-500 dark:text-gray-600">
              ({(lastDecision.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
