export class PluginManager {
    plugins = new Map();
    beforeModelCallHooks = [];
    afterModelCallHooks = [];
    beforeToolHooks = [];
    afterToolHooks = [];
    errorHooks = [];
    use(plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin '${plugin.name}' is already registered.`);
            return this;
        }
        this.plugins.set(plugin.name, plugin);
        const hooks = {};
        plugin.install(hooks);
        if (hooks.onInit)
            hooks.onInit();
        if (hooks.onBeforeModelCall)
            this.beforeModelCallHooks.push(hooks.onBeforeModelCall);
        if (hooks.onAfterModelCall)
            this.afterModelCallHooks.push(hooks.onAfterModelCall);
        if (hooks.onBeforeToolExecution)
            this.beforeToolHooks.push(hooks.onBeforeToolExecution);
        if (hooks.onAfterToolExecution)
            this.afterToolHooks.push(hooks.onAfterToolExecution);
        if (hooks.onError)
            this.errorHooks.push(hooks.onError);
        return this;
    }
    async onBeforeModelCall(messages) {
        let current = messages;
        for (const hook of this.beforeModelCallHooks) {
            const res = await hook(current);
            if (res)
                current = res;
        }
        return current;
    }
    async onAfterModelCall(response) {
        let current = response;
        for (const hook of this.afterModelCallHooks) {
            const res = await hook(current);
            if (res)
                current = res;
        }
        return current;
    }
    async onBeforeToolExecution(toolName, input) {
        let current = input;
        for (const hook of this.beforeToolHooks) {
            const res = await hook(toolName, current);
            if (res !== undefined)
                current = res;
        }
        return current;
    }
    async onAfterToolExecution(toolName, output) {
        let current = output;
        for (const hook of this.afterToolHooks) {
            const res = await hook(toolName, current);
            if (res !== undefined)
                current = res;
        }
        return current;
    }
    onError(error) {
        for (const hook of this.errorHooks) {
            try {
                hook(error);
            }
            catch (err) {
                console.error("Error executing plugin onError hook:", err);
            }
        }
    }
}
//# sourceMappingURL=plugin-manager.js.map