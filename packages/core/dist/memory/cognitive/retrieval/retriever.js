export class CognitiveMemoryRetriever {
    decayRateLambda;
    constructor(decayRateLambda = 0.0001) {
        this.decayRateLambda = decayRateLambda;
    }
    /**
     * Calculate decayed importance score: Score = Importance * e^(-lambda * deltaHours)
     */
    calculateDecayedScore(entry, now = Date.now()) {
        const deltaHours = (now - entry.lastAccessedAt) / (1000 * 60 * 60);
        const decayFactor = Math.exp(-this.decayRateLambda * deltaHours);
        return entry.importance * entry.confidence * decayFactor;
    }
    /**
     * Retrieve top-K relevant memories for input query, avoiding context overload
     */
    retrieveRelevant(query, entries, topK = 5, minScoreThreshold = 0.2) {
        const now = Date.now();
        const queryLower = query.toLowerCase();
        const scored = entries.map((entry) => {
            const decayedScore = this.calculateDecayedScore(entry, now);
            // Calculate keyword relevance boost
            let relevanceBoost = 1.0;
            const contentLower = entry.content.toLowerCase();
            const keyLower = entry.key.toLowerCase();
            if (queryLower.includes(keyLower) || queryLower.includes(contentLower)) {
                relevanceBoost = 2.0;
            }
            else {
                const queryWords = queryLower.split(/\s+/);
                const matches = queryWords.filter((w) => w.length > 3 && contentLower.includes(w));
                if (matches.length > 0)
                    relevanceBoost = 1.5;
            }
            const finalScore = decayedScore * relevanceBoost;
            return {
                entry,
                decayedScore,
                finalScore,
            };
        });
        return scored
            .filter((s) => s.finalScore >= minScoreThreshold)
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, topK)
            .map((s) => {
            // Update access count and timestamp upon retrieval
            s.entry.lastAccessedAt = now;
            s.entry.accessCount++;
            return s.entry;
        });
    }
}
//# sourceMappingURL=retriever.js.map