import { OpenAIProvider, InMemoryAdapter, GuardrailPipeline, PIISanitizerGuardrail, SDKEventEmitter, UsageTracker, } from "@nekora-ai/core";
// 1. Initialize Supporting Modules
const provider = new OpenAIProvider({ model: "gpt-4o-mini" });
const memory = new InMemoryAdapter();
const guardrails = new GuardrailPipeline().register(new PIISanitizerGuardrail("output"));
const events = new SDKEventEmitter();
const usageTracker = new UsageTracker();
events.on("text_stream", (evt) => {
    process.stdout.write(evt.delta);
});
console.log("🐾 Nekora AI Agent initialized successfully!");
console.log("Ready to wire up your custom Agent Runtime loop.");
