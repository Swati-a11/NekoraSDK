import { ToolExecutionError } from "../errors/index.js";
export class ToolError extends Error {
    toolName;
    cause;
    code;
    constructor(message, toolName, code = "TOOL_ERROR", cause) {
        super(`Tool '${toolName}' error: ${message}`);
        this.toolName = toolName;
        this.cause = cause;
        this.name = "ToolError";
        this.code = code;
        if (cause && cause instanceof Error && cause.stack) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }
    }
}
export class ToolValidationError extends ToolError {
    constructor(toolName, message, cause) {
        super(`Validation failed: ${message}`, toolName, "TOOL_VALIDATION_FAILED", cause);
        this.name = "ToolValidationError";
    }
}
export class ToolPermissionError extends ToolError {
    missingPermission;
    constructor(toolName, missingPermission) {
        super(`Missing required permission '${missingPermission}'`, toolName, "TOOL_PERMISSION_DENIED");
        this.missingPermission = missingPermission;
        this.name = "ToolPermissionError";
    }
}
export class ToolApprovalRequiredError extends ToolError {
    args;
    constructor(toolName, args) {
        const msg = typeof args === "string" ? args : "Tool execution requires human approval before proceeding";
        super(msg, toolName, "TOOL_APPROVAL_REQUIRED");
        this.args = args;
        this.name = "ToolApprovalRequiredError";
    }
}
export { ToolExecutionError };
//# sourceMappingURL=types.js.map