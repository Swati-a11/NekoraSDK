/**
 * Memory Agent Example - Nekora AI SDK
 * 
 * Demonstrates Neko Cognitive Memory and session-based context retention.
 * Conversation 1 stores user facts into memory.
 * Conversation 2 retrieves stored information in a future conversation session.
 */

import { Agent, NekoCognitiveMemory, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Initialize Neko Cognitive Memory
const cognitiveMemory = new NekoCognitiveMemory();

// 2. Pre-seed Long-Term Knowledge
cognitiveMemory.remember(
  "user_profile",
  "name_and_role",
  "Swati - AI Engineer",
  "User's name is Swati and she builds AI applications",
  { importance: 0.95, confidence: 0.98 }
);

// 3. Initialize Agent with Cognitive Memory
const agent = new Agent({
  name: "Memory-Enabled Assistant",
  instructions: "You are a personal assistant. Store and retrieve facts about the user from cognitive memory.",
  model: new GroqProvider({
    apiKey: process.env.GROQ_API_KEY || "demo_key",
    model: "llama-3.3-70b-versatile",
  }),
  memory: cognitiveMemory,
});

async function main() {
  console.log("=== Neko Cognitive Memory Demonstration ===\n");
  const sessionId = "sess_swati_user_1";

  // --- Conversation 1: Storing Context ---
  console.log("--- Conversation 1: Storing Context ---");
  const msg1 = "My name is Swati and I build AI applications.";
  console.log(`User: "${msg1}"`);

  const response1 = await agent.run(msg1, { sessionId });
  console.log(`Agent: "${response1.output}"\n`);

  // --- Conversation 2: Retrieving Context ---
  console.log("--- Conversation 2: Retrieving Stored Knowledge ---");
  const msg2 = "What do you know about me?";
  console.log(`User: "${msg2}"`);

  const response2 = await agent.run(msg2, { sessionId });
  console.log(`Agent: "${response2.output}"\n`);

  // --- Memory Inspection Report ---
  console.log("=== Neko Cognitive Memory Report ===");
  const report = agent.memory.inspect(sessionId);
  console.log(`Short-Term Session Messages Count: ${report.shortTermMessageCount}`);
  console.log(`Long-Term Memories Stored: ${report.longTermMemories.length}`);
  report.longTermMemories.forEach((mem) => {
    console.log(`  - [LTM] Category: ${mem.category} | Key: ${mem.key} | Content: "${mem.content}" (Importance: ${mem.importance})`);
  });
}

main().catch(console.error);
