import { AuthenticationError, } from "./types.js";
import { getEnvVar } from "../agent/agent.js";
/**
 * GroqProvider
 *
 * Production-grade Groq model provider adapter with resilient tool-calling normalization,
 * native tool_calls parsing, and failed_generation recovery for Llama 3 models.
 */
export class GroqProvider {
    id = "groq";
    modelName;
    apiKey;
    baseUrl;
    defaultConfig;
    constructor(config = {}) {
        this.modelName = config.model || "llama-3.3-70b-versatile";
        this.apiKey = config.apiKey || getEnvVar("GROQ_API_KEY") || "";
        this.baseUrl = (config.baseUrl || "https://api.groq.com/openai/v1").replace(/\/$/, "");
        this.defaultConfig = config;
        if (!this.apiKey) {
            throw new AuthenticationError("groq", "Groq API key missing. Pass apiKey or set GROQ_API_KEY.");
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
            const errMsg = data?.error?.message || JSON.stringify(data);
            if (errMsg.includes("failed_generation") && errMsg.includes("<function=")) {
                const parsedToolCalls = parseFailedGenerationTools(errMsg);
                if (parsedToolCalls.length > 0) {
                    return {
                        text: "",
                        toolCalls: parsedToolCalls,
                        finishReason: "tool_calls",
                        rawResponse: data,
                    };
                }
            }
            throw new Error(`Groq API Error (${res.status}): ${errMsg}`);
        }
        const choice = data.choices?.[0];
        let toolCalls = choice?.message?.tool_calls?.map((tc) => ({
            id: tc.id || `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: tc.function.name,
            arguments: typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments || "{}")
                : tc.function.arguments,
        }));
        const textContent = choice?.message?.content || "";
        if ((!toolCalls || toolCalls.length === 0) && textContent.includes("<function=")) {
            const parsedToolCalls = parseFailedGenerationTools(textContent);
            if (parsedToolCalls.length > 0) {
                toolCalls = parsedToolCalls;
            }
        }
        return {
            text: textContent,
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
function parseFailedGenerationTools(rawText) {
    const funcRegex = /<function=([a-zA-Z0-9_-]+)>\s*([\s\S]*?)\s*<\/function>/g;
    let match;
    const toolCalls = [];
    while ((match = funcRegex.exec(rawText)) !== null) {
        const name = match[1] || "";
        let argsStr = (match[2] || "").trim();
        try {
            const parsedArgs = JSON.parse(argsStr);
            toolCalls.push({
                id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name,
                arguments: parsedArgs,
            });
        }
        catch {
            try {
                const cleanedStr = argsStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                const parsedArgs = JSON.parse(cleanedStr);
                toolCalls.push({
                    id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    name,
                    arguments: parsedArgs,
                });
            }
            catch {
                const codeMatch = argsStr.match(/"code":\s*"([\s\S]*?)"/);
                const langMatch = argsStr.match(/"language":\s*"([a-zA-Z0-9_-]+)"/);
                if (codeMatch || langMatch) {
                    toolCalls.push({
                        id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        name,
                        arguments: {
                            code: codeMatch && codeMatch[1] ? codeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
                            language: langMatch && langMatch[1] ? langMatch[1] : 'javascript',
                        },
                    });
                }
            }
        }
    }
    return toolCalls;
}
//# sourceMappingURL=groq.provider.js.map