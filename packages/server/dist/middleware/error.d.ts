import { ErrorRequestHandler } from "express";
export declare class ApiError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, any>;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, any>);
}
export declare class SandboxUnavailableError extends ApiError {
    constructor(message?: string, details?: Record<string, any>);
}
export declare class ExecutionTimeoutError extends ApiError {
    constructor(message?: string, details?: Record<string, any>);
}
export declare class ToolExecutionError extends ApiError {
    constructor(message?: string, details?: Record<string, any>);
}
export declare class ValidationError extends ApiError {
    constructor(message?: string, details?: Record<string, any>);
}
export declare const errorHandler: ErrorRequestHandler;
//# sourceMappingURL=error.d.ts.map