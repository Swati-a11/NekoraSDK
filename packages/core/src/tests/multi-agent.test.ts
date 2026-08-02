import { describe, it, expect } from "vitest";
import { Agent } from "../agent/index.js";
import { NekoCognitiveMemory } from "../memory/index.js";
import { AgentRegistry, HandoffManager, createHandoffTool } from "../handoff/index.js";
import { ModelProvider, ModelResponse, Message } from "../providers/types.js";

/**
 * Mock Model Provider for Multi-Agent & Memory Testing
 */
class MockTestProvider implements ModelProvider {
  readonly id = "mock_test_provider";
  readonly name = "Mock Test Provider";

  async generate(messages: Message[]): Promise<ModelResponse> {
    return this.generateResponse(messages);
  }

  async generateResponse(messages: Message[]): Promise<ModelResponse> {
    const userMsgs = messages.filter((m) => m.role === "user");
    const lastMsg = userMsgs[userMsgs.length - 1]?.content || "";

    let responseText = `Processed query: ${lastMsg}`;
    if (lastMsg.includes("Swati")) {
      responseText = "Nice to meet you, Swati! I have stored your information.";
    } else if (lastMsg.includes("know about me")) {
      responseText = "Your name is Swati and you build AI applications.";
    } else if (lastMsg.includes("Research Weather API")) {
      responseText = "Research specs for Weather API";
    }

    return {
      id: "resp_test",
      text: responseText,
      content: responseText,
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
    };
  }
}

describe("Task 7: Memory & Multi-Agent Collaboration Integration Tests", () => {
  it("should store user facts and retrieve context across sessions in Cognitive Memory", async () => {
    const memory = new NekoCognitiveMemory();

    // Store Long-Term Memory
    memory.remember(
      "user_profile",
      "identity",
      { name: "Swati", role: "AI Developer" },
      "User's name is Swati and she builds AI applications",
      { importance: 0.95, confidence: 0.99 }
    );

    const provider = new MockTestProvider();
    const agent = new Agent({
      name: "Memory Test Agent",
      instructions: "Remember user context.",
      model: provider,
      memory,
    });

    const sessionId = "test_session_swati";

    // Turn 1
    const res1 = await agent.run("My name is Swati", { sessionId });
    expect(res1.output).toContain("Swati");

    // Turn 2
    const res2 = await agent.run("What do you know about me?", { sessionId });
    expect(res2.output).toContain("Swati");

    const report = memory.inspect(sessionId);
    expect(report.shortTermMessageCount).toBe(4);
    expect(report.longTermMemories.length).toBeGreaterThanOrEqual(1);
    expect(report.longTermMemories[0]?.key).toBe("identity");
  });

  it("should coordinate multi-agent handoffs and track shared execution history", async () => {
    const registry = new AgentRegistry();
    registry.register({ id: "manager", name: "Manager Agent", description: "Orchestrates tasks" });
    registry.register({ id: "worker", name: "Worker Agent", description: "Executes subtasks" });

    const handoffManager = new HandoffManager(registry, { maxHandoffDepth: 3 });
    const handoffTool = createHandoffTool(handoffManager, "manager");

    const provider = new MockTestProvider();

    const workerAgent = new Agent({
      name: "Worker Agent",
      instructions: "Perform delegated subtasks.",
      model: provider,
    });

    // Verify Handoff execution
    const handoffResult: any = await handoffTool.execute({
      targetAgentId: "worker",
      reason: "Delegating code review subtask",
      context: { task: "Build Weather App", step: "Review" },
    });

    expect(handoffResult.status).toBe("handoff_initiated");
    expect(handoffResult.handoffContext.toAgentId).toBe("worker");

    const workerRes = await workerAgent.run("Perform code review for Weather App");
    expect(workerRes.output).toContain("Weather App");
  });

  it("should share context across multi-agent steps", async () => {
    const sharedContext: Record<string, any> = { history: [] };
    const provider = new MockTestProvider();

    const researchAgent = new Agent({ name: "Researcher", instructions: "Research APIs", model: provider });
    const codingAgent = new Agent({ name: "Coder", instructions: "Write TypeScript", model: provider });

    const step1 = await researchAgent.run("Research Weather API");
    sharedContext.history.push({ step: 1, output: step1.output });

    const step2 = await codingAgent.run(`Implement code using research: ${sharedContext.history[0].output}`);
    sharedContext.history.push({ step: 2, output: step2.output });

    expect(sharedContext.history.length).toBe(2);
    expect(sharedContext.history[1].output).toContain("Research specs for Weather API");
  });
});
