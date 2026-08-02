export class JavaScriptExecutor {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    checkSyntax(code) {
        if (!code || !code.trim()) {
            return { valid: false, error: "Empty code snippet provided." };
        }
        try {
            new Function(code);
            return { valid: true };
        }
        catch (err) {
            return {
                valid: false,
                error: `JavaScript Syntax Error: ${err.message || String(err)}`,
            };
        }
    }
    async execute(request) {
        const syntax = this.checkSyntax(request.code);
        if (!syntax.valid) {
            return {
                success: false,
                output: "",
                error: syntax.error,
                executionTime: 0,
                exitCode: 1,
            };
        }
        const startTime = Date.now();
        const res = await this.provider.execute({
            language: "javascript",
            code: request.code,
            timeout: request.timeout || 5000,
        });
        const executionTime = res.executionTimeMs || Date.now() - startTime;
        const output = res.stdout ? res.stdout.trim() : "";
        if (!res.success) {
            return {
                success: false,
                output,
                error: res.stderr || res.error || "Execution failed",
                executionTime,
                exitCode: res.exitCode ?? 1,
            };
        }
        return {
            success: true,
            output,
            executionTime,
            exitCode: 0,
        };
    }
}
//# sourceMappingURL=javascript.executor.js.map