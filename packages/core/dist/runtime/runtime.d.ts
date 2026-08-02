import { ModelProvider } from "../providers/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { InMemoryTraceStorage } from "../tracing/tracer.js";
import { ExecutionResult, NekoraEngineConfig } from "./loop.js";
import { ExecutionOptions } from "./context.js";
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
export declare class NekoraRuntime {
    private engine;
    private config;
    private maxRetries;
    private defaultTimeoutMs?;
    constructor(options: NekoraRuntimeOptions);
    /**
     * Execute an input query through Nekora's execution lifecycle with retries and timeout protection.
     */
    execute<T = string>(input: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>;
    getEventEmitter(): SDKEventEmitter;
}
export { NekoraRuntime as Runtime, NekoraRuntime as AgentRuntime };
export type { NekoraRuntimeOptions as AgentRuntimeOptions };
//# sourceMappingURL=runtime.d.ts.map