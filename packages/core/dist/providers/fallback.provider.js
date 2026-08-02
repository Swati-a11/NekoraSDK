import { ProviderError, } from "./types.js";
export class FallbackProvider {
    id = "fallback";
    modelName;
    providers;
    emitter;
    constructor(configOrProviders) {
        const providers = Array.isArray(configOrProviders)
            ? configOrProviders
            : configOrProviders.providers;
        const emitter = Array.isArray(configOrProviders) ? undefined : configOrProviders.eventEmitter;
        if (!providers || providers.length === 0) {
            throw new Error("FallbackProvider requires at least one primary provider.");
        }
        this.providers = providers;
        this.modelName = `fallback-[${this.providers.map((p) => p.modelName).join(",")}]`;
        this.emitter = emitter;
    }
    async generate(messages, options) {
        const errors = [];
        for (let i = 0; i < this.providers.length; i++) {
            const provider = this.providers[i];
            try {
                const response = await provider.generate(messages, options);
                if (i > 0 && this.emitter) {
                    this.emitter.emit({
                        type: "provider.fallback",
                        primary: this.providers[0].id,
                        fallback: provider.id,
                        reason: String(errors[errors.length - 1]?.error),
                        timestamp: Date.now(),
                    });
                }
                return response;
            }
            catch (err) {
                errors.push({ provider: provider.id, error: err });
            }
        }
        throw new ProviderError(`All fallback providers failed: ${errors.map((e) => `${e.provider} (${e.error.message})`).join("; ")}`, "fallback");
    }
    async *generateStream(messages, options) {
        for (let i = 0; i < this.providers.length; i++) {
            const provider = this.providers[i];
            try {
                if (provider.generateStream) {
                    for await (const chunk of provider.generateStream(messages, options)) {
                        yield chunk;
                    }
                    return;
                }
            }
            catch {
                // Continue trying next fallback provider
            }
        }
        throw new ProviderError("All fallback providers failed stream generation", "fallback");
    }
}
//# sourceMappingURL=fallback.provider.js.map