import { BehaviorProfileManager } from "./profile.js";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";
import { BehaviorProfile } from "./types.js";
export declare class BehaviorLearner {
    private memory?;
    readonly profileManager: BehaviorProfileManager;
    constructor(memory?: NekoCognitiveMemory | undefined);
    /**
     * Observe user input turn, learn interaction patterns, and update Cognitive LTM
     */
    observeTurn(input: string, sessionId?: string): BehaviorProfile;
    getProfile(): BehaviorProfile;
}
//# sourceMappingURL=learner.d.ts.map