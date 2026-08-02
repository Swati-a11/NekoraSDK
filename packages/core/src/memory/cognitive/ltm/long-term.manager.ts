import { LTMEntry, MemoryCategory } from "../types.js";

export class LongTermMemoryManager {
  private entries: Map<string, LTMEntry> = new Map();

  store(entry: Omit<LTMEntry, "id" | "createdAt" | "lastAccessedAt" | "accessCount"> & { id?: string }): LTMEntry {
    const id = entry.id || `ltm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();

    const record: LTMEntry = {
      id,
      category: entry.category,
      key: entry.key,
      value: entry.value,
      content: entry.content,
      importance: Math.min(Math.max(entry.importance, 0.0), 1.0),
      confidence: Math.min(Math.max(entry.confidence, 0.0), 1.0),
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      sourceSessionId: entry.sourceSessionId,
      sourceContext: entry.sourceContext,
    };

    this.entries.set(id, record);
    return record;
  }

  findByKey(category: MemoryCategory, key: string): LTMEntry | undefined {
    for (const item of this.entries.values()) {
      if (item.category === category && item.key === key) {
        return item;
      }
    }
    return undefined;
  }

  getAll(): LTMEntry[] {
    return Array.from(this.entries.values());
  }

  touch(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.lastAccessedAt = Date.now();
      entry.accessCount++;
    }
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }
}
