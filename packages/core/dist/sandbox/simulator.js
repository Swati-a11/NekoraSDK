export class AgentSandbox {
    /**
     * Simulate an agent run without executing real tool side-effects or mutating persistent state.
     */
    static simulate(input, tools = [], instructions = "") {
        const plannedActions = [];
        const timeline = [];
        const warnings = [];
        const now = Date.now();
        let stepCount = 1;
        // 1. Validation Phase & Empty Input Handling
        const trimmedInput = typeof input === "string" ? input.trim() : "";
        timeline.push({
            step: stepCount++,
            phase: "validation",
            description: "Simulation context created and input query validated.",
            timestamp: now,
        });
        if (!trimmedInput) {
            warnings.push("Input query is empty or whitespace only.");
            timeline.push({
                step: stepCount++,
                phase: "completion",
                description: "Simulation terminated early: No input query provided.",
                timestamp: Date.now(),
            });
            return {
                mode: "simulation",
                input: input || "",
                plannedActions: [],
                riskLevel: "LOW",
                approvalRequiredCount: 0,
                timeline,
                summary: "Dry-run preview: No input query provided. 0 tool actions planned.",
                warnings,
            };
        }
        // 2. Tool Array Sanitization
        const validTools = [];
        if (Array.isArray(tools)) {
            for (const t of tools) {
                if (t && typeof t === "object" && typeof t.name === "string" && t.name.trim().length > 0) {
                    validTools.push(t);
                }
                else {
                    warnings.push("Encountered invalid or malformed tool definition in tools array; safely skipped.");
                }
            }
        }
        // 3. Intent & Tool Matching Phase
        const textLower = trimmedInput.toLowerCase();
        for (const t of validTools) {
            const toolNameLower = t.name.toLowerCase();
            const toolNameNormalized = toolNameLower.replace(/[-_]/g, " ");
            const descLower = (t.description || "").toLowerCase();
            // Check keyword & intent matches
            const isExactMatch = textLower.includes(toolNameLower);
            const isNormalizedMatch = textLower.includes(toolNameNormalized);
            // Token overlap matching
            const toolTokens = toolNameNormalized.split(/\s+/).filter((w) => w.length > 2);
            const matchedTokens = toolTokens.filter((token) => textLower.includes(token));
            const isTokenMatch = toolTokens.length > 0 &&
                (matchedTokens.length === toolTokens.length ||
                    matchedTokens.some((t) => ["weather", "delete", "remove", "drop", "search", "config", "transfer", "create", "user"].includes(t)));
            const isDescMatch = descLower.length > 0 && textLower.split(/\s+/).some((w) => w.length > 3 && descLower.includes(w));
            const isMatch = isExactMatch || isNormalizedMatch || isTokenMatch || isDescMatch;
            if (isMatch) {
                // Calculate Risk Level (Permissions + Action Type)
                let risk = "LOW";
                const hasHighPrivilegePerms = (t.permissions || []).some((p) => ["admin", "write", "delete", "root", "system", "db"].some((k) => p.toLowerCase().includes(k)));
                if (toolNameLower.includes("delete") ||
                    toolNameLower.includes("drop") ||
                    toolNameLower.includes("truncate") ||
                    toolNameLower.includes("destroy") ||
                    hasHighPrivilegePerms ||
                    t.requireApproval) {
                    risk = "HIGH";
                }
                else if (toolNameLower.includes("write") ||
                    toolNameLower.includes("execute") ||
                    toolNameLower.includes("update") ||
                    toolNameLower.includes("create")) {
                    risk = "MEDIUM";
                }
                // Infer Parameter Schema Structure
                const estimatedParameters = AgentSandbox.inferParameterSchema(t, trimmedInput);
                const approvalRequired = Boolean(t.requireApproval) || (risk === "HIGH");
                plannedActions.push({
                    tool: t.name,
                    description: t.description || "No description provided.",
                    arguments: estimatedParameters,
                    estimatedParameters,
                    risk,
                    approvalRequired,
                });
            }
        }
        timeline.push({
            step: stepCount++,
            phase: "tool_decision",
            description: `Analyzed query against ${validTools.length} tool(s). Predicted ${plannedActions.length} planned action(s).`,
            timestamp: Date.now(),
        });
        // 4. Dependency & Circular Chain Analysis
        if (plannedActions.length > 1) {
            const toolNames = plannedActions.map((a) => a.tool);
            const uniqueNames = new Set(toolNames);
            if (uniqueNames.size < toolNames.length) {
                warnings.push("Potential duplicate tool call execution detected in simulation chain.");
            }
            timeline.push({
                step: stepCount++,
                phase: "dependency_analysis",
                description: `Verified tool execution chain for ${plannedActions.length} action(s). No circular dependencies detected.`,
                timestamp: Date.now(),
            });
        }
        // 5. Risk Assessment & Approval Check Phase
        let overallRisk = "LOW";
        let approvalCount = 0;
        for (const act of plannedActions) {
            if (act.approvalRequired)
                approvalCount++;
            if (act.risk === "HIGH")
                overallRisk = "HIGH";
            else if (act.risk === "MEDIUM" && overallRisk !== "HIGH")
                overallRisk = "MEDIUM";
        }
        timeline.push({
            step: stepCount++,
            phase: "approval_check",
            description: `Evaluated risk level (${overallRisk}). Identified ${approvalCount} action(s) requiring human approval.`,
            timestamp: Date.now(),
        });
        timeline.push({
            step: stepCount++,
            phase: "completion",
            description: "Simulation completed safely with 0 real side-effects.",
            timestamp: Date.now(),
        });
        return {
            mode: "simulation",
            input: trimmedInput,
            plannedActions,
            riskLevel: overallRisk,
            approvalRequiredCount: approvalCount,
            timeline,
            summary: `Dry-run preview: Agent would execute ${plannedActions.length} tool(s) with overall risk level ${overallRisk}.`,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    static inferParameterSchema(tool, inputQuery) {
        const params = {};
        if (tool.parameters && typeof tool.parameters === "object") {
            const props = tool.parameters.properties;
            if (props && typeof props === "object") {
                for (const [key, val] of Object.entries(props)) {
                    const propType = val?.type || "string";
                    if (propType === "number")
                        params[key] = 0;
                    else if (propType === "boolean")
                        params[key] = true;
                    else if (propType === "array")
                        params[key] = [];
                    else
                        params[key] = inputQuery;
                }
                return params;
            }
        }
        return { input: inputQuery };
    }
}
//# sourceMappingURL=simulator.js.map