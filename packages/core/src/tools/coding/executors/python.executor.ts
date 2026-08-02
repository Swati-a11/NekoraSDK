import { CodeExecutionProvider, CodeExecutionResult } from "../../executors/types.js";
import { CodingRequest, CodingResult, SyntaxCheckResult } from "../types.js";

export class PythonExecutor {
  constructor(private provider: CodeExecutionProvider) {}

  public checkSyntax(code: string): SyntaxCheckResult {
    if (!code || !code.trim()) {
      return { valid: false, error: "Empty Python code snippet provided." };
    }
    let openBrackets = 0;
    let openParens = 0;
    for (const char of code) {
      if (char === "[") openBrackets++;
      if (char === "]") openBrackets--;
      if (char === "(") openParens++;
      if (char === ")") openParens--;
    }
    if (openBrackets !== 0 || openParens !== 0) {
      return {
        valid: false,
        error: "Python Syntax Error: Mismatched brackets or parentheses in code.",
      };
    }
    return { valid: true };
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
      language: "python",
      code: request.code,
      timeout: request.timeout || 5000,
    });

    const executionTime = res.executionTimeMs || Date.now() - startTime;
    const output = res.stdout ? res.stdout.trim() : "";

    if (!res.success) {
      return {
        success: false,
        output,
        error: res.stderr || res.error || "Python execution failed",
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
