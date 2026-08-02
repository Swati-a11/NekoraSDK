export type SDKEvent = {
    type: "agent_started";
    agentId: string;
    timestamp: number;
} | {
    type: "text_stream";
    delta: string;
} | {
    type: "tool_started";
    toolName: string;
    input: unknown;
} | {
    type: "tool_completed";
    toolName: string;
    output: unknown;
} | {
    type: "handoff_started";
    fromAgentId: string;
    toAgentId: string;
    reason: string;
} | {
    type: "guardrail_triggered";
    guardrailName: string;
    stage: string;
    action: string;
} | {
    type: "retry";
    attempt: number;
    error: string;
} | {
    type: "run_completed";
    result: unknown;
} | {
    type: "run_failed";
    error: Error;
};
export type SDKEventType = SDKEvent["type"];
//# sourceMappingURL=types.d.ts.map