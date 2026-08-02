import { Message } from "../providers/types.js";
import { z } from "zod";

export type ExecutionState =
  | "idle"
  | "running"
  | "waiting_tool"
  | "waiting_approval"
  | "handoff"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutionOptions {
  maxIterations?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  sessionId?: string;
  userId?: string;
  outputSchema?: z.ZodType<any> | Record<string, unknown>;
  requireApprovalForTools?: boolean;
  eventEmitter?: any;
  metadata?: Record<string, unknown>;
}

export interface RunState {
  runId: string;
  agentId: string;
  sessionId: string;
  messages: Message[];
  iterations: number;
  toolsUsed: string[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  startTime: number;
  metadata: Record<string, unknown>;
}

export class ExecutionContext {
  readonly runId: string;
  readonly agentId: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly signal?: AbortSignal;
  state: ExecutionState = "idle";
  stepCount: number = 0;
  messages: Message[] = [];
  toolsUsedSet: Set<string> = new Set();
  tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  metadata: Record<string, unknown> = {};
  readonly startTime: number;

  constructor(config: {
    runId?: string;
    agentId: string;
    sessionId?: string;
    userId?: string;
    signal?: AbortSignal;
    metadata?: Record<string, unknown>;
  }) {
    this.runId = config.runId || `run_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    this.agentId = config.agentId;
    this.sessionId = config.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    this.userId = config.userId;
    this.signal = config.signal;
    this.metadata = config.metadata || {};
    this.startTime = Date.now();
  }

  checkCancellation(): void {
    if (this.signal?.aborted) {
      this.state = "cancelled";
      throw new Error(`Execution '${this.runId}' was cancelled by AbortSignal.`);
    }
  }

  toRunState(): RunState {
    return {
      runId: this.runId,
      agentId: this.agentId,
      sessionId: this.sessionId,
      messages: [...this.messages],
      iterations: this.stepCount,
      toolsUsed: Array.from(this.toolsUsedSet),
      tokenUsage: { ...this.tokenUsage },
      startTime: this.startTime,
      metadata: { ...this.metadata },
    };
  }
}
