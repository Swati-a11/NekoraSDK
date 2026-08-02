import { z } from "zod";
import { ToolExecutionError } from "../errors/index.js";
import { ToolDefinition } from "../providers/types.js";
export interface ToolContext {
    runId: string;
    sessionId?: string;
    agentId?: string;
    signal?: AbortSignal;
}
export type ToolExecutionContext = ToolContext;
export type { ToolDefinition };
export interface ToolConfig<TInput = any, TOutput = any> {
    name: string;
    description: string;
    schema: z.ZodType<TInput>;
    permissions?: string[];
    requireApproval?: boolean;
    metadata?: Record<string, unknown>;
    execute: (input: TInput, context: ToolContext) => Promise<TOutput>;
}
export interface Tool<TInput = any, TOutput = any> {
    readonly name: string;
    readonly description: string;
    readonly schema: z.ZodType<TInput>;
    readonly permissions?: string[];
    readonly requireApproval?: boolean;
    readonly metadata?: Record<string, unknown>;
    readonly parameters?: Record<string, unknown>;
    toDefinition(): ToolDefinition;
    execute(input: unknown, context?: ToolContext): Promise<TOutput>;
}
export declare class ToolError extends Error {
    readonly toolName: string;
    readonly cause?: unknown | undefined;
    readonly code: string;
    constructor(message: string, toolName: string, code?: string, cause?: unknown | undefined);
}
export declare class ToolValidationError extends ToolError {
    constructor(toolName: string, message: string, cause?: unknown);
}
export declare class ToolPermissionError extends ToolError {
    readonly missingPermission: string;
    constructor(toolName: string, missingPermission: string);
}
export declare class ToolApprovalRequiredError extends ToolError {
    readonly args: unknown;
    constructor(toolName: string, args: unknown);
}
export { ToolExecutionError };
//# sourceMappingURL=types.d.ts.map