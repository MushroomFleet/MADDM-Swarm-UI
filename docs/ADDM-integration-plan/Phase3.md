# Phase 3: React Frontend Integration

## Phase Overview

**Goal:** Implement React hooks and execution logic for ADDM loop mode in the chat interface

**Prerequisites:**
- Phase 2 complete (TypeScript integration layer working)
- React 18+ application running
- Zustand stores accessible
- Existing useStreamingChat and useParallelChat hooks understood

**Estimated Duration:** 7-10 days

**Key Deliverables:**
- useADDMLoop() custom React hook
- ChatInterface integration with ADDM execution path
- Progress tracking components
- Streaming content aggregation in UI
- Loop cancellation support
- Integration with execution history

## Step-by-Step Implementation

### Step 1: useADDMLoop Hook

**Purpose:** Create a React hook that manages ADDM loop execution and state

**Duration:** 6-8 hours

#### Code Example: `src/hooks/useADDMLoop.ts`

```typescript
/**
 * useADDMLoop Hook
 * React hook for ADDM loop execution
 */
import { useState, useCallback, useRef } from 'react';
import { useADDMStore, useADDMConfig } from '../stores/ADDMStore';
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
  
  // Initialize bridge
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
```

### Step 2: ChatInterface Integration

**Purpose:** Integrate ADDM execution mode into ChatInterface component

**Duration:** 4-6 hours

#### Code Example: `src/components/ChatInterface.tsx` (Modified)

```typescript
// Add ADDM execution handler
const handleADDMExecution = useCallback(async (prompt: string) => {
  if (!addmConfig.enabled) {
    toast.error('ADDM mode is not enabled');
    return;
  }
  
  // Check service health first
  const isHealthy = await checkADDMServiceHealth();
  if (!isHealthy) {
    toast.error('ADDM service is not available. Please check service health.');
    return;
  }
  
  const sessionId = generateSessionId();
  setMessages((prev) => [
    ...prev,
    { role: 'user', content: prompt, timestamp: new Date() },
  ]);
  
  try {
    const result = await executeADDMLoop(prompt, sessionId, userId);
    
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        metadata: {
          type: 'addm',
          iterations: result.iterations,
          finalDecision: result.finalDecision,
          totalExecutionTime: result.totalExecutionTime,
        },
      },
    ]);
    
    toast.success(
      `ADDM loop completed in ${result.iterations} iterations (${(result.totalExecutionTime / 1000).toFixed(1)}s)`
    );
    
  } catch (error) {
    toast.error('ADDM execution failed');
    setMessages((prev) => [
      ...prev,
      {
        role: 'error',
        content: 'ADDM execution encountered an error. Please try again.',
        timestamp: new Date(),
      },
    ]);
  }
}, [addmConfig, executeADDMLoop, userId]);

// Modify handleSendMessage to route to ADDM when enabled
const handleSendMessage = useCallback(async (prompt: string) => {
  if (addmConfig.enabled) {
    await handleADDMExecution(prompt);
  } else if (parallelConfig.enabled) {
    await handleParallelExecution(prompt);
  } else {
    await handleSequentialExecution(prompt);
  }
}, [addmConfig, parallelConfig, handleADDMExecution, handleParallelExecution, handleSequentialExecution]);
```

### Step 3: Progress Indicator Component

**Purpose:** Show real-time ADDM loop progress

**Duration:** 3-4 hours

#### Code Example: `src/components/ADDMProgressIndicator.tsx`

```typescript
/**
 * ADDM Progress Indicator
 * Shows current iteration and decision status
 */
import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ADDMLoopState } from '../types/addm.types';

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
  
  const progress = (loopState.iteration / loopState.maxIterations) * 100;
  const lastDecision = loopState.decisionHistory[loopState.decisionHistory.length - 1];
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="font-semibold">ADDM Loop Executing</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Iteration {loopState.iteration} of {loopState.maxIterations}</span>
          <span className="text-gray-500">{progress.toFixed(0)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {lastDecision && (
          <div className="flex items-center gap-2 text-sm mt-3">
            {lastDecision.decision === 'complete' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="capitalize">{lastDecision.decision}</span>
            <span className="text-gray-500">
              (confidence: {(lastDecision.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Step 4: Enhanced SwarmTrace for ADDM

**Purpose:** Display ADDM decision history in trace panel

**Duration:** 4-5 hours

#### Code Example: `src/components/SwarmTrace.tsx` (ADDM Section)

```typescript
// Add ADDM section to SwarmTrace component
const ADDMTraceSection: React.FC<{ decisions: ADDMDecisionResponse[] }> = ({ decisions }) => {
  if (decisions.length === 0) return null;
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <span>ADDM Decision Timeline</span>
        <span className="text-xs text-gray-500">({decisions.length} iterations)</span>
      </h4>
      
      <div className="space-y-3">
        {decisions.map((decision, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Iteration {index}</span>
              <DecisionBadge decision={decision.decision} />
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-mono">{(decision.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reaction Time:</span>
                <span className="font-mono">{decision.reaction_time.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quality:</span>
                <span className="font-mono">{(decision.metrics.quality_score * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            {decision.reasoning && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {decision.reasoning}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DecisionBadge: React.FC<{ decision: ADDMDecision }> = ({ decision }) => {
  const colors = {
    enhance: 'bg-blue-100 text-blue-700',
    research: 'bg-purple-100 text-purple-700',
    complete: 'bg-green-100 text-green-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[decision]}`}>
      {decision}
    </span>
  );
};
```

### Step 5: Toast Notifications

**Purpose:** User feedback for ADDM loop events

**Duration:** 2-3 hours

#### Code Example: Toast notification integration

```typescript
// In ChatInterface or useADDMLoop
import { toast } from 'react-hot-toast';

// Loop started
toast.loading('Starting ADDM loop...', { id: 'addm-loop' });

// Iteration update
toast.loading(
  `ADDM iteration ${iteration}/${maxIterations} - ${decision}`,
  { id: 'addm-loop' }
);

// Loop complete
toast.success(
  `Loop completed in ${iterations} iterations (${time}s)`,
  { id: 'addm-loop', duration: 4000 }
);

// Error
toast.error(
  'ADDM service unavailable',
  { id: 'addm-loop' }
);
```

## Testing Procedures

### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';

test('ADDM execution starts when enabled', async () => {
  render(<ChatInterface />);
  
  // Enable ADDM in settings
  fireEvent.click(screen.getByRole('button', { name: /settings/i }));
  fireEvent.click(screen.getByLabelText(/enable addm/i));
  
  // Send message
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'Test prompt' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
  
  // Check progress indicator appears
  await waitFor(() => {
    expect(screen.getByText(/addm loop executing/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

**Issue:** Hook re-renders causing multiple executions
**Solution:** Use useCallback and useMemo appropriately, check dependency arrays

**Issue:** Progress not updating in UI
**Solution:** Verify state updates, check if onProgress callback firing

**Issue:** Content not aggregating correctly
**Solution:** Check string concatenation logic, verify newlines

## Next Steps

✅ **Phase 3 Complete when:**
- useADDMLoop hook functional
- ChatInterface routes to ADDM mode
- Progress indicator shows status
- SwarmTrace displays decisions
- Notifications work correctly

**Proceed to:** Phase 4 - UI Components & Settings

---

**Phase 3 Character Count:** ~19,000
