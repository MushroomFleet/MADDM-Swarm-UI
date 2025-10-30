/**
 * ADDM Store
 * Zustand store for ADDM configuration and state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ADDMConfig,
  ADDMLoopState,
  WorkflowMode,
} from '../types/addm.types';

interface ADDMStore {
  // Configuration
  config: ADDMConfig;
  updateConfig: (updates: Partial<ADDMConfig>) => void;
  resetConfig: () => void;

  // Loop state
  currentLoop: ADDMLoopState | null;
  setCurrentLoop: (loop: ADDMLoopState | null) => void;

  // UI state
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;

  // Service health
  serviceHealth: boolean;
  setServiceHealth: (healthy: boolean) => void;
  lastHealthCheck: Date | null;
  setLastHealthCheck: (date: Date) => void;
}

const DEFAULT_CONFIG: ADDMConfig = {
  enabled: false,
  workflowMode: 'research_assembly',
  maxIterations: 10,
  confidenceThreshold: 0.85,
  contextSummarizationThreshold: 32000,
  serviceUrl: 'http://localhost:8000',
  requestTimeout: 30000,
  maxRetries: 3,
};

export const useADDMStore = create<ADDMStore>()(
  persist(
    (set, get) => ({
      // Configuration
      config: DEFAULT_CONFIG,

      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      resetConfig: () => {
        set({ config: DEFAULT_CONFIG });
      },

      // Loop state
      currentLoop: null,

      setCurrentLoop: (loop) => {
        set({ currentLoop: loop });
      },

      // UI state
      isExecuting: false,

      setIsExecuting: (executing) => {
        set({ isExecuting: executing });
      },

      // Service health
      serviceHealth: false,

      setServiceHealth: (healthy) => {
        set({ serviceHealth: healthy });
      },

      lastHealthCheck: null,

      setLastHealthCheck: (date) => {
        set({ lastHealthCheck: date });
      },
    }),
    {
      name: 'addm-store',
      partialize: (state) => ({
        // Only persist configuration
        config: state.config,
      }),
    }
  )
);

// Selector hooks for convenience
export const useADDMConfig = () => useADDMStore((state) => state.config);
export const useADDMEnabled = () => useADDMStore((state) => state.config.enabled);
export const useCurrentLoop = () => useADDMStore((state) => state.currentLoop);
export const useADDMExecuting = () => useADDMStore((state) => state.isExecuting);
export const useADDMServiceHealth = () => useADDMStore((state) => state.serviceHealth);
