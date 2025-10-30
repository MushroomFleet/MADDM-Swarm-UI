import { useState, useCallback } from 'react';
import { OpenRouterClient } from '@/api/openrouter-client';
import { CoordinationResult } from '@/core/types';
import { useApiKey } from './useApiKey';
import { useSystemStore } from '@/stores/system-store';
import { STORAGE_KEY_API_KEY } from '@/utils/constants';

/**
 * Hook for executing streaming chat with OpenRouter
 *
 * Handles real-time token streaming and content accumulation
 */
export function useStreamingChat() {
  const { apiKey } = useApiKey();
  const getEffectiveModel = useSystemStore(state => state.getEffectiveModel);
  const [chunks, setChunks] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithStreaming = useCallback(
    async (coordination: CoordinationResult, prompt: string): Promise<string> => {
      // Check API key directly from localStorage to bypass React state timing issues
      const currentApiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
      if (!currentApiKey) {
        throw new Error('API key not set. Please configure OpenRouter API key in Settings.');
      }

      setIsStreaming(true);
      setChunks([]);
      setError(null);

      try {
        const effectiveModel = getEffectiveModel();
        const client = new OpenRouterClient(currentApiKey, { model: effectiveModel });
        const systemPrompt = client.buildSystemPrompt(coordination.approachMetadata);
        const stream = client.streamChat([{ role: 'user', content: prompt }], systemPrompt);

        const allChunks: string[] = [];
        for await (const chunk of stream) {
          allChunks.push(chunk);
          setChunks(prev => [...prev, chunk]);
        }

        return allChunks.join('');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Streaming failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    [getEffectiveModel] // Remove apiKey dependency since we check localStorage directly
  );

  const reset = useCallback(() => {
    setChunks([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return {
    executeWithStreaming,
    chunks,
    isStreaming,
    error,
    reset,
    fullContent: chunks.join(''),
  };
}
