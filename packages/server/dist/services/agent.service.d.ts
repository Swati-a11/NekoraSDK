import { ChatResponse } from "../types/index.js";
import { SandboxService } from "./sandbox.service.js";
export interface AgentStreamEvent {
    event: "agent_started" | "text_stream" | "tool_started" | "tool_completed" | "run_completed";
    data: any;
}
export declare class AgentService {
    private sandboxService;
    private memory;
    constructor(sandboxService?: SandboxService);
    private createProvider;
    private createAgentInstance;
    runAgent(message: string, sessionId?: string, providerName?: string): Promise<ChatResponse>;
    streamAgent(message: string, sessionId: string | undefined, providerName: string | undefined, onEvent: (event: AgentStreamEvent) => void): Promise<void>;
}
//# sourceMappingURL=agent.service.d.ts.map