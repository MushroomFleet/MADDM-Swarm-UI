import { beforeEach, afterEach, vi } from 'vitest';

// Mock the database module to avoid IndexedDB dependency
vi.mock('@/storage/db', () => ({
  db: {
    specialists: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
    approaches: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
    signals: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
    executionHistory: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
    patterns: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// Setup fetch mocking for global test environment
global.fetch = vi.fn() as any;

// Mock AbortController if not available in test environment
const mockAbortSignal = new EventTarget();
Object.defineProperty(mockAbortSignal, 'aborted', { value: false });
Object.defineProperty(mockAbortSignal, 'reason', { value: undefined });

global.AbortController = class MockAbortController {
  public signal: AbortSignal;
  abort() {}
  constructor() {
    this.signal = mockAbortSignal as AbortSignal;
  }
};

// Set up test environment variables
process.env.VITE_OPENROUTER_API_KEY = 'test-api-key';
process.env.VITE_ADDM_SERVICE_URL = 'http://localhost:8000';

// CreatedAt/setup environment for isolated component tests
beforeEach(() => {
  // Reset fetch mock before each test
  (global.fetch as any).mockClear();
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
