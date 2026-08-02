import { MemoryAdapter, MemoryRecord } from "./types.js";
import { Message } from "../providers/types.js";
export declare class InMemoryAdapter implements MemoryAdapter {
    private storage;
    saveMessage(sessionId: string, message: Message): Promise<MemoryRecord>;
    getHistory(sessionId: string, limit?: number): Promise<Message[]>;
    clearHistory(sessionId: string): Promise<void>;
    searchContext(sessionId: string, query: string, topK?: number): Promise<Message[]>;
}
//# sourceMappingURL=in-memory.adapter.d.ts.map