/**
 * ADDM Client
 * HTTP client for Python ADDM service
 */
import type {
  ADDMDecisionRequest,
  ADDMDecisionResponse,
  ADDMHealthResponse,
  ADDMErrorResponse,
  ADDMConfig,
  QualityMetrics,
} from '../types/addm.types';

export class ADDMClient {
  private config: ADDMConfig;

  constructor(config: ADDMConfig) {
    this.config = config;
  }

  /**
   * Check if ADDM service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('[ADDMClient] Checking service health');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.serviceUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[ADDMClient] Health check failed:', response.status);
        return false;
      }

      const data: ADDMHealthResponse = await response.json();

      console.log('[ADDMClient] Health check result:', data.status);
      return data.status === 'healthy';

    } catch (error) {
      console.error('[ADDMClient] Health check error:', error);
      return false;
    }
  }

  /**
   * Make ADDM decision with retry logic
   */
  async makeDecision(
    request: ADDMDecisionRequest
  ): Promise<ADDMDecisionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        console.log(
          `[ADDMClient] Making decision (attempt ${attempt + 1}/${this.config.maxRetries})`,
          { iteration: request.iteration }
        );

      const result = await this._callDecisionEndpoint(request);

        console.log(
          `[ADDMClient] Decision received: ${result.decision}`,
          {
            confidence: result.confidence,
            reaction_time: result.reaction_time,
            hasRefinementStrategy: !!result.refinement_strategy,
            refinementStrategyType: result.refinement_strategy?.type,
          }
        );

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[ADDMClient] Decision attempt ${attempt + 1} failed:`,
          error
        );

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw this.transformError(error);
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw new Error(
      `ADDM decision failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<Record<string, any>> {
    try {
      console.log('[ADDMClient] Fetching service status');

      const response = await fetch(`${this.config.serviceUrl}/api/v1/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ADDMClient] Service status received');
      return data;

    } catch (error) {
      console.error('[ADDMClient] Status check failed:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Make the actual HTTP call to the decision endpoint
   */
  private async _callDecisionEndpoint(
    request: ADDMDecisionRequest
  ): Promise<ADDMDecisionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[ADDMClient] Request timeout - aborting');
      controller.abort();
    }, this.config.requestTimeout);

    try {
      const response = await fetch(`${this.config.serviceUrl}/api/v1/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      const data: ADDMDecisionResponse = await response.json();

      // Validate response structure
      this._validateResponse(data);

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }

      throw error;
    }
  }

  /**
   * Validate response structure from Python service
   */
  private _validateResponse(data: any): asserts data is ADDMDecisionResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const requiredFields = [
      'decision',
      'confidence',
      'reaction_time',
      'reasoning',
      'metrics',
      'next_prompt',
      'should_summarize',
      'timestamp'
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Invalid response: missing field '${field}'`);
      }
    }

    if (!['enhance', 'research', 'complete'].includes(data.decision)) {
      throw new Error(`Invalid response: decision must be enhance/research/complete, got '${data.decision}'`);
    }

    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      throw new Error('Invalid response: confidence must be number between 0 and 1');
    }

    // Validate metrics
    const metrics = data.metrics;
    if (!metrics || typeof metrics !== 'object') {
      throw new Error('Invalid response: metrics must be object');
    }

    const metricFields = ['quality_score', 'completeness_score', 'improvement_potential'];
    for (const field of metricFields) {
      if (typeof metrics[field] !== 'number' || metrics[field] < 0 || metrics[field] > 1) {
        throw new Error(`Invalid response: ${field} must be number between 0 and 1`);
      }
    }
  }

  /**
   * Transform any error into readable ADDM error
   */
  private transformError(error: any): Error {
    if (error instanceof Error) {
      return new Error(`ADDM service error: ${error.message}`);
    }
    return new Error(`ADDM service error: ${String(error)}`);
  }

  /**
   * Check if error is client error (4xx)
   */
  private isClientError(error: any): boolean {
    if (error instanceof Error && error.message.includes('HTTP 4')) {
      return true;
    }
    return false;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<ADDMConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
