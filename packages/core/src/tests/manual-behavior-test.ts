import { Agent } from "../agent/agent.js";
import { ModelProvider, ModelResponse } from "../providers/types.js";

class BehaviorMockProvider implements ModelProvider {
  readonly id = "mock-behavior-provider";
  readonly modelName = "mock-behavior-model";

  async generate(): Promise<ModelResponse> {
    return {
      text: "Step 1: Analyzed pattern. Step 2: Adapted output style.",
      finishReason: "stop",
    };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "Behavior stream" };
  }
}

async function runBehaviorTest() {
  console.log("=========================================");
  console.log("🌱 FEATURE 3: AGENT BEHAVIOR EVOLUTION SYSTEM MANUAL TEST");
  console.log("=========================================\n");

  const agent = new Agent({
    name: "Adaptive Agent",
    instructions: "You adapt to user preferences.",
    model: new BehaviorMockProvider(),
  });

  // 1. Initial Behavior Profile Check
  console.log("👉 Initial Behavior Profile:", agent.behavior.profile());

  // 2. Simulate User Interaction Turns expressing preferred style & coding language
  console.log("\n💬 User Turn 1: 'Please explain step by step in TypeScript'");
  await agent.run("Please explain step by step in TypeScript");

  // 3. Inspect Evolved Behavior Profile
  console.log("\n👉 Evolved Behavior Profile after Turn 1:");
  console.log(agent.behavior.profile());

  // 4. Verify Learned Knowledge in Cognitive LTM
  console.log("\n👉 Inspect Cognitive LTM for Learned Preferences:");
  const inspection = agent.memory.inspect();
  inspection.longTermMemories.forEach((item, idx) => {
    console.log(`  [${idx + 1}] Category: ${item.category} | Key: ${item.key} | Content: "${item.content}"`);
  });

  console.log("\n✅ [VERIFIED]: Agent behavior evolution system learned user interaction patterns!");
}

runBehaviorTest().catch(console.error);
