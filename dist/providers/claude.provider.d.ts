import { ModelProvider, ProviderConfig, Message, GenerateOptions, ModelResponse, ModelResponseChunk } from "./types.js";
export declare class ClaudeProvider implements ModelProvider {
    readonly id = "claude";
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
//# sourceMappingURL=claude.provider.d.ts.map