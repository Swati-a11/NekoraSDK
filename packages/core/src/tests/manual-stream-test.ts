import { Agent } from "../agent/agent.js";
import { tool } from "../tools/tool.js";
import { ModelProvider, ModelResponse } from "../providers/types.js";
import { z } from "zod";

class StreamMockProvider implements ModelProvider {
  readonly id = "mock-stream-provider";
  readonly modelName = "mock-stream-model";
  private step = 0;

  async generate(): Promise<ModelResponse> {
    this.step++;
    if (this.step === 1) {
      return {
        text: "Checking search database...",
        finishReason: "tool_calls",
        toolCalls: [{ id: "call_str_1", name: "search_news", arguments: { query: "AI technology" } }],
      };
    }
    return {
      text: "AI technology is rapidly transforming software development with autonomous agents.",
      finishReason: "stop",
    };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "AI technology " };
    yield { deltaText: "is rapidly transforming " };
    yield { deltaText: "software development." };
  }
}

async function runStreamTest() {
  console.log("=========================================");
  console.log("🌊 TASK 5: REAL-TIME STREAMING MANUAL TEST");
  console.log("=========================================\n");

  const searchTool = tool({
    name: "search_news",
    description: "Search news updates",
    schema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      await new Promise((r) => setTimeout(r, 50));
      return { query, headline: "Autonomous Agents reach 10x adoption" };
    },
  });

  const agent = new Agent({
    name: "Stream Assistant",
    instructions: "Stream answers progressively",
    model: new StreamMockProvider(),
    tools: [searchTool],
  });

  console.log("👉 Initiating agent.stream()...\n");
  const eventCounts: Record<string, number> = {};

  for await (const event of agent.stream("Summarize AI tech news")) {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;

    switch (event.type) {
      case "run.started":
        console.log(`🚀 [EVENT]: run.started -> Run ID: ${event.runId}, Agent: ${event.agentId}`);
        break;
      case "model.started":
        console.log(`🤖 [EVENT]: model.started -> Model: ${event.model}, Messages: ${event.messageCount}`);
        break;
      case "token.generated":
        process.stdout.write(`🔤 [TOKEN STREAM]: ${JSON.stringify(event.delta)}\n`);
        break;
      case "tool.started":
        console.log(`⚡ [EVENT]: tool.started -> Tool: ${event.toolName}`);
        break;
      case "tool.completed":
        console.log(`✅ [EVENT]: tool.completed -> Tool: ${event.toolName}, Result:`, event.output);
        break;
      case "run.completed":
        console.log(`🎉 [EVENT]: run.completed -> Output: ${(event.result as any).output}`);
        break;
    }
  }

  console.log("\n=========================================");
  console.log("📊 STREAM EVENT VERIFICATION SUMMARY:");
  console.log("=========================================");
  Object.entries(eventCounts).forEach(([type, count]) => {
    console.log(`  - Event '${type}': emitted ${count} time(s)`);
  });
}

runStreamTest().catch(console.error);
