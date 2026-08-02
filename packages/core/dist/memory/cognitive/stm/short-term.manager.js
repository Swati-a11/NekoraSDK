export class ShortTermMemoryManager {
    sessions = new Map();
    maxMessages;
    constructor(maxMessages = 20) {
        this.maxMessages = maxMessages;
    }
    async addMessage(sessionId, message) {
        const history = this.sessions.get(sessionId) || [];
        history.push(message);
        // Apply context window sliding & compression threshold
        if (history.length > this.maxMessages) {
            const systemMsgs = history.filter((m) => m.role === "system");
            const overflowCount = history.length - this.maxMessages;
            const retainedNonSystem = history.filter((m) => m.role !== "system").slice(overflowCount);
            // Create compressed context summary marker
            const summaryMsg = {
                role: "system",
                content: `[ShortTermMemory Compression]: ${overflowCount} older message(s) summarized and archived.`,
            };
            this.sessions.set(sessionId, [...systemMsgs, summaryMsg, ...retainedNonSystem]);
            return;
        }
        this.sessions.set(sessionId, history);
    }
    async getMessages(sessionId) {
        return this.sessions.get(sessionId) || [];
    }
    async clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}
//# sourceMappingURL=short-term.manager.js.map