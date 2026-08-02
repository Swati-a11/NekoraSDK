import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ErrorResponseBody } from "../types/index.js";

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, any>;

  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SandboxUnavailableError extends ApiError {
  constructor(message: string = "Code execution sandbox environment is unavailable in this environment.", details?: Record<string, any>) {
    super(message, "SANDBOX_UNAVAILABLE", 503, details);
  }
}

export class ExecutionTimeoutError extends ApiError {
  constructor(message: string = "Code execution process timed out.", details?: Record<string, any>) {
    super(message, "EXECUTION_TIMEOUT", 408, details);
  }
}

export class ToolExecutionError extends ApiError {
  constructor(message: string = "An error occurred while executing the tool.", details?: Record<string, any>) {
    super(message, "TOOL_EXECUTION_ERROR", 500, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = "Invalid request payload.", details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response<ErrorResponseBody>,
  _next: NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const code = err instanceof ApiError ? err.code : err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred.";
  const details = err instanceof ApiError ? err.details : err.details || undefined;

  res.status(statusCode).json({
    code,
    message,
    ...(details ? { details } : {}),
  });
};
