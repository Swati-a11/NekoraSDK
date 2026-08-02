export class LongTermMemoryManager {
    entries = new Map();
    store(entry) {
        const id = entry.id || `ltm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const now = Date.now();
        const record = {
            id,
            category: entry.category,
            key: entry.key,
            value: entry.value,
            content: entry.content,
            importance: Math.min(Math.max(entry.importance, 0.0), 1.0),
            confidence: Math.min(Math.max(entry.confidence, 0.0), 1.0),
            createdAt: now,
            lastAccessedAt: now,
            accessCount: 1,
            sourceSessionId: entry.sourceSessionId,
            sourceContext: entry.sourceContext,
        };
        this.entries.set(id, record);
        return record;
    }
    findByKey(category, key) {
        for (const item of this.entries.values()) {
            if (item.category === category && item.key === key) {
                return item;
            }
        }
        return undefined;
    }
    getAll() {
        return Array.from(this.entries.values());
    }
    touch(id) {
        const entry = this.entries.get(id);
        if (entry) {
            entry.lastAccessedAt = Date.now();
            entry.accessCount++;
        }
    }
    delete(id) {
        return this.entries.delete(id);
    }
}
//# sourceMappingURL=long-term.manager.js.map