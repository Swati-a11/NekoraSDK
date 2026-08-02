import { ModelProvider, ProviderConfig, Message, GenerateOptions, ModelResponse, ModelResponseChunk } from "./types.js";
export declare class GeminiProvider implements ModelProvider {
    readonly id = "gemini";
    readonly modelName: string;
    private apiKey;
    private baseUrl;
    private defaultConfig;
    constructor(config: ProviderConfig);
    private handleError;
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=gemini.provider.d.ts.map