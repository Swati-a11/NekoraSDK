import { ShortTermMemoryManager } from "./stm/short-term.manager.js";
import { WorkingMemoryManager } from "./working/working.manager.js";
import { LongTermMemoryManager } from "./ltm/long-term.manager.js";
import { CognitiveMemoryRetriever } from "./retrieval/retriever.js";
import { MemoryConflictResolver } from "./conflict/conflict-resolver.js";
import { CognitiveMemoryOptions, LTMEntry, MemoryCategory, MemoryInspectionResult } from "./types.js";
import { Message } from "../../providers/types.js";
import { MemoryAdapter, MemoryRecord } from "../types.js";
export declare class NekoCognitiveMemory implements MemoryAdapter {
    readonly stm: ShortTermMemoryManager;
    readonly working: WorkingMemoryManager;
    readonly ltm: LongTermMemoryManager;
    readonly retriever: CognitiveMemoryRetriever;
    readonly conflictResolver: MemoryConflictResolver;
    constructor(options?: CognitiveMemoryOptions);
    saveMessage(sessionId: string, message: Message): Promise<MemoryRecord>;
    getHistory(sessionId: string): Promise<Message[]>;
    clearHistory(sessionId: string): Promise<void>;
    /**
     * Store or update long-term knowledge with conflict resolution
     */
    remember(category: MemoryCategory, key: string, value: unknown, content: string, options?: {
        importance?: number;
        confidence?: number;
        sourceSessionId?: string;
    }): LTMEntry;
    /**
     * Retrieve relevant LTM entries for input query and format system context block
     */
    retrieveContextBlock(query: string, topK?: number): string;
    /**
     * Developer Inspection API: View full cognitive memory state
     */
    inspect(sessionId?: string): MemoryInspectionResult;
}
//# sourceMappingURL=cognitive.memory.d.ts.map