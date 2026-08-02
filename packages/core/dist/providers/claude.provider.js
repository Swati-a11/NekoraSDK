import { AuthenticationError, } from "./types.js";
import { getEnvVar } from "../agent/agent.js";
export class ClaudeProvider {
    id = "claude";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config = {}) {
        this.modelName = config.model || "claude-3-5-sonnet-20241022";
        this.apiKey = config.apiKey || getEnvVar("ANTHROPIC_API_KEY") || "";
        this.baseUrl = (config.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("claude", "Anthropic API key missing. Pass apiKey or set ANTHROPIC_API_KEY.");
        }
    }
    async generate(messages, options = {}) {
        const res = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.modelName,
                max_tokens: options.maxTokens || 1024,
                messages: messages.map((m) => ({
                    role: m.role === "system" ? "user" : m.role,
                    content: m.content,
                })),
            }),
        });
        const data = (await res.json());
        if (!res.ok) {
            throw new Error(`Claude API Error (${res.status}): ${JSON.stringify(data)}`);
        }
        const text = data.content?.[0]?.text || "";
        return {
            text,
            finishReason: "stop",
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
            rawResponse: data,
        };
    }
    async *generateStream(messages, options = {}) {
        const res = await this.generate(messages, options);
        yield {
            type: "text_delta",
            textDelta: res.text,
            deltaText: res.text,
        };
        yield {
            type: "done",
            textDelta: "",
            deltaText: "",
            finishReason: "stop",
        };
    }
}
//# sourceMappingURL=claude.provider.js.map