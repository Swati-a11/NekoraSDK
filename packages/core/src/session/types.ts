export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastActiveAt: number;
  metadata: Record<string, unknown>;
}

export interface SessionStore {
  createSession(userId: string, metadata?: Record<string, unknown>): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  touchSession(sessionId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  listUserSessions(userId: string): Promise<Session[]>;
  cleanupStaleSessions(maxAgeMs: number): Promise<number>;
}
