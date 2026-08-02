export type Role = "system" | "user" | "assistant" | "tool";
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface Message {
    role: Role;
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
export interface ModelResponseChunk {
    deltaText?: string;
    deltaToolCall?: Partial<ToolCall>;
    finishReason?: "stop" | "tool_calls" | "length" | "content_filter";
    usage?: TokenUsage;
}
export interface ModelResponse {
    text: string;
    toolCalls?: ToolCall[];
    finishReason: "stop" | "tool_calls" | "length" | "content_filter";
    usage?: TokenUsage;
    rawResponse?: unknown;
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
export interface GenerateOptions {
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
}
export interface ModelProvider {
    readonly id: string;
    readonly modelName: string;
    generate(messages: Message[], options?: GenerateOptions): Promise<ModelResponse>;
    generateStream(messages: Message[], options?: GenerateOptions): AsyncIterable<ModelResponseChunk>;
}
export declare class ProviderError extends Error {
    readonly provider: string;
    readonly statusCode?: number | undefined;
    readonly isRetryable: boolean;
    readonly cause?: unknown | undefined;
    constructor(message: string, provider: string, statusCode?: number | undefined, isRetryable?: boolean, cause?: unknown | undefined);
}
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