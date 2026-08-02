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

export class GuardrailViolationError extends Error {
  constructor(
    public readonly guardrailName: string,
    public readonly stage: GuardrailStage,
    public readonly reason: string
  ) {
    super(`Guardrail '${guardrailName}' violated at stage '${stage}': ${reason}`);
    this.name = "GuardrailViolationError";
  }
}
