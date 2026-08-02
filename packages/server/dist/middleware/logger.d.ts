import { RequestHandler } from "express";
export interface LogData {
    runId: string;
    latencyMs: number;
    provider?: string;
    toolsUsed?: string[];
    error?: string;
    method: string;
    path: string;
    statusCode: number;
}
export declare function requestLogger(): RequestHandler;
//# sourceMappingURL=logger.d.ts.map