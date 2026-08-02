export class InMemoryTraceStorage {
    traces = new Map();
    async saveTrace(trace) {
        this.traces.set(trace.runId, trace);
    }
    async getTrace(runId) {
        return this.traces.get(runId) || null;
    }
    async listTraces(sessionId) {
        const list = Array.from(this.traces.values());
        if (sessionId) {
            return list.filter((t) => t.sessionId === sessionId);
        }
        return list;
    }
}
export class Tracer {
    activeSpans = new Map();
    completedSpans = [];
    runId;
    sessionId;
    agentId;
    startTime;
    constructor(runId, sessionId, agentId) {
        this.runId = runId;
        this.sessionId = sessionId;
        this.agentId = agentId;
        this.startTime = Date.now();
    }
    startSpan(name, kind, parentId, attributes = {}) {
        const span = {
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
    endSpan(spanId, status = "ok", error) {
        const span = this.activeSpans.get(spanId);
        if (!span)
            return undefined;
        span.endTime = Date.now();
        span.durationMs = span.endTime - span.startTime;
        span.status = status;
        if (error)
            span.error = error;
        this.activeSpans.delete(spanId);
        this.completedSpans.push(span);
        return span;
    }
    addEvent(spanId, eventName, payload) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.events.push({ name: eventName, timestamp: Date.now(), payload });
        }
    }
    exportRecord() {
        return {
            runId: this.runId,
            sessionId: this.sessionId,
            agentId: this.agentId,
            startTime: this.startTime,
            endTime: Date.now(),
            spans: [...this.completedSpans, ...Array.from(this.activeSpans.values())],
        };
    }
}
//# sourceMappingURL=tracer.js.map