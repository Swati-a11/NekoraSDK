import { AgentRegistry } from "./registry.js";
import { HandoffConfig, HandoffContext, HandoffRequest } from "./types.js";
export declare class HandoffManager {
    private registry;
    private config;
    private handoffHistory;
    constructor(registry: AgentRegistry, config?: HandoffConfig);
    trackHandoff(fromAgentId: string, request: HandoffRequest): HandoffContext;
    resetHistory(): void;
    getHistoryTrace(): string[];
}
//# sourceMappingURL=handoff.manager.d.ts.map