export class WorkingMemoryManager {
    state;
    constructor() {
        this.state = this.createDefaultState();
    }
    createDefaultState() {
        return {
            goal: undefined,
            constraints: [],
            currentStep: undefined,
            activePlan: [],
            pendingActions: [],
            temporaryDecisions: {},
            metadata: {},
        };
    }
    setGoal(goal, constraints = []) {
        this.state.goal = goal;
        this.state.constraints = constraints;
    }
    setCurrentStep(step) {
        this.state.currentStep = step;
    }
    setPlan(plan) {
        this.state.activePlan = plan;
    }
    addDecision(key, value) {
        this.state.temporaryDecisions[key] = value;
    }
    getState() {
        return { ...this.state };
    }
    clear() {
        this.state = this.createDefaultState();
    }
    formatContextPrompt() {
        if (!this.state.goal && (!this.state.constraints || this.state.constraints.length === 0) && !this.state.currentStep) {
            return "";
        }
        const lines = ["[Working Memory Active Task State]"];
        if (this.state.goal)
            lines.push(`Goal: ${this.state.goal}`);
        if (this.state.constraints && this.state.constraints.length > 0)
            lines.push(`Constraints: ${this.state.constraints.join("; ")}`);
        if (this.state.currentStep)
            lines.push(`Current Step: ${this.state.currentStep}`);
        if (this.state.activePlan && this.state.activePlan.length > 0)
            lines.push(`Active Plan: ${this.state.activePlan.join(" -> ")}`);
        return lines.join("\n");
    }
}
//# sourceMappingURL=working.manager.js.map