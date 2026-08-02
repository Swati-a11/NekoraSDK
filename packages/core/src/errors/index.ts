export interface NekoraErrorOptions {
  code: string;
  message: string;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

export class NekoraBaseError extends Error {
  readonly code: string;
  readonly cause?: unknown;
  readonly metadata?: Record<string, unknown>;

  constructor(options: NekoraErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.cause = options.cause;
    this.metadata = options.metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RuntimeError extends NekoraBaseError {
  constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({ code: "RUNTIME_ERROR", message, cause, metadata });
  }
}

export class ProviderError extends NekoraBaseError {
  readonly providerName?: string;
  readonly statusCode?: number;

  constructor(message: string, providerName?: string, statusCode?: number, cause?: unknown, metadata?: Record<string, unknown>) {
    super({
      code: "PROVIDER_ERROR",
      message,
      cause,
      metadata: { ...metadata, providerName, statusCode },
    });
    this.providerName = providerName;
    this.statusCode = statusCode;
  }
}

export class ToolExecutionError extends NekoraBaseError {
  readonly toolName?: string;

  constructor(message: string, toolName?: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({
      code: "TOOL_EXECUTION_ERROR",
      message,
      cause,
      metadata: { ...metadata, toolName },
    });
    this.toolName = toolName;
  }
}

export class ValidationError extends NekoraBaseError {
  constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({ code: "VALIDATION_ERROR", message, cause, metadata });
  }
}

export class GuardrailError extends NekoraBaseError {
  readonly guardrailName?: string;
  readonly stage?: string;

  constructor(message: string, guardrailName?: string, stage?: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({
      code: "GUARDRAIL_ERROR",
      message,
      cause,
      metadata: { ...metadata, guardrailName, stage },
    });
    this.guardrailName = guardrailName;
    this.stage = stage;
  }
}

export class HandoffError extends NekoraBaseError {
  readonly fromAgentId?: string;
  readonly toAgentId?: string;

  constructor(message: string, fromAgentId?: string, toAgentId?: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({
      code: "HANDOFF_ERROR",
      message,
      cause,
      metadata: { ...metadata, fromAgentId, toAgentId },
    });
    this.fromAgentId = fromAgentId;
    this.toAgentId = toAgentId;
  }
}

export class MemoryError extends NekoraBaseError {
  constructor(message: string, cause?: unknown, metadata?: Record<string, unknown>) {
    super({ code: "MEMORY_ERROR", message, cause, metadata });
  }
}
