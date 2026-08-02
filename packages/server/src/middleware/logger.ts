import { Request, Response, NextFunction, RequestHandler } from "express";

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

export function requestLogger(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const runId = (req.headers["x-run-id"] as string) || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.locals.runId = runId;
    res.locals.toolsUsed = [];
    res.locals.provider = undefined;

    res.on("finish", () => {
      const latencyMs = Date.now() - startTime;
      const logData: LogData = {
        runId,
        latencyMs,
        provider: res.locals.provider,
        toolsUsed: res.locals.toolsUsed || [],
        error: res.locals.error,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
      };

      // Structured log entry
      console.log(`[HTTP] ${logData.method} ${logData.path} ${logData.statusCode} - ${logData.latencyMs}ms | runId=${logData.runId} provider=${logData.provider || "none"} tools=${JSON.stringify(logData.toolsUsed)}${logData.error ? ` error=${logData.error}` : ""}`);
    });

    next();
  };
}
