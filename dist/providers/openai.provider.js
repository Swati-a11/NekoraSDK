import { AuthenticationError, RateLimitError, ProviderServerError, ProviderError, } from "./types.js";
export class OpenAIProvider {
    id = "openai";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config) {
        this.modelName = config.model;
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
        this.baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("openai", "OpenAI API key is missing. Pass apiKey in config or set OPENAI_API_KEY.");
        }
    }
    getHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            ...this.defaultConfig.headers,
        };
    }
    handleError(status, errorData) {
        const msg = typeof errorData === "object" && errorData && "error" in errorData
            ? JSON.stringify(errorData.error)
            : `HTTP ${status}`;
        if (status === 401 || status === 403) {
            throw new AuthenticationError("openai", msg);
        }
        if (status === 429) {
            throw new RateLimitError("openai", msg);
        }
        if (status >= 500) {
            throw new ProviderServerError("openai", status, msg);
        }
        throw new ProviderError(msg, "openai", status, false);
    }
    async generate(messages, options) {
        const payload = {
            model: this.modelName,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
                name: m.name,
                tool_call_id: m.toolCallId,
                tool_calls: m.toolCalls?.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments),
                    },
                })),
            })),
            tools: options?.tools?.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            })),
            temperature: options?.temperature ?? this.defaultConfig.temperature,
            max_tokens: options?.maxTokens ?? this.defaultConfig.maxTokens,
        };
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
        const choice = data.choices?.[0];
        const msg = choice?.message;
        const toolCalls = msg?.tool_calls?.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || "{}"),
        }));
        return {
            text: msg?.content || "",
            toolCalls: toolCalls?.length ? toolCalls : undefined,
            finishReason: choice?.finish_reason === "tool_calls" ? "tool_calls" : "stop",
            usage: data.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                }
                : undefined,
            rawResponse: data,
        };
    }
    async *generateStream(messages, options) {
        const payload = {
            model: this.modelName,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream: true,
            temperature: options?.temperature ?? this.defaultConfig.temperature,
            max_tokens: options?.maxTokens ?? this.defaultConfig.maxTokens,
        };
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
                    if (!trimmed || trimmed.startsWith(":"))
                        continue;
                    if (trimmed === "data: [DONE]")
                        return;
                    if (trimmed.startsWith("data: ")) {
                        const dataStr = trimmed.slice(6);
                        try {
                            const parsed = JSON.parse(dataStr);
                            const delta = parsed.choices?.[0]?.delta;
                            if (delta?.content) {
                                yield { deltaText: delta.content };
                            }
                        }
                        catch {
                            // ignore malformed SSE chunks
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
//# sourceMappingURL=openai.provider.js.map