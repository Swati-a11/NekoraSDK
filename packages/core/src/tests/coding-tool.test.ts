import { describe, it, expect } from "vitest";
import { CodingTool } from "../tools/coding/coding.tool.js";
import { CodeExecutionProvider, CodeExecutionResult } from "../tools/executors/types.js";

describe("Feature 1: Advanced Coding Capabilities", () => {
  it("executes JavaScript code successfully", async () => {
    const tool = new CodingTool();
    const result = await tool.execute({
      language: "javascript",
      code: "console.log('Hello JavaScript');",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("Hello JavaScript");
    expect(typeof result.executionTime).toBe("number");
  });

  it("executes TypeScript code successfully", async () => {
    const tool = new CodingTool();
    const result = await tool.execute({
      language: "typescript",
      code: "const msg: string = 'Hello TypeScript'; console.log(msg);",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("Hello TypeScript");
  });

  it("executes Python code successfully", async () => {
    const tool = new CodingTool();
    const result = await tool.execute({
      language: "python",
      code: "print('Hello Python')",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("Hello Python");
  });

  it("handles JavaScript pre-execution syntax error gracefully", async () => {
    const tool = new CodingTool();
    const result = await tool.execute({
      language: "javascript",
      code: "console.log('unclosed string)",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Syntax Error");
  });

  it("handles execution timeout using provider timeout error", async () => {
    const timeoutMockProvider: CodeExecutionProvider = {
      name: "mock_timeout",
      execute: async (): Promise<CodeExecutionResult> => ({
        success: false,
        stdout: "",
        stderr: "Code execution timed out after 100ms.",
        exitCode: null,
        executionTimeMs: 100,
        errorCode: "EXECUTION_TIMEOUT",
        error: "Code execution timed out after 100ms.",
      }),
    };

    const tool = new CodingTool({ provider: timeoutMockProvider });
    const result = await tool.execute({
      language: "javascript",
      code: "while(true){}",
      timeout: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("timed out");
  });

  it("supports swapping execution providers (CodeExecutionProvider abstraction)", async () => {
    const customProvider: CodeExecutionProvider = {
      name: "custom_sandbox",
      execute: async (req): Promise<CodeExecutionResult> => ({
        success: true,
        stdout: `Custom execution of ${req.language}: ${req.code}`,
        stderr: "",
        exitCode: 0,
        executionTimeMs: 15,
      }),
    };

    const tool = new CodingTool({ provider: customProvider });
    const result = await tool.execute({
      language: "python",
      code: "import sys; print('sys')",
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("Custom execution of python");
  });
});
