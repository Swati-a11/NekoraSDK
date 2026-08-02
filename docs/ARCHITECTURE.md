# Nekora AI Server & Runtime Architecture

## Overview

Nekora AI features a production-grade decoupled architecture where agent orchestration, cognitive memory, guardrail pipelines, and code execution sandboxing run on a dedicated Express backend (`packages/server`). The Vite/React Playground (`packages/playground`) acts as a pure frontend component communicating with the server via HTTP REST and Server-Sent Events (SSE).

```
┌─────────────────────────┐
│   Browser Playground    │
│  (Pure React Frontend)  │
└────────────┬────────────┘
             │
   HTTP REST / SSE Stream
             │
┌────────────▼────────────┐
│      Nekora Server      │
│   (Express Backend)     │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│     Agent Runtime       │
│  (@nekora-ai/core)      │
└─────┬──────────────┬────┘
      │              │
┌─────▼──────┐ ┌─────▼──────────────────────────────┐
│  Provider  │ │           Tools                    │
│(Groq, etc.)│ │ ┌────────────────────────────────┐ │
└────────────┘ │ │      CodeExecutionTool         │ │
               │ └──────────────┬─────────────────┘ │
               └────────────────┼───────────────────┘
                                │
               ┌────────────────▼───────────────────┐
               │    CodeExecutionProvider           │
               │   (NodeSandboxExecutor / Docker /  │
               │     E2B / Firecracker / Remote)    │
               └────────────────┬───────────────────┘
                                │
                        stdout / stderr
```

---

## 1. Why Browser Execution is Impossible

Browser execution of untrusted system code or Node.js native code execution is fundamentally impossible due to web security models and runtime constraints:

1. **Absence of Native Operating System APIs**: Browsers run in standard V8 sandbox environments and do not expose low-level Node.js operating system modules such as:
   - `child_process.execFile` / `child_process.spawn`: Required to instantiate language runtimes (`node`, `python3`).
   - `fs` / `fs/promises`: Required to write code files to disk before execution.
   - `os.tmpdir`: Required to provision dynamic workspace directories.
2. **Security & Same-Origin Policies**: Web browsers restrict direct hardware, process, and file system access to prevent arbitrary code execution on client machines.
3. **Module Bundling Failures**: When bundled with Vite/Webpack for browser deployment, references to native C/C++ bindings or Node internal modules produce `SANDBOX_UNAVAILABLE` runtime exceptions.

---

## 2. Why Server-Side Execution is Safer

Executing code sandboxes on a controlled backend runtime provides essential production security guarantees:

1. **Process Isolation & Timeouts**: Process execution is spawned in temporary sub-directories with strict timeout enforcement (`childProcess.execFile` with `timeout` flags), preventing infinite loops or memory depletion attacks from compromising the user's browser.
2. **Environment Variable & Secret Protection**: Sensitive API keys (`OPENAI_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`) remain securely on the server and are never exposed to client-side JS bundles.
3. **Network & System Guardrails**: Server-side sandboxes can be restricted via network namespaces, Docker containerization, eBPF filters, or microVMs.

---

## 3. Playground Backend Communication Protocol

The Playground frontend communicates with `@nekora-ai/server` via standardized endpoints:

### Endpoints

| Method | Endpoint | Description | Payload / Query | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check | N/A | `{ status: "ok", version, uptime }` |
| `POST` | `/api/code/execute` | Direct sandbox execution | `{ language, code, timeout? }` | `{ success, stdout, stderr, executionTime }` |
| `POST` | `/api/chat` | Batch agent execution | `{ message, sessionId?, provider? }` | `{ response, runId, toolsUsed, traceId }` |
| `GET` | `/api/chat/stream` | Real-time SSE streaming | `?message=...&provider=...&sessionId=...` | Event stream (`agent_started`, `text_stream`, `tool_started`, `tool_completed`, `run_completed`) |

### Server-Sent Events (SSE) Lifecycle

```
Client -> GET /api/chat/stream
Server -> event: agent_started    data: {"sessionId":"sess_123","provider":"groq"}
Server -> event: text_stream      data: {"delta":"I will execute the code..."}
Server -> event: tool_started     data: {"toolName":"code_executor","args":{...}}
Server -> event: tool_completed   data: {"toolName":"code_executor","result":{...}}
Server -> event: run_completed    data: {"runId":"run_456","result":{...}}
```

---

## 4. Extending Execution Providers (Future-Ready Sandbox Design)

The server's `SandboxService` relies solely on the `CodeExecutionProvider` contract defined in `@nekora-ai/core`:

```typescript
export interface CodeExecutionProvider {
  readonly name: string;
  execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
}
```

Because `SandboxService` accepts a `CodeExecutionProvider` instance via constructor injection, alternative sandbox backends can be plugged in without modifying any server routes or business logic.

### Example: Plugging in a Docker or Remote Sandbox Provider

```typescript
import { CodeExecutionProvider, CodeExecutionRequest, CodeExecutionResult } from "@nekora-ai/core";

export class DockerExecutor implements CodeExecutionProvider {
  readonly name = "docker_sandbox";

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    // 1. Spawn isolated ephemeral Docker container (e.g. node:18-alpine or python:3.11-slim)
    // 2. Pass request.code
    // 3. Capture stdout, stderr, exitCode, executionTimeMs
    return {
      success: true,
      stdout: "Isolated Docker output",
      stderr: "",
      exitCode: 0,
      executionTimeMs: 120,
    };
  }
}

// Plug into server:
const dockerSandbox = new SandboxService(new DockerExecutor());
const app = createApp({ sandboxService: dockerSandbox });
```

Supported Future Executors:
- `DockerExecutor`: Ephemeral container sandboxing.
- `E2BExecutor`: Cloud sandbox environments via E2B SDK.
- `FirecrackerExecutor`: Lightweight AWS Firecracker microVM sandboxing.
- `RemoteExecutor`: Distributed RPC worker sandbox clusters.
