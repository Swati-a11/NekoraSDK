import { Message, ModelProvider, ModelResponse, ToolCall } from "../providers/types.js";
import { Tool } from "../tools/types.js";
import { ToolPermissionManager } from "../tools/permissions.js";
import { GuardrailPipeline } from "../guardrails/pipeline.js";
import { MemoryAdapter } from "../memory/types.js";
import { SessionStore } from "../session/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { Tracer, InMemoryTraceStorage } from "../tracing/tracer.js";
import { RunTrace } from "../tracing/types.js";
import { UsageTracker } from "../cost/tracker.js";
import { PluginManager } from "../plugins/plugin-manager.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { StructuredOutputValidator } from "../structured/validator.js";
import { ApprovalManager } from "../approval/approval.manager.js";
import { ExecutionContext, ExecutionOptions, RunState } from "./context.js";
import { ToolApprovalRequiredError, ToolValidationError } from "../tools/types.js";
import { z } from "zod";

export interface ExecutionResult<T = string> {
  runId: string;
  sessionId: string;
  output: T;
  rawText: string;
  messages: Message[];
  steps: number;
  totalTokens: number;
  durationMs: number;
  handoffTarget?: string;
  runState?: RunState;
  runTrace?: RunTrace;
  metadata?: Record<string, unknown>;
}

export interface NekoraEngineConfig {
  agentId: string;
  agentName?: string;
  instructions: string;
  model: ModelProvider;
  tools?: Tool[];
  memory?: MemoryAdapter;
  sessionStore?: SessionStore;
  guardrails?: GuardrailPipeline;
  permissionManager?: ToolPermissionManager;
  handoffManager?: HandoffManager;
  approvalManager?: ApprovalManager;
  eventEmitter?: SDKEventEmitter;
  tracer?: Tracer;
  traceStorage?: InMemoryTraceStorage;
  usageTracker?: UsageTracker;
  pluginManager?: PluginManager;
}

/**
 * NekoraExecutionEngine
 * 
 * Production-grade autonomous execution engine with RunState isolation per run.
 * Every run creates an isolated ExecutionContext & Tracer instance preventing cross-turn state leaks.
 */
export class NekoraExecutionEngine {
  constructor(private config: NekoraEngineConfig) {}

  async execute<T = string>(
    input: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    const maxIterations = options.maxIterations ?? 10;
    
    let timeoutController: AbortController | undefined;
    let effectiveSignal = options.signal;

    if (options.timeoutMs && options.timeoutMs > 0) {
      timeoutController = new AbortController();
      if (options.signal) {
        options.signal.addEventListener("abort", () => timeoutController?.abort());
      }
      setTimeout(() => {
        timeoutController?.abort();
      }, options.timeoutMs);
      effectiveSignal = timeoutController.signal;
    }

    // Per-run isolated ExecutionContext & RunState
    const ctx = new ExecutionContext({
      agentId: this.config.agentId,
      sessionId: options.sessionId,
      userId: options.userId,
      signal: effectiveSignal,
      metadata: options.metadata,
    });

    ctx.state = "running";
    const emitter = this.config.eventEmitter || new SDKEventEmitter();
    const tracer = new Tracer(ctx.runId, ctx.sessionId, ctx.agentId);
    const parentSpan = tracer.startSpan("agent_run", "custom", undefined, { input });

    emitter.emit({
      type: "run.started",
      runId: ctx.runId,
      agentId: ctx.agentId,
      timestamp: Date.now(),
      input,
    });
    emitter.emit({
      type: "agent_started",
      agentId: ctx.agentId,
      timestamp: Date.now(),
    });

    try {
      ctx.checkCancellation();

      let processedInput = input;
      if (this.config.guardrails) {
        const inputSpan = tracer.startSpan("guardrail_input", "guardrail", parentSpan.id);
        try {
          const res = await this.config.guardrails.execute("input", input, {
            agentId: ctx.agentId,
          });
          processedInput = String(res.content);
          tracer.endSpan(inputSpan.id, "ok");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          tracer.endSpan(inputSpan.id, "error", msg);
          emitter.emit({
            type: "guardrail.failed",
            guardrailName: "input",
            stage: "input",
            reason: msg,
            runId: ctx.runId,
            timestamp: Date.now(),
          });
          throw err;
        }
      }

      let history: Message[] = [];
      if (this.config.memory && ctx.sessionId) {
        history = await this.config.memory.getHistory(ctx.sessionId);
        emitter.emit({
          type: "memory_retrieved",
          sessionId: ctx.sessionId,
          count: history.length,
        });
      }

      let activeInstructions = this.config.instructions;
      if (this.config.memory && typeof (this.config.memory as any).retrieveContextBlock === "function") {
        const memBlock = (this.config.memory as any).retrieveContextBlock(processedInput);
        if (memBlock) {
          activeInstructions = `${activeInstructions}\n\n${memBlock}`;
        }
      }

      const systemMessage: Message = {
        role: "system",
        content: activeInstructions,
      };

      const userMessage: Message = {
        role: "user",
        content: processedInput,
      };

      const lastStored = history[history.length - 1];
      const isAlreadyStored =
        lastStored && lastStored.role === "user" && lastStored.content === processedInput;

      if (isAlreadyStored) {
        ctx.messages = [systemMessage, ...history];
      } else {
        ctx.messages = [systemMessage, ...history, userMessage];
        if (this.config.memory && ctx.sessionId) {
          await this.config.memory.saveMessage(ctx.sessionId, userMessage);
          emitter.emit({
            type: "memory_saved",
            sessionId: ctx.sessionId,
            role: "user",
          });
        }
      }

      let finalResponseText = "";
      let structuredResultData: any = undefined;
      const toolMap = new Map<string, Tool>(
        (this.config.tools || []).map((t) => [t.name, t])
      );

      while (ctx.stepCount < maxIterations) {
        ctx.checkCancellation();
        ctx.stepCount++;

        emitter.emit({
          type: "agent_thinking",
          agentId: ctx.agentId,
          step: ctx.stepCount,
        });

        if (this.config.pluginManager) {
          const modMessages = await this.config.pluginManager.onBeforeModelCall(ctx.messages);
          if (modMessages) ctx.messages = modMessages;
        }

        const toolDefs = Array.from(toolMap.values()).map((t) => t.toDefinition());
        const modelSpan = tracer.startSpan(`model_call_step_${ctx.stepCount}`, "model_call", parentSpan.id, {
          messagesCount: ctx.messages.length,
        });

        emitter.emit({
          type: "model.started",
          runId: ctx.runId,
          model: this.config.model.modelName,
          timestamp: Date.now(),
          messageCount: ctx.messages.length,
        });
        emitter.emit({
          type: "model_called",
          model: this.config.model.modelName,
        });

        let modelRes: ModelResponse;

        if (
          typeof this.config.model.generateStream === "function" &&
          this.config.model.capabilities?.()?.supportsStreaming
        ) {
          let fullText = "";
          let finishReason: any = undefined;
          let usage: any = undefined;

          for await (const chunk of this.config.model.generateStream(ctx.messages, {
            tools: toolDefs.length > 0 ? toolDefs : undefined,
            signal: ctx.signal,
          })) {
            const textDelta = chunk.textDelta || chunk.deltaText || "";
            if (textDelta) {
              fullText += textDelta;
              emitter.emit({
                type: "token.generated",
                token: textDelta,
                delta: textDelta,
                timestamp: Date.now(),
              });
              emitter.emit({
                type: "text_stream",
                delta: textDelta,
              });
            }
            if (chunk.finishReason) finishReason = chunk.finishReason;
            if (chunk.usage) usage = chunk.usage;
          }

          modelRes = {
            text: fullText,
            finishReason,
            usage,
          };
        } else {
          modelRes = await this.config.model.generate(ctx.messages, {
            tools: toolDefs.length > 0 ? toolDefs : undefined,
            signal: ctx.signal,
          });

          if (modelRes.text) {
            const tokens = modelRes.text.match(/[\s\S]{1,4}|\S+\s*/g) || [modelRes.text];
            for (const t of tokens) {
              emitter.emit({
                type: "token.generated",
                token: t,
                delta: t,
                timestamp: Date.now(),
              });
              emitter.emit({
                type: "text_stream",
                delta: t,
              });
            }
          }
        }

        if (modelRes.usage) {
          ctx.tokenUsage.promptTokens += modelRes.usage.promptTokens || 0;
          ctx.tokenUsage.completionTokens += modelRes.usage.completionTokens || 0;
          ctx.tokenUsage.totalTokens += modelRes.usage.totalTokens || 0;

          if (this.config.usageTracker) {
            this.config.usageTracker.recordUsage(this.config.model.modelName, modelRes.usage);
          }
        }

        tracer.endSpan(modelSpan.id, "ok");
        emitter.emit({
          type: "model_completed",
          model: this.config.model.modelName,
        });

        if (this.config.pluginManager) {
          const modRes = await this.config.pluginManager.onAfterModelCall(modelRes);
          if (modRes) Object.assign(modelRes, modRes);
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: modelRes.text || "",
          toolCalls: modelRes.toolCalls,
        };
        ctx.messages.push(assistantMessage);

        if (this.config.memory && ctx.sessionId) {
          await this.config.memory.saveMessage(ctx.sessionId, assistantMessage);
        }

        if (modelRes.toolCalls && modelRes.toolCalls.length > 0) {
          ctx.state = "waiting_tool";

          for (const tc of modelRes.toolCalls) {
            ctx.toolsUsedSet.add(tc.name);
          }

          const toolResults = await this.executeToolCalls(
            modelRes.toolCalls,
            toolMap,
            ctx,
            options,
            emitter,
            tracer
          );

          for (const resMessage of toolResults) {
            ctx.messages.push(resMessage);
            if (this.config.memory && ctx.sessionId) {
              await this.config.memory.saveMessage(ctx.sessionId, resMessage);
            }
          }

          continue;
        }

        finalResponseText = modelRes.text || "";
        break;
      }

      if (ctx.stepCount >= maxIterations && !finalResponseText) {
        throw new Error(`Execution exceeded maximum iterations (${maxIterations}).`);
      }

      let processedOutput = finalResponseText;
      if (this.config.guardrails) {
        const outSpan = tracer.startSpan("guardrail_output", "guardrail", parentSpan.id);
        try {
          const res = await this.config.guardrails.execute("output", finalResponseText, {
            agentId: ctx.agentId,
          });
          processedOutput = String(res.content);
          tracer.endSpan(outSpan.id, "ok");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          tracer.endSpan(outSpan.id, "error", msg);
          emitter.emit({
            type: "guardrail.failed",
            guardrailName: "output",
            stage: "output",
            reason: msg,
            runId: ctx.runId,
            timestamp: Date.now(),
          });
          throw err;
        }
      }

      if (options.outputSchema) {
        const schema = options.outputSchema instanceof z.ZodType
          ? options.outputSchema
          : z.object(options.outputSchema as any);

        const validator = new StructuredOutputValidator({ schema });
        const valResult = validator.parse(processedOutput);

        if (valResult.success) {
          structuredResultData = valResult.data;
        } else {
          ctx.messages.push({
            role: "user",
            content: valResult.repairPrompt || "Invalid JSON output, please fix schema errors.",
          });

          const repairRes = await this.config.model.generate(ctx.messages, {
            signal: ctx.signal,
          });
          const reparse = validator.parse(repairRes.text || "");
          if (reparse.success) {
            structuredResultData = reparse.data;
            processedOutput = repairRes.text || "";
          } else {
            throw new Error(`Structured output validation failed: ${reparse.repairPrompt}`);
          }
        }
      }

      ctx.state = "completed";
      const totalTokens = ctx.tokenUsage.totalTokens || this.config.usageTracker?.getReport().totalTokens || 0;
      const durationMs = Date.now() - ctx.startTime;

      tracer.endSpan(parentSpan.id, "ok");

      const runState = ctx.toRunState();
      const runTrace = tracer.exportRunTrace(this.config.agentName || this.config.agentId, "completed");

      if (this.config.traceStorage) {
        await this.config.traceStorage.saveRunTrace(runTrace);
        await this.config.traceStorage.saveTrace(tracer.exportRecord());
      }

      const result: ExecutionResult<T> = {
        runId: ctx.runId,
        sessionId: ctx.sessionId,
        output: (structuredResultData !== undefined ? structuredResultData : processedOutput) as T,
        rawText: processedOutput,
        messages: ctx.messages,
        steps: ctx.stepCount,
        totalTokens,
        durationMs,
        runState,
        runTrace,
      };

      emitter.emit({
        type: "run.completed",
        runId: ctx.runId,
        result,
        timestamp: Date.now(),
      });
      emitter.emit({
        type: "run_completed",
        result,
      });

      return result;
    } catch (err) {
      ctx.state = "failed";
      const error = err instanceof Error ? err : new Error(String(err));
      tracer.endSpan(parentSpan.id, "error", error.message);

      const runTrace = tracer.exportRunTrace(this.config.agentName || this.config.agentId, "failed");
      if (this.config.traceStorage) {
        await this.config.traceStorage.saveRunTrace(runTrace);
        await this.config.traceStorage.saveTrace(tracer.exportRecord());
      }

      emitter.emit({
        type: "run.failed",
        runId: ctx.runId,
        error,
        timestamp: Date.now(),
      });
      emitter.emit({
        type: "run_failed",
        error,
      });

      throw error;
    }
  }

  private async executeToolCalls(
    toolCalls: ToolCall[],
    toolMap: Map<string, Tool>,
    ctx: ExecutionContext,
    options: ExecutionOptions,
    emitter: SDKEventEmitter,
    tracer: Tracer
  ): Promise<Message[]> {
    const promises = toolCalls.map(async (tc) => {
      const toolSpan = tracer.startSpan(`tool_${tc.name}`, "tool_execution", undefined, {
        toolName: tc.name,
        arguments: tc.arguments,
      });

      emitter.emit({
        type: "tool.started",
        toolName: tc.name,
        input: tc.arguments,
        runId: ctx.runId,
        timestamp: Date.now(),
      });
      emitter.emit({
        type: "tool_started",
        toolName: tc.name,
        input: tc.arguments,
      });

      try {
        const targetTool = toolMap.get(tc.name);
        if (!targetTool) {
          throw new ToolValidationError(tc.name, `Tool '${tc.name}' not found in registry.`);
        }

        if (this.config.guardrails) {
          await this.config.guardrails.execute("tool", tc.arguments, {
            agentId: ctx.agentId,
            toolName: tc.name,
          });
        }

        if (this.config.permissionManager && targetTool.permissions?.length) {
          this.config.permissionManager.validateToolPermissions(tc.name, targetTool.permissions);
        }

        const needsApproval =
          targetTool.requireApproval ||
          options.requireApprovalForTools ||
          (this.config.approvalManager && this.config.approvalManager.requiresApproval(targetTool, tc.arguments));

        if (needsApproval) {
          ctx.state = "waiting_approval";
          emitter.emit({
            type: "approval.required",
            toolName: tc.name,
            args: tc.arguments,
            runId: ctx.runId,
            timestamp: Date.now(),
          });

          if (this.config.approvalManager) {
            const result = await this.config.approvalManager.evaluateAndRequest(targetTool, tc.arguments, {
              runId: ctx.runId,
              eventEmitter: emitter,
            });

            if (!result.approved) {
              throw new ToolApprovalRequiredError(tc.name, `Human approval rejected: ${result.reason || "Execution denied"}`);
            }
          } else {
            throw new ToolApprovalRequiredError(tc.name, tc.arguments);
          }
        }

        let argsToPass = tc.arguments;
        if (this.config.pluginManager) {
          const modArgs = await this.config.pluginManager.onBeforeToolExecution(
            tc.name,
            tc.arguments
          );
          if (modArgs !== undefined) argsToPass = modArgs as Record<string, unknown>;
        }

        let output = await targetTool.execute(argsToPass, {
          runId: ctx.runId,
          sessionId: ctx.sessionId,
          agentId: ctx.agentId,
          signal: ctx.signal,
        });

        if (this.config.pluginManager) {
          const modOut = await this.config.pluginManager.onAfterToolExecution(tc.name, output);
          if (modOut !== undefined) output = modOut;
        }

        tracer.endSpan(toolSpan.id, "ok");
        emitter.emit({
          type: "tool.completed",
          toolName: tc.name,
          output,
          runId: ctx.runId,
          timestamp: Date.now(),
        });
        emitter.emit({
          type: "tool_completed",
          toolName: tc.name,
          output,
        });

        const outputStr = typeof output === "string" ? output : JSON.stringify(output);
        return {
          role: "tool" as const,
          name: tc.name,
          toolCallId: tc.id,
          content: outputStr,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        tracer.endSpan(toolSpan.id, "error", errorMsg);

        if (err instanceof ToolApprovalRequiredError) {
          throw err;
        }

        return {
          role: "tool" as const,
          name: tc.name,
          toolCallId: tc.id,
          content: JSON.stringify({ error: errorMsg }),
        };
      }
    });

    return await Promise.all(promises);
  }
}

export { NekoraExecutionEngine as AgentExecutionLoop };
export type { NekoraEngineConfig as AgentLoopConfig };
