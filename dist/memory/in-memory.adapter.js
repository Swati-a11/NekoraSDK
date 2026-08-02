export class InMemoryAdapter {
    storage = new Map();
    async saveMessage(sessionId, message) {
        const record = {
            id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sessionId,
            message,
            timestamp: Date.now(),
        };
        const records = this.storage.get(sessionId) || [];
        records.push(record);
        this.storage.set(sessionId, records);
        return record;
    }
    async getHistory(sessionId, limit) {
        const records = this.storage.get(sessionId) || [];
        const messages = records.map((r) => r.message);
        if (limit && limit > 0) {
            return messages.slice(-limit);
        }
        return messages;
    }
    async clearHistory(sessionId) {
        this.storage.delete(sessionId);
    }
    async searchContext(sessionId, query, topK = 5) {
        const records = this.storage.get(sessionId) || [];
        const lower = query.toLowerCase();
        const matches = records
            .filter((r) => r.message.content.toLowerCase().includes(lower))
            .slice(-topK);
        return matches.map((r) => r.message);
    }
}
//# sourceMappingURL=in-memory.adapter.js.map