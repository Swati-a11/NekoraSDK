import { BehaviorAnalyzer } from "./analyzer.js";
import { BehaviorProfileManager } from "./profile.js";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";
import { BehaviorProfile } from "./types.js";

export class BehaviorLearner {
  readonly profileManager: BehaviorProfileManager;

  constructor(private memory?: NekoCognitiveMemory) {
    this.profileManager = new BehaviorProfileManager();
  }

  /**
   * Observe user input turn, learn interaction patterns, and update Cognitive LTM
   */
  observeTurn(input: string, sessionId?: string): BehaviorProfile {
    const learned = BehaviorAnalyzer.analyze(input);

    if (learned.communication?.preferredStyle) {
      this.profileManager.update({ communication: { preferredStyle: learned.communication.preferredStyle } });
      if (this.memory) {
        this.memory.remember(
          "communication_style",
          "preferred_style",
          learned.communication.preferredStyle,
          `User prefers ${learned.communication.preferredStyle} explanations.`,
          { importance: 0.85, confidence: 0.9, sourceSessionId: sessionId }
        );
      }
    }

    if (learned.coding?.language) {
      this.profileManager.update({ coding: { language: learned.coding.language } });
      if (this.memory) {
        this.memory.remember(
          "coding_preference",
          "language",
          learned.coding.language,
          `User primary coding language is ${learned.coding.language}.`,
          { importance: 0.9, confidence: 0.95, sourceSessionId: sessionId }
        );
      }
    }

    return this.profileManager.getProfile();
  }

  getProfile(): BehaviorProfile {
    return this.profileManager.getProfile();
  }
}
