import { CodeExecutionProvider } from "../../executors/types.js";
import { CodingRequest, CodingResult, SyntaxCheckResult } from "../types.js";
export declare class TypeScriptExecutor {
    private provider;
    constructor(provider: CodeExecutionProvider);
    checkSyntax(code: string): SyntaxCheckResult;
    execute(request: CodingRequest): Promise<CodingResult>;
}
//# sourceMappingURL=typescript.executor.d.ts.map