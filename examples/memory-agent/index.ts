/**
 * Memory Agent Example - Nekora AI SDK
 * 
 * Demonstrates session-based conversation context and Neko Cognitive Memory
 * for long-term fact retention across agent interactions.
 */

import { Agent, NekoCognitiveMemory, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Initialize Neko Cognitive Memory
const memory = new NekoCognitiveMemory();

// 2. Pre-seed Long-Term Knowledge
memory.remember(
  "user_preference",
  "language",
  "TypeScript",
  "User prefers TypeScript for full-stack application development",
  { importance: 0.95, confidence: 0.98 }
);

// 3. Initialize Memory Agent
const agent = new Agent({
  name: "Cognitive Memory Agent",
  instructions: "You are a personal assistant that customizes answers using stored memory.",
  model: new GroqProvider({
    apiKey: process.env.GROQ_API_KEY || "demo_key",
    model: "llama-3.3-70b-versatile",
  }),
  memory,
});

async function main() {
  console.log("Running Memory Agent...\n");
  const sessionId = "session_user_42";

  // Turn 1: User introduces themselves
  console.log("--- Turn 1 ---");
  console.log("User: Hi, my name is Alex and I live in Seattle.");
  const res1 = await agent.run("Hi, my name is Alex and I live in Seattle.", { sessionId });
  console.log("Agent:", res1.output, "\n");

  // Turn 2: Retrieve short-term session context
  console.log("--- Turn 2 ---");
  console.log("User: What is my name and location?");
  const res2 = await agent.run("What is my name and location?", { sessionId });
  console.log("Agent:", res2.output, "\n");

  // Inspect Cognitive Memory state
  console.log("--- Memory Report Inspection ---");
  const report = agent.memory.inspect();
  console.log("Long Term Memories stored:", report.longTermMemories.length);
  console.log("Active Session Messages:", report.shortTermMessages.length);
}

main().catch(console.error);
