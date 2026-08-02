export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  tools?: string[];
  metadata?: Record<string, unknown>;
}

export interface HandoffConfig {
  maxHandoffDepth?: number;
  allowSelfHandoff?: boolean;
  transferredKeys?: string[];
}

export interface HandoffContext {
  fromAgentId: string;
  toAgentId: string;
  reason: string;
  transferredData: Record<string, unknown>;
  historyDepth: number;
  timestamp: number;
}

export interface HandoffRequest {
  targetAgentId: string;
  reason: string;
  context?: Record<string, unknown>;
}

export class HandoffLoopError extends Error {
  public readonly code: string = "HANDOFF_LOOP_DETECTED";

  constructor(public readonly trace: string[]) {
    super(`Handoff loop detected across agent sequence: ${trace.join(" -> ")}.`);
    this.name = "HandoffLoopError";
  }
}
