import { Message, ModelProvider } from "../providers/types.js";
import { Tool } from "../tools/types.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { GuardrailPipeline } from "../guardrails/pipeline.js";
import { MemoryAdapter } from "../memory/types.js";
import { SessionStore } from "../session/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { Tracer, InMemoryTraceStorage } from "../tracing/tracer.js";
import { RunTrace } from "../tracing/types.js";
import { UsageTracker } from "../cost/tracker.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { ApprovalManager } from "../approval/approval.manager.js";
import { ExecutionOptions, RunState } from "./context.js";
export interface ExecutionResult<T = string> {
    runId: string;
    sessionId: string;
    output: T;
    rawText: string;
    messages: Message[];
    steps: number;
    totalTokens: number;
    durationMs: number;
    handoffTarget?: string;
    runState?: RunState;
    runTrace?: RunTrace;
    metadata?: Record<string, unknown>;
}
export interface NekoraEngineConfig {
    agentId: string;
    agentName?: string;
    instructions: string;
    model: ModelProvider;
    tools?: Tool[];
    memory?: MemoryAdapter;
    sessionStore?: SessionStore;
    guardrails?: GuardrailPipeline;
    permissionManager?: ToolPermissionManager;
    handoffManager?: HandoffManager;
    approvalManager?: ApprovalManager;
    eventEmitter?: SDKEventEmitter;
    tracer?: Tracer;
    traceStorage?: InMemoryTraceStorage;
    usageTracker?: UsageTracker;
    pluginManager?: PluginManager;
}
/**
 * NekoraExecutionEngine
 *
 * Production-grade autonomous execution engine with RunState isolation per run.
 * Every run creates an isolated ExecutionContext & Tracer instance preventing cross-turn state leaks.
 */
export declare class NekoraExecutionEngine {
    private config;
    constructor(config: NekoraEngineConfig);
    execute<T = string>(input: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>;
    private executeToolCalls;
}
export { NekoraExecutionEngine as AgentExecutionLoop };
export type { NekoraEngineConfig as AgentLoopConfig };
//# sourceMappingURL=loop.d.ts.map