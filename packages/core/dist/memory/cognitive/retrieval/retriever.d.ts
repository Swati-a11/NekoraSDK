import { LTMEntry } from "../types.js";
export declare class CognitiveMemoryRetriever {
    private decayRateLambda;
    constructor(decayRateLambda?: number);
    /**
     * Calculate decayed importance score: Score = Importance * e^(-lambda * deltaHours)
     */
    calculateDecayedScore(entry: LTMEntry, now?: number): number;
    /**
     * Retrieve top-K relevant memories for input query, avoiding context overload
     */
    retrieveRelevant(query: string, entries: LTMEntry[], topK?: number, minScoreThreshold?: number): LTMEntry[];
}
//# sourceMappingURL=retriever.d.ts.map