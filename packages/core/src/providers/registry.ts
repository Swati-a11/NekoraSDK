import { ModelProvider } from "./types.js";

/**
 * ProviderRegistry manages named model providers for dynamic provider selection and switching.
 */
export class ProviderRegistry {
  private providers: Map<string, ModelProvider> = new Map();

  /**
   * Register a ModelProvider under a unique name (e.g., "gemini", "openai", "groq")
   */
  register(name: string, provider: ModelProvider): this {
    this.providers.set(name.toLowerCase().trim(), provider);
    return this;
  }

  /**
   * Get a registered provider by name
   */
  get(name: string): ModelProvider | undefined {
    return this.providers.get(name.toLowerCase().trim());
  }

  /**
   * Check if a provider name is registered
   */
  has(name: string): boolean {
    return this.providers.has(name.toLowerCase().trim());
  }

  /**
   * List all registered provider names
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Remove a registered provider
   */
  unregister(name: string): boolean {
    return this.providers.delete(name.toLowerCase().trim());
  }
}
