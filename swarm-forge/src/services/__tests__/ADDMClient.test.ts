/**
 * Unit tests for ADDMClient service
 * Tests HTTP client functionality and retry logic
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ADDMClient } from '../ADDMClient';
import type { ADDMConfig } from '@/types/addm.types';

describe('ADDMClient', () => {
  let client: ADDMClient;
  let config: ADDMConfig;
  const mockFetch = vi.fn();

  beforeEach(() => {
    // Mock fetch globally
    global.fetch = mockFetch;

    config = {
      enabled: true,
      workflowMode: 'research_assembly' as const,
      maxIterations: 5,
      confidenceThreshold: 0.85,
      contextSummarizationThreshold: 32000,
      serviceUrl: 'http://localhost:8000',
      requestTimeout: 5000,
      maxRetries: 2,
    };

    client = new ADDMClient(config);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(client).toBeDefined();
      expect(client['config']).toEqual(config);
    });
  });

  describe('healthCheck', () => {
    it('should return true on successful health check', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'healthy' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return false on health check failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('makeDecision', () => {
    const mockRequest = {
      content: 'Test content',
      context: '',
      workflow_mode: 'research_assembly' as const,
      iteration: 1,
      confidence_threshold: 0.85,
      max_iterations: 5,
    };

    const mockApiResponse = {
      decision: 'enhance',
      confidence: 0.8,
      reaction_time: 150,
      reasoning: 'Test reasoning',
      metrics: {
        quality_score: 0.7,
        completeness_score: 0.6,
        improvement_potential: 0.8,
      },
      next_prompt: 'Continue enhancing...',
      should_summarize: false,
      timestamp: new Date().toISOString(),
    };

    it('should successfully make decision on first attempt', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse)
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.makeDecision(mockRequest);

      expect(result).toEqual(mockApiResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/decide',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockRequest),
        })
      );
    });

    it('should retry on server error and succeed on retry', async () => {
      const mockErrorResponse = { ok: false, status: 500 };
      const mockSuccessResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse)
      };

      mockFetch
        .mockResolvedValueOnce(mockErrorResponse) // First call fails (5xx error)
        .mockResolvedValueOnce(mockSuccessResponse); // Second call succeeds

      const result = await client.makeDecision(mockRequest);

      expect(result.decision).toBe('enhance');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries exceeded', async () => {
      const mockErrorResponse = { ok: false, status: 500 };
      mockFetch.mockResolvedValue(mockErrorResponse);

      await expect(client.makeDecision(mockRequest)).rejects.toThrow('ADDM decision failed after 2 attempts');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on client errors (4xx)', async () => {
      const mockClientError = { ok: false, status: 400 };
      mockFetch.mockResolvedValue(mockClientError);

      await expect(client.makeDecision(mockRequest)).rejects.toThrow('ADDM service error');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx
    });

    it('should handle timeout errors', async () => {
      // Mock AbortError for timeout
      const abortError = new Error('Request timed out');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(client.makeDecision(mockRequest)).rejects.toThrow('Request timed out');
    });

    it('should handle different workflow modes', async () => {
      const newsAnalysisRequest = {
        ...mockRequest,
        workflow_mode: 'news_analysis' as const,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse)
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.makeDecision(newsAnalysisRequest);

      expect(result.decision).toBe('enhance');
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.workflow_mode).toBe('news_analysis');
    });

    it('should handle zero max retries', async () => {
      const noRetryConfig = { ...config, maxRetries: 0 };
      const noRetryClient = new ADDMClient(noRetryConfig);

      const mockErrorResponse = { ok: false, status: 500 };
      mockFetch.mockResolvedValue(mockErrorResponse);

      await expect(noRetryClient.makeDecision(mockRequest)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial call, no retries
    });
  });

  describe('validation', () => {
    it('should validate response structure', async () => {
      const invalidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          decision: 'enhance',
          // Missing required fields like confidence, reaction_time, etc.
        })
      };
      mockFetch.mockResolvedValueOnce(invalidResponse);

      await expect(client.makeDecision({
        content: 'Test',
        context: '',
        workflow_mode: 'research_assembly' as const,
        iteration: 1,
        confidence_threshold: 0.85,
        max_iterations: 5,
      })).rejects.toThrow('Invalid response: missing field');
    });

    it('should validate decision values', async () => {
      const invalidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          decision: 'invalid_decision', // Invalid decision
          confidence: 0.8,
          reaction_time: 150,
          reasoning: 'Test',
          metrics: {
            quality_score: 0.7,
            completeness_score: 0.6,
            improvement_potential: 0.8,
          },
        })
      };
      mockFetch.mockResolvedValueOnce(invalidResponse);

      await expect(client.makeDecision({
        content: 'Test',
        context: '',
        workflow_mode: 'research_assembly' as const,
        iteration: 1,
        confidence_threshold: 0.85,
        max_iterations: 5,
      })).rejects.toThrow('decision must be enhance/research/complete');
    });

    it('should validate confidence range', async () => {
      const invalidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          decision: 'enhance',
          confidence: 1.5, // Invalid confidence > 1
          reaction_time: 150,
          reasoning: 'Test',
          metrics: {
            quality_score: 0.7,
            completeness_score: 0.6,
            improvement_potential: 0.8,
          },
        })
      };
      mockFetch.mockResolvedValueOnce(invalidResponse);

      await expect(client.makeDecision({
        content: 'Test',
        context: '',
        workflow_mode: 'research_assembly' as const,
        iteration: 1,
        confidence_threshold: 0.85,
        max_iterations: 5,
      })).rejects.toThrow('confidence must be number between 0 and 1');
    });
  });

  describe('getStatus', () => {
    it('should successfully fetch service status', async () => {
      const mockStatus = { service: 'addm-regulator', status: 'operational', version: '1.0.0' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockStatus)
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.getStatus();

      expect(result).toEqual(mockStatus);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/status',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle status fetch errors', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(client.getStatus()).rejects.toThrow('Status check failed: 500');
    });
  });

  describe('updateConfig', () => {
    it('should update client configuration', () => {
      const newConfig = {
        requestTimeout: 10000,
        maxRetries: 5,
      };

      client.updateConfig(newConfig);

      expect(client['config'].requestTimeout).toBe(10000);
      expect(client['config'].maxRetries).toBe(5);
      // Other config values should remain the same
      expect(client['config'].serviceUrl).toBe('http://localhost:8000');
    });
  });
});
