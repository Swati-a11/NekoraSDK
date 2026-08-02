export class StructuredOutputValidator {
    schema;
    constructor(options) {
        this.schema = options.schema;
    }
    static extractJson(text) {
        const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            return markdownMatch[1].trim();
        }
        return text.trim();
    }
    parse(rawText) {
        const jsonStr = StructuredOutputValidator.extractJson(rawText);
        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonStr);
        }
        catch (e) {
            return {
                success: false,
                rawText,
                repairPrompt: `Your previous output was not valid JSON. Error: ${e.message}. Please output ONLY a valid JSON object matching the required schema.`,
            };
        }
        const result = this.schema.safeParse(parsedJson);
        if (result.success) {
            return {
                success: true,
                data: result.data,
                rawText,
            };
        }
        const issueMessages = result.error.issues
            .map((i) => `Path '${i.path.join(".")}': ${i.message}`)
            .join("; ");
        return {
            success: false,
            error: result.error,
            rawText,
            repairPrompt: `JSON output did not match the expected schema issues: [${issueMessages}]. Correct the format and respond with valid JSON.`,
        };
    }
}
//# sourceMappingURL=validator.js.map