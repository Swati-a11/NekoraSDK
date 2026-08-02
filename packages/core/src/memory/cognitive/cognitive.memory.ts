import { ShortTermMemoryManager } from "./stm/short-term.manager.js";
import { WorkingMemoryManager } from "./working/working.manager.js";
import { LongTermMemoryManager } from "./ltm/long-term.manager.js";
import { CognitiveMemoryRetriever } from "./retrieval/retriever.js";
import { MemoryConflictResolver } from "./conflict/conflict-resolver.js";
import {
  CognitiveMemoryOptions,
  LTMEntry,
  MemoryCategory,
  MemoryInspectionResult,
} from "./types.js";
import { Message } from "../../providers/types.js";
import { MemoryAdapter, MemoryRecord } from "../types.js";

export class NekoCognitiveMemory implements MemoryAdapter {
  readonly stm: ShortTermMemoryManager;
  readonly working: WorkingMemoryManager;
  readonly ltm: LongTermMemoryManager;
  readonly retriever: CognitiveMemoryRetriever;
  readonly conflictResolver: MemoryConflictResolver;

  constructor(options: CognitiveMemoryOptions = {}) {
    this.stm = new ShortTermMemoryManager(options.maxShortTermMessages || 20);
    this.working = new WorkingMemoryManager();
    this.ltm = new LongTermMemoryManager();
    this.retriever = new CognitiveMemoryRetriever(options.decayRateLambda || 0.0001);
    this.conflictResolver = new MemoryConflictResolver(this.ltm);
  }

  // MemoryAdapter interface implementation
  async saveMessage(sessionId: string, message: Message): Promise<MemoryRecord> {
    await this.stm.addMessage(sessionId, message);
    return {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      message,
      timestamp: Date.now(),
    };
  }

  async getHistory(sessionId: string): Promise<Message[]> {
    return this.stm.getMessages(sessionId);
  }

  async clearHistory(sessionId: string): Promise<void> {
    await this.stm.clearSession(sessionId);
    this.working.clear();
  }

  /**
   * Store or update long-term knowledge with conflict resolution
   */
  remember(
    category: MemoryCategory,
    key: string,
    value: unknown,
    content: string,
    options: { importance?: number; confidence?: number; sourceSessionId?: string } = {}
  ): LTMEntry {
    return this.conflictResolver.resolveAndStore({
      category,
      key,
      value,
      content,
      importance: options.importance ?? 0.8,
      confidence: options.confidence ?? 0.9,
      sourceSessionId: options.sourceSessionId,
    });
  }

  /**
   * Retrieve relevant LTM entries for input query and format system context block
   */
  retrieveContextBlock(query: string, topK: number = 3): string {
    const entries = this.retriever.retrieveRelevant(query, this.ltm.getAll(), topK);
    const workingContext = this.working.formatContextPrompt();

    if (entries.length === 0 && !workingContext) {
      return "";
    }

    const lines: string[] = [];
    if (workingContext) {
      lines.push(workingContext);
    }

    if (entries.length > 0) {
      lines.push("[Retrieved Long-Term Knowledge]");
      for (const e of entries) {
        lines.push(`- (${e.category}:${e.key}): ${e.content} [confidence: ${Math.round(e.confidence * 100)}%]`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Developer Inspection API: View full cognitive memory state
   */
  inspect(sessionId?: string): MemoryInspectionResult {
    const now = Date.now();
    const ltmEntries = this.ltm.getAll().map((entry) => ({
      id: entry.id,
      category: entry.category,
      key: entry.key,
      content: entry.content,
      importance: entry.importance,
      confidence: entry.confidence,
      decayedImportance: Number(this.retriever.calculateDecayedScore(entry, now).toFixed(3)),
      createdAt: new Date(entry.createdAt).toISOString(),
      lastAccessed: new Date(entry.lastAccessedAt).toISOString(),
      accessCount: entry.accessCount,
      source: entry.sourceSessionId ? `Session ${entry.sourceSessionId}` : "Explicit/Learned",
    }));

    return {
      shortTermMessageCount: sessionId ? (this.stm as any).sessions.get(sessionId)?.length || 0 : 0,
      workingMemory: this.working.getState(),
      longTermMemories: ltmEntries,
    };
  }
}
