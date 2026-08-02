import { WorkingMemoryState } from "../types.js";

export class WorkingMemoryManager {
  private state: WorkingMemoryState;

  constructor() {
    this.state = this.createDefaultState();
  }

  private createDefaultState(): WorkingMemoryState {
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

  setGoal(goal: string, constraints: string[] = []): void {
    this.state.goal = goal;
    this.state.constraints = constraints;
  }

  setCurrentStep(step: string): void {
    this.state.currentStep = step;
  }

  setPlan(plan: string[]): void {
    this.state.activePlan = plan;
  }

  addDecision(key: string, value: unknown): void {
    this.state.temporaryDecisions[key] = value;
  }

  getState(): WorkingMemoryState {
    return { ...this.state };
  }

  clear(): void {
    this.state = this.createDefaultState();
  }

  formatContextPrompt(): string {
    if (!this.state.goal && (!this.state.constraints || this.state.constraints.length === 0) && !this.state.currentStep) {
      return "";
    }

    const lines: string[] = ["[Working Memory Active Task State]"];
    if (this.state.goal) lines.push(`Goal: ${this.state.goal}`);
    if (this.state.constraints && this.state.constraints.length > 0) lines.push(`Constraints: ${this.state.constraints.join("; ")}`);
    if (this.state.currentStep) lines.push(`Current Step: ${this.state.currentStep}`);
    if (this.state.activePlan && this.state.activePlan.length > 0) lines.push(`Active Plan: ${this.state.activePlan.join(" -> ")}`);
    
    return lines.join("\n");
  }
}
