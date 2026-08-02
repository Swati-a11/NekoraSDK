/**
 * Streaming Agent Example - Nekora AI SDK
 * 
 * Demonstrates real-time token and event streaming using
 * native AsyncIterator pattern via agent.stream()
 */

import { Agent, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Initialize Agent
const agent = new Agent({
  name: "Streaming Storyteller",
  instructions: "You are a creative writer. Write short, engaging stories.",
  model: new GroqProvider({
    apiKey: process.env.GROQ_API_KEY || "demo_key",
    model: "llama-3.3-70b-versatile",
  }),
});

// 2. Stream tokens in real time
async function main() {
  console.log("=== Real-time Event & Token Streaming ===\n");

  const prompt = "Write a 3-sentence story about an AI discovery on Mars.";

  for await (const event of agent.stream(prompt)) {
    switch (event.type) {
      case "run.started":
        console.log(`[Event] Agent Run Started (Run ID: ${event.runId})`);
        break;

      case "model.started":
        console.log(`[Event] Model Generation Started (${event.model})`);
        break;

      case "token.generated":
        // Print streamed tokens immediately to stdout
        process.stdout.write(event.token);
        break;

      case "tool.started":
        console.log(`\n[Event] Tool Started: ${event.toolName}`);
        break;

      case "tool.completed":
        console.log(`[Event] Tool Completed: ${event.toolName}`);
        break;

      case "run.completed":
        console.log("\n\n[Event] Agent Run Completed Successfully!");
        console.log(`Total Tokens: ${event.result.totalTokens}`);
        console.log(`Duration: ${event.result.durationMs}ms`);
        break;

      case "run.failed":
        console.error(`\n[Event] Agent Run Failed: ${event.error}`);
        break;
    }
  }
}

main().catch(console.error);
