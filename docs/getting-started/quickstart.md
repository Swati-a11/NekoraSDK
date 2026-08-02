# 🚀 Quickstart Guide - Nekora AI

Welcome to **Nekora AI**! This guide gets you up and running with your first autonomous AI agent in under 2 minutes.

---

## 1. Installation

```bash
npm install @nekora-ai/core zod
# or with pnpm
pnpm add @nekora-ai/core zod
```

---

## 2. Environment Setup

Set your preferred provider API key in your environment or `.env` file:

```bash
export GEMINI_API_KEY="your-gemini-api-key"
# or
export OPENAI_API_KEY="your-openai-api-key"
```

---

## 3. Your First Agent

Create `agent.ts`:

```typescript
import { Agent, tool } from "@nekora-ai/core";
import { z } from "zod";

// Define a type-safe tool with Zod validation
const calculatorTool = tool({
  name: "add_numbers",
  description: "Add two numbers together",
  schema: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => {
    return { result: a + b };
  },
});

// Create the Agent (Model is auto-detected from environment keys!)
const agent = new Agent({
  name: "Math Assistant",
  instructions: "You answer questions and solve math problems using tools when required.",
  tools: [calculatorTool],
});

async function main() {
  const result = await agent.run("What is 42 plus 58?");
  console.log("Output:", result.output);
}

main();
```

---

## 4. Run your Agent

```bash
npx tsx agent.ts
```
