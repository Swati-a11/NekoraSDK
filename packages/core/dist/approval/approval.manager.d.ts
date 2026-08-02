import { Tool } from "../tools/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { RiskAnalyzer } from "./risk-analyzer.js";
import { ApprovalHandler, ApprovalRequest, RiskLevel } from "./types.js";
export declare class ApprovalManager {
    private handler;
    private riskAnalyzer;
    private requireApprovalLevels;
    constructor(options?: {
        handler?: ApprovalHandler;
        riskAnalyzer?: RiskAnalyzer;
        requireApprovalLevels?: RiskLevel[];
    });
    setHandler(handler: ApprovalHandler): void;
    getRiskAnalyzer(): RiskAnalyzer;
    hasHandler(): boolean;
    requiresApproval(tool: Tool, args?: unknown): boolean;
    evaluateAndRequest(tool: Tool, args: unknown, context: {
        runId?: string;
        eventEmitter?: SDKEventEmitter;
    }): Promise<{
        approved: boolean;
        request: ApprovalRequest;
        reason?: string;
    }>;
}
//# sourceMappingURL=approval.manager.d.ts.map