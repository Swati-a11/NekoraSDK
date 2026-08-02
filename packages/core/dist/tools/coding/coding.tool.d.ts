import { Tool, ToolContext, ToolDefinition } from "../types.js";
import { z } from "zod";
import { CodeExecutionProvider } from "../executors/types.js";
import { CodingRequest, CodingResult } from "./types.js";
export interface CodingToolConfig {
    name?: string;
    description?: string;
    provider?: CodeExecutionProvider;
    timeout?: number;
    permissions?: string[];
    requireApproval?: boolean;
}
export declare class CodingTool implements Tool<CodingRequest, CodingResult> {
    readonly name: string;
    readonly description: string;
    readonly schema: z.ZodType<CodingRequest>;
    readonly permissions?: string[];
    readonly requireApproval?: boolean;
    readonly timeout: number;
    readonly provider: CodeExecutionProvider;
    private jsExecutor;
    private tsExecutor;
    private pyExecutor;
    constructor(config?: CodingToolConfig);
    toDefinition(): ToolDefinition;
    execute(input: CodingRequest, _context?: ToolContext): Promise<CodingResult>;
}
//# sourceMappingURL=coding.tool.d.ts.map