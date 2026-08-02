/**
 * Tool Agent Example - Nekora AI SDK
 * 
 * Demonstrates defining type-safe tools using Zod schemas
 * and attaching them to an Agent for autonomous tool calling.
 */

import { Agent, tool, GroqProvider } from "@nekora-ai/core";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Define a custom Calculator Tool with Zod validation
const calculatorTool = tool({
  name: "calculator",
  description: "Perform mathematical calculations (add, subtract, multiply, divide)",
  schema: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The mathematical operation"),
    a: z.number().describe("First number operand"),
    b: z.number().describe("Second number operand"),
  }),
  execute: async ({ operation, a, b }) => {
    console.log(`[Tool Execution] Operating: ${a} ${operation} ${b}`);
    switch (operation) {
      case "add": return { result: a + b };
      case "subtract": return { result: a - b };
      case "multiply": return { result: a * b };
      case "divide": return { result: b !== 0 ? a / b : "Error: Division by zero" };
    }
  },
});

// 2. Define a Weather Tool
const weatherTool = tool({
  name: "get_weather",
  description: "Get real-time weather information for a given city",
  schema: z.object({
    city: z.string().describe("City name"),
  }),
  execute: async ({ city }) => {
    console.log(`[Tool Execution] Fetching weather for: ${city}`);
    return { city, temperature: "24°C", condition: "Sunny", humidity: "45%" };
  },
});

// 3. Initialize Agent with multiple tools
const agent = new Agent({
  name: "Tool-Enabled Agent",
  instructions: "You are a helpful assistant with access to weather and calculator tools.",
  model: new GroqProvider({
    apiKey: process.env.GROQ_API_KEY || "demo_key",
    model: "llama-3.3-70b-versatile",
  }),
  tools: [calculatorTool, weatherTool],
});

async function main() {
  console.log("Running Tool Agent...\n");

  const query = "What is the weather in Tokyo, and what is 125 multiplied by 8?";
  console.log(`User Query: "${query}"\n`);

  const result = await agent.run(query);

  console.log("=== Final Output ===");
  console.log(result.output);
}

main().catch(console.error);
