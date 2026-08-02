import { Router, Request, Response } from "express";
import { HealthResponse } from "../types/index.js";

export function createHealthRouter(version: string = "1.0.0"): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response<HealthResponse>) => {
    res.json({
      status: "ok",
      version,
      uptime: process.uptime(),
    });
  });

  return router;
}
