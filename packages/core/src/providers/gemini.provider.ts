import {
  Message,
  ModelProvider,
  ModelResponse,
  ModelResponseChunk,
  GenerateOptions,
  ProviderConfig,
  AuthenticationError,
} from "./types.js";
import { getEnvVar } from "../agent/agent.js";

export class GeminiProvider implements ModelProvider {
  readonly id = "gemini";
  readonly modelName: string;
  private apiKey: string;
  private baseUrl: string;
  private defaultConfig: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.modelName = config.model || "gemini-2.0-flash";
    this.apiKey = config.apiKey || getEnvVar("GEMINI_API_KEY") || getEnvVar("GOOGLE_API_KEY") || "";
    this.baseUrl = (config.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
    this.defaultConfig = config;

    if (!this.apiKey) {
      throw new AuthenticationError("gemini", "Gemini API key missing. Pass apiKey or set GEMINI_API_KEY.");
    }
  }

  async generate(messages: Message[], options: GenerateOptions = {}): Promise<ModelResponse> {
    const isOAuthToken = this.apiKey.startsWith("AQ.") || this.apiKey.startsWith("ya29.");
    const candidateModels = [this.modelName, "gemini-1.5-flash", "gemini-1.5-pro"];

    let lastError: Error | null = null;
    for (const targetModel of candidateModels) {
      const url = isOAuthToken
        ? `${this.baseUrl}/models/${targetModel}:generateContent`
        : `${this.baseUrl}/models/${targetModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isOAuthToken) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      } else {
        headers["x-goog-api-key"] = this.apiKey;
      }

      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const systemInstruction = messages.find((m) => m.role === "system")?.content;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
          }),
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          const errDetail = data?.error?.message || JSON.stringify(data);
          throw new Error(`Gemini API error (HTTP ${res.status}): ${errDetail}`);
        }

        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || "";

        return {
          text,
          finishReason: "stop",
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount || 0,
            completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata?.totalTokenCount || 0,
          },
          rawResponse: data,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.includes("429") || lastError.message.includes("Quota")) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new Error("Gemini Provider execution failed.");
  }

  async *generateStream(messages: Message[], options: GenerateOptions = {}): AsyncIterable<ModelResponseChunk> {
    const res = await this.generate(messages, options);
    yield {
      type: "text_delta",
      textDelta: res.text,
      deltaText: res.text,
    };
    yield {
      type: "done",
      textDelta: "",
      deltaText: "",
      finishReason: "stop",
    };
  }
}
