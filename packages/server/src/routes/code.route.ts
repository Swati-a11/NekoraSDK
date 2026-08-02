import { Router, Request, Response, NextFunction } from "express";
import { SandboxService } from "../services/sandbox.service.js";
import { CodeExecuteRequest, CodeExecuteResponse } from "../types/index.js";

export function createCodeRouter(sandboxService: SandboxService): Router {
  const router = Router();

  router.post(
    "/execute",
    async (
      req: Request<{}, {}, CodeExecuteRequest>,
      res: Response<CodeExecuteResponse>,
      next: NextFunction
    ) => {
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
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
