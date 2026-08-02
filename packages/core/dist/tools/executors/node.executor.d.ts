import { CodeExecutionProvider, CodeExecutionRequest, CodeExecutionResult } from "./types.js";
/**
 * Environment check helper to detect if Node.js server environment is active.
 */
export declare function isNodeEnvironment(): boolean;
/**
 * NodeSandboxExecutor
 *
 * Executes JavaScript, TypeScript, and Python code in isolated Node.js child processes
 * using temporary file sandboxes with strict execution timeouts and stdout/stderr capture.
 */
export declare class NodeSandboxExecutor implements CodeExecutionProvider {
    readonly name = "node_sandbox";
    execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
}
//# sourceMappingURL=node.executor.d.ts.map