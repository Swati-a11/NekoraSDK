import {
  Agent,
  tool,
  NekoCognitiveMemory,
  GuardrailPipeline,
  PIISanitizerGuardrail,
  CodeExecutionTool,
} from "@nekora-ai/core";
import { GeminiProvider, OpenAIProvider, GroqProvider } from "@nekora-ai/core/providers";
import { z } from "zod";
import { ChatResponse } from "../types/index.js";
import { SandboxService } from "./sandbox.service.js";
import { ToolExecutionError, ValidationError } from "../middleware/error.js";

export interface AgentStreamEvent {
  event: "agent_started" | "text_stream" | "tool_started" | "tool_completed" | "run_completed";
  data: any;
}

export class AgentService {
  private sandboxService: SandboxService;
  private memory: NekoCognitiveMemory;

  constructor(sandboxService?: SandboxService) {
    this.sandboxService = sandboxService || new SandboxService();
    this.memory = new NekoCognitiveMemory();
  }

  private createProvider(providerName?: string) {
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
        generate: async (messages: any[]) => {
          const lastMsg = messages[messages.length - 1]?.content || "";
          if (lastMsg.toLowerCase().includes("weather")) {
            return {
              text: "The weather in Tokyo is 24°C and Sunny.",
              toolCalls: [{ id: "tc_1", name: "weather_fetcher", arguments: { city: "Tokyo" } }],
            };
          }
          if (
            lastMsg.toLowerCase().includes("code") ||
            lastMsg.toLowerCase().includes("run") ||
            lastMsg.toLowerCase().includes("console.log")
          ) {
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

  private createAgentInstance(providerName?: string): Agent {
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
      instructions:
        "You are an autonomous AI assistant powered by Nekora AI Server Runtime. " +
        "When asked to execute or run code snippets (JavaScript, TypeScript, Python), ALWAYS invoke the code_executor tool immediately. " +
        "When asked about real-time weather, invoke the weather_fetcher tool. " +
        "For general knowledge questions, respond directly.",
      model: provider,
      tools: [weatherTool, dbTool, codingTool],
      memory: this.memory,
      guardrails,
    });
  }

  public async runAgent(
    message: string,
    sessionId?: string,
    providerName?: string
  ): Promise<ChatResponse> {
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ValidationError("Parameter 'message' must be a non-empty string.");
    }

    const agent = this.createAgentInstance(providerName);
    const effectiveSessionId = sessionId || `sess_${Date.now()}`;

    try {
      const runResult = await agent.run(message.trim(), { sessionId: effectiveSessionId });

      const toolsUsed: string[] = [];
      if (runResult.messages) {
        for (const m of runResult.messages) {
          if (m.role === "tool" && (m as any).name) {
            toolsUsed.push((m as any).name);
          }
        }
      }

      const responseText =
        typeof runResult.output === "string"
          ? runResult.output
          : JSON.stringify(runResult.output || "");

      return {
        response: responseText,
        runId: runResult.runId || `run_${Date.now()}`,
        toolsUsed: Array.from(new Set(toolsUsed)),
        traceId: (runResult as any).traceId || `trace_${Date.now()}`,
      };
    } catch (err: any) {
      throw new ToolExecutionError(
        `Agent execution failed: ${err.message || String(err)}`,
        { originalError: String(err) }
      );
    }
  }

  public async streamAgent(
    message: string,
    sessionId: string | undefined,
    providerName: string | undefined,
    onEvent: (event: AgentStreamEvent) => void
  ): Promise<void> {
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
        } else if (event.type === "text_stream") {
          onEvent({
            event: "text_stream",
            data: { delta: event.delta || "", token: event.delta || "" },
          });
        } else if (event.type === "tool.started" || event.type === "tool_started") {
          onEvent({
            event: "tool_started",
            data: { toolName: (event as any).toolName, args: (event as any).input || (event as any).args },
          });
        } else if (event.type === "tool.completed" || event.type === "tool_completed") {
          onEvent({
            event: "tool_completed",
            data: { toolName: (event as any).toolName, result: (event as any).output || (event as any).result },
          });
        } else if (event.type === "run.completed" || event.type === "run_completed") {
          onEvent({
            event: "run_completed",
            data: {
              runId: (event as any).runId || `run_${Date.now()}`,
              result: (event as any).result,
            },
          });
        }
      }
    } catch (err: any) {
      throw new ToolExecutionError(
        `Agent streaming failed: ${err.message || String(err)}`,
        { originalError: String(err) }
      );
    }
  }
}
