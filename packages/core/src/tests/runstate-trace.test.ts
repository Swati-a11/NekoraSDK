import { describe, it, expect } from "vitest";
import { Agent, tool } from "../index.js";
import { ModelProvider, Message, ModelResponse } from "../providers/types.js";
import { z } from "zod";

class DynamicMockProvider implements ModelProvider {
  readonly id = "dynamic_mock";
  readonly modelName = "dynamic-mock-model";

  async generate(messages: Message[]): Promise<ModelResponse> {
    const lastMsg = messages[messages.length - 1]?.content || "";

    if (messages.some((m) => m.role === "tool")) {
      return {
        text: "The result has been processed.",
        finishReason: "stop",
      };
    }

    if (lastMsg.includes("25 * 4") || lastMsg.includes("Calculate")) {
      return {
        toolCalls: [
          {
            id: `tc_${Date.now()}_calc`,
            name: "calculator",
            arguments: { expr: "25 * 4" },
          },
        ],
        finishReason: "tool_calls",
      };
    }

    if (lastMsg.includes("Tokyo") || lastMsg.includes("Weather")) {
      return {
        toolCalls: [
          {
            id: `tc_${Date.now()}_weather`,
            name: "weather_fetcher",
            arguments: { city: "Tokyo" },
          },
        ],
        finishReason: "tool_calls",
      };
    }

    return {
      text: "Default response.",
      finishReason: "stop",
    };
  }
}

describe("RunState & Trace Isolation Engine Tests", () => {
  const calcTool = tool({
    name: "calculator",
    description: "Perform math calculation",
    schema: z.object({ expr: z.string() }),
    execute: async ({ expr }) => ({ result: 100 }),
  });

  const weatherTool = tool({
    name: "weather_fetcher",
    description: "Get city weather",
    schema: z.object({ city: z.string() }),
    execute: async ({ city }) => ({ city, temperature: "24°C" }),
  });

  const agent = new Agent({
    name: "Isolation QA Agent",
    instructions: "Call tools when required.",
    model: new DynamicMockProvider(),
    tools: [calcTool, weatherTool],
  });

  it("Test 1: Run calculator tool -> toolsUsed=['calculator']", async () => {
    const res = await agent.run("Calculate 25 * 4");
    expect(res.runState?.toolsUsed).toEqual(["calculator"]);

    const trace = await agent.getTrace(res.runId);
    expect(trace).not.toBeNull();
    expect(trace?.toolsUsed).toEqual(["calculator"]);
  });

  it("Test 2: Run weather tool -> toolsUsed=['weather_fetcher']", async () => {
    const res = await agent.run("What is the weather in Tokyo?");
    expect(res.runState?.toolsUsed).toEqual(["weather_fetcher"]);

    const trace = await agent.getTrace(res.runId);
    expect(trace).not.toBeNull();
    expect(trace?.toolsUsed).toEqual(["weather_fetcher"]);
  });

  it("Test 3: Run sequentially -> zero state leakage", async () => {
    const res1 = await agent.run("Calculate 25 * 4");
    const res2 = await agent.run("What is the weather in Tokyo?");

    expect(res1.runState?.toolsUsed).toEqual(["calculator"]);
    expect(res2.runState?.toolsUsed).toEqual(["weather_fetcher"]);

    const trace1 = await agent.getTrace(res1.runId);
    const trace2 = await agent.getTrace(res2.runId);

    expect(trace1?.toolsUsed).toEqual(["calculator"]);
    expect(trace2?.toolsUsed).toEqual(["weather_fetcher"]);
  });

  it("Test 4: Run concurrently (Promise.all) -> isolated RunStates & thread safety", async () => {
    const [res1, res2] = await Promise.all([
      agent.run("Calculate 25 * 4"),
      agent.run("What is the weather in Tokyo?"),
    ]);

    expect(res1.runState?.toolsUsed).toEqual(["calculator"]);
    expect(res2.runState?.toolsUsed).toEqual(["weather_fetcher"]);

    expect(res1.runId).not.toEqual(res2.runId);

    const trace1 = await agent.getTrace(res1.runId);
    const trace2 = await agent.getTrace(res2.runId);

    expect(trace1?.toolsUsed).toEqual(["calculator"]);
    expect(trace2?.toolsUsed).toEqual(["weather_fetcher"]);
  });
});
