import { Message, ModelResponse } from "../providers/types.js";
export interface PluginHooks {
    onInit?(): void;
    onBeforeModelCall?(messages: Message[]): Promise<Message[] | void>;
    onAfterModelCall?(response: ModelResponse): Promise<ModelResponse | void>;
    onBeforeToolExecution?(toolName: string, input: unknown): Promise<unknown | void>;
    onAfterToolExecution?(toolName: string, output: unknown): Promise<unknown | void>;
    onError?(error: Error): void;
}
export interface NekoraPlugin {
    name: string;
    version?: string;
    install(hooks: PluginHooks): void;
}
//# sourceMappingURL=types.d.ts.map