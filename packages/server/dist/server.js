import express from "express";
import { createCorsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error.js";
import { SandboxService } from "./services/sandbox.service.js";
import { AgentService } from "./services/agent.service.js";
import { createHealthRouter } from "./routes/health.route.js";
import { createCodeRouter } from "./routes/code.route.js";
import { createAgentRouter } from "./routes/agent.route.js";
export function createApp(options = {}) {
    const app = express();
    const sandboxService = options.sandboxService || new SandboxService();
    const agentService = options.agentService || new AgentService(sandboxService);
    // Global Middleware
    app.use(createCorsMiddleware(options.corsOptions));
    app.use(express.json({ limit: "10mb" }));
    app.use(requestLogger());
    // Mount API Routers
    app.use("/api/health", createHealthRouter(options.version || "1.0.0"));
    app.use("/api/code", createCodeRouter(sandboxService));
    app.use("/api", createAgentRouter(agentService));
    // Global Error Handler Middleware
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=server.js.map