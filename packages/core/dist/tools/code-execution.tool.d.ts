import { Tool, ToolContext, ToolDefinition } from "./types.js";
import { z } from "zod";
import { CodeExecutionProvider, SupportedLanguage, CodeExecutionResult } from "./executors/types.js";
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
export declare class CodeExecutionTool implements Tool<{
    language: SupportedLanguage;
    code: string;
}, CodeExecutionResult> {
    readonly name: string;
    readonly description: string;
    readonly schema: z.ZodType<{
        language: SupportedLanguage;
        code: string;
    }>;
    readonly permissions?: string[];
    readonly requireApproval?: boolean;
    readonly timeout: number;
    readonly provider: CodeExecutionProvider;
    readonly allowedLanguages: Set<SupportedLanguage>;
    constructor(config?: CodeExecutionToolConfig);
    toDefinition(): ToolDefinition;
    execute(input: {
        language: SupportedLanguage;
        code: string;
    }, context?: ToolContext): Promise<CodeExecutionResult>;
}
//# sourceMappingURL=code-execution.tool.d.ts.map