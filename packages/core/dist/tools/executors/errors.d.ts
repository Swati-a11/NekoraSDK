export declare class CodeExecutionError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare class SandboxUnavailableError extends CodeExecutionError {
    constructor(message?: string);
}
export declare class ExecutionTimeoutError extends CodeExecutionError {
    constructor(timeoutMs: number);
}
export declare class UnsupportedLanguageError extends CodeExecutionError {
    constructor(language: string);
}
//# sourceMappingURL=errors.d.ts.map