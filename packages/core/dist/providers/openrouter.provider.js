import { AuthenticationError, } from "./types.js";
import { getEnvVar } from "../agent/agent.js";
export class OpenRouterProvider {
    id = "openrouter";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config = {}) {
        this.modelName = config.model || "meta-llama/llama-3.3-70b-instruct";
        this.apiKey = config.apiKey || getEnvVar("OPENROUTER_API_KEY") || "";
        this.baseUrl = (config.baseUrl || "https://openrouter.ai/api/v1").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("openrouter", "OpenRouter API key missing. Pass apiKey or set OPENROUTER_API_KEY.");
        }
    }
    async generate(messages, options = {}) {
        const formattedMessages = messages.map((m) => {
            if (m.role === "tool") {
                return {
                    role: "tool",
                    tool_call_id: m.toolCallId || `call_${Date.now()}`,
                    content: m.content,
                };
            }
            if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
                return {
                    role: "assistant",
                    content: m.content || null,
                    tool_calls: m.toolCalls.map((tc) => ({
                        id: tc.id,
                        type: "function",
                        function: {
                            name: tc.name,
                            arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments),
                        },
                    })),
                };
            }
            return {
                role: m.role,
                content: m.content,
            };
        });
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.modelName,
                messages: formattedMessages,
                tools: options.tools
                    ? options.tools.map((t) => ({
                        type: "function",
                        function: t,
                    }))
                    : undefined,
            }),
        });
        const data = (await res.json());
        if (!res.ok) {
            throw new Error(`OpenRouter API Error (${res.status}): ${JSON.stringify(data)}`);
        }
        const choice = data.choices?.[0];
        const toolCalls = choice?.message?.tool_calls?.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments || "{}")
                : tc.function.arguments,
        }));
        return {
            text: choice?.message?.content || "",
            toolCalls,
            finishReason: choice?.finish_reason || "stop",
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
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
//# sourceMappingURL=openrouter.provider.js.map