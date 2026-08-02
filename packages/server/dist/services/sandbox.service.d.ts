import { CodeExecutionProvider, CodeExecutionRequest, CodeExecutionResult } from "@nekora-ai/core";
export declare class SandboxService {
    private provider;
    constructor(provider?: CodeExecutionProvider);
    getProvider(): CodeExecutionProvider;
    setProvider(provider: CodeExecutionProvider): void;
    executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
}
//# sourceMappingURL=sandbox.service.d.ts.map