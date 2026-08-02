import { tool } from "../tools/tool.js";
import { z } from "zod";
export function createHandoffTool(handoffManager, fromAgentId) {
    return tool({
        name: "handoff_to_agent",
        description: "Hand off the conversation to another specialized AI agent.",
        schema: z.object({
            targetAgentId: z.string().describe("The ID of the target agent to handoff to"),
            reason: z.string().describe("The reason why context/task is being handed off"),
            context: z.record(z.unknown()).optional().describe("Additional context to pass to the agent"),
        }),
        execute: async ({ targetAgentId, reason, context }) => {
            const handoffCtx = handoffManager.trackHandoff(fromAgentId, {
                targetAgentId,
                reason,
                context: context || {},
            });
            return {
                status: "handoff_initiated",
                handoffContext: handoffCtx,
                message: `Task successfully handed off to agent '${targetAgentId}' for reason: ${reason}`,
            };
        },
    });
}
//# sourceMappingURL=handoff.tool.js.map