import { Session, SessionStore } from "./types.js";

export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();

  async createSession(userId: string, metadata: Record<string, unknown> = {}): Promise<Session> {
    const session: Session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return s;
  }

  async touchSession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s) {
      s.lastActiveAt = Date.now();
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async listUserSessions(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  async cleanupStaleSessions(maxAgeMs: number): Promise<number> {
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
