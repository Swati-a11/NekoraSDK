import { Tool, ToolContext, ToolDefinition } from "./types.js";
import { z } from "zod";
import {
  CodeExecutionProvider,
  SupportedLanguage,
  CodeExecutionResult,
} from "./executors/types.js";
import { NodeSandboxExecutor } from "./executors/node.executor.js";

export interface CodeExecutionToolConfig {
  name?: string;
  description?: string;
  languages?: SupportedLanguage[];
  timeout?: number;
  provider?: CodeExecutionProvider;
  permissions?: string[];
  requireApproval?: boolean;
}

export type CodeExecutionToolOptions = CodeExecutionToolConfig;
export type CodeExecutionOutput = CodeExecutionResult;

/**
 * CodeExecutionTool
 * 
 * Production-grade sandbox code execution tool for JavaScript, TypeScript, and Python
 * built on a provider-agnostic CodeExecutionProvider execution engine.
 */
export class CodeExecutionTool implements Tool<
  { language: SupportedLanguage; code: string },
  CodeExecutionResult
> {
  readonly name: string;
  readonly description: string;
  readonly schema: z.ZodType<{ language: SupportedLanguage; code: string }>;
  readonly permissions?: string[];
  readonly requireApproval?: boolean;
  readonly timeout: number;
  readonly provider: CodeExecutionProvider;
  readonly allowedLanguages: Set<SupportedLanguage>;

  constructor(config: CodeExecutionToolConfig = {}) {
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
        .enum(allowed as [SupportedLanguage, ...SupportedLanguage[]])
        .describe("Target programming language for code execution (javascript, typescript, python)"),
      code: z.string().describe("Source code snippet to execute"),
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

  async execute(
    input: { language: SupportedLanguage; code: string },
    context?: ToolContext
  ): Promise<CodeExecutionResult> {
    const validated = this.schema.parse(input);
    if (!this.allowedLanguages.has(validated.language)) {
      throw new Error(
        `Language '${validated.language}' is not permitted by CodeExecutionTool. Allowed: ${Array.from(
          this.allowedLanguages
        ).join(", ")}`
      );
    }

    return this.provider.execute({
      language: validated.language,
      code: validated.code,
      timeout: this.timeout,
    });
  }
}
