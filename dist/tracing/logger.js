export class Logger {
    namespace;
    level;
    constructor(namespace, level = "info") {
        this.namespace = namespace;
        this.level = level;
    }
    shouldLog(targetLevel) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[targetLevel] >= levels[this.level];
    }
    format(level, message, meta) {
        const time = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
        return `[${time}] [${level.toUpperCase()}] [${this.namespace}] ${message}${metaStr}`;
    }
    debug(message, meta) {
        if (this.shouldLog("debug"))
            console.debug(this.format("debug", message, meta));
    }
    info(message, meta) {
        if (this.shouldLog("info"))
            console.log(this.format("info", message, meta));
    }
    warn(message, meta) {
        if (this.shouldLog("warn"))
            console.warn(this.format("warn", message, meta));
    }
    error(message, meta) {
        if (this.shouldLog("error"))
            console.error(this.format("error", message, meta));
    }
}
//# sourceMappingURL=logger.js.map