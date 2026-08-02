import { Guardrail, GuardrailContext, GuardrailResult, GuardrailStage } from "./types.js";

export class RegexGuardrail implements Guardrail {
  constructor(
    public readonly name: string,
    public readonly stage: GuardrailStage,
    private pattern: RegExp,
    private blockOnMatch: boolean = true,
    private failureReason = "Content matched restricted pattern"
  ) {}

  async validate(content: unknown): Promise<GuardrailResult> {
    const text = typeof content === "string" ? content : JSON.stringify(content);
    const matches = this.pattern.test(text);

    if (this.blockOnMatch && matches) {
      return { passed: false, action: "block", reason: this.failureReason };
    }

    return { passed: true, action: "allow" };
  }
}

export class PIISanitizerGuardrail implements Guardrail {
  readonly name = "PIISanitizer";
  readonly stage: GuardrailStage;

  constructor(stage: GuardrailStage = "output") {
    this.stage = stage;
  }

  async validate(content: unknown): Promise<GuardrailResult> {
    if (typeof content !== "string") {
      return { passed: true, action: "allow" };
    }

    // Redact emails and SSNs
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;

    let sanitized = content.replace(emailRegex, "[REDACTED_EMAIL]");
    sanitized = sanitized.replace(ssnRegex, "[REDACTED_SSN]");

    const isModified = sanitized !== content;

    return {
      passed: true,
      action: isModified ? "modify" : "allow",
      modifiedContent: sanitized,
    };
  }
}
