import { ModelProvider } from "../providers/types.js";
import { Tool } from "../tools/types.js";
import { MemoryAdapter } from "../memory/types.js";
import { SessionStore } from "../session/types.js";
import { GuardrailPipeline } from "../guardrails/pipeline.js";
import { HandoffManager } from "../handoff/handoff.manager.js";
import { NekoraPlugin } from "../plugins/types.js";
import { PersonalityProfile } from "../personality/types.js";
import { ExecutionOptions } from "../runtime/context.js";
import { z } from "zod";
export interface AgentConfig {
    id?: string;
    name: string;
    instructions: string;
    model?: ModelProvider | string;
    personality?: PersonalityProfile;
    tools?: Tool[];
    memory?: MemoryAdapter;
    sessionStore?: SessionStore;
    guardrails?: GuardrailPipeline;
    handoffManager?: HandoffManager;
    approvalManager?: any;
    permissions?: string[];
    plugins?: NekoraPlugin[];
    maxIterations?: number;
    timeoutMs?: number;
    maxRetries?: number;
    metadata?: Record<string, unknown>;
}
export interface AgentRunOptions extends ExecutionOptions {
    outputSchema?: z.ZodType<any> | Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map