export class GuardrailViolationError extends Error {
    guardrailName;
    stage;
    reason;
    constructor(guardrailName, stage, reason) {
        super(`Guardrail '${guardrailName}' violated at stage '${stage}': ${reason}`);
        this.guardrailName = guardrailName;
        this.stage = stage;
        this.reason = reason;
        this.name = "GuardrailViolationError";
    }
}
//# sourceMappingURL=types.js.map