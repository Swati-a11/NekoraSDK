export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableErrors?: (err: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let delay = options.initialDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 10000;
  const backoff = options.backoffFactor ?? 2;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const error = err instanceof Error ? err : new Error(String(err));

      if (attempt > maxRetries) {
        throw error;
      }

      if (options.retryableErrors && !options.retryableErrors(error)) {
        throw error;
      }

      if (options.onRetry) {
        options.onRetry(attempt, error);
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 100;
      const sleepTime = Math.min(delay + jitter, maxDelay);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      delay *= backoff;
    }
  }
}
