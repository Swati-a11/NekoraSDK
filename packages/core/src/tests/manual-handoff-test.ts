import { AgentRegistry } from "../handoff/registry.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { createHandoffTool } from "../handoff/handoff.tool.js";
import { HandoffLoopError } from "../handoff/types.js";

async function runHandoffTest() {
  console.log("=========================================");
  console.log("🔄 TASK 5: HANDOFF & LOOP PREVENTION MANUAL TEST");
  console.log("=========================================\n");

  // 1. Initialize Registry & HandoffManager
  const registry = new AgentRegistry();
  registry.register({ id: "triage_agent", name: "Triage Agent", description: "Routes incoming user requests" });
  registry.register({ id: "coding_agent", name: "Coding Agent", description: "Specialist software developer" });

  const handoffManager = new HandoffManager(registry, { maxHandoffDepth: 3 });

  // 2. Test Successful Agent-to-Agent Handoff
  console.log("👉 Test 1: Executing Agent Handoff (triage_agent -> coding_agent)...");
  const handoffTool = createHandoffTool(handoffManager, "triage_agent");

  const result = (await handoffTool.execute({
    targetAgentId: "coding_agent",
    reason: "Query requires TypeScript debugging expertise",
    context: { language: "typescript", topic: "SDK architecture" },
  })) as any;

  console.log("  ✅ Handoff Result:", result.status);
  console.log("  ✅ Transferred Reason:", result.handoffContext.reason);
  console.log("  ✅ Transferred Data:", result.handoffContext.transferredData);

  // 3. Test Loop Prevention (coding_agent -> triage_agent -> coding_agent)
  console.log("\n👉 Test 2: Executing Sequence to Test Loop Prevention...");
  try {
    // Second hop: coding_agent -> triage_agent
    handoffManager.trackHandoff("coding_agent", {
      targetAgentId: "triage_agent",
      reason: "Handing back for clarification",
    });

    // Third hop: triage_agent -> coding_agent (CYCLE DETECTED!)
    handoffManager.trackHandoff("triage_agent", {
      targetAgentId: "coding_agent",
      reason: "Triggering loop",
    });

    console.error("  ❌ ERROR: Loop detection failed to block cyclic handoff!");
  } catch (err) {
    if (err instanceof HandoffLoopError) {
      console.log("  🛡️ [VERIFIED Loop Prevention]: HandoffLoopError correctly thrown:");
      console.log(`     Message: ${err.message}`);
    } else {
      console.log("  🛑 Unexpected Error:", err);
    }
  }
}

runHandoffTest().catch(console.error);
