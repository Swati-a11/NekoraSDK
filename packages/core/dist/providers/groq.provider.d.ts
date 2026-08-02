import { Message, ModelProvider, ModelResponse, ModelResponseChunk, GenerateOptions, ProviderConfig } from "./types.js";
/**
 * GroqProvider
 *
 * Production-grade Groq model provider adapter with resilient tool-calling normalization,
 * native tool_calls parsing, and failed_generation recovery for Llama 3 models.
 */
export declare class GroqProvider implements ModelProvider {
    readonly id = "groq";
    readonly modelName: string;
    private apiKey;
    private baseUrl;
    private defaultConfig;
    constructor(config?: ProviderConfig);
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=groq.provider.d.ts.map