import { ProviderError } from "../errors/index.js";
export type Role = "user" | "assistant" | "system" | "tool";
export interface Message {
    role: Role;
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxRetries?: number;
    timeoutMs?: number;
    maxTokens?: number;
    temperature?: number;
}
export interface GenerateOptions {
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    signal?: AbortSignal;
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ModelResponse {
    text?: string;
    toolCalls?: ToolCall[];
    finishReason?: "stop" | "tool_calls" | "length" | "content_filter";
    usage?: TokenUsage;
    rawResponse?: unknown;
    metadata?: Record<string, unknown>;
}
export interface ModelResponseChunk {
    type: "text_delta" | "tool_call_delta" | "done";
    textDelta?: string;
    deltaText?: string;
    toolCallDelta?: Partial<ToolCall>;
    finishReason?: "stop" | "tool_calls" | "length" | "content_filter";
    usage?: TokenUsage;
}
export interface ModelCapabilities {
    supportsStreaming: boolean;
    supportsTools: boolean;
    supportsVision: boolean;
    supportsStructuredOutput: boolean;
    maxContextTokens: number;
}
export interface ModelProvider {
    readonly id: string;
    readonly modelName: string;
    capabilities?(): ModelCapabilities;
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream?(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
export { ProviderError };
export declare class AuthenticationError extends ProviderError {
    constructor(provider: string, message?: string);
}
export declare class RateLimitError extends ProviderError {
    constructor(provider: string, message?: string);
}
export declare class ProviderServerError extends ProviderError {
    constructor(provider: string, statusCode: number, message?: string);
}
//# sourceMappingURL=types.d.ts.map