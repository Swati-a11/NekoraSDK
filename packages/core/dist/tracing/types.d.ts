import { TokenUsage } from "../providers/types.js";
export interface TraceSpan {
    id: string;
    parentId?: string;
    name: string;
    kind: "model_call" | "tool_execution" | "handoff" | "guardrail" | "custom";
    startTime: number;
    endTime?: number;
    durationMs?: number;
    attributes: Record<string, unknown>;
    events: Array<{
        name: string;
        timestamp: number;
        payload?: unknown;
    }>;
    status: "ok" | "error";
    error?: string;
}
export interface TraceRecord {
    runId: string;
    sessionId?: string;
    agentId?: string;
    startTime: number;
    endTime?: number;
    totalTokens?: TokenUsage;
    spans: TraceSpan[];
}
export interface RunTrace {
    runId: string;
    agentName: string;
    startTime: number;
    endTime: number;
    duration: number;
    toolsUsed: string[];
    modelCalls: number;
    errors: string[];
    status: "completed" | "failed" | "cancelled";
}
export interface TraceStorage {
    saveTrace(trace: TraceRecord): Promise<void>;
    getTrace(runId: string): Promise<TraceRecord | null>;
    listTraces(sessionId?: string): Promise<TraceRecord[]>;
}
//# sourceMappingURL=types.d.ts.map