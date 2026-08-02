import { Message } from "../providers/types.js";
import { z } from "zod";
export type ExecutionState = "idle" | "running" | "waiting_tool" | "waiting_approval" | "handoff" | "completed" | "failed" | "cancelled";
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
export declare class ExecutionContext {
    readonly runId: string;
    readonly agentId: string;
    readonly sessionId: string;
    readonly userId?: string;
    readonly signal?: AbortSignal;
    state: ExecutionState;
    stepCount: number;
    messages: Message[];
    toolsUsedSet: Set<string>;
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata: Record<string, unknown>;
    readonly startTime: number;
    constructor(config: {
        runId?: string;
        agentId: string;
        sessionId?: string;
        userId?: string;
        signal?: AbortSignal;
        metadata?: Record<string, unknown>;
    });
    checkCancellation(): void;
    toRunState(): RunState;
}
//# sourceMappingURL=context.d.ts.map