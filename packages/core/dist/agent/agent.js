import { NekoraRuntime } from "../runtime/runtime.js";
import { GeminiProvider } from "../providers/gemini.provider.js";
import { OpenAIProvider } from "../providers/openai.provider.js";
import { ClaudeProvider } from "../providers/claude.provider.js";
import { GroqProvider } from "../providers/groq.provider.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { PersonalityCompiler } from "../personality/compiler.js";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";
import { BehaviorLearner } from "../behavior/learner.js";
import { AgentSandbox } from "../sandbox/simulator.js";
import { ApprovalManager } from "../approval/index.js";
import { InMemoryTraceStorage } from "../tracing/tracer.js";
/**
 * Safely retrieve environment variables across Node.js and Browser environments.
 */
export function getEnvVar(key) {
    try {
        if (typeof process !== "undefined" && process?.env && process.env[key]) {
            return process.env[key];
        }
    }
    catch { }
    try {
        if (typeof import.meta !== "undefined" && import.meta?.env?.[`VITE_${key}`]) {
            return import.meta.env[`VITE_${key}`];
        }
    }
    catch { }
    return "";
}
/**
 * Resolve explicit or default ModelProvider based on environment configuration or provider instance.
 */
export function resolveDefaultProvider(modelInput) {
    if (typeof modelInput === "object" && modelInput !== null && "generate" in modelInput) {
        return modelInput;
    }
    const modelStr = typeof modelInput === "string" ? modelInput.toLowerCase().trim() : "";
    const geminiKey = getEnvVar("GEMINI_API_KEY") || getEnvVar("GOOGLE_API_KEY");
    const openaiKey = getEnvVar("OPENAI_API_KEY");
    const anthropicKey = getEnvVar("ANTHROPIC_API_KEY");
    const groqKey = getEnvVar("GROQ_API_KEY");
    if (modelStr.includes("gemini") || (!modelInput && geminiKey)) {
        return new GeminiProvider({
            apiKey: geminiKey,
            model: "gemini-2.0-flash",
        });
    }
    if (modelStr.includes("openai") || modelStr.includes("gpt") || (!modelInput && openaiKey)) {
        return new OpenAIProvider({
            apiKey: openaiKey,
            model: "gpt-4o-mini",
        });
    }
    if (modelStr.includes("claude") || modelStr.includes("anthropic") || (!modelInput && anthropicKey)) {
        return new ClaudeProvider({
            apiKey: anthropicKey,
            model: "claude-3-5-sonnet-20241022",
        });
    }
    if (modelStr.includes("groq") || (!modelInput && groqKey)) {
        return new GroqProvider({
            apiKey: groqKey,
            model: "llama-3.3-70b-versatile",
        });
    }
    if (geminiKey) {
        return new GeminiProvider({
            apiKey: geminiKey,
            model: "gemini-2.0-flash",
        });
    }
    throw new Error("No ModelProvider specified and no API keys found in environment. " +
        "Please pass an explicit model instance (e.g. new GeminiProvider({ apiKey: '...' })) or set GEMINI_API_KEY in your environment.");
}
/**
 * Agent
 *
 * Production-grade developer API for Nekora AI agents with isolated RunState,
 * thread-safe concurrent executions, Cognitive Memory, and Observability Tracing.
 */
export class Agent {
    id;
    name;
    personality;
    memory;
    memoryAdapter;
    behavior;
    baseInstructions;
    instructions;
    model;
    tools = new Map();
    eventEmitter;
    pluginManager;
    permissionManager;
    guardrails;
    sessionStore;
    handoffManager;
    approvalManager;
    behaviorLearner;
    traceStorage = new InMemoryTraceStorage();
    runtime;
    constructor(config) {
        this.id = config.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.name = config.name;
        this.baseInstructions = config.instructions;
        this.personality = config.personality;
        this.guardrails = config.guardrails;
        this.sessionStore = config.sessionStore;
        this.handoffManager = config.handoffManager;
        this.approvalManager = config.approvalManager || new ApprovalManager();
        const personalityPrompt = PersonalityCompiler.compile(this.name, this.personality);
        this.instructions = `${this.baseInstructions}${personalityPrompt ? `\n${personalityPrompt}` : ""}`;
        this.model = resolveDefaultProvider(config.model);
        if (config.memory instanceof NekoCognitiveMemory) {
            this.memory = config.memory;
            this.memoryAdapter = config.memory;
        }
        else if (config.memory) {
            this.memoryAdapter = config.memory;
            this.memory = new NekoCognitiveMemory();
        }
        else {
            this.memory = new NekoCognitiveMemory();
            this.memoryAdapter = this.memory;
        }
        this.behaviorLearner = new BehaviorLearner(this.memory);
        this.behavior = {
            profile: () => this.behaviorLearner.getProfile(),
        };
        this.eventEmitter = new SDKEventEmitter();
        this.pluginManager = new PluginManager();
        this.permissionManager = new ToolPermissionManager(config.permissions || ["*"]);
        if (config.tools) {
            for (const t of config.tools) {
                this.tools.set(t.name, t);
            }
        }
        if (config.plugins) {
            for (const p of config.plugins) {
                this.use(p);
            }
        }
        this.runtime = new NekoraRuntime({
            agentId: this.id,
            agentName: this.name,
            instructions: this.instructions,
            model: this.model,
            tools: Array.from(this.tools.values()),
            memory: this.memoryAdapter,
            sessionStore: this.sessionStore,
            guardrails: this.guardrails,
            permissionManager: this.permissionManager,
            handoffManager: this.handoffManager,
            eventEmitter: this.eventEmitter,
            pluginManager: this.pluginManager,
            traceStorage: this.traceStorage,
            maxRetries: config.maxRetries ?? 2,
            timeoutMs: config.timeoutMs,
        });
    }
    use(plugin) {
        this.pluginManager.use(plugin);
        return this;
    }
    useModel(model) {
        this.model = resolveDefaultProvider(model);
        this.refreshRuntime();
        return this;
    }
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        this.refreshRuntime();
        return this;
    }
    addTool(tool) {
        return this.registerTool(tool);
    }
    removeTool(name) {
        this.tools.delete(name);
        this.refreshRuntime();
        return this;
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    on(eventType, listener) {
        return this.eventEmitter.on(eventType, listener);
    }
    setInstructions(instructions) {
        this.baseInstructions = instructions;
        const personalityPrompt = PersonalityCompiler.compile(this.name, this.personality);
        this.instructions = `${this.baseInstructions}${personalityPrompt ? `\n${personalityPrompt}` : ""}`;
        this.refreshRuntime();
        return this;
    }
    refreshRuntime() {
        this.runtime = new NekoraRuntime({
            agentId: this.id,
            agentName: this.name,
            instructions: this.instructions,
            model: this.model,
            tools: Array.from(this.tools.values()),
            memory: this.memoryAdapter,
            sessionStore: this.sessionStore,
            guardrails: this.guardrails,
            handoffManager: this.handoffManager,
            eventEmitter: this.eventEmitter,
            pluginManager: this.pluginManager,
            permissionManager: this.permissionManager,
            traceStorage: this.traceStorage,
        });
    }
    /**
     * Retrieve isolated RunTrace record by runId without returning stale traces.
     */
    async getTrace(runId) {
        return this.traceStorage.getRunTrace(runId);
    }
    /**
     * Run the agent on a user query with thread-safe per-run isolation.
     */
    async run(input, options = {}) {
        const scopedRuntime = new NekoraRuntime({
            agentId: this.id,
            agentName: this.name,
            instructions: this.instructions,
            model: this.model,
            tools: Array.from(this.tools.values()),
            memory: this.memoryAdapter,
            sessionStore: this.sessionStore,
            guardrails: this.guardrails,
            handoffManager: this.handoffManager,
            approvalManager: this.approvalManager,
            eventEmitter: options.eventEmitter || this.eventEmitter,
            pluginManager: this.pluginManager,
            permissionManager: this.permissionManager,
            traceStorage: this.traceStorage,
        });
        return scopedRuntime.execute(input, options);
    }
    /**
     * Register human-in-the-loop approval callback handler.
     */
    onApprovalRequest(handler) {
        this.approvalManager.setHandler(handler);
    }
    /**
     * Stream real-time events and generated tokens as an AsyncIterableIterator.
     */
    async *stream(input, options = {}) {
        const scopedEmitter = options.eventEmitter || new SDKEventEmitter();
        if (scopedEmitter !== this.eventEmitter) {
            scopedEmitter.onAny((evt) => {
                this.eventEmitter.emit(evt);
            });
        }
        const streamIterable = scopedEmitter.toAsyncIterable();
        const runPromise = this.run(input, { ...options, eventEmitter: scopedEmitter }).catch(() => { });
        yield* streamIterable;
        await runPromise;
    }
    /**
     * Safe Agent Sandbox / Simulation Mode.
     */
    async simulate(input) {
        return AgentSandbox.simulate(input, Array.from(this.tools.values()), this.instructions);
    }
    getEventEmitter() {
        return this.eventEmitter;
    }
    getModel() {
        return this.model;
    }
}
//# sourceMappingURL=agent.js.map