import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemConfig } from '@/core/types';
import {
  DEFAULT_VIGILANCE_THRESHOLD,
  DEFAULT_DECAY_RATE,
  DEFAULT_MAX_SPECIALISTS,
  DEFAULT_LEARNING_RATE,
  PATTERN_DISCOVERY_THRESHOLD,
  DEFAULT_MODEL,
  DEFAULT_PARALLEL_ENABLED,
  DEFAULT_PARALLEL_COUNT,
  DEFAULT_PARALLEL_STRATEGY,
  DEFAULT_PARALLEL_TIMEOUT,
} from '@/utils/constants';

/**
 * System configuration state with Zustand
 * 
 * Manages coordination parameters with localStorage persistence
 */
interface SystemState {
  config: SystemConfig;
  model: string;
  enableWebSearch: boolean;
  patternDiscoveryConfig: {
    minQuality: number;
    minClusterSize: number;
    similarityThreshold: number;
  };
  updateConfig: (updates: Partial<SystemConfig>) => void;
  updateParallelConfig: (updates: Partial<SystemConfig['parallelConfig']>) => void;
  updatePatternDiscoveryConfig: (updates: Partial<SystemState['patternDiscoveryConfig']>) => void;
  setModel: (model: string) => void;
  setEnableWebSearch: (enabled: boolean) => void;
  getEffectiveModel: () => string;
  resetConfig: () => void;
}

const defaultConfig: SystemConfig = {
  vigilanceThreshold: DEFAULT_VIGILANCE_THRESHOLD,
  decayRate: DEFAULT_DECAY_RATE,
  maxSpecialists: DEFAULT_MAX_SPECIALISTS,
  learningRate: DEFAULT_LEARNING_RATE,
  patternDiscoveryThreshold: PATTERN_DISCOVERY_THRESHOLD,
  enablePatternDiscovery: true,
  parallelConfig: {
    enabled: DEFAULT_PARALLEL_ENABLED,
    parallelCount: DEFAULT_PARALLEL_COUNT,
    selectionStrategy: DEFAULT_PARALLEL_STRATEGY,
    timeoutMs: DEFAULT_PARALLEL_TIMEOUT,
  },
};

const defaultPatternDiscoveryConfig = {
  minQuality: 0.6,
  minClusterSize: 5,
  similarityThreshold: 0.6,
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      model: DEFAULT_MODEL,
      enableWebSearch: false,
      patternDiscoveryConfig: defaultPatternDiscoveryConfig,
      
      updateConfig: (updates) =>
        set((state) => ({ config: { ...state.config, ...updates } })),
      
      updateParallelConfig: (updates) =>
        set((state) => ({
          config: {
            ...state.config,
            parallelConfig: {
              ...state.config.parallelConfig,
              ...updates,
            },
          },
        })),
      
      updatePatternDiscoveryConfig: (updates) =>
        set((state) => ({
          patternDiscoveryConfig: {
            ...state.patternDiscoveryConfig,
            ...updates,
          },
        })),
      
      setModel: (model) => set({ model }),
      
      setEnableWebSearch: (enabled) => set({ enableWebSearch: enabled }),
      
      getEffectiveModel: () => {
        const state = get();
        const baseModel = state.model.replace(/:online$/, '');
        return state.enableWebSearch ? `${baseModel}:online` : baseModel;
      },
      
      resetConfig: () => set({ 
        config: defaultConfig, 
        model: DEFAULT_MODEL,
        enableWebSearch: false,
        patternDiscoveryConfig: defaultPatternDiscoveryConfig,
      }),
    }),
    {
      name: 'hybrid-swarm-config',
    }
  )
);
