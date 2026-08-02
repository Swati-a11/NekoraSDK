import { SupportedLanguage } from "../executors/types.js";

export type { SupportedLanguage };

export interface CodingRequest {
  language: SupportedLanguage;
  code: string;
  timeout?: number;
}

export interface CodingResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  exitCode?: number | null;
}

export interface SyntaxCheckResult {
  valid: boolean;
  error?: string;
}
