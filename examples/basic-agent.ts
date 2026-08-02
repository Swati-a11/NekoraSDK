/**
 * Basic Agent Example - Nekora AI SDK
 * 
 * Demonstrates initializing a basic agent with instructions and executing a prompt.
 */

import { Agent, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Initialize LLM Model Provider
const model = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY || "demo_key",
  model: "llama-3.3-70b-versatile",
});

// 2. Initialize Nekora Agent
const agent = new Agent({
  name: "Assistant Agent",
  instructions: "You are a concise, helpful AI assistant. Answer user queries accurately.",
  model,
});

// 3. Run Agent Execution
async function main() {
  console.log("=== Running Basic Agent ===");

  const prompt = "Explain quantum computing in 2 bullet points.";
  console.log(`Prompt: "${prompt}"\n`);

  const result = await agent.run(prompt);

  console.log("=== Response Output ===");
  console.log(result.output);

  console.log("\n=== Execution Metrics ===");
  console.log(`Run ID: ${result.runId}`);
  console.log(`Tokens Used: ${result.totalTokens}`);
  console.log(`Duration: ${result.durationMs}ms`);
}

main().catch(console.error);
