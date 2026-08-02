import { ModelProvider } from "../providers/types.js";
/**
 * Agent Runtime Placeholder
 *
 * Note: Per user architecture rules, the core agent runtime loop, execution cycle,
 * tool calling decision flow, and reasoning orchestration are implemented by you.
 *
 * Wire your custom loop here using the supporting infrastructure modules provided by Nekora AI:
 * - ModelProvider (OpenAI, Gemini, Claude, Groq, OpenRouter, Fallback)
 * - MemoryAdapter & SessionStore
 * - GuardrailPipeline
 * - SDKEventEmitter
 * - UsageTracker & Tracer
 */
export declare class AgentRuntime {
    protected model: ModelProvider;
    protected options?: Record<string, unknown> | undefined;
    constructor(model: ModelProvider, options?: Record<string, unknown> | undefined);
    /**
     * Override or implement your custom agent runtime loop here.
     */
    run(input: string, options?: Record<string, unknown>): Promise<string>;
}
//# sourceMappingURL=runtime.d.ts.map