import { Tool } from "../tools/types.js";
import { RiskLevel } from "./types.js";
export declare class RiskAnalyzer {
    private highRiskTools;
    private mediumRiskTools;
    constructor(options?: {
        highRiskTools?: string[];
        mediumRiskTools?: string[];
    });
    registerHighRiskTool(toolName: string): void;
    registerMediumRiskTool(toolName: string): void;
    analyzeRisk(tool: Tool, args?: unknown): RiskLevel;
}
//# sourceMappingURL=risk-analyzer.d.ts.map