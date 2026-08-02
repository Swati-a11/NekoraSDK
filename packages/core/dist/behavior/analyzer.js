export class BehaviorAnalyzer {
    /**
     * Analyze input query text for interaction patterns and user preferences
     */
    static analyze(input) {
        const textLower = input.toLowerCase();
        const result = {
            communication: {},
            coding: {},
            habits: [],
        };
        if (textLower.includes("explain step by step") || textLower.includes("detailed explanation") || textLower.includes("in detail")) {
            result.communication.preferredStyle = "detailed";
        }
        else if (textLower.includes("tl;dr") || textLower.includes("short answer") || textLower.includes("be concise")) {
            result.communication.preferredStyle = "concise";
        }
        else if (textLower.includes("bullet points") || textLower.includes("list format")) {
            result.communication.preferredStyle = "bullet_points";
        }
        if (textLower.includes("typescript") || textLower.includes(".ts")) {
            result.coding.language = "typescript";
        }
        else if (textLower.includes("python") || textLower.includes(".py")) {
            result.coding.language = "python";
        }
        if (textLower.includes("react") || textLower.includes("next.js")) {
            result.coding.framework = "react";
        }
        return result;
    }
}
//# sourceMappingURL=analyzer.js.map