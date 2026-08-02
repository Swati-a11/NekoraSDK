import { describe, it, expect } from "vitest";
import {
  CodeExecutionTool,
  NodeSandboxExecutor,
  Agent,
  ModelProvider,
  Message,
  ModelResponse,
} from "../index.js";

class CodeExecutorMockProvider implements ModelProvider {
  readonly id = "code_mock";
  readonly modelName = "code-mock-model";

  async generate(messages: Message[]): Promise<ModelResponse> {
    if (messages.some((m) => m.role === "tool")) {
      return {
        text: "Code execution finished successfully with stdout: Hello Nekora",
        finishReason: "stop",
      };
    }

    return {
      toolCalls: [
        {
          id: "tc_code_1",
          name: "code_executor",
          arguments: {
            language: "javascript",
            code: 'console.log("Hello Nekora")',
          },
        },
      ],
      finishReason: "tool_calls",
    };
  }
}

describe("CodeExecutionTool Runtime & Execution Provider Tests", () => {
  const executor = new NodeSandboxExecutor();
  const tool = new CodeExecutionTool({ provider: executor });

  it("Test 1: JavaScript execution stdout & success", async () => {
    const res = await tool.execute({
      language: "javascript",
      code: 'console.log("Hello Nekora")',
    });

    expect(res.success).toBe(true);
    expect(res.stdout).toBe("Hello Nekora");
    expect(res.exitCode).toBe(0);
  });

  it("Test 2: Python execution stdout & success", async () => {
    const res = await tool.execute({
      language: "python",
      code: 'print("Hello Nekora")',
    });

    expect(res.success).toBe(true);
    expect(res.stdout).toBe("Hello Nekora");
    expect(res.exitCode).toBe(0);
  });

  it("Test 3: Execution timeout handling", async () => {
    const shortTimeoutTool = new CodeExecutionTool({
      timeout: 1000,
      provider: executor,
    });

    const res = await shortTimeoutTool.execute({
      language: "javascript",
      code: "while(true){}",
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("EXECUTION_TIMEOUT");
  });

  it("Test 4: Browser environment simulation -> SandboxUnavailableError response", async () => {
    class MockBrowserExecutor extends NodeSandboxExecutor {
      async execute(): Promise<any> {
        return {
          success: false,
          stdout: "",
          stderr: "Code execution requires a server-side sandbox environment.",
          exitCode: 1,
          executionTimeMs: 0,
          error: "Code execution requires a server-side sandbox environment.",
          errorCode: "SANDBOX_UNAVAILABLE",
        };
      }
    }

    const browserTool = new CodeExecutionTool({ provider: new MockBrowserExecutor() });
    const res = await browserTool.execute({
      language: "javascript",
      code: 'console.log("Hello")',
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("SANDBOX_UNAVAILABLE");
  });

  it("Test 5: Agent integration executes code_executor and tracks toolsUsed", async () => {
    const agent = new Agent({
      name: "Coding QA Agent",
      instructions: "Execute code snippets when requested.",
      model: new CodeExecutorMockProvider(),
      tools: [tool],
    });

    const res = await agent.run('Use code_executor to run console.log("Hello Nekora")');
    expect(res.runState?.toolsUsed).toEqual(["code_executor"]);
    expect(res.output).toContain("Hello Nekora");
  });
});
