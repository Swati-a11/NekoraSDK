import { RiskLevel } from "../sandbox/types.js";
export type { RiskLevel };
export interface ApprovalRequest {
    id: string;
    toolName: string;
    reason: string;
    riskLevel: RiskLevel;
    args?: unknown;
    runId?: string;
}
export interface ApprovalDecision {
    approved: boolean;
    reason?: string;
}
export type ApprovalHandler = (request: ApprovalRequest) => Promise<boolean | ApprovalDecision>;
//# sourceMappingURL=types.d.ts.map