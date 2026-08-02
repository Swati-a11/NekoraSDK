# 🏗️ Nekora AI Architecture Overview

Nekora AI is designed with a **Zero-Wrapper, Provider-Agnostic Engine**.

```
                 +-----------------------+
                 |       Agent API       |
                 +-----------+-----------+
                             |
                 +-----------v-----------+
                 | NekoraExecutionEngine |
                 +-----------+-----------+
                             |
      +----------------------+----------------------+
      |                      |                      |
+-----v-----+          +-----v-----+          +-----v-----+
| Guardrails|          | Memory &  |          | Provider  |
| Pipeline  |          | Cognitive |          | Registry  |
+-----------+          +-----------+          +-----------+
```

## Key Architectural Principles

1. **Explicit Controls & Observability**: Every execution turn emits structured events (`token.generated`, `tool.started`, `guardrail.rejected`).
2. **Provider Agnostic**: Decoupled LLM providers via standard `ModelProvider` interface (`generate`, `generateStream`).
3. **Multi-Layer Memory**: Short-Term (STM), Working Memory (WM), and Long-Term Memory (LTM) with decay & conflict resolution.
4. **Safety & Sandbox**: Simulation mode previews planned actions and risk levels before executing side effects.
