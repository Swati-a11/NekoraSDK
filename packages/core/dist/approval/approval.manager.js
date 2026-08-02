import { RiskAnalyzer } from "./risk-analyzer.js";
export class ApprovalManager {
    handler = null;
    riskAnalyzer;
    requireApprovalLevels = new Set(["HIGH"]);
    constructor(options = {}) {
        this.handler = options.handler || null;
        this.riskAnalyzer = options.riskAnalyzer || new RiskAnalyzer();
        if (options.requireApprovalLevels) {
            this.requireApprovalLevels = new Set(options.requireApprovalLevels);
        }
    }
    setHandler(handler) {
        this.handler = handler;
    }
    getRiskAnalyzer() {
        return this.riskAnalyzer;
    }
    hasHandler() {
        return this.handler !== null;
    }
    requiresApproval(tool, args) {
        if (tool.requireApproval)
            return true;
        if (!this.handler)
            return false;
        const riskLevel = this.riskAnalyzer.analyzeRisk(tool, args);
        return this.requireApprovalLevels.has(riskLevel);
    }
    async evaluateAndRequest(tool, args, context) {
        const riskLevel = this.riskAnalyzer.analyzeRisk(tool, args);
        const requestId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const reason = `Tool '${tool.name}' requires human approval due to ${riskLevel} risk level.`;
        const request = {
            id: requestId,
            toolName: tool.name,
            reason,
            riskLevel,
            args,
            runId: context.runId,
        };
        context.eventEmitter?.emit({
            type: "approval_requested",
            request,
        });
        if (!this.handler) {
            // Default: if no handler is registered, reject high-risk tool execution for safety
            context.eventEmitter?.emit({
                type: "approval_rejected",
                requestId,
                toolName: tool.name,
                reason: "No human approval handler registered.",
            });
            return { approved: false, request, reason: "No approval handler registered." };
        }
        try {
            const decision = await this.handler(request);
            const isApproved = typeof decision === "boolean" ? decision : decision.approved;
            const rejectReason = typeof decision === "object" ? decision.reason : undefined;
            if (isApproved) {
                context.eventEmitter?.emit({
                    type: "approval_granted",
                    requestId,
                    toolName: tool.name,
                });
                return { approved: true, request };
            }
            else {
                context.eventEmitter?.emit({
                    type: "approval_rejected",
                    requestId,
                    toolName: tool.name,
                    reason: rejectReason || "Rejected by user",
                });
                return { approved: false, request, reason: rejectReason || "Rejected by user" };
            }
        }
        catch (err) {
            context.eventEmitter?.emit({
                type: "approval_rejected",
                requestId,
                toolName: tool.name,
                reason: err.message || String(err),
            });
            return { approved: false, request, reason: err.message || String(err) };
        }
    }
}
//# sourceMappingURL=approval.manager.js.map