import { useState, useEffect } from 'react';
import { STORAGE_KEY_API_KEY } from '@/utils/constants';

/**
 * Hook for managing OpenRouter API key in localStorage
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isSet, setIsSet] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (stored) {
      setApiKeyState(stored);
      setIsSet(true);
    }
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
    setApiKeyState(key);
    setIsSet(true);
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    setApiKeyState('');
    setIsSet(false);
  };

  return {
    apiKey,
    isSet,
    setApiKey,
    clearApiKey,
  };
}
