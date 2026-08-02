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

export class ToolError extends Error {
  public readonly code: string;

  constructor(
    message: string,
    public readonly toolName: string,
    code: string = "TOOL_ERROR",
    public readonly cause?: unknown
  ) {
    super(`Tool '${toolName}' error: ${message}`);
    this.name = "ToolError";
    this.code = code;
    if (cause && cause instanceof Error && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class ToolValidationError extends ToolError {
  constructor(toolName: string, message: string, cause?: unknown) {
    super(`Validation failed: ${message}`, toolName, "TOOL_VALIDATION_FAILED", cause);
    this.name = "ToolValidationError";
  }
}

export class ToolPermissionError extends ToolError {
  constructor(toolName: string, public readonly missingPermission: string) {
    super(`Missing required permission '${missingPermission}'`, toolName, "TOOL_PERMISSION_DENIED");
    this.name = "ToolPermissionError";
  }
}

export class ToolApprovalRequiredError extends ToolError {
  constructor(toolName: string, public readonly args: unknown) {
    const msg = typeof args === "string" ? args : "Tool execution requires human approval before proceeding";
    super(msg, toolName, "TOOL_APPROVAL_REQUIRED");
    this.name = "ToolApprovalRequiredError";
  }
}

export { ToolExecutionError };
