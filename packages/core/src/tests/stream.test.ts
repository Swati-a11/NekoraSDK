import { describe, it, expect } from "vitest";
import { Agent, SDKEvent, tool } from "../index.js";
import { z } from "zod";

describe("Agent Streaming Engine Tests", () => {
  it("agent.stream() returns an AsyncIterable & AsyncIterator", async () => {
    const agent = new Agent({
      name: "Streaming Test Agent",
      instructions: "You are a test assistant.",
      model: {
        id: "mock_provider",
        modelName: "mock-model",
        generate: async () => ({ text: "Artificial Intelligence is fascinating." }),
      },
    });

    const stream = agent.stream("Tell me about AI");

    expect(stream).toBeDefined();
    expect(typeof stream[Symbol.asyncIterator]).toBe("function");
    expect(typeof stream.next).toBe("function");

    const events: SDKEvent[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
  });

  it("emits events in exact required sequence including run.started, model.started, token.generated, run.completed", async () => {
    const agent = new Agent({
      name: "Sequence Test Agent",
      instructions: "Answer concisely.",
      model: {
        id: "mock_provider",
        modelName: "mock-model",
        generate: async () => ({ text: "AI is awesome." }),
      },
    });

    const emittedTypes: string[] = [];
    let receivedTokens = "";

    for await (const event of agent.stream("Tell me about AI")) {
      emittedTypes.push(event.type);
      if (event.type === "token.generated") {
        expect(typeof event.token).toBe("string");
        receivedTokens += event.token;
      }
    }

    expect(emittedTypes).toContain("run.started");
    expect(emittedTypes).toContain("model.started");
    expect(emittedTypes).toContain("token.generated");
    expect(emittedTypes).toContain("run.completed");

    const runStartedIdx = emittedTypes.indexOf("run.started");
    const modelStartedIdx = emittedTypes.indexOf("model.started");
    const tokenGenIdx = emittedTypes.indexOf("token.generated");
    const runCompletedIdx = emittedTypes.indexOf("run.completed");

    expect(runStartedIdx).toBeLessThan(modelStartedIdx);
    expect(modelStartedIdx).toBeLessThan(tokenGenIdx);
    expect(tokenGenIdx).toBeLessThan(runCompletedIdx);

    expect(receivedTokens).toBe("AI is awesome.");
  });

  it("emits tool.started and tool.completed when tools are invoked during stream", async () => {
    const weatherTool = tool({
      name: "weather_fetcher",
      description: "Fetch current weather",
      schema: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ city, temp: "22°C" }),
    });

    let callCount = 0;
    const mockModel = {
      id: "mock_tool_model",
      modelName: "mock-tool-model",
      generate: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            text: "",
            toolCalls: [{ id: "tc_1", name: "weather_fetcher", arguments: { city: "Tokyo" } }],
          };
        }
        return { text: "The weather in Tokyo is 22°C." };
      },
    };

    const agent = new Agent({
      name: "Tool Stream Agent",
      instructions: "Use weather tool when asked.",
      model: mockModel,
      tools: [weatherTool],
    });

    const emittedTypes: string[] = [];
    const toolsStarted: string[] = [];
    const toolsCompleted: string[] = [];

    for await (const event of agent.stream("What is the weather in Tokyo?")) {
      emittedTypes.push(event.type);
      if (event.type === "tool.started") {
        toolsStarted.push(event.toolName);
      }
      if (event.type === "tool.completed") {
        toolsCompleted.push(event.toolName);
      }
    }

    expect(emittedTypes).toContain("run.started");
    expect(emittedTypes).toContain("model.started");
    expect(emittedTypes).toContain("tool.started");
    expect(emittedTypes).toContain("tool.completed");
    expect(emittedTypes).toContain("run.completed");

    expect(toolsStarted).toContain("weather_fetcher");
    expect(toolsCompleted).toContain("weather_fetcher");
  });

  it("handles process.stdout.write(event.token) as specified in requirements", async () => {
    const agent = new Agent({
      name: "Stdout Test Agent",
      instructions: "Explain AI",
      model: {
        id: "mock",
        modelName: "mock",
        generate: async () => ({ text: "AI stands for Artificial Intelligence." }),
      },
    });

    const stdoutTokens: string[] = [];

    for await (const event of agent.stream("Tell me about AI")) {
      if (event.type === "token.generated") {
        stdoutTokens.push(event.token);
      }
    }

    expect(stdoutTokens.length).toBeGreaterThan(0);
    expect(stdoutTokens.join("")).toBe("AI stands for Artificial Intelligence.");
  });

  it("emits run.failed when execution errors occur", async () => {
    const agent = new Agent({
      name: "Failing Agent",
      instructions: "Fail test",
      model: {
        id: "failing_mock",
        modelName: "failing-model",
        generate: async () => {
          throw new Error("Simulated Provider Failure");
        },
      },
    });

    const emittedTypes: string[] = [];
    let caughtError: Error | null = null;

    try {
      for await (const event of agent.stream("Will fail")) {
        emittedTypes.push(event.type);
      }
    } catch (err: any) {
      caughtError = err;
    }

    expect(emittedTypes).toContain("run.started");
    expect(emittedTypes).toContain("model.started");
    expect(emittedTypes).toContain("run.failed");
  });
});
