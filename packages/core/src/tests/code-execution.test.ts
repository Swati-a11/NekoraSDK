import { describe, it, expect } from "vitest";
import { CodeExecutionTool } from "../tools/code-execution.tool.js";

describe("CodeExecutionTool Unit Tests", () => {
  const tool = new CodeExecutionTool({
    languages: ["javascript", "typescript", "python"],
    timeout: 3000,
  });

  it("1. Execute JavaScript snippet successfully", async () => {
    const res = await tool.execute({
      language: "javascript",
      code: "console.log(25 * 4);",
    });

    expect(res.success).toBe(true);
    expect(res.stdout).toBe("100");
    expect(res.exitCode).toBe(0);
  });

  it("2. Execute Python snippet successfully", async () => {
    const res = await tool.execute({
      language: "python",
      code: "print('Hello from Python')",
    });

    expect(res.success).toBe(true);
    expect(res.stdout).toBe("Hello from Python");
    expect(res.exitCode).toBe(0);
  });

  it("3. Handle execution error in script", async () => {
    const res = await tool.execute({
      language: "javascript",
      code: "throw new Error('Script crash');",
    });

    expect(res.success).toBe(false);
    expect(res.exitCode).not.toBe(0);
    expect(res.stderr).toContain("Script crash");
  });

  it("4. Reject non-permitted programming language", async () => {
    const restrictedTool = new CodeExecutionTool({
      languages: ["javascript"],
    });

    await expect(
      restrictedTool.execute({
        language: "python" as any,
        code: "print('Hello')",
      })
    ).rejects.toThrow();
  });
});
