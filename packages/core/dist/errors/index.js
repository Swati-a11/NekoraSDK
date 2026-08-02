export class NekoraBaseError extends Error {
    code;
    cause;
    metadata;
    constructor(options) {
        super(options.message);
        this.name = this.constructor.name;
        this.code = options.code;
        this.cause = options.cause;
        this.metadata = options.metadata;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class RuntimeError extends NekoraBaseError {
    constructor(message, cause, metadata) {
        super({ code: "RUNTIME_ERROR", message, cause, metadata });
    }
}
export class ProviderError extends NekoraBaseError {
    providerName;
    statusCode;
    constructor(message, providerName, statusCode, cause, metadata) {
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
    toolName;
    constructor(message, toolName, cause, metadata) {
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
    constructor(message, cause, metadata) {
        super({ code: "VALIDATION_ERROR", message, cause, metadata });
    }
}
export class GuardrailError extends NekoraBaseError {
    guardrailName;
    stage;
    constructor(message, guardrailName, stage, cause, metadata) {
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
    fromAgentId;
    toAgentId;
    constructor(message, fromAgentId, toAgentId, cause, metadata) {
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
    constructor(message, cause, metadata) {
        super({ code: "MEMORY_ERROR", message, cause, metadata });
    }
}
//# sourceMappingURL=index.js.map