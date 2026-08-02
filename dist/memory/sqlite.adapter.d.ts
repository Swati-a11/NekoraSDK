import { MemoryAdapter, MemoryRecord } from "./types.js";
import { Message } from "../providers/types.js";
export declare class SQLiteMemoryAdapter implements MemoryAdapter {
    private filePath;
    private db;
    constructor(filename?: string);
    private persist;
    saveMessage(sessionId: string, message: Message): Promise<MemoryRecord>;
    getHistory(sessionId: string, limit?: number): Promise<Message[]>;
    clearHistory(sessionId: string): Promise<void>;
}
//# sourceMappingURL=sqlite.adapter.d.ts.map