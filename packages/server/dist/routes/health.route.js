import { Router } from "express";
export function createHealthRouter(version = "1.0.0") {
    const router = Router();
    router.get("/", (_req, res) => {
        res.json({
            status: "ok",
            version,
            uptime: process.uptime(),
        });
    });
    return router;
}
//# sourceMappingURL=health.route.js.map