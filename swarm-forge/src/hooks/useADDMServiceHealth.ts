/**
 * useADDMServiceHealth Hook
 * Background health monitoring for ADDM service
 */
import { useEffect, useState } from 'react';
import { ADDMClient } from '../services/ADDMClient';
import { useADDMStore } from '../stores/ADDMStore';

interface UseADDMServiceHealthOptions {
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook for monitoring ADDM service health in the background
 * Updates the global health status in the ADDM store
 */
export const useADDMServiceHealth = (
  options: UseADDMServiceHealthOptions = {}
) => {
  const { intervalMs = 30000, enabled = true } = options;
  const {
    config,
    serviceHealth,
    setServiceHealth,
    setLastHealthCheck
  } = useADDMStore();

  const [client, setClient] = useState<ADDMClient | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Initialize client when config is available
  useEffect(() => {
    if (config.enabled) {
      const newClient = new ADDMClient(config);
      setClient(newClient);
    }
  }, [config.enabled, config.serviceUrl, config.requestTimeout]);

  // Health check function
  const checkHealth = async () => {
    if (!client || !enabled) return;

    setIsCheckingHealth(true);
    try {
      const healthy = await client.healthCheck();
      setServiceHealth(healthy);

      console.log(
        `[useADDMServiceHealth] Health check successful: ${healthy ? 'Healthy' : 'Unhealthy'}`
      );
    } catch (error) {
      console.error('[useADDMServiceHealth] Health check failed:', error);
      setServiceHealth(false);
    } finally {
      setLastHealthCheck(new Date());
      setIsCheckingHealth(false);
    }
  };

  // Set up periodic health checks
  useEffect(() => {
    if (!config.enabled || !client || !enabled) {
      return;
    }

    // Initial check
    checkHealth();

    // Periodic checks
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [config.enabled, client, enabled, intervalMs]);

  // Manual health check (expose for user-triggered checks)
  const manualHealthCheck = () => {
    if (client) {
      checkHealth();
    }
  };

  return {
    isHealthy: serviceHealth,
    isCheckingHealth,
    manualHealthCheck,
    isEnabled: config.enabled && enabled,
  };
};
