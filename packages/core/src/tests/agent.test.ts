import { describe, it, expect } from "vitest";
import {
  Agent,
  tool,
  ModelProvider,
  ModelResponse,
  InMemoryAdapter,
  GuardrailPipeline,
  Guardrail,
  GuardrailContext,
  GuardrailResult,
  AgentRegistry,
  HandoffManager,
  createHandoffTool,
} from "../index.js";
import { z } from "zod";

// Mock Provider for Unit Tests
class MockModelProvider implements ModelProvider {
  readonly id = "mock-provider";
  readonly modelName = "mock-model";

  public responses: ModelResponse[] = [];
  public callCount = 0;

  constructor(responses: ModelResponse[]) {
    this.responses = [...responses];
  }

  async generate(): Promise<ModelResponse> {
    this.callCount++;
    const res = this.responses.shift();
    if (!res) {
      return {
        text: "Default mock response",
        finishReason: "stop",
      };
    }
    return res;
  }
}

describe("Agent & Runtime Engine", () => {
  it("1. Simple agent response", async () => {
    const mockModel = new MockModelProvider([
      { text: "Hello! How can I assist you today?", finishReason: "stop" },
    ]);

    const agent = new Agent({
      name: "SimpleAgent",
      instructions: "You are a helpful assistant.",
      model: mockModel,
    });

    const result = await agent.run("Hi there");
    expect(result.output).toBe("Hello! How can I assist you today?");
    expect(result.steps).toBe(1);
  });

  it("2. Tool calling and tool execution flow", async () => {
    const mockModel = new MockModelProvider([
      {
        text: "",
        finishReason: "tool_calls",
        toolCalls: [
          {
            id: "call_1",
            name: "calculator",
            arguments: { a: 10, b: 20 },
          },
        ],
      },
      {
        text: "The result of 10 + 20 is 30.",
        finishReason: "stop",
      },
    ]);

    const calcTool = tool({
      name: "calculator",
      description: "Add two numbers",
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      execute: async ({ a, b }) => a + b,
    });

    const agent = new Agent({
      name: "CalcAgent",
      instructions: "Perform calculations",
      model: mockModel,
      tools: [calcTool],
    });

    const result = await agent.run("Calculate 10 + 20");
    expect(result.output).toBe("The result of 10 + 20 is 30.");
    expect(result.steps).toBe(2);
  });

  it("3. Invalid tool input handling", async () => {
    const mockModel = new MockModelProvider([
      {
        text: "",
        finishReason: "tool_calls",
        toolCalls: [
          {
            id: "call_bad",
            name: "typedTool",
            arguments: { age: "not-a-number" }, // Invalid argument
          },
        ],
      },
      {
        text: "Handled error gracefully",
        finishReason: "stop",
      },
    ]);

    const typedTool = tool({
      name: "typedTool",
      description: "Requires valid age number",
      schema: z.object({
        age: z.number(),
      }),
      execute: async ({ age }) => `Age is ${age}`,
    });

    const agent = new Agent({
      name: "ValidatorAgent",
      instructions: "Test invalid inputs",
      model: mockModel,
      tools: [typedTool],
    });

    const result = await agent.run("Test invalid age");
    expect(result.output).toBe("Handled error gracefully");
    // Tool result message in context should contain error string
    const toolMsg = result.messages.find((m) => m.role === "tool");
    expect(toolMsg?.content).toContain("Validation failed");
  });

  it("4. Guardrail rejection", async () => {
    const blockingGuardrail: Guardrail = {
      name: "BlockProfanity",
      stage: "input",
      async validate(content: unknown): Promise<GuardrailResult> {
        if (typeof content === "string" && content.includes("forbidden")) {
          return { passed: false, action: "block", reason: "Forbidden content detected" };
        }
        return { passed: true, action: "allow" };
      },
    };

    const pipeline = new GuardrailPipeline().register(blockingGuardrail);

    const mockModel = new MockModelProvider([
      { text: "Should not be reached", finishReason: "stop" },
    ]);

    const agent = new Agent({
      name: "GuardrailAgent",
      instructions: "Safe agent",
      model: mockModel,
      guardrails: pipeline,
    });

    await expect(agent.run("Execute forbidden command")).rejects.toThrow("Forbidden content detected");
  });

  it("5. Memory persistence and multi-turn conversation", async () => {
    const mockModel = new MockModelProvider([
      { text: "Nice to meet you, Alice!", finishReason: "stop" },
    ]);

    const memory = new InMemoryAdapter();

    const agent = new Agent({
      name: "MemoryAgent",
      instructions: "Remember user details",
      model: mockModel,
      memory,
    });

    const sessionId = "user_session_1";
    await agent.run("My name is Alice", { sessionId });

    const history = await memory.getHistory(sessionId);
    expect(history.length).toBe(2); // user + assistant message
    expect(history[0]?.content).toBe("My name is Alice");
    expect(history[1]?.content).toBe("Nice to meet you, Alice!");
  });

  it("6. Handoff tool execution and registry check", async () => {
    const registry = new AgentRegistry();
    registry.register({ id: "support_agent", name: "Support Agent", description: "Customer support" });
    registry.register({ id: "billing_agent", name: "Billing Agent", description: "Billing questions" });

    const handoffManager = new HandoffManager(registry);
    const handoffTool = createHandoffTool(handoffManager, "support_agent");

    const res = await handoffTool.execute(
      {
        targetAgentId: "billing_agent",
        reason: "User asked about refund",
      },
      { runId: "test_run_1" }
    );

    expect((res as any).status).toBe("handoff_initiated");
    expect((res as any).handoffContext.toAgentId).toBe("billing_agent");
  });
});
