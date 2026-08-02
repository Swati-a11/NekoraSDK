export type SDKEvent =
  | { type: "run.started"; runId: string; agentId: string; timestamp: number; input: unknown }
  | { type: "agent_started"; agentId: string; timestamp: number }
  | { type: "agent_thinking"; agentId: string; step: number }
  | { type: "model.started"; runId: string; model: string; timestamp: number; messageCount: number }
  | { type: "model_called"; model: string }
  | { type: "model_completed"; model: string }
  | { type: "token.generated"; token: string; delta: string; timestamp?: number }
  | { type: "text_stream"; delta: string }
  | { type: "tool.started"; toolName: string; input: unknown; runId?: string; timestamp: number }
  | { type: "tool_started"; toolName: string; input: unknown }
  | { type: "tool.completed"; toolName: string; output: unknown; runId?: string; timestamp: number }
  | { type: "tool_completed"; toolName: string; output: unknown }
  | { type: "memory_retrieved"; sessionId: string; count: number }
  | { type: "memory_saved"; sessionId: string; role: string }
  | { type: "handoff.started"; fromAgentId: string; toAgentId: string; reason: string; runId?: string; timestamp: number }
  | { type: "handoff_started"; fromAgentId: string; toAgentId: string; reason: string }
  | { type: "guardrail.failed"; guardrailName: string; stage: string; reason: string; runId?: string; timestamp: number }
  | { type: "guardrail_triggered"; guardrailName: string; stage: string; action: string }
  | { type: "approval.required"; toolName: string; args: unknown; runId?: string; timestamp: number }
  | { type: "approval_requested"; request: any }
  | { type: "approval_granted"; requestId: string; toolName: string }
  | { type: "approval_rejected"; requestId: string; toolName: string; reason?: string }
  | { type: "provider.fallback"; primary: string; fallback: string; reason: string; timestamp: number }
  | { type: "retry"; attempt: number; error: string }
  | { type: "run.completed"; runId: string; result: unknown; timestamp: number }
  | { type: "run_completed"; result: unknown }
  | { type: "run.failed"; runId: string; error: Error | any; timestamp: number }
  | { type: "run_failed"; error: Error | any };

export type SDKEventType = SDKEvent["type"];
