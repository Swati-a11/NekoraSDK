export class HandoffLoopError extends Error {
    trace;
    constructor(trace) {
        super(`Handoff loop detected across sequence: ${trace.join(" -> ")}`);
        this.trace = trace;
        this.name = "HandoffLoopError";
    }
}
//# sourceMappingURL=types.js.map