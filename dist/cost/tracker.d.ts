import { ModelPricing, ModelUsageRecord, UsageReport } from "./types.js";
import { TokenUsage } from "../providers/types.js";
export declare const DEFAULT_MODEL_PRICING: Record<string, ModelPricing>;
export declare class TokenCounter {
    /**
     * Simple heuristic estimate (1 token ~ 4 chars in English)
     */
    static estimateTokenCount(text: string): number;
}
export declare class UsageTracker {
    private records;
    private pricingTable;
    constructor(customPricing?: Record<string, ModelPricing>);
    calculateCost(modelName: string, usage: TokenUsage): number;
    recordUsage(modelName: string, usage: TokenUsage): ModelUsageRecord;
    getReport(sessionId?: string): UsageReport;
}
//# sourceMappingURL=tracker.d.ts.map