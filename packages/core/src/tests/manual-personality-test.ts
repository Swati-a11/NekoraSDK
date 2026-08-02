import { Agent } from "../agent/agent.js";
import { PersonalityCompiler } from "../personality/compiler.js";
import { ModelProvider, ModelResponse } from "../providers/types.js";

class PersonalityMockProvider implements ModelProvider {
  readonly id = "mock-personality-provider";
  readonly modelName = "mock-personality-model";

  async generate(messages: any[]): Promise<ModelResponse> {
    const sysMsg = messages.find((m: any) => m.role === "system")?.content || "";
    return {
      text: `Hello! I'm Mochi. Compiled system directives:\n${sysMsg}`,
      finishReason: "stop",
    };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "Personality mock stream" };
  }
}

async function runPersonalityTest() {
  console.log("=========================================");
  console.log("🎭 FEATURE 2: AGENT PERSONALITY PROFILE MANUAL TEST");
  console.log("=========================================\n");

  // 1. Define Personality Profile
  const personality = {
    tone: "friendly" as const,
    style: "concise" as const,
    humor: "light" as const,
    emoji: false,
    formality: "casual" as const,
  };

  // 2. Verify Prompt Compiler Output
  console.log("👉 Step 1: Testing PersonalityCompiler.compile()...");
  const compiledPrompt = PersonalityCompiler.compile("Mochi", personality);
  console.log("  📜 Compiled System Prompt Block:");
  console.log(compiledPrompt);

  // 3. Create Agent with Personality Profile
  console.log("\n👉 Step 2: Running Agent with Personality Profile...");
  const agent = new Agent({
    name: "Mochi",
    instructions: "You help users research topics.",
    personality,
    model: new PersonalityMockProvider(),
  });

  const result = await agent.run("Hi Mochi!");
  console.log("\n🤖 Agent Response:");
  console.log(result.output);
}

runPersonalityTest().catch(console.error);
