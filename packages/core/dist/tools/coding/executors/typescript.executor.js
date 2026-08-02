export class TypeScriptExecutor {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    checkSyntax(code) {
        if (!code || !code.trim()) {
            return { valid: false, error: "Empty TypeScript code snippet provided." };
        }
        let openBraces = 0;
        let openParens = 0;
        for (const char of code) {
            if (char === "{")
                openBraces++;
            if (char === "}")
                openBraces--;
            if (char === "(")
                openParens++;
            if (char === ")")
                openParens--;
        }
        if (openBraces !== 0 || openParens !== 0) {
            return {
                valid: false,
                error: "TypeScript Syntax Error: Mismatched braces or parentheses in code.",
            };
        }
        return { valid: true };
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
            language: "typescript",
            code: request.code,
            timeout: request.timeout || 5000,
        });
        const executionTime = res.executionTimeMs || Date.now() - startTime;
        const output = res.stdout ? res.stdout.trim() : "";
        if (!res.success) {
            return {
                success: false,
                output,
                error: res.stderr || res.error || "TypeScript execution failed",
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
//# sourceMappingURL=typescript.executor.js.map