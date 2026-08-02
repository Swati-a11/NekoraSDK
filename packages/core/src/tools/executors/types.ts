export type SupportedLanguage = "javascript" | "typescript" | "python";

export interface CodeExecutionRequest {
  language: SupportedLanguage;
  code: string;
  timeout?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  error?: string;
  errorCode?: string;
}

export interface CodeExecutionProvider {
  readonly name: string;
  execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
}
