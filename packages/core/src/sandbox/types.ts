export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PlannedAction {
  tool: string;
  description: string;
  arguments: Record<string, unknown>;
  risk: RiskLevel;
  approvalRequired: boolean;
  estimatedParameters?: Record<string, unknown>;
}

export interface SimulationTimelineEvent {
  step: number;
  phase: "validation" | "tool_decision" | "dependency_analysis" | "approval_check" | "completion";
  description: string;
  timestamp: number;
}

export interface SimulationReport {
  mode: "simulation";
  input: string;
  plannedActions: PlannedAction[];
  riskLevel: RiskLevel;
  approvalRequiredCount: number;
  timeline: SimulationTimelineEvent[];
  summary: string;
  warnings?: string[];
}
