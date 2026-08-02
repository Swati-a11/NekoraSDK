import { Tool } from "../tools/types.js";
import { RiskLevel } from "./types.js";

export class RiskAnalyzer {
  private highRiskTools: Set<string> = new Set();
  private mediumRiskTools: Set<string> = new Set();

  constructor(options: { highRiskTools?: string[]; mediumRiskTools?: string[] } = {}) {
    if (options.highRiskTools) {
      options.highRiskTools.forEach((t) => this.highRiskTools.add(t));
    }
    if (options.mediumRiskTools) {
      options.mediumRiskTools.forEach((t) => this.mediumRiskTools.add(t));
    }
  }

  public registerHighRiskTool(toolName: string): void {
    this.highRiskTools.add(toolName);
  }

  public registerMediumRiskTool(toolName: string): void {
    this.mediumRiskTools.add(toolName);
  }

  public analyzeRisk(tool: Tool, args?: unknown): RiskLevel {
    if (this.highRiskTools.has(tool.name)) return "HIGH";
    if (this.mediumRiskTools.has(tool.name)) return "MEDIUM";

    const permissions = tool.permissions || [];
    const highRiskPermissions = ["code:execute", "sys:exec", "db:write", "file:delete", "system:sudo"];
    const mediumRiskPermissions = ["db:read", "file:read", "network:fetch"];

    const hasHighRiskPerm = permissions.some((p) =>
      highRiskPermissions.some((hr) => p.includes(hr) || hr.includes(p))
    );
    if (hasHighRiskPerm) return "HIGH";

    const hasMediumRiskPerm = permissions.some((p) =>
      mediumRiskPermissions.some((mr) => p.includes(mr) || mr.includes(p))
    );
    if (hasMediumRiskPerm) return "MEDIUM";

    if (tool.requireApproval) return "HIGH";

    // Heuristics on args
    if (args && typeof args === "object") {
      const strArgs = JSON.stringify(args).toLowerCase();
      if (strArgs.includes("drop") || strArgs.includes("delete") || strArgs.includes("rm -rf")) {
        return "HIGH";
      }
    }

    return "LOW";
  }
}
