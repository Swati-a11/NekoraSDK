import { LongTermMemoryManager } from "../ltm/long-term.manager.js";
import { LTMEntry, MemoryCategory } from "../types.js";

export class MemoryConflictResolver {
  constructor(private ltm: LongTermMemoryManager) {}

  /**
   * Store or update a memory entry, resolving conflicts in-place if key already exists
   */
  resolveAndStore(newEntry: Omit<LTMEntry, "id" | "createdAt" | "lastAccessedAt" | "accessCount">): LTMEntry {
    const existing = this.ltm.findByKey(newEntry.category, newEntry.key);

    if (existing) {
      // In-place conflict resolution: update value, content, confidence, importance
      existing.value = newEntry.value;
      existing.content = newEntry.content;
      existing.importance = Math.max(existing.importance, newEntry.importance);
      existing.confidence = newEntry.confidence;
      existing.lastAccessedAt = Date.now();
      existing.accessCount++;
      return existing;
    }

    return this.ltm.store(newEntry);
  }
}
