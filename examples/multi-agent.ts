/**
 * Multi-Agent Simulation Example - Nekora AI SDK
 * 
 * Demonstrates multi-agent orchestration, delegation, shared context,
 * and step-by-step task execution tracking.
 * 
 * Flow:
 * User Task -> Manager Agent
 *                 |-- Research Agent (Gathers API requirements)
 *                 |-- Coding Agent (Writes TypeScript implementation)
 *                 |-- Review Agent (Validates security and quality)
 *                 |
 *             Final Synthesis Response Agent
 */

import { Agent, AgentRegistry, HandoffManager, createHandoffTool, GroqProvider } from "@nekora-ai/core";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize shared model provider
const model = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY || "demo_key",
  model: "llama-3.3-70b-versatile",
});

// 1. Initialize Registry and Handoff Manager
const registry = new AgentRegistry();

registry.register({
  id: "manager_agent",
  name: "Manager Agent",
  description: "Orchestrates task execution and delegates subtasks to specialist agents.",
});

registry.register({
  id: "research_agent",
  name: "Research Agent",
  description: "Researches weather API requirements, endpoints, and data schemas.",
});

registry.register({
  id: "coding_agent",
  name: "Coding Agent",
  description: "Writes clean TypeScript code for the weather application.",
});

registry.register({
  id: "review_agent",
  name: "Review Agent",
  description: "Reviews code quality, error handling, and security.",
});

const handoffManager = new HandoffManager(registry, { maxHandoffDepth: 5 });

// 2. Define Specialist Agents
const researchAgent = new Agent({
  name: "Research Agent",
  instructions: "You are an API researcher. Provide clean API specifications for OpenWeatherMap integration.",
  model,
});

const codingAgent = new Agent({
  name: "Coding Agent",
  instructions: "You are a senior TypeScript developer. Write modular, type-safe code based on API research specs.",
  model,
});

const reviewAgent = new Agent({
  name: "Review Agent",
  instructions: "You are a code reviewer. Inspect TypeScript code for type safety, error boundaries, and quality.",
  model,
});

// 3. Define Manager Agent with Handoff Capabilities
const managerAgent = new Agent({
  name: "Manager Agent",
  instructions: "You are an AI Software Architect. Coordinate specialist agents to build complete software solutions.",
  model,
  tools: [createHandoffTool(handoffManager, "manager_agent")],
});

// 4. Multi-Agent Pipeline Execution Simulation
async function runMultiAgentPipeline(userTask: string) {
  console.log("=========================================================================");
  console.log(`🚀 Multi-Agent Task Pipeline Started: "${userTask}"`);
  console.log("=========================================================================\n");

  const sharedContext: Record<string, any> = { task: userTask, history: [] };

  // Step 1: Manager Task Decomposition
  console.log("[LOG][Manager Agent] Analyzing task requirements and delegating subtasks...");
  sharedContext.history.push({ step: 1, agent: "Manager Agent", action: "Decomposed task into Research, Coding, and Review phases." });

  // Step 2: Research Agent Execution
  console.log("[LOG][Research Agent] Executing API Research for OpenWeatherMap integration...");
  const researchOutput = await researchAgent.run(
    `Research API endpoints and JSON payload structures for a weather app using: ${userTask}`
  );
  sharedContext.research = researchOutput.output;
  console.log(`[OUTPUT][Research Agent]: ${researchOutput.output.substring(0, 120)}...\n`);
  sharedContext.history.push({ step: 2, agent: "Research Agent", action: "Completed weather API specs research." });

  // Step 3: Coding Agent Execution
  console.log("[LOG][Coding Agent] Implementing Weather Application in TypeScript...");
  const codingOutput = await codingAgent.run(
    `Write a complete TypeScript function fetching weather based on specs:\n${sharedContext.research}`
  );
  sharedContext.code = codingOutput.output;
  console.log(`[OUTPUT][Coding Agent]: ${codingOutput.output.substring(0, 120)}...\n`);
  sharedContext.history.push({ step: 3, agent: "Coding Agent", action: "Generated TypeScript implementation." });

  // Step 4: Review Agent Execution
  console.log("[LOG][Review Agent] Conducting Code Review & Quality Audit...");
  const reviewOutput = await reviewAgent.run(
    `Review this TypeScript implementation for security and type safety:\n${sharedContext.code}`
  );
  sharedContext.review = reviewOutput.output;
  console.log(`[OUTPUT][Review Agent]: ${reviewOutput.output.substring(0, 120)}...\n`);
  sharedContext.history.push({ step: 4, agent: "Review Agent", action: "Validated code quality and security." });

  // Step 5: Final Synthesis Response
  console.log("[LOG][Manager Agent] Synthesizing Final Project Deliverable...");
  const finalResponse = await managerAgent.run(
    `Synthesize a final response for the user request "${userTask}" using research, code, and review outputs.`
  );

  console.log("\n=========================================================================");
  console.log("🏆 FINAL MULTI-AGENT SYNTHESIS RESPONSE");
  console.log("=========================================================================");
  console.log(finalResponse.output);
  console.log("=========================================================================");
  console.log("📋 Multi-Agent Execution History:");
  sharedContext.history.forEach((h: any) => {
    console.log(`  Step ${h.step} [${h.agent}]: ${h.action}`);
  });
  console.log("=========================================================================\n");
}

async function main() {
  await runMultiAgentPipeline("Build a weather application in TypeScript");
}

main().catch(console.error);
