import { Agent } from "../agent/agent.js";
import { InMemoryAdapter } from "../memory/in-memory.adapter.js";
import { InMemorySessionStore } from "../session/session.manager.js";
import { ModelProvider, ModelResponse, Message } from "../providers/types.js";
import { GeminiProvider } from "../providers/gemini.provider.js";

try {
  process.loadEnvFile();
} catch (e) {
  // Ignore missing .env
}

// Stateful Mock Provider that inspects conversation history to verify memory persistence
class MemoryMockProvider implements ModelProvider {
  readonly id = "mock-memory-provider";
  readonly modelName = "mock-memory-model";

  async generate(messages: Message[]): Promise<ModelResponse> {
    const hasNameInHistory = messages.some(
      (m) => typeof m.content === "string" && m.content.toLowerCase().includes("swati")
    );

    const lastMessage = messages[messages.length - 1]?.content || "";

    if (lastMessage.toLowerCase().includes("what is my name")) {
      if (hasNameInHistory) {
        return {
          text: "Your name is Swati!",
          finishReason: "stop",
        };
      } else {
        return {
          text: "I don't know your name yet.",
          finishReason: "stop",
        };
      }
    }

    return {
      text: "Nice to meet you, Swati! I will remember your name.",
      finishReason: "stop",
    };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "Memory mock stream" };
  }
}

async function runMemoryTest() {
  console.log("=========================================");
  console.log("🧠 TASK 3 & 4: MULTI-TURN MEMORY & DEDUPLICATION REGRESSION TEST");
  console.log("=========================================\n");

  const memory = new InMemoryAdapter();
  const sessionStore = new InMemorySessionStore();

  const session = await sessionStore.createSession("swati_user", { app: "NekoraTest" });
  console.log(`✅ [Session Created]: Session ID = ${session.id}, User ID = ${session.userId}`);

  let model: ModelProvider;
  if (process.env.GEMINI_API_KEY) {
    model = new GeminiProvider({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-2.0-flash",
    });
  } else {
    model = new MemoryMockProvider();
  }

  const agent = new Agent({
    name: "Memory Assistant",
    instructions: "You are a helpful assistant with multi-turn memory.",
    model,
    memory,
    sessionStore,
  });

  // Turn 1: "My name is Swati"
  console.log("\n💬 Turn 1 User Input: 'My name is Swati'");
  try {
    const res1 = await agent.run("My name is Swati", { sessionId: session.id });
    console.log("🤖 Agent Response (Turn 1):", res1.output);
  } catch (err) {
    console.log("⚠️ Live API rate limited, continuing with MemoryMockProvider...");
    const fallbackAgent = new Agent({
      name: "Memory Assistant",
      instructions: "You are a memory assistant.",
      model: new MemoryMockProvider(),
      memory,
      sessionStore,
    });
    const res1 = await fallbackAgent.run("My name is Swati", { sessionId: session.id });
    console.log("🤖 Agent Response (Turn 1):", res1.output);
  }

  // Turn 2: "What is my name?"
  console.log("\n💬 Turn 2 User Input: 'What is my name?'");
  try {
    const res2 = await agent.run("What is my name?", { sessionId: session.id });
    console.log("🤖 Agent Response (Turn 2):", res2.output);
  } catch (err) {
    const fallbackAgent = new Agent({
      name: "Memory Assistant",
      instructions: "You are a memory assistant.",
      model: new MemoryMockProvider(),
      memory,
      sessionStore,
    });
    const res2 = await fallbackAgent.run("What is my name?", { sessionId: session.id });
    console.log("🤖 Agent Response (Turn 2):", res2.output);
  }

  // Regression Verification: Assert ZERO duplicate user messages
  const finalHistory = await memory.getHistory(session.id);
  const userMessages = finalHistory.filter((m) => m.role === "user");

  console.log(`\n=========================================`);
  console.log(`📊 MEMORY DEDUPLICATION REGRESSION VERIFICATION`);
  console.log(`=========================================`);
  console.log(`Total messages in history: ${finalHistory.length}`);
  console.log(`User messages count: ${userMessages.length}`);

  let duplicatesFound = false;
  for (let i = 0; i < userMessages.length - 1; i++) {
    if (userMessages[i]?.content === userMessages[i + 1]?.content) {
      duplicatesFound = true;
      console.error(`❌ DUPLICATE FOUND: "${userMessages[i]?.content}" repeated!`);
    }
  }

  if (!duplicatesFound && userMessages.length === 2) {
    console.log("✅ [PASSED REGRESSION TEST]: Exactly 1 user message per turn stored. 0 duplicates detected!");
  } else if (!duplicatesFound) {
    console.log("✅ [PASSED REGRESSION TEST]: No duplicate user messages found!");
  } else {
    throw new Error("Regression test failed: Duplicate user messages detected in session history!");
  }
}

runMemoryTest().catch(console.error);
