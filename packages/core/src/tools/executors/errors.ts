export class CodeExecutionError extends Error {
  readonly code: string;

  constructor(message: string, code: string = "CODE_EXECUTION_ERROR") {
    super(message);
    this.name = "CodeExecutionError";
    this.code = code;
  }
}

export class SandboxUnavailableError extends CodeExecutionError {
  constructor(message = "Code execution requires a server-side sandbox environment.") {
    super(message, "SANDBOX_UNAVAILABLE");
    this.name = "SandboxUnavailableError";
  }
}

export class ExecutionTimeoutError extends CodeExecutionError {
  constructor(timeoutMs: number) {
    super(`Code execution timed out after ${timeoutMs}ms.`, "EXECUTION_TIMEOUT");
    this.name = "ExecutionTimeoutError";
  }
}

export class UnsupportedLanguageError extends CodeExecutionError {
  constructor(language: string) {
    super(`Language '${language}' is not supported by this sandbox provider.`, "UNSUPPORTED_LANGUAGE");
    this.name = "UnsupportedLanguageError";
  }
}
