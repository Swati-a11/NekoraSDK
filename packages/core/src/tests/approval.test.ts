import { describe, it, expect } from "vitest";
import { Agent } from "../agent/agent.js";
import { tool } from "../tools/tool.js";
import { z } from "zod";
import { SDKEvent } from "../events/types.js";

describe("Feature 2: Human Approval System", () => {
  it("allows execution when human approval callback returns true (approved execution)", async () => {
    const dangerousTool = tool({
      name: "delete_database_record",
      description: "Delete a record from database",
      permissions: ["db:write"],
      schema: z.object({ recordId: z.string() }),
      execute: async ({ recordId }) => `Deleted ${recordId}`,
    });

    let mockGenerateCalled = false;
    const agent = new Agent({
      name: "ApprovalTestAgent",
      instructions: "Perform database operations",
      model: {
        id: "mock",
        modelName: "mock",
        generate: async () => {
          if (!mockGenerateCalled) {
            mockGenerateCalled = true;
            return {
              text: "",
              toolCalls: [
                {
                  id: "tc_1",
                  name: "delete_database_record",
                  arguments: { recordId: "rec_123" },
                },
              ],
            };
          }
          return { text: "Record deleted successfully." };
        },
      },
      tools: [dangerousTool],
    });

    const emittedEvents: SDKEvent[] = [];
    agent.getEventEmitter().onAny((evt) => emittedEvents.push(evt));

    agent.onApprovalRequest(async (req) => {
      expect(req.toolName).toBe("delete_database_record");
      expect(req.riskLevel).toBe("HIGH");
      return true; // Approve
    });

    const res = await agent.run("Delete record rec_123");
    expect(res.output).toContain("Record deleted successfully.");

    const eventTypes = emittedEvents.map((e) => e.type);
    expect(eventTypes).toContain("approval_requested");
    expect(eventTypes).toContain("approval_granted");
  });

  it("prevents execution and throws error when approval is rejected", async () => {
    const dangerousTool = tool({
      name: "delete_system_file",
      description: "Delete a file",
      permissions: ["file:delete"],
      schema: z.object({ filePath: z.string() }),
      execute: async ({ filePath }) => `Deleted ${filePath}`,
    });

    const agent = new Agent({
      name: "ApprovalRejectAgent",
      instructions: "Manage files",
      model: {
        id: "mock",
        modelName: "mock",
        generate: async () => ({
          text: "",
          toolCalls: [
            {
              id: "tc_2",
              name: "delete_system_file",
              arguments: { filePath: "/etc/config" },
            },
          ],
        }),
      },
      tools: [dangerousTool],
    });

    const emittedEvents: SDKEvent[] = [];
    agent.getEventEmitter().onAny((evt) => emittedEvents.push(evt));

    agent.onApprovalRequest(async () => {
      return { approved: false, reason: "Deleting system configuration is forbidden." };
    });

    await expect(agent.run("Delete /etc/config")).rejects.toThrow("Human approval rejected");

    const eventTypes = emittedEvents.map((e) => e.type);
    expect(eventTypes).toContain("approval_requested");
    expect(eventTypes).toContain("approval_rejected");
  });
});
