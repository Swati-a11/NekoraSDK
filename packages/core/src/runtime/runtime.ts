import { ModelProvider } from "../providers/types.js";
import { Tool } from "../tools/types.js";
import { MemoryAdapter } from "../memory/types.js";
import { SessionStore } from "../session/types.js";
import { GuardrailPipeline } from "../guardrails/pipeline.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { Tracer, InMemoryTraceStorage } from "../tracing/tracer.js";
import { UsageTracker } from "../cost/tracker.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { NekoraExecutionEngine, ExecutionResult, NekoraEngineConfig } from "./loop.js";
import { ExecutionOptions } from "./context.js";
import { withTimeout } from "../reliability/timeout.js";
import { withRetry } from "../reliability/retry.js";

export interface NekoraRuntimeOptions extends Omit<NekoraEngineConfig, "agentId" | "instructions" | "model"> {
  agentId?: string;
  agentName?: string;
  instructions?: string;
  model?: ModelProvider;
  traceStorage?: InMemoryTraceStorage;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * NekoraRuntime
 * 
 * Orchestrates the execution engine, event emitters, memory adapters,
 * exponential retry, and trace storage for Nekora agents.
 */
export class NekoraRuntime {
  private engine: NekoraExecutionEngine;
  private config: NekoraEngineConfig;
  private maxRetries: number;
  private defaultTimeoutMs?: number;

  constructor(options: NekoraRuntimeOptions) {
    this.config = {
      agentId: options.agentId || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      agentName: options.agentName,
      instructions: options.instructions || "You are a helpful AI assistant.",
      model: options.model!,
      tools: options.tools || [],
      memory: options.memory,
      sessionStore: options.sessionStore,
      guardrails: options.guardrails,
      permissionManager: options.permissionManager || new ToolPermissionManager(),
      handoffManager: options.handoffManager,
      approvalManager: options.approvalManager,
      eventEmitter: options.eventEmitter || new SDKEventEmitter(),
      tracer: options.tracer,
      traceStorage: options.traceStorage,
      usageTracker: options.usageTracker || new UsageTracker(),
      pluginManager: options.pluginManager || new PluginManager(),
    };

    this.maxRetries = options.maxRetries ?? 2;
    this.defaultTimeoutMs = options.timeoutMs;
    this.engine = new NekoraExecutionEngine(this.config);
  }

  /**
   * Execute an input query through Nekora's execution lifecycle with retries and timeout protection.
   */
  async execute<T = string>(
    input: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    const timeout = options.timeoutMs ?? this.defaultTimeoutMs;

    const runTask = async () => {
      return withRetry(
        () => this.engine.execute<T>(input, options),
        {
          maxRetries: this.maxRetries,
          onRetry: (attempt, err) => {
            this.config.eventEmitter?.emit({
              type: "retry",
              attempt,
              error: err.message,
            });
          },
        }
      );
    };

    if (timeout && timeout > 0) {
      return withTimeout(runTask(), timeout);
    }

    return runTask();
  }

  getEventEmitter(): SDKEventEmitter {
    return this.config.eventEmitter!;
  }
}

export { NekoraRuntime as Runtime, NekoraRuntime as AgentRuntime };
export type { NekoraRuntimeOptions as AgentRuntimeOptions };