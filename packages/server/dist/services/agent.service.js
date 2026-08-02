import { Agent, tool, NekoCognitiveMemory, GuardrailPipeline, PIISanitizerGuardrail, CodeExecutionTool, } from "@nekora-ai/core";
import { GeminiProvider, OpenAIProvider, GroqProvider } from "@nekora-ai/core/providers";
import { z } from "zod";
import { SandboxService } from "./sandbox.service.js";
import { ToolExecutionError, ValidationError } from "../middleware/error.js";
export class AgentService {
    sandboxService;
    memory;
    constructor(sandboxService) {
        this.sandboxService = sandboxService || new SandboxService();
        this.memory = new NekoCognitiveMemory();
    }
    createProvider(providerName) {
        const selected = providerName?.toLowerCase() || "groq";
        const groqKey = process.env.GROQ_API_KEY || "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";
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        if (selected === "openai" && openaiKey) {
            return new OpenAIProvider({ apiKey: openaiKey, model: "gpt-4o-mini" });
        }
        if (selected === "gemini" && geminiKey) {
            return new GeminiProvider({ apiKey: geminiKey, model: "gemini-2.0-flash" });
        }
        if (selected === "demo") {
            return {
                id: "demo",
                modelName: "demo-local-agent",
                generate: async (messages) => {
                    const lastMsg = messages[messages.length - 1]?.content || "";
                    if (lastMsg.toLowerCase().includes("weather")) {
                        return {
                            text: "The weather in Tokyo is 24°C and Sunny.",
                            toolCalls: [{ id: "tc_1", name: "weather_fetcher", arguments: { city: "Tokyo" } }],
                        };
                    }
                    if (lastMsg.toLowerCase().includes("code") ||
                        lastMsg.toLowerCase().includes("run") ||
                        lastMsg.toLowerCase().includes("console.log")) {
                        return {
                            text: "Code executed successfully.",
                            toolCalls: [
                                {
                                    id: "tc_2",
                                    name: "code_executor",
                                    arguments: { language: "javascript", code: "console.log('Hello Nekora Server')" },
                                },
                            ],
                        };
                    }
                    return {
                        text: `[Nekora Server Demo Mode]: Response for user request: "${lastMsg}"`,
                    };
                },
            };
        }
        // Default to Groq
        return new GroqProvider({ apiKey: groqKey, model: "llama-3.3-70b-versatile" });
    }
    createAgentInstance(providerName) {
        const weatherTool = tool({
            name: "weather_fetcher",
            description: "Get real-time weather information for a specific location or city",
            schema: z.object({
                city: z.string().describe("City or location name"),
            }),
            execute: async ({ city }) => {
                return { city, temperature: "24°C", condition: "Sunny", humidity: "45%" };
            },
        });
        const dbTool = tool({
            name: "database_query",
            description: "Query user database records",
            permissions: ["db:read"],
            schema: z.object({
                query: z.string(),
            }),
            execute: async ({ query }) => {
                return { status: "success", rows: [{ id: 101, user: "Alice", role: "admin" }] };
            },
        });
        const codingTool = new CodeExecutionTool({
            languages: ["javascript", "typescript", "python"],
            timeout: 5000,
            provider: this.sandboxService.getProvider(),
        });
        const guardrails = new GuardrailPipeline().register(new PIISanitizerGuardrail("output"));
        const provider = this.createProvider(providerName);
        return new Agent({
            name: "Nekora Server Agent",
            instructions: "You are an autonomous AI assistant powered by Nekora AI Server Runtime. " +
                "When asked to execute or run code snippets (JavaScript, TypeScript, Python), ALWAYS invoke the code_executor tool immediately. " +
                "When asked about real-time weather, invoke the weather_fetcher tool. " +
                "For general knowledge questions, respond directly.",
            model: provider,
            tools: [weatherTool, dbTool, codingTool],
            memory: this.memory,
            guardrails,
        });
    }
    async runAgent(message, sessionId, providerName) {
        if (!message || typeof message !== "string" || !message.trim()) {
            throw new ValidationError("Parameter 'message' must be a non-empty string.");
        }
        const agent = this.createAgentInstance(providerName);
        const effectiveSessionId = sessionId || `sess_${Date.now()}`;
        try {
            const runResult = await agent.run(message.trim(), { sessionId: effectiveSessionId });
            const toolsUsed = [];
            if (runResult.messages) {
                for (const m of runResult.messages) {
                    if (m.role === "tool" && m.name) {
                        toolsUsed.push(m.name);
                    }
                }
            }
            const responseText = typeof runResult.output === "string"
                ? runResult.output
                : JSON.stringify(runResult.output || "");
            return {
                response: responseText,
                runId: runResult.runId || `run_${Date.now()}`,
                toolsUsed: Array.from(new Set(toolsUsed)),
                traceId: runResult.traceId || `trace_${Date.now()}`,
            };
        }
        catch (err) {
            throw new ToolExecutionError(`Agent execution failed: ${err.message || String(err)}`, { originalError: String(err) });
        }
    }
    async streamAgent(message, sessionId, providerName, onEvent) {
        if (!message || typeof message !== "string" || !message.trim()) {
            throw new ValidationError("Parameter 'message' must be a non-empty string.");
        }
        const agent = this.createAgentInstance(providerName);
        const effectiveSessionId = sessionId || `sess_${Date.now()}`;
        try {
            onEvent({
                event: "agent_started",
                data: { sessionId: effectiveSessionId, provider: providerName || "groq" },
            });
            for await (const event of agent.stream(message.trim(), { sessionId: effectiveSessionId })) {
                if (event.type === "token.generated") {
                    onEvent({
                        event: "text_stream",
                        data: { delta: event.token || event.delta || "", token: event.token || event.delta || "" },
                    });
                }
                else if (event.type === "text_stream") {
                    onEvent({
                        event: "text_stream",
                        data: { delta: event.delta || "", token: event.delta || "" },
                    });
                }
                else if (event.type === "tool.started" || event.type === "tool_started") {
                    onEvent({
                        event: "tool_started",
                        data: { toolName: event.toolName, args: event.input || event.args },
                    });
                }
                else if (event.type === "tool.completed" || event.type === "tool_completed") {
                    onEvent({
                        event: "tool_completed",
                        data: { toolName: event.toolName, result: event.output || event.result },
                    });
                }
                else if (event.type === "run.completed" || event.type === "run_completed") {
                    onEvent({
                        event: "run_completed",
                        data: {
                            runId: event.runId || `run_${Date.now()}`,
                            result: event.result,
                        },
                    });
                }
            }
        }
        catch (err) {
            throw new ToolExecutionError(`Agent streaming failed: ${err.message || String(err)}`, { originalError: String(err) });
        }
    }
}
//# sourceMappingURL=agent.service.js.map