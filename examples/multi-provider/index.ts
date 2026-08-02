/**
 * Multi-Provider & Fallback Chain Example - Nekora AI SDK
 * 
 * Demonstrates combining multiple model providers (Groq, OpenAI, Claude)
 * into a resilient FallbackProvider chain.
 */

import {
  Agent,
  GroqProvider,
  OpenAIProvider,
  ClaudeProvider,
  FallbackProvider,
} from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Configure Primary Model Provider (e.g. Groq)
const primaryProvider = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY || "demo_key",
  model: "llama-3.3-70b-versatile",
});

// 2. Configure Secondary Fallback Providers
const openaiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY || "demo_key",
  model: "gpt-4o-mini",
});

const claudeProvider = new ClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY || "demo_key",
  model: "claude-3-haiku-20240307",
});

// 3. Create Resilient Fallback Chain Provider
const resilientModel = new FallbackProvider({
  primary: primaryProvider,
  fallbacks: [openaiProvider, claudeProvider],
});

// 4. Initialize Agent with Fallback Model
const agent = new Agent({
  name: "Resilient Multi-Provider Agent",
  instructions: "Answer critical infrastructure questions with high reliability.",
  model: resilientModel,
});

async function main() {
  console.log("Running Multi-Provider Fallback Agent...\n");

  const result = await agent.run(
    "What are the key architectural advantages of multi-cloud deployments?"
  );

  console.log("=== Agent Output ===");
  console.log(result.output);
  console.log(`\nTokens Used: ${result.totalTokens}`);
  console.log(`Duration: ${result.durationMs}ms`);
}

main().catch(console.error);
