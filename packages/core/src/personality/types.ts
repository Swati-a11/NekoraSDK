export interface PersonalityProfile {
  tone?: "friendly" | "professional" | "academic" | "casual" | "empathetic";
  style?: "concise" | "detailed" | "bullet_points" | "storytelling";
  humor?: "none" | "light" | "witty";
  emoji?: boolean;
  formality?: "casual" | "formal" | "neutral";
}
