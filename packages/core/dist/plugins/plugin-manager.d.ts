import { Message, ModelResponse } from "../providers/types.js";
import { NekoraPlugin, PluginHooks } from "./types.js";
export declare class PluginManager implements PluginHooks {
    private plugins;
    private beforeModelCallHooks;
    private afterModelCallHooks;
    private beforeToolHooks;
    private afterToolHooks;
    private errorHooks;
    use(plugin: NekoraPlugin): this;
    onBeforeModelCall(messages: Message[]): Promise<Message[]>;
    onAfterModelCall(response: ModelResponse): Promise<ModelResponse>;
    onBeforeToolExecution(toolName: string, input: unknown): Promise<unknown>;
    onAfterToolExecution(toolName: string, output: unknown): Promise<unknown>;
    onError(error: Error): void;
}
//# sourceMappingURL=plugin-manager.d.ts.map