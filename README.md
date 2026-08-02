# 🐾 Nekora AI

> A TypeScript-first, provider-agnostic AI Agent SDK built from scratch for reliable autonomous agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

---

## 🌟 Why Nekora AI?

Existing AI agent frameworks are often heavy abstractions with obscure execution chains and vendor lock-in. **Nekora AI** is engineered from scratch with a different philosophy:

- 🎯 **Simple Agent Creation**: Define agents, tools, personalities, and guardrails in clean, readable TypeScript with optional model auto-selection.
- 🧠 **Neko Cognitive Memory**: Production-grade multi-layer memory (Short Term, Working Memory, Long Term Memory with decay & conflict resolution).
- 🔌 **Provider Freedom**: Seamlessly swap providers (OpenAI, Claude, Gemini, Groq, OpenRouter) or configure production-grade Fallback chains without rewriting agent code.
- 🛡️ **Reliable Execution Engine**: Built-in exponential backoff, request timeouts, and stateful multi-turn memory deduplication.
- 🧪 **Agent Sandbox Simulation**: Preview planned tool calls, risk levels, and timeline before executing real side-effects.
- ⚡ **Developer-Friendly & TypeScript-First**: 100% TypeScript with native Zod schema inference, type-safe streaming events, and zero framework bloat.

---

## ⚡ Advanced Features

- 🧠 **Neko Cognitive Memory**: Short-Term sliding context, Working Memory task tracking, Long-Term knowledge, Importance Decay, and Conflict Resolution (`agent.memory.inspect()`).
- 🎭 **Agent Personality Profile**: Customize tone, style, humor, formality, and emoji directives compiled into system instructions.
- 🌱 **Agent Behavior Evolution**: Learns user interaction styles and coding preferences over time (`agent.behavior.profile()`).
- 🧪 **Agent Sandbox Mode**: Dry-run simulation mode for safety testing without executing real tools (`agent.simulate()`).
- 🔄 **Multi-Agent Handoffs**: Transfer conversation context and memory between specialized agents with loop detection (`A -> B -> A`).
- 🛡️ **Guardrail Pipeline**: Input, Tool, and Output validation stages with PII redaction and policy enforcement.
- 📐 **Structured Outputs**: Validate output with Zod schemas, automatic markdown JSON extraction, repair prompts, and retry generation.
- 🌊 **Streaming & Event Pipeline**: Native `AsyncIterator` streaming and EventEmitter for real-time tokens, tool calls, fallback events, and trace events.

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install @nekora-ai/core zod
# or with pnpm
pnpm add @nekora-ai/core zod
```

### 2. Scaffold a New Project with CLI

```bash
npx nekora init my-agent
cd my-agent
npm run dev
```

### 3. Create your First Agent with Personality & Cognitive Memory

```typescript
import { Agent, tool, NekoCognitiveMemory } from "@nekora-ai/core";
import { z } from "zod";

// 1. Define a tool with Zod validation
const weatherTool = tool({
  name: "get_weather",
  description: "Get the current weather for a location",
  schema: z.object({
    city: z.string().describe("The name of the city"),
  }),
  execute: async ({ city }) => {
    return { city, temperature: "24°C", condition: "Sunny" };
  },
});

// 2. Create Agent with Personality & Cognitive Memory
const agent = new Agent({
  name: "Mochi",
  personality: {
    tone: "friendly",
    style: "concise",
    humor: "light",
    emoji: false,
    formality: "casual",
  },
  instructions: "You are a helpful assistant.",
  tools: [weatherTool],
  memory: new NekoCognitiveMemory(),
});

// 3. Run the Agent
async function main() {
  const result = await agent.run("What's the weather like in Tokyo?", {
    sessionId: "session_123",
  });

  console.log("Output:", result.output);

  // Inspect Cognitive Memory
  console.log("Memory Inspection:", agent.memory.inspect());
}

main();
```

---

## 🧠 Neko Cognitive Memory System

Nekora features a multi-layer cognitive brain:

1. **Short Term Memory (STM)**: Session message history with automatic context window compression.
2. **Working Memory**: Active goal, constraints, current step, and temporary decisions.
3. **Long Term Memory (LTM)**: Permanent knowledge with importance scoring ($0.0 - 1.0$), decay over time, and in-place conflict resolution.

```typescript
// Store long-term knowledge
agent.memory.remember(
  "coding_preference",
  "language",
  "typescript",
  "User prefers TypeScript for full-stack development",
  { importance: 0.95, confidence: 0.98 }
);

// Inspect memory state
const report = agent.memory.inspect();
console.log(report.longTermMemories);
```

---

## 🎭 Agent Personality Profile

```typescript
const agent = new Agent({
  name: "Mochi",
  personality: {
    tone: "friendly",
    style: "concise",
    humor: "light",
    emoji: false,
    formality: "casual",
  },
  instructions: "Help users research topics.",
});
```

---

## 🌱 Agent Behavior Evolution

The agent automatically learns user interaction patterns over time:

```typescript
await agent.run("Please explain step by step in TypeScript");

// View learned behavior profile
console.log(agent.behavior.profile());
// Output: { communication: { preferredStyle: 'detailed' }, coding: { language: 'typescript' } }
```

---

## 🧪 Agent Sandbox / Simulation Mode

Preview what tools an agent WOULD call and evaluate risk levels without executing side-effects:

```typescript
const simulation = await agent.simulate("Delete all old database records");

console.log(simulation.riskLevel); // "HIGH"
console.log(simulation.plannedActions); // [{ tool: "delete_database", risk: "HIGH", approvalRequired: true }]
console.log(simulation.timeline); // Action step timeline
```

---

## 🛠️ Tool System & Permissions

Create tools with schema validation, permission checks, and human approval:

```typescript
import { tool } from "@nekora-ai/core";
import { z } from "zod";

const deleteUserTool = tool({
  name: "delete_user",
  description: "Permanently delete a user account",
  permissions: ["admin:write"],
  requireApproval: true, // Requires human approval before executing
  schema: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }) => {
    return { status: "deleted", userId };
  },
});
```

---

## 🔄 Multi-Agent Handoffs

```typescript
import { AgentRegistry, HandoffManager, createHandoffTool } from "@nekora-ai/core";

const registry = new AgentRegistry();
registry.register({ id: "triage_agent", name: "Triage Agent", description: "Route requests" });
registry.register({ id: "coder_agent", name: "Coding Agent", description: "Write and review code" });

const handoffManager = new HandoffManager(registry, { maxHandoffDepth: 5 });
const handoffTool = createHandoffTool(handoffManager, "triage_agent");
```

---

## 💻 CLI & Playground UI

- Scaffold projects: `npx nekora init <project-name>`
- Launch visual playground: `pnpm dev`

---

## 📜 License

MIT © Nekora AI Team
