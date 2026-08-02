import { TraceRecord, TraceSpan, TraceStorage } from "./types.js";
export declare class InMemoryTraceStorage implements TraceStorage {
    private traces;
    saveTrace(trace: TraceRecord): Promise<void>;
    getTrace(runId: string): Promise<TraceRecord | null>;
    listTraces(sessionId?: string): Promise<TraceRecord[]>;
}
export declare class Tracer {
    private activeSpans;
    private completedSpans;
    readonly runId: string;
    readonly sessionId?: string;
    readonly agentId?: string;
    private startTime;
    constructor(runId: string, sessionId?: string, agentId?: string);
    startSpan(name: string, kind: TraceSpan["kind"], parentId?: string, attributes?: Record<string, unknown>): TraceSpan;
    endSpan(spanId: string, status?: "ok" | "error", error?: string): TraceSpan | undefined;
    addEvent(spanId: string, eventName: string, payload?: unknown): void;
    exportRecord(): TraceRecord;
}
//# sourceMappingURL=tracer.d.ts.map