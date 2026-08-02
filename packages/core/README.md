# Nekora AI Core (@nekora-ai/core)

A TypeScript-first, provider-agnostic AI Agent SDK built from scratch for reliable, production-grade autonomous agents.

---

## 1. Overview

Nekora AI is an open-source TypeScript framework designed to build stateful, resilient, and observable AI agents. Many agent frameworks introduce high-level abstractions that obfuscate execution loops, lock developers into specific model vendors, or lack runtime safety mechanisms.

Nekora AI is built on a clean architectural foundation with zero framework bloat:

- **Stateful Runtime Isolation**: Every agent execution runs within an isolated execution context with thread-safe tracing, memory, and usage tracking.
- **Provider Agnostic**: Native support for OpenAI, Anthropic Claude, Google Gemini, Groq, and OpenRouter, plus customizable Fallback chains.
- **Multi-Layer Cognitive Memory**: Short-Term sliding memory, Working Memory task tracking, and Long-Term Memory with importance decay and conflict resolution.
- **Human-in-the-Loop Safety**: Granular risk analysis and asynchronous human approval hooks before executing high-risk tools.
- **Agent Sandbox Simulation**: Dry-run simulation mode to evaluate tool decisions, risk levels, and timelines before side-effects are applied.

---

## 2. Features

- **Custom Agent Runtime**: Deterministic multi-turn execution engine with iteration limits, timeouts, and structured repair loops.
- **Multi-Provider Support**:
  - OpenAI (`OpenAIProvider`)
  - Anthropic Claude (`ClaudeProvider`)
  - Google Gemini (`GeminiProvider`)
  - Groq (`GroqProvider`)
  - OpenRouter (`OpenRouterProvider`)
  - Fallback Provider (`FallbackProvider`)
- **Type-Safe Tool System**: Tool definitions built with Zod schema inference, permission requirements, and execution sandboxing.
- **Advanced Code Execution**: `CodingTool` supporting sandboxed execution of JavaScript, TypeScript, and Python with pre-execution syntax validation.
- **Neko Cognitive Memory**: Multi-tiered memory engine featuring Short-Term Memory (STM), Working Memory, and Long-Term Memory (LTM) decay and conflict resolution.
- **Human Approval Layer**: Risk analyzer categorizing actions (`LOW`, `MEDIUM`, `HIGH`) with `agent.onApprovalRequest()` interceptors.
- **Dry-Run Sandbox Simulation**: `agent.simulate()` previews predicted tool calls and risk profiles with zero real side-effects.
- **Real-Time Event Streaming**: Native `AsyncIterator` streaming (`agent.stream()`) emitting lifecycle events (`run.started`, `model.started`, `token.generated`, `tool.started`, `tool.completed`, `run.completed`).
- **Guardrail Pipeline**: Pre-execution input validation, tool verification, and output sanitization with PII redaction.
- **OpenTelemetry-Style Tracing**: Built-in `Tracer` recording execution spans, tool latencies, model call metrics, and error stack traces.
- **Reliability Utilities**: Automatic exponential retry backoff (`withRetry`) and global call timeout protection (`withTimeout`).

---

## 3. Installation

Install `@nekora-ai/core` and `zod` using npm or pnpm:

```bash
npm install @nekora-ai/core zod
```

Using pnpm:

```bash
pnpm add @nekora-ai/core zod
```

---

## 4. Quick Start

Create an agent, configure a tool, and execute a query:

```typescript
import { Agent, tool, GroqProvider } from "@nekora-ai/core";
import { z } from "zod";

// Define a custom tool with Zod schema validation
const weatherTool = tool({
  name: "get_weather",
  description: "Retrieve current weather information for a location",
  schema: z.object({
    location: z.string().describe("City or region name"),
  }),
  execute: async ({ location }) => {
    return { location, temperature: "22°C", condition: "Clear" };
  },
});

// Initialize model provider and agent
const model = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

const agent = new Agent({
  name: "Weather Assistant",
  instructions: "Answer user questions concisely using available tools.",
  model,
  tools: [weatherTool],
});

async function main() {
  const result = await agent.run("What is the weather in Tokyo?");
  console.log("Agent Output:", result.output);
  console.log("Duration (ms):", result.durationMs);
  console.log("Tokens Used:", result.totalTokens);
}

main().catch(console.error);
```

---

## 5. Providers & Fallbacks

Nekora AI provides a unified `ModelProvider` interface. You can switch model providers or set up resilient fallback chains:

```typescript
import {
  Agent,
  OpenAIProvider,
  ClaudeProvider,
  FallbackProvider,
} from "@nekora-ai/core";

const primaryModel = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

const fallbackModel = new ClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-5-sonnet-20241022",
});

// Automatically switch to fallbackModel if primaryModel fails or rate-limits
const resilientModel = new FallbackProvider({
  primary: primaryModel,
  fallbacks: [fallbackModel],
});

const agent = new Agent({
  name: "Resilient Agent",
  instructions: "Process critical system tasks with automatic failover.",
  model: resilientModel,
});
```

---

## 6. Tool System & Code Execution

### Custom Tool Definition

```typescript
import { tool } from "@nekora-ai/core";
import { z } from "zod";

const databaseTool = tool({
  name: "query_database",
  description: "Execute read-only SQL query against production replica",
  permissions: ["db:read"],
  schema: z.object({
    query: z.string().describe("SQL query string"),
  }),
  execute: async ({ query }) => {
    return { rows: [{ id: 1, name: "Alice" }] };
  },
});
```

### Advanced Coding Tool

Execute sandboxed code across multiple programming languages with pre-execution syntax validation:

```typescript
import { CodingTool } from "@nekora-ai/core";

const codingTool = new CodingTool();

// Execute TypeScript code
const result = await codingTool.execute({
  language: "typescript",
  code: "const sum: number = 10 + 20; console.log(sum);",
  timeout: 3000,
});

console.log(result.success); // true
console.log(result.output);  // "30"
```

---

## 7. Neko Cognitive Memory System

Nekora includes a multi-layered cognitive memory architecture:

1. **Short-Term Memory (STM)**: Session message history with sliding window context management.
2. **Working Memory**: Active goal state and transient decisions.
3. **Long-Term Memory (LTM)**: Knowledge base supporting importance scoring, temporal decay, and conflict resolution.

```typescript
import { Agent, NekoCognitiveMemory } from "@nekora-ai/core";

const memory = new NekoCognitiveMemory();

// Store long-term preference with importance weighting
memory.remember(
  "user_preference",
  "programming_language",
  "TypeScript",
  "User prefers TypeScript for full-stack development",
  { importance: 0.95, confidence: 0.98 }
);

const agent = new Agent({
  name: "Cognitive Assistant",
  instructions: "Personalize responses based on stored memories.",
  memory,
});

// Inspect stored memory structures
console.log(agent.memory.inspect());
```

---

## 8. Human-in-the-Loop Approval & Sandbox Simulation

### Human Approval Callback

Intercept risky actions before execution:

```typescript
const agent = new Agent({
  name: "Operations Agent",
  instructions: "Perform infrastructure maintenance.",
  tools: [databaseTool],
});

// Register human approval callback
agent.onApprovalRequest(async (request) => {
  console.log(`Approval Requested for tool '${request.toolName}'`);
  console.log(`Risk Level: ${request.riskLevel}`);
  console.log(`Arguments:`, request.args);

  // Return true to grant execution, or false to reject
  return true;
});
```

### Sandbox Simulation Mode

Dry-run an input query to evaluate planned tool calls and risk levels without executing side-effects:

```typescript
const simulation = await agent.simulate("Drop database table users");

console.log("Risk Level:", simulation.riskLevel); // "HIGH"
console.log("Actions Planned:", simulation.plannedActions);
console.log("Timeline Steps:", simulation.timeline);
```

---

## 9. Real-Time Streaming

Stream events and tokens using an `AsyncIterator`:

```typescript
for await (const event of agent.stream("Explain machine learning concepts")) {
  if (event.type === "token.generated") {
    process.stdout.write(event.token);
  } else if (event.type === "tool.started") {
    console.log(`\nTool Started: ${event.toolName}`);
  } else if (event.type === "run.completed") {
    console.log("\nRun Completed.");
  }
}
```

---

## 10. Architecture Overview

```text
+-----------------------------------------------------------------------+
|                              Nekora Agent                             |
|  +-------------------+  +-------------------+  +-------------------+  |
|  |   Model Provider  |  |  Cognitive Memory |  |  Approval Manager |  |
|  +---------+---------+  +---------+---------+  +---------+---------+  |
+------------|----------------------|----------------------|------------+
             |                      |                      |
             v                      v                      v
+-----------------------------------------------------------------------+
|                         Nekora Execution Engine                       |
|                                                                       |
|   1. Context Init    ->  2. Memory Context  ->  3. Model Execution    |
|   4. Guardrail Check ->  5. Risk Analysis   ->  6. Tool Dispatch    |
|   7. Usage Tracking  ->  8. Span Telemetry  ->  9. Output Validation|
+-----------------------------------------------------------------------+
             |                      |                      |
             v                      v                      v
+-----------------------+ +-------------------+ +-----------------------+
| Provider Integrations | |  Sandbox Executor | | EventEmitter / Stream |
+-----------------------+ +-------------------+ +-----------------------+
```

---

## 11. Roadmap

- **Distributed Memory Adapters**: Redis and Vector DB (pgvector, Pinecone) adapters for long-term memory.
- **Docker & E2B Code Sandboxes**: First-class remote sandbox executors for isolated code execution environments.
- **Multi-Agent Orchestrator Graphs**: DAG-based workflow execution and multi-agent coordination pipelines.
- **OpenTelemetry Exporter**: Native export of trace spans to Jaeger, Zipkin, and Datadog.

---

## 12. Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository and create a feature branch (`git checkout -b feature/my-feature`).
2. Ensure all unit tests pass: `pnpm test`.
3. Ensure the workspace builds cleanly: `pnpm build`.
4. Submit a detailed Pull Request describing your changes.

---

## 13. License

[MIT](LICENSE) © Nekora AI Team
