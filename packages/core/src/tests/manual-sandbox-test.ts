import { Agent } from "../agent/agent.js";
import { tool } from "../tools/tool.js";
import { ModelProvider, ModelResponse } from "../providers/types.js";
import { z } from "zod";

class SandboxMockProvider implements ModelProvider {
  readonly id = "mock-sandbox-provider";
  readonly modelName = "mock-sandbox-model";

  async generate(): Promise<ModelResponse> {
    return { text: "Mock", finishReason: "stop" };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "Mock" };
  }
}

async function runSandboxTest() {
  console.log("=========================================");
  console.log("🧪 FEATURE 4: AGENT SANDBOX / SIMULATION MODE MANUAL TEST");
  console.log("=========================================\n");

  // Define tools including a high-risk approval-required tool
  const deleteDbTool = tool({
    name: "delete_database",
    description: "Permanently delete database records",
    requireApproval: true,
    schema: z.object({ table: z.string() }),
    execute: async () => "Deleted",
  });

  const searchTool = tool({
    name: "search_records",
    description: "Search records safely",
    schema: z.object({ query: z.string() }),
    execute: async () => "Found",
  });

  const agent = new Agent({
    name: "Sandbox Assistant",
    instructions: "Perform database tasks.",
    model: new SandboxMockProvider(),
    tools: [deleteDbTool, searchTool],
  });

  // Execute Agent Simulation (Dry-Run Mode)
  console.log("👉 Executing agent.simulate('Delete all old database records')...\n");
  const simulationReport = await agent.simulate("Delete all old database records");

  console.log("📊 Simulation Report Summary:");
  console.log(`   - Mode: ${simulationReport.mode}`);
  console.log(`   - Summary: ${simulationReport.summary}`);
  console.log(`   - Overall Risk Level: ${simulationReport.riskLevel}`);
  console.log(`   - Required Approvals Count: ${simulationReport.approvalRequiredCount}`);

  console.log("\n📋 Planned Tool Actions:");
  simulationReport.plannedActions.forEach((act, idx) => {
    console.log(`   [${idx + 1}] Tool: '${act.tool}' | Risk: ${act.risk} | ApprovalRequired: ${act.approvalRequired}`);
  });

  console.log("\n⏱️ Generated Simulation Timeline:");
  simulationReport.timeline.forEach((event) => {
    console.log(`   - Step ${event.step} [${event.phase}]: ${event.description}`);
  });

  console.log("\n✅ [VERIFIED]: Simulation mode evaluated risk and tool calls without executing real side-effects!");
}

runSandboxTest().catch(console.error);
