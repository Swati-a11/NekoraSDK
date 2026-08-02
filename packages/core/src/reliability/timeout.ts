export class TimeoutError extends Error {
  public readonly code: string = "REQUEST_TIMEOUT";

  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms.`);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  promiseOrFn: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const task = typeof promiseOrFn === "function" ? promiseOrFn(controller.signal) : promiseOrFn;
    return await Promise.race([task, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
