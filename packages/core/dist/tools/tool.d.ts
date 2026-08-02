import { Tool, ToolConfig } from "./types.js";
/**
 * Define a type-safe tool for Nekora AI agents with Zod validation.
 */
export declare function tool<TInput = any, TOutput = any>(config: ToolConfig<TInput, TOutput>): Tool<TInput, TOutput>;
//# sourceMappingURL=tool.d.ts.map