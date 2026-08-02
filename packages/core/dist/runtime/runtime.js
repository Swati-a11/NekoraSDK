import { SDKEventEmitter } from "../events/event-emitter.js";
import { UsageTracker } from "../cost/tracker.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { NekoraExecutionEngine } from "./loop.js";
import { withTimeout } from "../reliability/timeout.js";
import { withRetry } from "../reliability/retry.js";
/**
 * NekoraRuntime
 *
 * Orchestrates the execution engine, event emitters, memory adapters,
 * exponential retry, and trace storage for Nekora agents.
 */
export class NekoraRuntime {
    engine;
    config;
    maxRetries;
    defaultTimeoutMs;
    constructor(options) {
        this.config = {
            agentId: options.agentId || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            agentName: options.agentName,
            instructions: options.instructions || "You are a helpful AI assistant.",
            model: options.model,
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
    async execute(input, options = {}) {
        const timeout = options.timeoutMs ?? this.defaultTimeoutMs;
        const runTask = async () => {
            return withRetry(() => this.engine.execute(input, options), {
                maxRetries: this.maxRetries,
                onRetry: (attempt, err) => {
                    this.config.eventEmitter?.emit({
                        type: "retry",
                        attempt,
                        error: err.message,
                    });
                },
            });
        };
        if (timeout && timeout > 0) {
            return withTimeout(runTask(), timeout);
        }
        return runTask();
    }
    getEventEmitter() {
        return this.config.eventEmitter;
    }
}
export { NekoraRuntime as Runtime, NekoraRuntime as AgentRuntime };
//# sourceMappingURL=runtime.js.map