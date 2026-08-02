import { AuthenticationError, RateLimitError, ProviderServerError, ProviderError, } from "./types.js";
export class ClaudeProvider {
    id = "claude";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config) {
        this.modelName = config.model;
        this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || "";
        this.baseUrl = (config.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("claude", "Anthropic API key is missing. Pass apiKey in config or set ANTHROPIC_API_KEY.");
        }
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            ...this.defaultConfig.headers,
        };
    }
    handleError(status, errorData) {
        const msg = typeof errorData === "object" && errorData && "error" in errorData
            ? JSON.stringify(errorData.error)
            : `HTTP ${status}`;
        if (status === 401 || status === 403)
            throw new AuthenticationError("claude", msg);
        if (status === 429)
            throw new RateLimitError("claude", msg);
        if (status >= 500)
            throw new ProviderServerError("claude", status, msg);
        throw new ProviderError(msg, "claude", status, false);
    }
    async generate(messages, options) {
        const systemMessage = messages.find((m) => m.role === "system")?.content;
        const conversationMessages = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
        }));
        const payload = {
            model: this.modelName,
            max_tokens: options?.maxTokens ?? this.defaultConfig.maxTokens ?? 1024,
            system: systemMessage,
            messages: conversationMessages,
            temperature: options?.temperature ?? this.defaultConfig.temperature,
        };
        const res = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
            signal: options?.signal,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            this.handleError(res.status, err);
        }
        const data = (await res.json());
        const textContent = data.content
            ?.filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("") || "";
        return {
            text: textContent,
            finishReason: data.stop_reason === "end_turn" ? "stop" : "stop",
            usage: data.usage
                ? {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens,
                }
                : undefined,
            rawResponse: data,
        };
    }
    async *generateStream(messages, options) {
        const systemMessage = messages.find((m) => m.role === "system")?.content;
        const conversationMessages = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
        }));
        const payload = {
            model: this.modelName,
            max_tokens: options?.maxTokens ?? this.defaultConfig.maxTokens ?? 1024,
            system: systemMessage,
            messages: conversationMessages,
            stream: true,
            temperature: options?.temperature ?? this.defaultConfig.temperature,
        };
        const res = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
            signal: options?.signal,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            this.handleError(res.status, err);
        }
        if (!res.body)
            return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("data: ")) {
                        try {
                            const parsed = JSON.parse(trimmed.slice(6));
                            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                                yield { deltaText: parsed.delta.text };
                            }
                        }
                        catch {
                            // ignore malformed SSE
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
//# sourceMappingURL=claude.provider.js.map