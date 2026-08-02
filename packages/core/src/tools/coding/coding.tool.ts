import { Tool, ToolContext, ToolDefinition } from "../types.js";
import { z } from "zod";
import { CodeExecutionProvider } from "../executors/types.js";
import { NodeSandboxExecutor } from "../executors/node.executor.js";
import { CodingRequest, CodingResult, SupportedLanguage } from "./types.js";
import { JavaScriptExecutor } from "./executors/javascript.executor.js";
import { TypeScriptExecutor } from "./executors/typescript.executor.js";
import { PythonExecutor } from "./executors/python.executor.js";

export interface CodingToolConfig {
  name?: string;
  description?: string;
  provider?: CodeExecutionProvider;
  timeout?: number;
  permissions?: string[];
  requireApproval?: boolean;
}

export class CodingTool implements Tool<CodingRequest, CodingResult> {
  readonly name: string;
  readonly description: string;
  readonly schema: z.ZodType<CodingRequest>;
  readonly permissions?: string[];
  readonly requireApproval?: boolean;
  readonly timeout: number;
  readonly provider: CodeExecutionProvider;

  private jsExecutor: JavaScriptExecutor;
  private tsExecutor: TypeScriptExecutor;
  private pyExecutor: PythonExecutor;

  constructor(config: CodingToolConfig = {}) {
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
        .enum(["javascript", "typescript", "python"] as const)
        .describe("Programming language (javascript, typescript, python)"),
      code: z.string().describe("Source code snippet to execute"),
      timeout: z.number().optional().describe("Execution timeout limit in milliseconds"),
    });
  }

  toDefinition(): ToolDefinition {
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

  async execute(input: CodingRequest, _context?: ToolContext): Promise<CodingResult> {
    const validated = this.schema.parse(input);
    const effectiveTimeout = validated.timeout || this.timeout;
    const req: CodingRequest = { ...validated, timeout: effectiveTimeout };

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
