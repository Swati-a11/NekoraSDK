export class InMemorySessionStore {
    sessions = new Map();
    async createSession(userId, metadata = {}) {
        const session = {
            id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            metadata,
        };
        this.sessions.set(session.id, session);
        return session;
    }
    async getSession(sessionId) {
        const s = this.sessions.get(sessionId);
        if (!s)
            return null;
        return s;
    }
    async touchSession(sessionId) {
        const s = this.sessions.get(sessionId);
        if (s) {
            s.lastActiveAt = Date.now();
        }
    }
    async deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    async listUserSessions(userId) {
        return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
    }
    async cleanupStaleSessions(maxAgeMs) {
        const now = Date.now();
        let cleaned = 0;
        for (const [id, session] of this.sessions.entries()) {
            if (now - session.lastActiveAt > maxAgeMs) {
                this.sessions.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }
}
//# sourceMappingURL=session.manager.js.map