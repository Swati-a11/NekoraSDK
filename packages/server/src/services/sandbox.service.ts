import {
  CodeExecutionProvider,
  NodeSandboxExecutor,
  CodeExecutionRequest,
  CodeExecutionResult,
} from "@nekora-ai/core";
import {
  SandboxUnavailableError,
  ExecutionTimeoutError,
  ValidationError,
} from "../middleware/error.js";

export class SandboxService {
  private provider: CodeExecutionProvider;

  constructor(provider?: CodeExecutionProvider) {
    this.provider = provider || new NodeSandboxExecutor();
  }

  public getProvider(): CodeExecutionProvider {
    return this.provider;
  }

  public setProvider(provider: CodeExecutionProvider): void {
    this.provider = provider;
  }

  public async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    if (!request || typeof request.code !== "string" || !request.language) {
      throw new ValidationError("Both 'language' and 'code' fields are required.");
    }

    const validLanguages = ["javascript", "typescript", "python"];
    if (!validLanguages.includes(request.language)) {
      throw new ValidationError(
        `Language '${request.language}' is unsupported. Allowed: ${validLanguages.join(", ")}`
      );
    }

    const result = await this.provider.execute(request);

    if (!result.success) {
      if (result.errorCode === "SANDBOX_UNAVAILABLE") {
        throw new SandboxUnavailableError(
          result.error || "Code execution requires a server-side sandbox environment."
        );
      }
      if (result.errorCode === "EXECUTION_TIMEOUT") {
        throw new ExecutionTimeoutError(
          result.error || `Execution timed out after ${request.timeout || 5000}ms.`
        );
      }
    }

    return result;
  }
}
