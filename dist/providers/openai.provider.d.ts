import { ModelProvider, ProviderConfig, Message, GenerateOptions, ModelResponse, ModelResponseChunk } from "./types.js";
export declare class OpenAIProvider implements ModelProvider {
    readonly id: string;
    readonly modelName: string;
    private apiKey;
    private baseUrl;
    private defaultConfig;
    constructor(config: ProviderConfig);
    private getHeaders;
    private handleError;
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=openai.provider.d.ts.map