import { OpenAIProvider } from "./openai.provider.js";
export class GroqProvider extends OpenAIProvider {
    id = "groq";
    constructor(config) {
        super({
            ...config,
            apiKey: config.apiKey || process.env.GROQ_API_KEY,
            baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
        });
    }
}
//# sourceMappingURL=groq.provider.js.map