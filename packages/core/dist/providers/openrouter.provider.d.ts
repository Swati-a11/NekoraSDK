import { Message, ModelProvider, ModelResponse, ModelResponseChunk, GenerateOptions, ProviderConfig } from "./types.js";
export declare class OpenRouterProvider implements ModelProvider {
    readonly id = "openrouter";
    readonly modelName: string;
    private apiKey;
    private baseUrl;
    private defaultConfig;
    constructor(config?: ProviderConfig);
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=openrouter.provider.d.ts.map