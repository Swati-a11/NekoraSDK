import { ModelProvider } from "./types.js";
/**
 * ProviderRegistry manages named model providers for dynamic provider selection and switching.
 */
export declare class ProviderRegistry {
    private providers;
    /**
     * Register a ModelProvider under a unique name (e.g., "gemini", "openai", "groq")
     */
    register(name: string, provider: ModelProvider): this;
    /**
     * Get a registered provider by name
     */
    get(name: string): ModelProvider | undefined;
    /**
     * Check if a provider name is registered
     */
    has(name: string): boolean;
    /**
     * List all registered provider names
     */
    list(): string[];
    /**
     * Remove a registered provider
     */
    unregister(name: string): boolean;
}
//# sourceMappingURL=registry.d.ts.map