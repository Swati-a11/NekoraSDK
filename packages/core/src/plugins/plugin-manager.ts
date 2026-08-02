import { Message, ModelResponse } from "../providers/types.js";
import { NekoraPlugin, PluginHooks } from "./types.js";

export class PluginManager implements PluginHooks {
  private plugins: Map<string, NekoraPlugin> = new Map();
  private beforeModelCallHooks: Array<NonNullable<PluginHooks["onBeforeModelCall"]>> = [];
  private afterModelCallHooks: Array<NonNullable<PluginHooks["onAfterModelCall"]>> = [];
  private beforeToolHooks: Array<NonNullable<PluginHooks["onBeforeToolExecution"]>> = [];
  private afterToolHooks: Array<NonNullable<PluginHooks["onAfterToolExecution"]>> = [];
  private errorHooks: Array<NonNullable<PluginHooks["onError"]>> = [];

  use(plugin: NekoraPlugin): this {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' is already registered.`);
      return this;
    }

    this.plugins.set(plugin.name, plugin);

    const hooks: PluginHooks = {};
    plugin.install(hooks);

    if (hooks.onInit) hooks.onInit();
    if (hooks.onBeforeModelCall) this.beforeModelCallHooks.push(hooks.onBeforeModelCall);
    if (hooks.onAfterModelCall) this.afterModelCallHooks.push(hooks.onAfterModelCall);
    if (hooks.onBeforeToolExecution) this.beforeToolHooks.push(hooks.onBeforeToolExecution);
    if (hooks.onAfterToolExecution) this.afterToolHooks.push(hooks.onAfterToolExecution);
    if (hooks.onError) this.errorHooks.push(hooks.onError);

    return this;
  }

  async onBeforeModelCall(messages: Message[]): Promise<Message[]> {
    let current = messages;
    for (const hook of this.beforeModelCallHooks) {
      const res = await hook(current);
      if (res) current = res;
    }
    return current;
  }

  async onAfterModelCall(response: ModelResponse): Promise<ModelResponse> {
    let current = response;
    for (const hook of this.afterModelCallHooks) {
      const res = await hook(current);
      if (res) current = res;
    }
    return current;
  }

  async onBeforeToolExecution(toolName: string, input: unknown): Promise<unknown> {
    let current = input;
    for (const hook of this.beforeToolHooks) {
      const res = await hook(toolName, current);
      if (res !== undefined) current = res;
    }
    return current;
  }

  async onAfterToolExecution(toolName: string, output: unknown): Promise<unknown> {
    let current = output;
    for (const hook of this.afterToolHooks) {
      const res = await hook(toolName, current);
      if (res !== undefined) current = res;
    }
    return current;
  }

  onError(error: Error): void {
    for (const hook of this.errorHooks) {
      try {
        hook(error);
      } catch (err) {
        console.error("Error executing plugin onError hook:", err);
      }
    }
  }
}
