import { CodeExecutionProvider } from "../../executors/types.js";
import { CodingRequest, CodingResult, SyntaxCheckResult } from "../types.js";
export declare class JavaScriptExecutor {
    private provider;
    constructor(provider: CodeExecutionProvider);
    checkSyntax(code: string): SyntaxCheckResult;
    execute(request: CodingRequest): Promise<CodingResult>;
}
//# sourceMappingURL=javascript.executor.d.ts.map