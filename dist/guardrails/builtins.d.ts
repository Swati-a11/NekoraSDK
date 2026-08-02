import { Guardrail, GuardrailResult, GuardrailStage } from "./types.js";
export declare class RegexGuardrail implements Guardrail {
    readonly name: string;
    readonly stage: GuardrailStage;
    private pattern;
    private blockOnMatch;
    private failureReason;
    constructor(name: string, stage: GuardrailStage, pattern: RegExp, blockOnMatch?: boolean, failureReason?: string);
    validate(content: unknown): Promise<GuardrailResult>;
}
export declare class PIISanitizerGuardrail implements Guardrail {
    readonly name = "PIISanitizer";
    readonly stage: GuardrailStage;
    constructor(stage?: GuardrailStage);
    validate(content: unknown): Promise<GuardrailResult>;
}
//# sourceMappingURL=builtins.d.ts.map