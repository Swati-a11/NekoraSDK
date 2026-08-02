export interface InitOptions {
    projectName?: string;
    targetDir?: string;
    provider?: "openai" | "claude" | "gemini" | "groq" | "openrouter";
}
export declare function initProject(options?: InitOptions): void;
