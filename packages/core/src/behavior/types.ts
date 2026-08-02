export interface CommunicationBehavior {
  preferredStyle?: "concise" | "detailed" | "bullet_points";
  formality?: "casual" | "formal";
}

export interface CodingBehavior {
  language?: string;
  framework?: string;
  codeStyle?: "clean" | "commented";
}

export interface BehaviorProfile {
  communication: CommunicationBehavior;
  coding: CodingBehavior;
  habits: string[];
}
