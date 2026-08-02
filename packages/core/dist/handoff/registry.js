export class AgentRegistry {
    agents = new Map();
    register(agent) {
        if (this.agents.has(agent.id)) {
            throw new Error(`Agent with ID '${agent.id}' is already registered.`);
        }
        this.agents.set(agent.id, agent);
    }
    get(agentId) {
        return this.agents.get(agentId);
    }
    has(agentId) {
        return this.agents.has(agentId);
    }
    list() {
        return Array.from(this.agents.values());
    }
    unregister(agentId) {
        return this.agents.delete(agentId);
    }
}
//# sourceMappingURL=registry.js.map