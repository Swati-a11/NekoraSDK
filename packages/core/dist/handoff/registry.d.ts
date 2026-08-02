import { AgentDescriptor } from "./types.js";
export declare class AgentRegistry {
    private agents;
    register(agent: AgentDescriptor): void;
    get(agentId: string): AgentDescriptor | undefined;
    has(agentId: string): boolean;
    list(): AgentDescriptor[];
    unregister(agentId: string): boolean;
}
//# sourceMappingURL=registry.d.ts.map