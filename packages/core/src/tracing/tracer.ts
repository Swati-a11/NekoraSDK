import { TraceRecord, TraceSpan, TraceStorage, RunTrace } from "./types.js";

export class InMemoryTraceStorage implements TraceStorage {
  private traces: Map<string, TraceRecord> = new Map();
  private runTraces: Map<string, RunTrace> = new Map();

  async saveTrace(trace: TraceRecord): Promise<void> {
    this.traces.set(trace.runId, trace);
  }

  async saveRunTrace(runTrace: RunTrace): Promise<void> {
    this.runTraces.set(runTrace.runId, runTrace);
  }

  async getTrace(runId: string): Promise<TraceRecord | null> {
    return this.traces.get(runId) || null;
  }

  async getRunTrace(runId: string): Promise<RunTrace | null> {
    return this.runTraces.get(runId) || null;
  }

  async listTraces(sessionId?: string): Promise<TraceRecord[]> {
    const list = Array.from(this.traces.values());
    if (sessionId) {
      return list.filter((t) => t.sessionId === sessionId);
    }
    return list;
  }
}

export class Tracer {
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedSpans: TraceSpan[] = [];
  public readonly runId: string;
  public readonly sessionId?: string;
  public readonly agentId?: string;
  private startTime: number;

  constructor(runId: string, sessionId?: string, agentId?: string) {
    this.runId = runId;
    this.sessionId = sessionId;
    this.agentId = agentId;
    this.startTime = Date.now();
  }

  startSpan(name: string, kind: TraceSpan["kind"], parentId?: string, attributes: Record<string, unknown> = {}): TraceSpan {
    const span: TraceSpan = {
      id: `span_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      parentId,
      name,
      kind,
      startTime: Date.now(),
      attributes,
      events: [],
      status: "ok",
    };
    this.activeSpans.set(span.id, span);
    return span;
  }

  endSpan(spanId: string, status: "ok" | "error" = "ok", error?: string): TraceSpan | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    if (error) span.error = error;

    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);
    return span;
  }

  addEvent(spanId: string, eventName: string, payload?: unknown): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({ name: eventName, timestamp: Date.now(), payload });
    }
  }

  exportRecord(): TraceRecord {
    return {
      runId: this.runId,
      sessionId: this.sessionId,
      agentId: this.agentId,
      startTime: this.startTime,
      endTime: Date.now(),
      spans: [...this.completedSpans, ...Array.from(this.activeSpans.values())],
    };
  }

  exportRunTrace(agentName: string, status: "completed" | "failed" | "cancelled" = "completed"): RunTrace {
    const allSpans = [...this.completedSpans, ...Array.from(this.activeSpans.values())];
    const toolSpans = allSpans.filter((s) => s.kind === "tool_execution");
    const modelSpans = allSpans.filter((s) => s.kind === "model_call");
    const errorSpans = allSpans.filter((s) => s.status === "error" || s.error);

    const toolsUsed = Array.from(
      new Set(toolSpans.map((s) => String(s.attributes.toolName || s.name.replace(/^tool_/, ""))))
    );
    const errors = errorSpans.map((s) => s.error || `Error in span '${s.name}'`);

    const endTime = Date.now();
    return {
      runId: this.runId,
      agentName,
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      toolsUsed,
      modelCalls: modelSpans.length,
      errors,
      status,
    };
  }
}
