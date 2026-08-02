import { z } from "zod";
import { NodeSandboxExecutor } from "./executors/node.executor.js";
/**
 * CodeExecutionTool
 *
 * Production-grade sandbox code execution tool for JavaScript, TypeScript, and Python
 * built on a provider-agnostic CodeExecutionProvider execution engine.
 */
export class CodeExecutionTool {
    name;
    description;
    schema;
    permissions;
    requireApproval;
    timeout;
    provider;
    allowedLanguages;
    constructor(config = {}) {
        this.name = config.name || "code_executor";
        this.description =
            config.description ||
                "Execute JavaScript, TypeScript, or Python code safely in a sandboxed process environment.";
        this.timeout = config.timeout || 5000;
        this.permissions = config.permissions || ["code:execute"];
        this.requireApproval = config.requireApproval ?? false;
        this.provider = config.provider || new NodeSandboxExecutor();
        const allowed = config.languages || ["javascript", "typescript", "python"];
        this.allowedLanguages = new Set(allowed);
        this.schema = z.object({
            language: z
                .enum(allowed)
                .describe("Target programming language for code execution (javascript, typescript, python)"),
            code: z.string().describe("Source code snippet to execute"),
        });
    }
    toDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: "object",
                properties: {
                    language: {
                        type: "string",
                        enum: Array.from(this.allowedLanguages),
                        description: "Programming language (javascript, typescript, python)",
                    },
                    code: {
                        type: "string",
                        description: "Source code to execute",
                    },
                },
                required: ["language", "code"],
            },
        };
    }
    async execute(input, context) {
        const validated = this.schema.parse(input);
        if (!this.allowedLanguages.has(validated.language)) {
            throw new Error(`Language '${validated.language}' is not permitted by CodeExecutionTool. Allowed: ${Array.from(this.allowedLanguages).join(", ")}`);
        }
        return this.provider.execute({
            language: validated.language,
            code: validated.code,
            timeout: this.timeout,
        });
    }
}
//# sourceMappingURL=code-execution.tool.js.map