import { AgentRegistry } from "./registry.js";
import {
  HandoffConfig,
  HandoffContext,
  HandoffRequest,
  HandoffLoopError,
} from "./types.js";

export class HandoffManager {
  private registry: AgentRegistry;
  private config: HandoffConfig;
  private handoffHistory: string[] = [];

  constructor(registry: AgentRegistry, config: HandoffConfig = {}) {
    this.registry = registry;
    this.config = {
      maxHandoffDepth: 5,
      allowSelfHandoff: false,
      ...config,
    };
  }

  trackHandoff(fromAgentId: string, request: HandoffRequest): HandoffContext {
    const toAgentId = request.targetAgentId;

    if (!this.registry.has(toAgentId)) {
      throw new Error(`Cannot handoff to unregistered agent '${toAgentId}'.`);
    }

    if (!this.config.allowSelfHandoff && fromAgentId === toAgentId) {
      throw new Error(`Self-handoff is disabled for agent '${fromAgentId}'.`);
    }

    if (this.handoffHistory.length === 0) {
      this.handoffHistory.push(fromAgentId);
    }

    this.handoffHistory.push(toAgentId);

    if (this.handoffHistory.length > (this.config.maxHandoffDepth || 5)) {
      throw new HandoffLoopError([...this.handoffHistory]);
    }

    // Loop detection in sequence (e.g. A -> B -> A)
    const seen = new Set<string>();
    for (const id of this.handoffHistory) {
      if (seen.has(id)) {
        throw new HandoffLoopError([...this.handoffHistory]);
      }
      seen.add(id);
    }

    return {
      fromAgentId,
      toAgentId,
      reason: request.reason,
      transferredData: request.context || {},
      historyDepth: this.handoffHistory.length,
      timestamp: Date.now(),
    };
  }

  resetHistory(): void {
    this.handoffHistory = [];
  }

  getHistoryTrace(): string[] {
    return [...this.handoffHistory];
  }
}
