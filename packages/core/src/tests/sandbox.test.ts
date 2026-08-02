import { describe, it, expect } from "vitest";
import { AgentSandbox } from "../sandbox/simulator.js";
import { tool } from "../tools/tool.js";
import { z } from "zod";

describe("Agent Sandbox & Simulation Mode (Area 1)", () => {
  it("1. Simulates standard low-risk query with tool matching", () => {
    const weatherTool = tool({
      name: "get_weather",
      description: "Fetch current weather",
      schema: z.object({ city: z.string() }),
      execute: async () => "25°C",
    });

    const report = AgentSandbox.simulate("What is the weather in Delhi?", [weatherTool]);

    expect(report.mode).toBe("simulation");
    expect(report.input).toBe("What is the weather in Delhi?");
    expect(report.plannedActions.length).toBe(1);
    expect(report.plannedActions[0]?.tool).toBe("get_weather");
    expect(report.plannedActions[0]?.risk).toBe("LOW");
    expect(report.riskLevel).toBe("LOW");
    expect(report.approvalRequiredCount).toBe(0);
    expect(report.timeline.length).toBeGreaterThanOrEqual(4);
  });

  it("2. Handles empty or whitespace queries gracefully with warnings", () => {
    const report = AgentSandbox.simulate("   ");

    expect(report.mode).toBe("simulation");
    expect(report.plannedActions.length).toBe(0);
    expect(report.riskLevel).toBe("LOW");
    expect(report.warnings).toContain("Input query is empty or whitespace only.");
    expect(report.timeline.some((t) => t.description.includes("No input query provided"))).toBe(true);
  });

  it("3. Handles invalid / malformed tool entries safely", () => {
    const validTool = tool({
      name: "search_news",
      description: "Search news",
      execute: async () => "News",
    });

    const malformedTools: any[] = [null, undefined, { invalid: true }, validTool];

    const report = AgentSandbox.simulate("search news updates", malformedTools);

    expect(report.plannedActions.length).toBe(1);
    expect(report.plannedActions[0]?.tool).toBe("search_news");
    expect(report.warnings?.some((w) => w.includes("invalid or malformed tool"))).toBe(true);
  });

  it("4. Evaluates HIGH risk level for administrative / destructive permissions", () => {
    const sensitiveTool = tool({
      name: "update_system_config",
      description: "Modify system config",
      permissions: ["admin:write"],
      execute: async () => "Updated",
    });

    const report = AgentSandbox.simulate("update system config settings", [sensitiveTool]);

    expect(report.plannedActions[0]?.risk).toBe("HIGH");
    expect(report.riskLevel).toBe("HIGH");
    expect(report.plannedActions[0]?.approvalRequired).toBe(true);
  });

  it("5. Respects requireApproval flag on tools", () => {
    const approvalTool = tool({
      name: "transfer_funds",
      description: "Transfer money",
      requireApproval: true,
      execute: async () => "Transferred",
    });

    const report = AgentSandbox.simulate("transfer funds to recipient", [approvalTool]);

    expect(report.approvalRequiredCount).toBe(1);
    expect(report.plannedActions[0]?.approvalRequired).toBe(true);
  });

  it("6. Infers parameter schema shapes from tool parameter definitions", () => {
    const typedTool = tool({
      name: "create_user",
      description: "Create user record",
      schema: z.object({
        username: z.string(),
        age: z.number(),
        isAdmin: z.boolean(),
      }),
      execute: async () => "User created",
    });

    const report = AgentSandbox.simulate("create user john", [typedTool]);

    const params = report.plannedActions[0]?.estimatedParameters;
    expect(params).toBeDefined();
    expect(params?.age).toBe(0);
    expect(params?.isAdmin).toBe(true);
    expect(params?.username).toBe("create user john");
  });

  it("7. Emits structured simulation timeline with step numbers and timestamps", () => {
    const report = AgentSandbox.simulate("Search articles", []);

    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.timeline[0]?.step).toBe(1);
    expect(report.timeline[0]?.phase).toBe("validation");
    expect(report.timeline[report.timeline.length - 1]?.phase).toBe("completion");
  });
});
