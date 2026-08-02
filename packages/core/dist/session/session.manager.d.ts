import { Session, SessionStore } from "./types.js";
export declare class InMemorySessionStore implements SessionStore {
    private sessions;
    createSession(userId: string, metadata?: Record<string, unknown>): Promise<Session>;
    getSession(sessionId: string): Promise<Session | null>;
    touchSession(sessionId: string): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    listUserSessions(userId: string): Promise<Session[]>;
    cleanupStaleSessions(maxAgeMs: number): Promise<number>;
}
//# sourceMappingURL=session.manager.d.ts.map