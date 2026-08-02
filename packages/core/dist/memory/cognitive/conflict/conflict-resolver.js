export class MemoryConflictResolver {
    ltm;
    constructor(ltm) {
        this.ltm = ltm;
    }
    /**
     * Store or update a memory entry, resolving conflicts in-place if key already exists
     */
    resolveAndStore(newEntry) {
        const existing = this.ltm.findByKey(newEntry.category, newEntry.key);
        if (existing) {
            // In-place conflict resolution: update value, content, confidence, importance
            existing.value = newEntry.value;
            existing.content = newEntry.content;
            existing.importance = Math.max(existing.importance, newEntry.importance);
            existing.confidence = newEntry.confidence;
            existing.lastAccessedAt = Date.now();
            existing.accessCount++;
            return existing;
        }
        return this.ltm.store(newEntry);
    }
}
//# sourceMappingURL=conflict-resolver.js.map