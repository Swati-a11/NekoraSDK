import { Tool } from "../tools/types.js";
import { SimulationReport } from "./types.js";
export declare class AgentSandbox {
    /**
     * Simulate an agent run without executing real tool side-effects or mutating persistent state.
     */
    static simulate(input: string, tools?: Tool[], instructions?: string): SimulationReport;
    private static inferParameterSchema;
}
//# sourceMappingURL=simulator.d.ts.map