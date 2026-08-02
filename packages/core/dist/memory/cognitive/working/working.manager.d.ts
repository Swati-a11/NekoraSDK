import { WorkingMemoryState } from "../types.js";
export declare class WorkingMemoryManager {
    private state;
    constructor();
    private createDefaultState;
    setGoal(goal: string, constraints?: string[]): void;
    setCurrentStep(step: string): void;
    setPlan(plan: string[]): void;
    addDecision(key: string, value: unknown): void;
    getState(): WorkingMemoryState;
    clear(): void;
    formatContextPrompt(): string;
}
//# sourceMappingURL=working.manager.d.ts.map