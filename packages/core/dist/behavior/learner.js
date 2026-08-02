import { BehaviorAnalyzer } from "./analyzer.js";
import { BehaviorProfileManager } from "./profile.js";
export class BehaviorLearner {
    memory;
    profileManager;
    constructor(memory) {
        this.memory = memory;
        this.profileManager = new BehaviorProfileManager();
    }
    /**
     * Observe user input turn, learn interaction patterns, and update Cognitive LTM
     */
    observeTurn(input, sessionId) {
        const learned = BehaviorAnalyzer.analyze(input);
        if (learned.communication?.preferredStyle) {
            this.profileManager.update({ communication: { preferredStyle: learned.communication.preferredStyle } });
            if (this.memory) {
                this.memory.remember("communication_style", "preferred_style", learned.communication.preferredStyle, `User prefers ${learned.communication.preferredStyle} explanations.`, { importance: 0.85, confidence: 0.9, sourceSessionId: sessionId });
            }
        }
        if (learned.coding?.language) {
            this.profileManager.update({ coding: { language: learned.coding.language } });
            if (this.memory) {
                this.memory.remember("coding_preference", "language", learned.coding.language, `User primary coding language is ${learned.coding.language}.`, { importance: 0.9, confidence: 0.95, sourceSessionId: sessionId });
            }
        }
        return this.profileManager.getProfile();
    }
    getProfile() {
        return this.profileManager.getProfile();
    }
}
//# sourceMappingURL=learner.js.map