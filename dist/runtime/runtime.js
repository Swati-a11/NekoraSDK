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
export class AgentRuntime {
    model;
    options;
    constructor(model, options) {
        this.model = model;
        this.options = options;
    }
    /**
     * Override or implement your custom agent runtime loop here.
     */
    async run(input, options) {
        throw new Error("AgentRuntime.run() is a stub. Implement your custom agent runtime loop and reasoning orchestration here.");
    }
}
//# sourceMappingURL=runtime.js.map