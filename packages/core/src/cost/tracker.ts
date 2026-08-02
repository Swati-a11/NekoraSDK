import { ModelPricing, ModelUsageRecord, UsageReport } from "./types.js";
import { TokenUsage } from "../providers/types.js";

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o": { promptCostPer1K: 0.0025, completionCostPer1K: 0.01 },
  "gpt-4o-mini": { promptCostPer1K: 0.00015, completionCostPer1K: 0.0006 },
  "claude-3-5-sonnet-20241022": { promptCostPer1K: 0.003, completionCostPer1K: 0.015 },
  "claude-3-haiku-20240307": { promptCostPer1K: 0.00025, completionCostPer1K: 0.00125 },
  "gemini-1.5-pro": { promptCostPer1K: 0.00125, completionCostPer1K: 0.005 },
  "gemini-1.5-flash": { promptCostPer1K: 0.000075, completionCostPer1K: 0.0003 },
  "llama-3.3-70b-versatile": { promptCostPer1K: 0.00059, completionCostPer1K: 0.00079 },
};

export class TokenCounter {
  /**
   * Simple heuristic estimate (1 token ~ 4 chars in English)
   */
  static estimateTokenCount(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}

export class UsageTracker {
  private records: ModelUsageRecord[] = [];
  private pricingTable: Record<string, ModelPricing>;

  constructor(customPricing: Record<string, ModelPricing> = {}) {
    this.pricingTable = { ...DEFAULT_MODEL_PRICING, ...customPricing };
  }

  calculateCost(modelName: string, usage: TokenUsage): number {
    const pricing = this.pricingTable[modelName] || { promptCostPer1K: 0.002, completionCostPer1K: 0.006 };
    const promptCost = (usage.promptTokens / 1000) * pricing.promptCostPer1K;
    const completionCost = (usage.completionTokens / 1000) * pricing.completionCostPer1K;
    return Number((promptCost + completionCost).toFixed(6));
  }

  recordUsage(modelName: string, usage: TokenUsage): ModelUsageRecord {
    const costUsd = this.calculateCost(modelName, usage);
    const record: ModelUsageRecord = {
      modelName,
      usage,
      costUsd,
      timestamp: Date.now(),
    };
    this.records.push(record);
    return record;
  }

  getReport(sessionId?: string): UsageReport {
    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalCost = 0;
    const breakdown: Record<string, { usage: TokenUsage; costUsd: number }> = {};

    for (const r of this.records) {
      totalPrompt += r.usage.promptTokens;
      totalCompletion += r.usage.completionTokens;
      totalCost += r.costUsd;

      if (!breakdown[r.modelName]) {
        breakdown[r.modelName] = {
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          costUsd: 0,
        };
      }

      const b = breakdown[r.modelName]!;
      b.usage.promptTokens += r.usage.promptTokens;
      b.usage.completionTokens += r.usage.completionTokens;
      b.usage.totalTokens += r.usage.totalTokens;
      b.costUsd += r.costUsd;
    }

    return {
      sessionId,
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      totalTokens: totalPrompt + totalCompletion,
      totalCostUsd: Number(totalCost.toFixed(6)),
      breakdownByModel: breakdown,
    };
  }
}
