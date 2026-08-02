export interface NekoraErrorOptions {
    code: string;
    message: string;
    cause?: unknown;
    metadata?: Record<string, unknown>;
}
export declare class NekoraBaseError extends Error {
    readonly code: string;
    readonly cause?: unknown;
    readonly metadata?: Record<string, unknown>;
    constructor(options: NekoraErrorOptions);
}
export declare class RuntimeError extends NekoraBaseError {
    constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class ProviderError extends NekoraBaseError {
    readonly providerName?: string;
    readonly statusCode?: number;
    constructor(message: string, providerName?: string, statusCode?: number, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class ToolExecutionError extends NekoraBaseError {
    readonly toolName?: string;
    constructor(message: string, toolName?: string, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class ValidationError extends NekoraBaseError {
    constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class GuardrailError extends NekoraBaseError {
    readonly guardrailName?: string;
    readonly stage?: string;
    constructor(message: string, guardrailName?: string, stage?: string, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class HandoffError extends NekoraBaseError {
    readonly fromAgentId?: string;
    readonly toAgentId?: string;
    constructor(message: string, fromAgentId?: string, toAgentId?: string, cause?: unknown, metadata?: Record<string, unknown>);
}
export declare class MemoryError extends NekoraBaseError {
    constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>);
}
//# sourceMappingURL=index.d.ts.map