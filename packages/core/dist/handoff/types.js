export class HandoffLoopError extends Error {
    trace;
    code = "HANDOFF_LOOP_DETECTED";
    constructor(trace) {
        super(`Handoff loop detected across agent sequence: ${trace.join(" -> ")}.`);
        this.trace = trace;
        this.name = "HandoffLoopError";
    }
}
//# sourceMappingURL=types.js.map