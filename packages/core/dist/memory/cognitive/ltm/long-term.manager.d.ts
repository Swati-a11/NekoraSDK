import { LTMEntry, MemoryCategory } from "../types.js";
export declare class LongTermMemoryManager {
    private entries;
    store(entry: Omit<LTMEntry, "id" | "createdAt" | "lastAccessedAt" | "accessCount"> & {
        id?: string;
    }): LTMEntry;
    findByKey(category: MemoryCategory, key: string): LTMEntry | undefined;
    getAll(): LTMEntry[];
    touch(id: string): void;
    delete(id: string): boolean;
}
//# sourceMappingURL=long-term.manager.d.ts.map