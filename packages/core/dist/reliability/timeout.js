export class TimeoutError extends Error {
    timeoutMs;
    code = "REQUEST_TIMEOUT";
    constructor(timeoutMs) {
        super(`Operation timed out after ${timeoutMs}ms.`);
        this.timeoutMs = timeoutMs;
        this.name = "TimeoutError";
    }
}
export async function withTimeout(promiseOrFn, timeoutMs) {
    const controller = new AbortController();
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            controller.abort();
            reject(new TimeoutError(timeoutMs));
        }, timeoutMs);
    });
    try {
        const task = typeof promiseOrFn === "function" ? promiseOrFn(controller.signal) : promiseOrFn;
        return await Promise.race([task, timeoutPromise]);
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=timeout.js.map