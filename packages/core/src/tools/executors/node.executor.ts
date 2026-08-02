import { CodeExecutionProvider, CodeExecutionRequest, CodeExecutionResult } from "./types.js";
import { UnsupportedLanguageError } from "./errors.js";

/**
 * Environment check helper to detect if Node.js server environment is active.
 */
export function isNodeEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null &&
    typeof window === "undefined"
  );
}

/**
 * NodeSandboxExecutor
 * 
 * Executes JavaScript, TypeScript, and Python code in isolated Node.js child processes
 * using temporary file sandboxes with strict execution timeouts and stdout/stderr capture.
 */
export class NodeSandboxExecutor implements CodeExecutionProvider {
  readonly name = "node_sandbox";

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    if (!isNodeEnvironment()) {
      return {
        success: false,
        stdout: "",
        stderr: "Code execution requires a server-side sandbox environment.",
        exitCode: 1,
        executionTimeMs: 0,
        error: "Code execution requires a server-side sandbox environment.",
        errorCode: "SANDBOX_UNAVAILABLE",
      };
    }

    const { language, code } = request;
    const timeout = request.timeout || 5000;

    if (!["javascript", "typescript", "python"].includes(language)) {
      throw new UnsupportedLanguageError(language);
    }

    const startTime = Date.now();

    try {
      let childProcess: any;
      let fs: any;
      let path: any;
      let os: any;

      try {
        childProcess = await import("node:child_process");
        fs = await import("node:fs/promises");
        path = await import("node:path");
        os = await import("node:os");
      } catch {
        const req = Function("return typeof require !== 'undefined' ? require : null")();
        if (!req) {
          throw new Error("Node.js built-in modules are unavailable in this environment.");
        }
        childProcess = req("node:child_process");
        fs = req("node:fs/promises");
        path = req("node:path");
        os = req("node:os");
      }

      const tempDir = path.join(os.tmpdir(), "nekora_sandbox");
      await fs.mkdir(tempDir, { recursive: true });

      const ext = language === "javascript" ? "js" : language === "typescript" ? "ts" : "py";
      const filePath = path.join(
        tempDir,
        `exec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`
      );

      await fs.writeFile(filePath, code, "utf8");

      let cmd: string;
      let args: string[];

      if (language === "javascript" || language === "typescript") {
        cmd = "node";
        args = [filePath];
      } else {
        cmd = process.platform === "win32" ? "python" : "python3";
        args = [filePath];
      }

      const execFileFn = childProcess.execFile || childProcess.default?.execFile;

      return new Promise<CodeExecutionResult>((resolve) => {
        execFileFn(
          cmd,
          args,
          {
            timeout,
            maxBuffer: 1024 * 1024 * 5,
          },
          async (error: any, stdout: string, stderr: string) => {
            const executionTimeMs = Date.now() - startTime;
            try {
              await fs.unlink(filePath);
            } catch {}

            if (error && error.killed) {
              resolve({
                success: false,
                stdout: stdout ? stdout.trim() : "",
                stderr: stderr ? stderr.trim() : `Execution timed out after ${timeout}ms.`,
                exitCode: null,
                executionTimeMs,
                error: `Code execution timed out after ${timeout}ms.`,
                errorCode: "EXECUTION_TIMEOUT",
              });
              return;
            }

            if (error) {
              resolve({
                success: false,
                stdout: stdout ? stdout.trim() : "",
                stderr: stderr ? stderr.trim() : error.message,
                exitCode: typeof error.code === "number" ? error.code : 1,
                executionTimeMs,
                error: error.message,
              });
              return;
            }

            resolve({
              success: true,
              stdout: stdout ? stdout.trim() : "",
              stderr: stderr ? stderr.trim() : "",
              exitCode: 0,
              executionTimeMs,
            });
          }
        );
      });
    } catch (err) {
      return {
        success: false,
        stdout: "",
        stderr: String(err),
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        error: String(err),
      };
    }
  }
}

declare const __webpack_require__: any;
