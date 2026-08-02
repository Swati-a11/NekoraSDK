export interface Tool {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    execute(args: Record<string, unknown>): Promise<unknown>;
}
//# sourceMappingURL=tools.d.ts.map