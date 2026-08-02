import { ModelProvider, Message, GenerateOptions, ModelResponse, ModelResponseChunk } from "./types.js";
export declare class FallbackProvider implements ModelProvider {
    readonly id = "fallback";
    readonly modelName: string;
    private providers;
    constructor(providers: ModelProvider[]);
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=fallback.provider.d.ts.map