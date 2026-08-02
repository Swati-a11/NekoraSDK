import { ProviderError, } from "./types.js";
export class FallbackProvider {
    id = "fallback";
    modelName;
    providers;
    constructor(providers) {
        if (!providers || providers.length === 0) {
            throw new Error("FallbackProvider requires at least one provider.");
        }
        this.providers = providers;
        this.modelName = `fallback-[${providers.map((p) => p.modelName).join(",")}]`;
    }
    async generate(messages, options) {
        const errors = [];
        for (const provider of this.providers) {
            try {
                return await provider.generate(messages, options);
            }
            catch (err) {
                errors.push({ provider: provider.id, error: err });
                // continue trying next provider in fallback order
            }
        }
        throw new ProviderError(`All fallback providers failed: ${errors.map((e) => `${e.provider} (${e.error.message})`).join("; ")}`, "fallback", undefined, false);
    }
    async *generateStream(messages, options) {
        for (const provider of this.providers) {
            try {
                for await (const chunk of provider.generateStream(messages, options)) {
                    yield chunk;
                }
                return;
            }
            catch {
                // try next fallback provider
            }
        }
        throw new ProviderError("All fallback providers failed stream generation", "fallback");
    }
}
//# sourceMappingURL=fallback.provider.js.map