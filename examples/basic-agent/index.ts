/**
 * Basic Agent Example - Nekora AI SDK
 * 
 * Demonstrates creating a simple AI agent using @nekora-ai/core
 * and executing a single task.
 */

import { Agent, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Initialize the LLM Model Provider
const model = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY || "demo_key",
  model: "llama-3.3-70b-versatile",
});

// 2. Initialize the Nekora Agent
const agent = new Agent({
  name: "Basic Assistant",
  instructions: "You are a concise, helpful AI assistant.",
  model,
});

// 3. Execute an Agent Run
async function main() {
  console.log("Running Basic Agent...\n");

  const result = await agent.run(
    "Explain the difference between compiler and interpreter in 2 bullet points."
  );

  console.log("=== Agent Output ===");
  console.log(result.output);
  console.log("\n=== Execution Metadata ===");
  console.log(`Run ID: ${result.runId}`);
  console.log(`Tokens Used: ${result.totalTokens}`);
  console.log(`Duration: ${result.durationMs}ms`);
}

main().catch(console.error);
