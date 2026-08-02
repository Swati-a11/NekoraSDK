import { MemoryAdapter, MemoryRecord } from "./types.js";
import { Message } from "../providers/types.js";

export class InMemoryAdapter implements MemoryAdapter {
  private storage: Map<string, MemoryRecord[]> = new Map();

  async saveMessage(sessionId: string, message: Message): Promise<MemoryRecord> {
    const record: MemoryRecord = {
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

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    const records = this.storage.get(sessionId) || [];
    const messages = records.map((r) => r.message);
    if (limit && limit > 0) {
      return messages.slice(-limit);
    }
    return messages;
  }

  async clearHistory(sessionId: string): Promise<void> {
    this.storage.delete(sessionId);
  }

  async searchContext(sessionId: string, query: string, topK = 5): Promise<Message[]> {
    const records = this.storage.get(sessionId) || [];
    const lower = query.toLowerCase();
    const matches = records
      .filter((r) => r.message.content.toLowerCase().includes(lower))
      .slice(-topK);
    return matches.map((r) => r.message);
  }
}
