import { AuthenticationError, RateLimitError, ProviderServerError, ProviderError, } from "./types.js";
export class GeminiProvider {
    id = "gemini";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config) {
        this.modelName = config.model;
        this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        this.baseUrl = (config.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("gemini", "Gemini API key missing. Pass apiKey or set GEMINI_API_KEY.");
        }
    }
    handleError(status, errorData) {
        const msg = typeof errorData === "object" && errorData ? JSON.stringify(errorData) : `HTTP ${status}`;
        if (status === 401 || status === 403)
            throw new AuthenticationError("gemini", msg);
        if (status === 429)
            throw new RateLimitError("gemini", msg);
        if (status >= 500)
            throw new ProviderServerError("gemini", status, msg);
        throw new ProviderError(msg, "gemini", status, false);
    }
    async generate(messages, options) {
        const contents = messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));
        const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
            signal: options?.signal,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            this.handleError(res.status, err);
        }
        const data = (await res.json());
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return {
            text,
            finishReason: "stop",
            rawResponse: data,
        };
    }
    async *generateStream(messages, options) {
        const res = await this.generate(messages, options);
        yield { deltaText: res.text, finishReason: "stop" };
    }
}
//# sourceMappingURL=gemini.provider.js.map