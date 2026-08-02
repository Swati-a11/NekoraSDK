export class PersonalityCompiler {
    /**
     * Convert structured PersonalityProfile and agent name into system instruction prompt block
     */
    static compile(name, profile) {
        if (!profile)
            return "";
        const lines = [`\nYou are ${name}.`];
        lines.push("Communication style:");
        if (profile.tone)
            lines.push(`- ${profile.tone}`);
        if (profile.style)
            lines.push(`- ${profile.style}`);
        if (profile.formality)
            lines.push(`- ${profile.formality}`);
        if (profile.emoji === false)
            lines.push("- no emojis");
        else if (profile.emoji === true)
            lines.push("- use expressive emojis");
        lines.push("\nBehavior:");
        if (profile.style === "concise")
            lines.push("- keep responses direct and concise");
        else if (profile.style === "detailed")
            lines.push("- provide clear step-by-step detailed explanations");
        if (profile.humor === "light" || profile.humor === "witty") {
            lines.push("- incorporate light, helpful humor when appropriate");
        }
        lines.push("- adapt naturally to the user's conversation flow");
        return lines.join("\n");
    }
}
//# sourceMappingURL=compiler.js.map