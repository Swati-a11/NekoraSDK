export class ApiError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class SandboxUnavailableError extends ApiError {
    constructor(message = "Code execution sandbox environment is unavailable in this environment.", details) {
        super(message, "SANDBOX_UNAVAILABLE", 503, details);
    }
}
export class ExecutionTimeoutError extends ApiError {
    constructor(message = "Code execution process timed out.", details) {
        super(message, "EXECUTION_TIMEOUT", 408, details);
    }
}
export class ToolExecutionError extends ApiError {
    constructor(message = "An error occurred while executing the tool.", details) {
        super(message, "TOOL_EXECUTION_ERROR", 500, details);
    }
}
export class ValidationError extends ApiError {
    constructor(message = "Invalid request payload.", details) {
        super(message, "VALIDATION_ERROR", 400, details);
    }
}
export const errorHandler = (err, _req, res, _next) => {
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
//# sourceMappingURL=error.js.map