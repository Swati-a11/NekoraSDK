/**
 * Tool Agent Example - Nekora AI SDK
 * 
 * Demonstrates defining type-safe tools using Zod validation
 * and executing autonomous tool calls with an Agent.
 */

import { Agent, tool, GroqProvider } from "@nekora-ai/core";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Define a Calculator Tool
const calculatorTool = tool({
  name: "calculator",
  description: "Perform mathematical calculations",
  schema: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Math operation"),
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async ({ operation, a, b }) => {
    console.log(`[Tool] Calculator executing: ${a} ${operation} ${b}`);
    switch (operation) {
      case "add": return { result: a + b };
      case "subtract": return { result: a - b };
      case "multiply": return { result: a * b };
      case "divide": return { result: b !== 0 ? a / b : "Division by zero error" };
    }
  },
});

// 2. Define a Weather Tool
const weatherTool = tool({
  name: "get_weather",
  description: "Retrieve weather conditions for a city",
  schema: z.object({
    city: z.string().describe("City name"),
  }),
  execute: async ({ city }) => {
    console.log(`[Tool] Fetching weather for: ${city}`);
    return { city, temperature: "24°C", condition: "Sunny", humidity: "50%" };
  },
});

// 3. Initialize Agent with tools
const agent = new Agent({
  name: "Tool Agent",
  instructions: "Answer queries using calculator and weather tools when appropriate.",
  model: new GroqProvider({
    apiKey: process.env.GROQ_API_KEY || "demo_key",
    model: "llama-3.3-70b-versatile",
  }),
  tools: [calculatorTool, weatherTool],
});

async function main() {
  console.log("=== Running Tool Agent ===\n");

  const query = "What is the weather in Tokyo and what is 99 multiplied by 15?";
  console.log(`User Query: "${query}"\n`);

  const result = await agent.run(query);

  console.log("=== Response Output ===");
  console.log(result.output);
}

main().catch(console.error);
