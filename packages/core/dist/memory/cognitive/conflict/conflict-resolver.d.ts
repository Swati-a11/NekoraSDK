import { LongTermMemoryManager } from "../ltm/long-term.manager.js";
import { LTMEntry } from "../types.js";
export declare class MemoryConflictResolver {
    private ltm;
    constructor(ltm: LongTermMemoryManager);
    /**
     * Store or update a memory entry, resolving conflicts in-place if key already exists
     */
    resolveAndStore(newEntry: Omit<LTMEntry, "id" | "createdAt" | "lastAccessedAt" | "accessCount">): LTMEntry;
}
//# sourceMappingURL=conflict-resolver.d.ts.map