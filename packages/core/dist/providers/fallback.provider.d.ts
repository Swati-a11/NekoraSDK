import { Message, ModelProvider, ModelResponse, ModelResponseChunk, GenerateOptions } from "./types.js";
import { SDKEventEmitter } from "../events/event-emitter.js";
export interface FallbackProviderConfig {
    providers: ModelProvider[];
    eventEmitter?: SDKEventEmitter;
}
export declare class FallbackProvider implements ModelProvider {
    readonly id = "fallback";
    readonly modelName: string;
    private providers;
    private emitter?;
    constructor(configOrProviders: ModelProvider[] | FallbackProviderConfig);
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
//# sourceMappingURL=fallback.provider.d.ts.map