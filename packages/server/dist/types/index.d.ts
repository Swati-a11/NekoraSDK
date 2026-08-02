import { SupportedLanguage } from "@nekora-ai/core/tools";
export interface ChatRequest {
    message: string;
    sessionId?: string;
    provider?: string;
}
export interface ChatResponse {
    response: string;
    runId: string;
    toolsUsed: string[];
    traceId: string;
}
export interface CodeExecuteRequest {
    language: SupportedLanguage;
    code: string;
    timeout?: number;
}
export interface CodeExecuteResponse {
    success: boolean;
    stdout: string;
    stderr: string;
    executionTime: number;
    exitCode?: number | null;
    error?: string;
}
export interface HealthResponse {
    status: "ok" | string;
    version: string;
    uptime: number;
}
export interface ErrorDetails {
    [key: string]: any;
}
export interface ErrorResponseBody {
    code: string;
    message: string;
    details?: ErrorDetails;
}
//# sourceMappingURL=index.d.ts.map