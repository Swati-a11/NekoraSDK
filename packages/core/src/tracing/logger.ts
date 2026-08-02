export type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  constructor(private namespace: string, private level: LogLevel = "info") {}

  private shouldLog(targetLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[targetLevel] >= levels[this.level];
  }

  private format(level: LogLevel, message: string, meta?: unknown): string {
    const time = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${time}] [${level.toUpperCase()}] [${this.namespace}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog("debug")) console.debug(this.format("debug", message, meta));
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog("info")) console.log(this.format("info", message, meta));
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog("warn")) console.warn(this.format("warn", message, meta));
  }

  error(message: string, meta?: unknown): void {
    if (this.shouldLog("error")) console.error(this.format("error", message, meta));
  }
}
