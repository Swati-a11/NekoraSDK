import { AgentConfig, AgentRunOptions } from "./types.js";
import { ExecutionResult } from "../runtime/loop.js";
import { Tool } from "../tools/types.js";
import { ModelProvider } from "../providers/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { SDKEvent, SDKEventType } from "../events/types.js";
import { NekoraPlugin } from "../plugins/types.js";
import { PersonalityProfile } from "../personality/types.js";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";
import { BehaviorProfile } from "../behavior/types.js";
import { SimulationReport } from "../sandbox/types.js";
import { MemoryAdapter } from "../memory/types.js";
import { ApprovalHandler } from "../approval/index.js";
import { RunTrace } from "../tracing/types.js";
/**
 * Safely retrieve environment variables across Node.js and Browser environments.
 */
export declare function getEnvVar(key: string): string;
/**
 * Resolve explicit or default ModelProvider based on environment configuration or provider instance.
 */
export declare function resolveDefaultProvider(modelInput?: ModelProvider | string): ModelProvider;
/**
 * Agent
 *
 * Production-grade developer API for Nekora AI agents with isolated RunState,
 * thread-safe concurrent executions, Cognitive Memory, and Observability Tracing.
 */
export declare class Agent {
    readonly id: string;
    readonly name: string;
    readonly personality?: PersonalityProfile;
    readonly memory: NekoCognitiveMemory;
    readonly memoryAdapter: MemoryAdapter;
    readonly behavior: {
        profile: () => BehaviorProfile;
    };
    private baseInstructions;
    private instructions;
    private model;
    private tools;
    private eventEmitter;
    private pluginManager;
    private permissionManager;
    private guardrails?;
    private sessionStore?;
    private handoffManager?;
    private approvalManager;
    private behaviorLearner;
    private traceStorage;
    private runtime;
    constructor(config: AgentConfig);
    use(plugin: NekoraPlugin): this;
    useModel(model: ModelProvider | string): this;
    registerTool(tool: Tool): this;
    addTool(tool: Tool): this;
    removeTool(name: string): this;
    listTools(): Tool[];
    on<K extends SDKEventType>(eventType: K, listener: (data: Extract<SDKEvent, {
        type: K;
    }>) => void): () => void;
    setInstructions(instructions: string): this;
    private refreshRuntime;
    /**
     * Retrieve isolated RunTrace record by runId without returning stale traces.
     */
    getTrace(runId: string): Promise<RunTrace | null>;
    /**
     * Run the agent on a user query with thread-safe per-run isolation.
     */
    run<T = string>(input: string, options?: AgentRunOptions): Promise<ExecutionResult<T>>;
    /**
     * Register human-in-the-loop approval callback handler.
     */
    onApprovalRequest(handler: ApprovalHandler): void;
    /**
     * Stream real-time events and generated tokens as an AsyncIterableIterator.
     */
    stream(input: string, options?: AgentRunOptions): AsyncGenerator<SDKEvent, void, unknown>;
    /**
     * Safe Agent Sandbox / Simulation Mode.
     */
    simulate(input: string): Promise<SimulationReport>;
    getEventEmitter(): SDKEventEmitter;
    getModel(): ModelProvider;
}
//# sourceMappingURL=agent.d.ts.map