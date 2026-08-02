import { AgentDescriptor } from "./types.js";

export class AgentRegistry {
  private agents: Map<string, AgentDescriptor> = new Map();

  register(agent: AgentDescriptor): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID '${agent.id}' is already registered.`);
    }
    this.agents.set(agent.id, agent);
  }

  get(agentId: string): AgentDescriptor | undefined {
    return this.agents.get(agentId);
  }

  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  list(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }
}
