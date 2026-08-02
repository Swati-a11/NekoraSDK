/**
 * ProviderRegistry manages named model providers for dynamic provider selection and switching.
 */
export class ProviderRegistry {
    providers = new Map();
    /**
     * Register a ModelProvider under a unique name (e.g., "gemini", "openai", "groq")
     */
    register(name, provider) {
        this.providers.set(name.toLowerCase().trim(), provider);
        return this;
    }
    /**
     * Get a registered provider by name
     */
    get(name) {
        return this.providers.get(name.toLowerCase().trim());
    }
    /**
     * Check if a provider name is registered
     */
    has(name) {
        return this.providers.has(name.toLowerCase().trim());
    }
    /**
     * List all registered provider names
     */
    list() {
        return Array.from(this.providers.keys());
    }
    /**
     * Remove a registered provider
     */
    unregister(name) {
        return this.providers.delete(name.toLowerCase().trim());
    }
}
//# sourceMappingURL=registry.js.map