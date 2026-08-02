import { TokenUsage } from "../providers/types.js";
export interface ModelPricing {
    promptCostPer1K: number;
    completionCostPer1K: number;
}
export interface ModelUsageRecord {
    modelName: string;
    usage: TokenUsage;
    costUsd: number;
    timestamp: number;
}
export interface UsageReport {
    sessionId?: string;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    breakdownByModel: Record<string, {
        usage: TokenUsage;
        costUsd: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map