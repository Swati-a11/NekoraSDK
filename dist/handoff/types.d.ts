export interface AgentDescriptor {
    id: string;
    name: string;
    description: string;
    tools?: string[];
    metadata?: Record<string, unknown>;
}
export interface HandoffConfig {
    maxHandoffDepth?: number;
    allowSelfHandoff?: boolean;
    transferredKeys?: string[];
}
export interface HandoffContext {
    fromAgentId: string;
    toAgentId: string;
    reason: string;
    transferredData: Record<string, unknown>;
    historyDepth: number;
    timestamp: number;
}
export interface HandoffRequest {
    targetAgentId: string;
    reason: string;
    context?: Record<string, unknown>;
}
export declare class HandoffLoopError extends Error {
    readonly trace: string[];
    constructor(trace: string[]);
}
//# sourceMappingURL=types.d.ts.map