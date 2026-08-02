import {
  Guardrail,
  GuardrailContext,
  GuardrailResult,
  GuardrailStage,
  GuardrailViolationError,
} from "./types.js";

export class GuardrailPipeline {
  private guardrails: Guardrail[] = [];

  register(guardrail: Guardrail): this {
    this.guardrails.push(guardrail);
    return this;
  }

  async execute(
    stage: GuardrailStage,
    content: unknown,
    context: Omit<GuardrailContext, "stage"> = {}
  ): Promise<{ content: unknown; results: GuardrailResult[] }> {
    const fullContext: GuardrailContext = { ...context, stage };
    const stageGuardrails = this.guardrails.filter((g) => g.stage === stage);
    const results: GuardrailResult[] = [];

    let currentContent = content;

    for (const guardrail of stageGuardrails) {
      const res = await guardrail.validate(currentContent, fullContext);
      results.push(res);

      if (res.action === "block") {
        throw new GuardrailViolationError(
          guardrail.name,
          stage,
          res.reason || "Content blocked by guardrail policy"
        );
      }

      if (res.action === "modify" && res.modifiedContent !== undefined) {
        currentContent = res.modifiedContent;
      }
    }

    return { content: currentContent, results };
  }
}
