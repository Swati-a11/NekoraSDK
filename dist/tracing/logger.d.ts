export type LogLevel = "debug" | "info" | "warn" | "error";
export declare class Logger {
    private namespace;
    private level;
    constructor(namespace: string, level?: LogLevel);
    private shouldLog;
    private format;
    debug(message: string, meta?: unknown): void;
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
}
//# sourceMappingURL=logger.d.ts.map