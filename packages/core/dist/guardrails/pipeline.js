import { GuardrailViolationError, } from "./types.js";
export class GuardrailPipeline {
    guardrails = [];
    register(guardrail) {
        this.guardrails.push(guardrail);
        return this;
    }
    async execute(stage, content, context = {}) {
        const fullContext = { ...context, stage };
        const stageGuardrails = this.guardrails.filter((g) => g.stage === stage);
        const results = [];
        let currentContent = content;
        for (const guardrail of stageGuardrails) {
            const res = await guardrail.validate(currentContent, fullContext);
            results.push(res);
            if (res.action === "block") {
                throw new GuardrailViolationError(guardrail.name, stage, res.reason || "Content blocked by guardrail policy");
            }
            if (res.action === "modify" && res.modifiedContent !== undefined) {
                currentContent = res.modifiedContent;
            }
        }
        return { content: currentContent, results };
    }
}
//# sourceMappingURL=pipeline.js.map