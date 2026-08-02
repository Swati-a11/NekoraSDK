export type GuardrailStage = "input" | "output" | "tool";
export type GuardrailAction = "allow" | "block" | "modify";
export interface GuardrailResult {
    passed: boolean;
    action: GuardrailAction;
    modifiedContent?: unknown;
    reason?: string;
}
export interface GuardrailContext {
    stage: GuardrailStage;
    agentId?: string;
    toolName?: string;
    metadata?: Record<string, unknown>;
}
export interface Guardrail {
    readonly name: string;
    readonly stage: GuardrailStage;
    validate(content: unknown, context: GuardrailContext): Promise<GuardrailResult>;
}
export declare class GuardrailViolationError extends Error {
    readonly guardrailName: string;
    readonly stage: GuardrailStage;
    readonly reason: string;
    constructor(guardrailName: string, stage: GuardrailStage, reason: string);
}
//# sourceMappingURL=types.d.ts.map