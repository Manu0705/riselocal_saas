export type RetryOptions = {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
};

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  attempts: 4,
  initialDelayMs: 600,
  maxDelayMs: 4000,
  factor: 1.7,
};

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export class RetryableRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RetryableRequestError';
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableRequestError) return true;

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('load failed') ||
      message.includes('timed out')
    );
  }

  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  let delayMs = config.initialDelayMs;
  let lastError: unknown = null;

  while (attempt < config.attempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt >= config.attempts || !isRetryableError(error)) {
        throw error;
      }

      await sleep(delayMs);
      delayMs = Math.min(Math.round(delayMs * config.factor), config.maxDelayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed after retries');
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(input, init);

    if (RETRYABLE_STATUSES.has(response.status)) {
      throw new RetryableRequestError(`Request failed with status ${response.status}`, response.status);
    }

    return response;
  }, options);
}