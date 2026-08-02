# Nekora AI Core (@nekora-ai/core)

A TypeScript-first, provider-agnostic AI Agent SDK built from scratch for reliable autonomous agents.

---

## 1. Hero

### What is Nekora AI?

Nekora AI is a production-ready, TypeScript-native framework for building, running, and observing autonomous AI agents. Built from the ground up without heavy third-party framework dependencies, Nekora AI provides deterministic execution loops, multi-provider model switching, cognitive memory management, type-safe tool calling, and human-in-the-loop safety controls.

### Why Developers Choose Nekora AI

Existing agent frameworks often introduce complex abstractions, hidden prompt chains, or tight vendor lock-in. Nekora AI delivers a lightweight, explicit, and fully observable architecture designed specifically for TypeScript applications:

- **Explicit Control Flow**: Every step of the agent execution lifecycle is transparent, customizable, and emitted as typed events.
- **Provider Agnostic**: Seamlessly switch between OpenAI, Anthropic Claude, Google Gemini, Groq, and OpenRouter, or build automated multi-provider fallback chains.
- **Production Safety**: Native guardrails, granular risk analysis, dry-run simulation mode, and human approval hooks prevent unexpected side-effects.
- **Multi-Layer Memory**: Built-in Short-Term sliding window memory, Working Memory task tracking, and Long-Term Memory with temporal decay and conflict resolution.
- **Full Telemetry**: OpenTelemetry-compatible span tracing, latency tracking, token cost calculations, and structured output repair loops.

### Core Philosophy

1. **Type Safety First**: End-to-end TypeScript types, native Zod schema integration, and zero unsafe casting.
2. **Zero Hidden Magic**: No black-box prompt engineering or untraceable loops. Every iteration and model response is inspectable.
3. **Pluggable Architecture**: Modular providers, custom memory adapters, custom tool executors, and extensible plugin middleware.

---

## 2. Features

### Agent Runtime Engine
The core execution engine (`NekoraExecutionEngine`) coordinates the multi-turn agent loop. It manages iteration boundaries, token limits, system instruction composition, tool dispatching, and error recovery.

### Multi-Provider Architecture
Switch model backends with zero code refactoring:
- **OpenAI**: `OpenAIProvider` (`gpt-4o`, `gpt-4o-mini`)
- **Google Gemini**: `GeminiProvider` (`gemini-2.0-flash`, `gemini-1.5-pro`)
- **Anthropic Claude**: `ClaudeProvider` (`claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`)
- **Groq**: `GroqProvider` (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`)
- **OpenRouter**: `OpenRouterProvider` (Access 300+ models via OpenRouter API)
- **Fallback Provider**: `FallbackProvider` (Automatic failover between primary and secondary providers)

### Tool Calling System
Define tools with Zod schema validation. Tools support permission tags, execution timeouts, and human approval requirements.

### Advanced Sandbox Code Execution
The `CodingTool` and `NodeSandboxExecutor` enable isolated execution of JavaScript, TypeScript, and Python code snippets with pre-execution syntax validation and execution timeouts.

### Neko Cognitive Memory System
A 3-layer cognitive memory architecture:
- **Short-Term Memory (STM)**: Session message history with sliding window context management.
- **Working Memory**: Active goals, constraints, and transient task state.
- **Long-Term Memory (LTM)**: Knowledge base supporting importance scoring, temporal decay, and conflict resolution.

### Session Management
Stateful session tracking across multi-turn user conversations with automatic history retrieval and persistence adapters (`InMemoryAdapter`, `SQLiteAdapter`).

### Async Iterator Streaming
Native `AsyncGenerator` response streaming via `agent.stream()`. Emits granular events (`run.started`, `model.started`, `token.generated`, `tool.started`, `tool.completed`, `run.completed`).

### Guardrail Pipeline
Multi-stage validation pipeline (`GuardrailPipeline`) for input queries, tool calls, and final model outputs. Supports PII redaction and policy enforcement.

### Human Approval System
Granular risk analyzer categorizing actions into `LOW`, `MEDIUM`, or `HIGH` risk levels. Requires human confirmation (`agent.onApprovalRequest()`) before high-risk tools execute.

### Dry-Run Sandbox Simulation
Preview predicted tool calls, risk levels, and action timelines without executing real side-effects via `agent.simulate()`.

### Reliability Utilities
Built-in exponential backoff retry policies (`withRetry`) and request timeout handlers (`withTimeout`).

### Tracing & Telemetry System
Structured `Tracer` recording execution spans, tool latencies, model token counts, and stack traces per run ID.

### Structured Output Validation
Validate model outputs against Zod schemas (`options.outputSchema`). Includes automatic JSON extraction from markdown and self-healing repair loops.

---

## 3. Installation

Install `@nekora-ai/core` and `zod` via npm:

```bash
npm install @nekora-ai/core zod
```

Using pnpm:

```bash
pnpm add @nekora-ai/core zod
```

---

## 4. Quick Start

Create an agent, execute a query, and handle output:

```typescript
import { Agent, GroqProvider } from "@nekora-ai/core";

// Initialize provider
const model = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

// Initialize agent
const agent = new Agent({
  name: "Assistant Agent",
  instructions: "You are a helpful AI assistant. Answer user queries accurately.",
  model,
});

async function main() {
  const result = await agent.run("Explain the concept of quantum superposition in 2 sentences.");

  console.log("Response:", result.output);
  console.log("Run ID:", result.runId);
  console.log("Tokens Used:", result.totalTokens);
  console.log("Duration (ms):", result.durationMs);
}

main().catch(console.error);
```

---

## 5. Provider Usage

### Google Gemini

```typescript
import { Agent, GeminiProvider } from "@nekora-ai/core";

const gemini = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.0-flash",
});

const agent = new Agent({
  name: "Gemini Agent",
  instructions: "You are an assistant powered by Google Gemini.",
  model: gemini,
});
```

### OpenAI

```typescript
import { Agent, OpenAIProvider } from "@nekora-ai/core";

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

const agent = new Agent({
  name: "OpenAI Agent",
  instructions: "You are an assistant powered by OpenAI.",
  model: openai,
});
```

### Anthropic Claude

```typescript
import { Agent, ClaudeProvider } from "@nekora-ai/core";

const claude = new ClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-5-sonnet-20241022",
});

const agent = new Agent({
  name: "Claude Agent",
  instructions: "You are an assistant powered by Anthropic Claude.",
  model: claude,
});
```

### Groq

```typescript
import { Agent, GroqProvider } from "@nekora-ai/core";

const groq = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

const agent = new Agent({
  name: "Groq Agent",
  instructions: "You are an assistant powered by Groq.",
  model: groq,
});
```

### Resilient Fallback Chain

```typescript
import { Agent, OpenAIProvider, GroqProvider, FallbackProvider } from "@nekora-ai/core";

const primary = new GroqProvider({ apiKey: process.env.GROQ_API_KEY });
const secondary = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

const fallbackModel = new FallbackProvider({
  primary,
  fallbacks: [secondary],
});

const agent = new Agent({
  name: "Resilient Agent",
  instructions: "Automatically fall back if primary provider fails.",
  model: fallbackModel,
});
```

---

## 6. Tool Calling Example

Define a custom tool using Zod validation and attach it to an agent:

```typescript
import { Agent, tool, GroqProvider } from "@nekora-ai/core";
import { z } from "zod";

// Define custom tool
const calculatorTool = tool({
  name: "calculator",
  description: "Perform basic mathematical operations",
  schema: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case "add": return { result: a + b };
      case "subtract": return { result: a - b };
      case "multiply": return { result: a * b };
      case "divide": return { result: b !== 0 ? a / b : "Error: Division by zero" };
    }
  },
});

const agent = new Agent({
  name: "Math Agent",
  instructions: "Use the calculator tool to solve math problems.",
  model: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
  tools: [calculatorTool],
});

async function main() {
  const result = await agent.run("Calculate 42 multiplied by 18");
  console.log("Result:", result.output);
}

main().catch(console.error);
```

---

## 7. Memory Example

Store long-term facts and run multi-turn sessions with Neko Cognitive Memory:

```typescript
import { Agent, NekoCognitiveMemory, GroqProvider } from "@nekora-ai/core";

const memory = new NekoCognitiveMemory();

// Store long-term knowledge
memory.remember(
  "user_preference",
  "theme",
  "dark_mode",
  "User prefers dark mode interfaces",
  { importance: 0.9, confidence: 0.95 }
);

const agent = new Agent({
  name: "Memory Agent",
  instructions: "Personalize responses based on user context.",
  model: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
  memory,
});

async function main() {
  const sessionId = "user_session_1";

  // First turn
  await agent.run("My name is Alice.", { sessionId });

  // Second turn - retrieves previous context
  const response = await agent.run("What is my name?", { sessionId });
  console.log("Response:", response.output);

  // Inspect memory state
  console.log("Cognitive Memory Report:", agent.memory.inspect());
}

main().catch(console.error);
```

---

## 8. Streaming Example

Stream real-time tokens and lifecycle events:

```typescript
import { Agent, GroqProvider } from "@nekora-ai/core";

const agent = new Agent({
  name: "Streaming Agent",
  instructions: "Write a creative short story.",
  model: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
});

async function main() {
  console.log("Streaming response:\n");

  for await (const event of agent.stream("Write a 3-sentence story about space exploration.")) {
    if (event.type === "token.generated") {
      process.stdout.write(event.token);
    } else if (event.type === "tool.started") {
      console.log(`\nTool Executing: ${event.toolName}`);
    } else if (event.type === "run.completed") {
      console.log("\n\nStream Finished.");
    }
  }
}

main().catch(console.error);
```

---

## 9. Guardrails Example

Validate input queries and sanitize output responses:

```typescript
import { Agent, GuardrailPipeline, GroqProvider } from "@nekora-ai/core";

const guardrails = new GuardrailPipeline();

// Input guardrail: block prompt injection keywords
guardrails.addInputGuardrail({
  name: "injection_prevention",
  validate: async (input) => {
    if (input.toLowerCase().includes("ignore previous instructions")) {
      return { isValid: false, reason: "Prompt injection attempt detected." };
    }
    return { isValid: true };
  },
});

// Output guardrail: redact sensitive email patterns
guardrails.addOutputGuardrail({
  name: "email_redaction",
  validate: async (output) => {
    const redacted = output.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
    return { isValid: true, content: redacted };
  },
});

const agent = new Agent({
  name: "Secure Agent",
  instructions: "Provide customer assistance.",
  model: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
  guardrails,
});
```

---

## 10. Human Approval Example

Require human authorization before executing sensitive or high-risk tools:

```typescript
import { Agent, tool, GroqProvider } from "@nekora-ai/core";
import { z } from "zod";

const deleteTableTool = tool({
  name: "delete_table",
  description: "Delete a database table",
  permissions: ["db:write", "file:delete"],
  requireApproval: true,
  schema: z.object({ tableName: z.string() }),
  execute: async ({ tableName }) => ({ status: "deleted", tableName }),
});

const agent = new Agent({
  name: "Admin Agent",
  instructions: "Perform database administration.",
  model: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
  tools: [deleteTableTool],
});

// Register human approval handler
agent.onApprovalRequest(async (request) => {
  console.log(`Approval Request ID: ${request.id}`);
  console.log(`Tool: ${request.toolName} (Risk: ${request.riskLevel})`);
  console.log(`Reason: ${request.reason}`);

  // Return true to authorize, false to reject
  return true;
});
```

---

## 11. Architecture Overview

```text
+-------------------------------------------------------------------------+
|                              Nekora Agent                               |
|  +---------------------+  +---------------------+  +------------------+ |
|  |    Model Provider   |  |   Cognitive Memory  |  | Approval Manager | |
|  +----------+----------+  +----------+----------+  +--------+---------+ |
+-------------|------------------------|----------------------|-----------+
              |                        |                      |
              v                        v                      v
+-------------------------------------------------------------------------+
|                          Nekora Execution Engine                        |
|                                                                         |
|   1. Context Init    -->  2. Memory Context   -->  3. Model Execution   |
|   4. Guardrail Check -->  5. Risk Evaluation  -->  6. Tool Dispatch     |
|   7. Usage Tracking  -->  8. Telemetry Spans  -->  9. Output Check    |
+-------------------------------------------------------------------------+
              |                        |                      |
              v                        v                      v
+------------------------+ +--------------------+ +-----------------------+
|  Provider Integrations | |  Sandbox Executor  | | EventEmitter / Stream |
+------------------------+ +--------------------+ +-----------------------+
```

### Architectural Components

- **Agent (`Agent`)**: The user-facing configuration interface defining identity, instructions, tools, memory, and model bindings.
- **Runtime (`NekoraRuntime` & `NekoraExecutionEngine`)**: Thread-safe execution engine driving the multi-turn iteration loop, error handling, and timeout limits.
- **Providers (`ModelProvider`)**: Abstraction layer converting standard `Message[]` inputs into provider-specific payloads.
- **Tools (`Tool`)**: Executable units with Zod schema validation, permission checks, and execution providers.
- **Memory (`MemoryAdapter` & `NekoCognitiveMemory`)**: Multi-tiered state storage handling short-term history, working goals, and long-term knowledge decay.
- **Guardrails (`GuardrailPipeline`)**: Pipeline executing validation rules across input, tool, and output phases.
- **Tracing (`Tracer`)**: OpenTelemetry-style span collector recording execution graphs and latency metrics.

---

## 12. Roadmap

- **CLI Initialization Suite**: Scaffolding templates (`npx nekora init`) with preset configurations.
- **Extended Provider Ecosystem**: Native adapters for Cohere, Mistral, Ollama, and AWS Bedrock.
- **Agent Graph Orchestration**: DAG-based multi-agent coordination pipelines with conditional branching.
- **Distributed Memory Adapters**: Redis, PostgreSQL (pgvector), and Pinecone vector store integrations.
- **Cloud Dashboard & Telemetry Exporter**: OpenTelemetry span exporters for Jaeger, Datadog, and Grafana Tempo.

---

## 13. Contributing

Contributions to Nekora AI are welcome. Please follow these steps to contribute:

1. Fork the repository: `https://github.com/Swati-a11/NekoraSDK`.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Ensure all tests pass: `pnpm test`.
4. Ensure the workspace builds cleanly: `pnpm build`.
5. Submit a pull request with a description of your changes.

---

## 14. License

[MIT](LICENSE) © Nekora AI Team
