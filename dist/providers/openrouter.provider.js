import { OpenAIProvider } from "./openai.provider.js";
export class OpenRouterProvider extends OpenAIProvider {
    id = "openrouter";
    constructor(config) {
        super({
            ...config,
            apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
            baseUrl: config.baseUrl || "https://openrouter.ai/api/v1",
            headers: {
                "HTTP-Referer": "https://nekora.ai",
                "X-Title": "Nekora AI SDK",
                ...config.headers,
            },
        });
    }
}
//# sourceMappingURL=openrouter.provider.js.map