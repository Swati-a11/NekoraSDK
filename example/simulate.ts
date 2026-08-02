import { Agent, tool } from "@nekora-ai/core";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

const deleteTool = tool({
  name: "delete_database",
  description: "Delete all database records",
  permissions: ["admin:write", "delete"],
  requireApproval: true,
  schema: z.object({ confirm: z.boolean() }),
  execute: async () => ({ deleted: true }),
});

const agent = new Agent({
  name: "Mochi",
  instructions: "You are a helpful assistant",
  tools: [deleteTool],
});

async function main() {
  console.log("🧪 Running Simulation Mode...\n");

  const simulation = await agent.simulate(
    "Delete all old database records"
  );

  console.log("⚠️  Risk Level:", simulation.riskLevel);
  console.log("🔐 Approval Required Count:", simulation.approvalRequiredCount);
  console.log("📋 Planned Actions:", simulation.plannedActions);
  console.log("\n📅 Timeline:");
  simulation.timeline.forEach((step: any) => {
    console.log(`  → ${step.phase}: ${step.description}`);
  });
}

main();
