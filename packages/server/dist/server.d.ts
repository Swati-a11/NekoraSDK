import { Express } from "express";
import { CorsOptions } from "./middleware/cors.js";
import { SandboxService } from "./services/sandbox.service.js";
import { AgentService } from "./services/agent.service.js";
export interface ServerOptions {
    sandboxService?: SandboxService;
    agentService?: AgentService;
    corsOptions?: CorsOptions;
    version?: string;
}
export declare function createApp(options?: ServerOptions): Express;
//# sourceMappingURL=server.d.ts.map