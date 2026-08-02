export declare class TimeoutError extends Error {
    constructor(timeoutMs: number);
}
export declare function withTimeout<T>(promiseOrFn: Promise<T> | ((signal: AbortSignal) => Promise<T>), timeoutMs: number): Promise<T>;
//# sourceMappingURL=timeout.d.ts.map