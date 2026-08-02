import { describe, it, expect } from "vitest";
import { OpenAIProvider, FallbackProvider, InMemoryAdapter, InMemorySessionStore, AgentRegistry, HandoffManager, GuardrailPipeline, PIISanitizerGuardrail, StructuredOutputValidator, SDKEventEmitter, withRetry, PluginManager, UsageTracker, } from "../index.js";
import { z } from "zod";
describe("Nekora AI Core Infrastructure", () => {
    it("Module 1: Model Provider & Fallback initialization", () => {
        const provider1 = new OpenAIProvider({ model: "gpt-4o", apiKey: "test-key" });
        const fallback = new FallbackProvider([provider1]);
        expect(fallback.id).toBe("fallback");
        expect(fallback.modelName).toContain("gpt-4o");
    });
    it("Module 2: In-Memory Adapter saves and retrieves history", async () => {
        const memory = new InMemoryAdapter();
        await memory.saveMessage("sess-1", { role: "user", content: "Hello world" });
        const history = await memory.getHistory("sess-1");
        expect(history.length).toBe(1);
        expect(history[0]?.content).toBe("Hello world");
    });
    it("Module 3: Session Manager creates and touches sessions", async () => {
        const sessionStore = new InMemorySessionStore();
        const session = await sessionStore.createSession("user-100", { env: "prod" });
        expect(session.userId).toBe("user-100");
        const retrieved = await sessionStore.getSession(session.id);
        expect(retrieved?.id).toBe(session.id);
    });
    it("Module 4: Handoff Manager prevents loops", () => {
        const registry = new AgentRegistry();
        registry.register({ id: "agent-a", name: "Agent A", description: "First agent" });
        registry.register({ id: "agent-b", name: "Agent B", description: "Second agent" });
        const manager = new HandoffManager(registry, { maxHandoffDepth: 3 });
        const handoff = manager.trackHandoff("agent-a", { targetAgentId: "agent-b", reason: "Need billing help" });
        expect(handoff.toAgentId).toBe("agent-b");
        // Loop detection error test
        expect(() => {
            manager.trackHandoff("agent-b", { targetAgentId: "agent-a", reason: "Returning to A" });
        }).toThrow("Handoff loop detected");
    });
    it("Module 5: Guardrails PII Sanitizer redacts emails", async () => {
        const pipeline = new GuardrailPipeline();
        pipeline.register(new PIISanitizerGuardrail("output"));
        const result = await pipeline.execute("output", "Contact user@example.com for support");
        expect(result.content).toBe("Contact [REDACTED_EMAIL] for support");
    });
    it("Module 6: Structured Output validates schema", () => {
        const schema = z.object({ answer: z.string(), score: z.number() });
        const validator = new StructuredOutputValidator({ schema });
        const validJson = JSON.stringify({ answer: "Yes", score: 95 });
        const res = validator.parse(validJson);
        expect(res.success).toBe(true);
        expect(res.data?.score).toBe(95);
        const invalidJson = "Not a json";
        const errRes = validator.parse(invalidJson);
        expect(errRes.success).toBe(false);
        expect(errRes.repairPrompt).toBeDefined();
    });
    it("Module 7: Event Emitter emits and receives events", async () => {
        const emitter = new SDKEventEmitter();
        let received = false;
        emitter.on("text_stream", (data) => {
            if (data.delta === "test")
                received = true;
        });
        emitter.emit({ type: "text_stream", delta: "test" });
        expect(received).toBe(true);
    });
    it("Module 9: Reliability retry retries on failure", async () => {
        let attempts = 0;
        const result = await withRetry(async () => {
            attempts++;
            if (attempts < 2)
                throw new Error("Temporary error");
            return "success";
        }, { maxRetries: 3, initialDelayMs: 10 });
        expect(result).toBe("success");
        expect(attempts).toBe(2);
    });
    it("Module 10: Plugin System calls hooks", async () => {
        const manager = new PluginManager();
        let called = false;
        manager.use({
            name: "test-plugin",
            install(hooks) {
                hooks.onInit = () => {
                    called = true;
                };
            },
        });
        expect(called).toBe(true);
    });
    it("Module 11: Cost Tracker calculates model usage", () => {
        const tracker = new UsageTracker();
        tracker.recordUsage("gpt-4o", { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 });
        const report = tracker.getReport();
        expect(report.totalTokens).toBe(1500);
        expect(report.totalCostUsd).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=core.test.js.map