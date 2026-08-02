import "dotenv/config";

import { Agent } from "../agent/agent.js";
import { GeminiProvider } from "../providers/gemini.provider.js";


const model = new GeminiProvider({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY || "",
});


const agent = new Agent({
  name: "Test Agent",
  instructions:
    "You are a helpful AI assistant. Answer clearly.",
  model,
});


async function main() {
  console.log("🚀 Starting Nekora Agent test...\n");

  const result = await agent.run(
    "Explain what an AI agent is in simple words"
  );

  console.log("Agent Response:");
  console.log(result);
}


main().catch((error) => {
  console.error("❌ Error:");
  console.error(error);
});