export class RegexGuardrail {
    name;
    stage;
    pattern;
    blockOnMatch;
    failureReason;
    constructor(name, stage, pattern, blockOnMatch = true, failureReason = "Content matched restricted pattern") {
        this.name = name;
        this.stage = stage;
        this.pattern = pattern;
        this.blockOnMatch = blockOnMatch;
        this.failureReason = failureReason;
    }
    async validate(content) {
        const text = typeof content === "string" ? content : JSON.stringify(content);
        const matches = this.pattern.test(text);
        if (this.blockOnMatch && matches) {
            return { passed: false, action: "block", reason: this.failureReason };
        }
        return { passed: true, action: "allow" };
    }
}
export class PIISanitizerGuardrail {
    name = "PIISanitizer";
    stage;
    constructor(stage = "output") {
        this.stage = stage;
    }
    async validate(content) {
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
//# sourceMappingURL=builtins.js.map