import { Guardrail, GuardrailContext, GuardrailResult, GuardrailStage } from "./types.js";
export declare class GuardrailPipeline {
    private guardrails;
    register(guardrail: Guardrail): this;
    execute(stage: GuardrailStage, content: unknown, context?: Omit<GuardrailContext, "stage">): Promise<{
        content: unknown;
        results: GuardrailResult[];
    }>;
}
//# sourceMappingURL=pipeline.d.ts.map