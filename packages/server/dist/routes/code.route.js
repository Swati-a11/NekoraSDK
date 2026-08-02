import { Router } from "express";
export function createCodeRouter(sandboxService) {
    const router = Router();
    router.post("/execute", async (req, res, next) => {
        try {
            const { language, code, timeout } = req.body;
            const result = await sandboxService.executeCode({ language, code, timeout });
            res.json({
                success: result.success,
                stdout: result.stdout,
                stderr: result.stderr,
                executionTime: result.executionTimeMs,
                exitCode: result.exitCode,
                ...(result.error ? { error: result.error } : {}),
            });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=code.route.js.map