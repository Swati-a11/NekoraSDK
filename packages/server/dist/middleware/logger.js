export function requestLogger() {
    return (req, res, next) => {
        const startTime = Date.now();
        const runId = req.headers["x-run-id"] || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        res.locals.runId = runId;
        res.locals.toolsUsed = [];
        res.locals.provider = undefined;
        res.on("finish", () => {
            const latencyMs = Date.now() - startTime;
            const logData = {
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
//# sourceMappingURL=logger.js.map