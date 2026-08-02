import { z } from "zod";
import { NodeSandboxExecutor } from "../executors/node.executor.js";
import { JavaScriptExecutor } from "./executors/javascript.executor.js";
import { TypeScriptExecutor } from "./executors/typescript.executor.js";
import { PythonExecutor } from "./executors/python.executor.js";
export class CodingTool {
    name;
    description;
    schema;
    permissions;
    requireApproval;
    timeout;
    provider;
    jsExecutor;
    tsExecutor;
    pyExecutor;
    constructor(config = {}) {
        this.name = config.name || "advanced_coding_tool";
        this.description =
            config.description ||
                "Execute JavaScript, TypeScript, or Python code safely with pre-execution syntax validation and execution sandboxing.";
        this.timeout = config.timeout || 5000;
        this.permissions = config.permissions || ["code:execute"];
        this.requireApproval = config.requireApproval ?? false;
        this.provider = config.provider || new NodeSandboxExecutor();
        this.jsExecutor = new JavaScriptExecutor(this.provider);
        this.tsExecutor = new TypeScriptExecutor(this.provider);
        this.pyExecutor = new PythonExecutor(this.provider);
        this.schema = z.object({
            language: z
                .enum(["javascript", "typescript", "python"])
                .describe("Programming language (javascript, typescript, python)"),
            code: z.string().describe("Source code snippet to execute"),
            timeout: z.number().optional().describe("Execution timeout limit in milliseconds"),
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
                        enum: ["javascript", "typescript", "python"],
                        description: "Programming language (javascript, typescript, python)",
                    },
                    code: {
                        type: "string",
                        description: "Source code to execute",
                    },
                    timeout: {
                        type: "number",
                        description: "Execution timeout in milliseconds",
                    },
                },
                required: ["language", "code"],
            },
        };
    }
    async execute(input, _context) {
        const validated = this.schema.parse(input);
        const effectiveTimeout = validated.timeout || this.timeout;
        const req = { ...validated, timeout: effectiveTimeout };
        switch (validated.language) {
            case "javascript":
                return this.jsExecutor.execute(req);
            case "typescript":
                return this.tsExecutor.execute(req);
            case "python":
                return this.pyExecutor.execute(req);
            default:
                throw new Error(`Unsupported programming language: ${validated.language}`);
        }
    }
}
//# sourceMappingURL=coding.tool.js.map