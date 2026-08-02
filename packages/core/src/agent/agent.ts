import { AgentConfig, AgentRunOptions } from "./types.js";
import { NekoraRuntime } from "../runtime/runtime.js";
import { ExecutionResult } from "../runtime/loop.js";
import { Tool } from "../tools/types.js";
import { ModelProvider } from "../providers/types.js";
import { GeminiProvider } from "../providers/gemini.provider.js";
import { OpenAIProvider } from "../providers/openai.provider.js";
import { ClaudeProvider } from "../providers/claude.provider.js";
import { GroqProvider } from "../providers/groq.provider.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { SDKEvent, SDKEventType } from "../events/types.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { NekoraPlugin } from "../plugins/types.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { PersonalityProfile } from "../personality/types.js";
import { PersonalityCompiler } from "../personality/compiler.js";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";
import { BehaviorLearner } from "../behavior/learner.js";
import { BehaviorProfile } from "../behavior/types.js";
import { AgentSandbox } from "../sandbox/simulator.js";
import { SimulationReport } from "../sandbox/types.js";
import { MemoryAdapter } from "../memory/types.js";
import { SessionStore } from "../session/types.js";
import { GuardrailPipeline } from "../guardrails/pipeline.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { ApprovalManager, ApprovalHandler } from "../approval/index.js";
import { InMemoryTraceStorage } from "../tracing/tracer.js";
import { RunTrace } from "../tracing/types.js";

/**
 * Safely retrieve environment variables across Node.js and Browser environments.
 */
export function getEnvVar(key: string): string {
  try {
    if (typeof process !== "undefined" && process?.env && process.env[key]) {
      return process.env[key]!;
    }
  } catch {}
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.[`VITE_${key}`]) {
      return (import.meta as any).env[`VITE_${key}`];
    }
  } catch {}
  return "";
}

/**
 * Resolve explicit or default ModelProvider based on environment configuration or provider instance.
 */
export function resolveDefaultProvider(modelInput?: ModelProvider | string): ModelProvider {
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

  throw new Error(
    "No ModelProvider specified and no API keys found in environment. " +
      "Please pass an explicit model instance (e.g. new GeminiProvider({ apiKey: '...' })) or set GEMINI_API_KEY in your environment."
  );
}

/**
 * Agent
 * 
 * Production-grade developer API for Nekora AI agents with isolated RunState,
 * thread-safe concurrent executions, Cognitive Memory, and Observability Tracing.
 */
export class Agent {
  readonly id: string;
  readonly name: string;
  readonly personality?: PersonalityProfile;
  readonly memory: NekoCognitiveMemory;
  readonly memoryAdapter: MemoryAdapter;
  readonly behavior: { profile: () => BehaviorProfile };

  private baseInstructions: string;
  private instructions: string;
  private model: ModelProvider;
  private tools: Map<string, Tool> = new Map();
  private eventEmitter: SDKEventEmitter;
  private pluginManager: PluginManager;
  private permissionManager: ToolPermissionManager;
  private guardrails?: GuardrailPipeline;
  private sessionStore?: SessionStore;
  private handoffManager?: HandoffManager;
  private approvalManager: ApprovalManager;
  private behaviorLearner: BehaviorLearner;
  private traceStorage: InMemoryTraceStorage = new InMemoryTraceStorage();
  private runtime: NekoraRuntime;

  constructor(config: AgentConfig) {
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
    } else if (config.memory) {
      this.memoryAdapter = config.memory;
      this.memory = new NekoCognitiveMemory();
    } else {
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

  use(plugin: NekoraPlugin): this {
    this.pluginManager.use(plugin);
    return this;
  }

  useModel(model: ModelProvider | string): this {
    this.model = resolveDefaultProvider(model);
    this.refreshRuntime();
    return this;
  }

  registerTool(tool: Tool): this {
    this.tools.set(tool.name, tool);
    this.refreshRuntime();
    return this;
  }

  addTool(tool: Tool): this {
    return this.registerTool(tool);
  }

  removeTool(name: string): this {
    this.tools.delete(name);
    this.refreshRuntime();
    return this;
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  on<K extends SDKEventType>(
    eventType: K,
    listener: (data: Extract<SDKEvent, { type: K }>) => void
  ): () => void {
    return this.eventEmitter.on(eventType, listener);
  }

  setInstructions(instructions: string): this {
    this.baseInstructions = instructions;
    const personalityPrompt = PersonalityCompiler.compile(this.name, this.personality);
    this.instructions = `${this.baseInstructions}${personalityPrompt ? `\n${personalityPrompt}` : ""}`;
    this.refreshRuntime();
    return this;
  }

  private refreshRuntime(): void {
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
  async getTrace(runId: string): Promise<RunTrace | null> {
    return this.traceStorage.getRunTrace(runId);
  }

  /**
   * Run the agent on a user query with thread-safe per-run isolation.
   */
  async run<T = string>(
    input: string,
    options: AgentRunOptions = {}
  ): Promise<ExecutionResult<T>> {
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

    return scopedRuntime.execute<T>(input, options);
  }

  /**
   * Register human-in-the-loop approval callback handler.
   */
  onApprovalRequest(handler: ApprovalHandler): void {
    this.approvalManager.setHandler(handler);
  }

  /**
   * Stream real-time events and generated tokens as an AsyncIterableIterator.
   */
  async *stream(
    input: string,
    options: AgentRunOptions = {}
  ): AsyncGenerator<SDKEvent, void, unknown> {
    const scopedEmitter = options.eventEmitter || new SDKEventEmitter();

    if (scopedEmitter !== this.eventEmitter) {
      scopedEmitter.onAny((evt: SDKEvent) => {
        this.eventEmitter.emit(evt);
      });
    }

    const streamIterable = scopedEmitter.toAsyncIterable();
    const runPromise = this.run(input, { ...options, eventEmitter: scopedEmitter }).catch(() => {});

    yield* streamIterable;
    await runPromise;
  }

  /**
   * Safe Agent Sandbox / Simulation Mode.
   */
  async simulate(input: string): Promise<SimulationReport> {
    return AgentSandbox.simulate(
      input,
      Array.from(this.tools.values()),
      this.instructions
    );
  }

  getEventEmitter(): SDKEventEmitter {
    return this.eventEmitter;
  }

  getModel(): ModelProvider {
    return this.model;
  }
}
