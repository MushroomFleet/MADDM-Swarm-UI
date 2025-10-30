/**
 * API Error Handling
 * 
 * Handles errors from OpenRouter API with retry logic.
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIError(error: unknown): Promise<never> {
  if (error instanceof Response) {
    const status = error.status;
    const body = await error.json().catch(() => ({}));
    
    const retryable = status === 429 || status >= 500;
    
    throw new APIError(
      body.error?.message || `HTTP ${status}`,
      status,
      retryable
    );
  }

  if (error instanceof Error) {
    throw new APIError(error.message, undefined, false);
  }

  throw new APIError('Unknown error', undefined, false);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof APIError && !error.retryable) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
