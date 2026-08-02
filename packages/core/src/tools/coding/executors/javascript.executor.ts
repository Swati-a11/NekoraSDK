import { CodeExecutionProvider, CodeExecutionResult } from "../../executors/types.js";
import { CodingRequest, CodingResult, SyntaxCheckResult } from "../types.js";

export class JavaScriptExecutor {
  constructor(private provider: CodeExecutionProvider) {}

  public checkSyntax(code: string): SyntaxCheckResult {
    if (!code || !code.trim()) {
      return { valid: false, error: "Empty code snippet provided." };
    }
    try {
      new Function(code);
      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        error: `JavaScript Syntax Error: ${err.message || String(err)}`,
      };
    }
  }

  public async execute(request: CodingRequest): Promise<CodingResult> {
    const syntax = this.checkSyntax(request.code);
    if (!syntax.valid) {
      return {
        success: false,
        output: "",
        error: syntax.error,
        executionTime: 0,
        exitCode: 1,
      };
    }

    const startTime = Date.now();
    const res: CodeExecutionResult = await this.provider.execute({
      language: "javascript",
      code: request.code,
      timeout: request.timeout || 5000,
    });

    const executionTime = res.executionTimeMs || Date.now() - startTime;
    const output = res.stdout ? res.stdout.trim() : "";

    if (!res.success) {
      return {
        success: false,
        output,
        error: res.stderr || res.error || "Execution failed",
        executionTime,
        exitCode: res.exitCode ?? 1,
      };
    }

    return {
      success: true,
      output,
      executionTime,
      exitCode: 0,
    };
  }
}
