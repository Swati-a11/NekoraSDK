import { Message } from "../providers/types.js";
export interface MemoryRecord {
    id: string;
    sessionId: string;
    message: Message;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface MemoryAdapter {
    saveMessage(sessionId: string, message: Message): Promise<MemoryRecord>;
    getHistory(sessionId: string, limit?: number): Promise<Message[]>;
    clearHistory(sessionId: string): Promise<void>;
    searchContext?(sessionId: string, query: string, topK?: number): Promise<Message[]>;
}
//# sourceMappingURL=types.d.ts.map