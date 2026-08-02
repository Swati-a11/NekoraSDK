export class ExecutionContext {
    runId;
    agentId;
    sessionId;
    userId;
    signal;
    state = "idle";
    stepCount = 0;
    messages = [];
    toolsUsedSet = new Set();
    tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    metadata = {};
    startTime;
    constructor(config) {
        this.runId = config.runId || `run_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        this.agentId = config.agentId;
        this.sessionId = config.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        this.userId = config.userId;
        this.signal = config.signal;
        this.metadata = config.metadata || {};
        this.startTime = Date.now();
    }
    checkCancellation() {
        if (this.signal?.aborted) {
            this.state = "cancelled";
            throw new Error(`Execution '${this.runId}' was cancelled by AbortSignal.`);
        }
    }
    toRunState() {
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
//# sourceMappingURL=context.js.map