import { Tool } from "../tools/types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
import { RiskAnalyzer } from "./risk-analyzer.js";
import { ApprovalHandler, ApprovalRequest, RiskLevel } from "./types.js";

export class ApprovalManager {
  private handler: ApprovalHandler | null = null;
  private riskAnalyzer: RiskAnalyzer;
  private requireApprovalLevels: Set<RiskLevel> = new Set(["HIGH"]);

  constructor(
    options: {
      handler?: ApprovalHandler;
      riskAnalyzer?: RiskAnalyzer;
      requireApprovalLevels?: RiskLevel[];
    } = {}
  ) {
    this.handler = options.handler || null;
    this.riskAnalyzer = options.riskAnalyzer || new RiskAnalyzer();
    if (options.requireApprovalLevels) {
      this.requireApprovalLevels = new Set(options.requireApprovalLevels);
    }
  }

  public setHandler(handler: ApprovalHandler): void {
    this.handler = handler;
  }

  public getRiskAnalyzer(): RiskAnalyzer {
    return this.riskAnalyzer;
  }

  public hasHandler(): boolean {
    return this.handler !== null;
  }

  public requiresApproval(tool: Tool, args?: unknown): boolean {
    if (tool.requireApproval) return true;
    if (!this.handler) return false;
    const riskLevel = this.riskAnalyzer.analyzeRisk(tool, args);
    return this.requireApprovalLevels.has(riskLevel);
  }

  public async evaluateAndRequest(
    tool: Tool,
    args: unknown,
    context: { runId?: string; eventEmitter?: SDKEventEmitter }
  ): Promise<{ approved: boolean; request: ApprovalRequest; reason?: string }> {
    const riskLevel = this.riskAnalyzer.analyzeRisk(tool, args);
    const requestId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reason = `Tool '${tool.name}' requires human approval due to ${riskLevel} risk level.`;

    const request: ApprovalRequest = {
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
      } else {
        context.eventEmitter?.emit({
          type: "approval_rejected",
          requestId,
          toolName: tool.name,
          reason: rejectReason || "Rejected by user",
        });
        return { approved: false, request, reason: rejectReason || "Rejected by user" };
      }
    } catch (err: any) {
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
