import React, { useState } from "react";
import {
  User,
  Bot,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Cpu,
  Clock,
  Zap,
  Activity,
  ArrowRight,
} from "lucide-react";

export interface TraceStepNode {
  id: string;
  type:
    | "userInput"
    | "agentStarted"
    | "modelCall"
    | "toolDecision"
    | "toolExecution"
    | "toolResult"
    | "handoff"
    | "finalOutput"
    | "error";
  label: string;
  subText?: string;
  durationMs?: number;
  tokens?: number;
  provider?: string;
  details?: Record<string, unknown>;
}

export interface VisualTraceData {
  runId: string;
  provider?: string;
  totalDurationMs?: number;
  toolsUsed?: string[];
  status?: "completed" | "failed" | "running";
  steps: TraceStepNode[];
}

interface TraceViewerProps {
  traceData?: VisualTraceData;
  traceSteps?: TraceStepNode[];
}

export const TraceViewer: React.FC<TraceViewerProps> = ({
  traceData,
  traceSteps = [],
}) => {
  const steps: TraceStepNode[] =
    traceData?.steps ||
    (traceSteps.length > 0
      ? traceSteps
      : [
          {
            id: "step_1",
            type: "userInput",
            label: "User Input",
            subText: "What's the weather in Tokyo?",
            details: { query: "What's the weather in Tokyo?", sessionId: "sess_123" },
          },
          {
            id: "step_2",
            type: "agentStarted",
            label: "Agent Started",
            subText: "Agent 'Nekora Assistant' initialized execution cycle",
            details: { agentId: "agent_weather_1", memoryLoaded: true },
          },
          {
            id: "step_3",
            type: "modelCall",
            label: "Model Call",
            subText: "Provider: Groq (llama-3.3-70b) | 240ms | 42 tokens",
            durationMs: 240,
            tokens: 42,
            provider: "Groq",
            details: { promptTokens: 30, completionTokens: 12 },
          },
          {
            id: "step_4",
            type: "toolDecision",
            label: "Tool Decision",
            subText: "Agent decided to call 'weather_fetcher'",
            details: { toolName: "weather_fetcher", args: { city: "Tokyo" } },
          },
          {
            id: "step_5",
            type: "toolExecution",
            label: "Tool Execution",
            subText: "Executing 'weather_fetcher({ city: 'Tokyo' })'",
            durationMs: 180,
            details: { toolName: "weather_fetcher", status: "success" },
          },
          {
            id: "step_6",
            type: "toolResult",
            label: "Tool Result",
            subText: "Returned: { city: 'Tokyo', temp: '22°C', condition: 'Clear' }",
            details: { result: { city: "Tokyo", temp: "22°C", condition: "Clear" } },
          },
          {
            id: "step_7",
            type: "finalOutput",
            label: "Final Response",
            subText: "The weather in Tokyo is currently 22°C and clear.",
            details: { text: "The weather in Tokyo is currently 22°C and clear." },
          },
        ]);

  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    step_1: true,
    step_7: true,
  });

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const runId = traceData?.runId || "run_demo_8f92a1";
  const provider = traceData?.provider || "Groq";
  const totalDurationMs =
    traceData?.totalDurationMs ||
    steps.reduce((acc, s) => acc + (s.durationMs || 0), 120);
  const toolsCount =
    traceData?.toolsUsed?.length ||
    new Set(steps.filter((s) => s.type === "toolExecution").map((s) => s.label)).size;

  const getStepIcon = (type: TraceStepNode["type"]) => {
    switch (type) {
      case "userInput":
        return <User className="w-4 h-4 text-blue-400" />;
      case "agentStarted":
        return <Bot className="w-4 h-4 text-indigo-400" />;
      case "modelCall":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case "toolDecision":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "toolExecution":
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case "toolResult":
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case "finalOutput":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Bot className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden font-sans">
      {/* SaaS Dashboard Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Execution Trace</h3>
              <span className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                {runId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time agent execution pipeline & telemetry</p>
          </div>
        </div>

        {/* Dashboard Stat Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Provider:</span>
            <span className="font-medium text-slate-200">{provider}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="font-medium text-emerald-400">{totalDurationMs}ms</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Tools:</span>
            <span className="font-medium text-slate-200">{toolsCount}</span>
          </div>
        </div>
      </div>

      {/* Execution Flow Steps Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-950/60">
        {steps.map((step, index) => {
          const isExpanded = !!expandedSteps[step.id];

          return (
            <div
              key={step.id}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition duration-150 overflow-hidden"
            >
              <div
                onClick={() => toggleStep(step.id)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700">
                    {getStepIcon(step.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{step.label}</span>
                      {step.durationMs != null && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>
                    {step.subText && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-lg">
                        {step.subText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Step Expanded Details */}
              {isExpanded && step.details && (
                <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-950/40 text-xs font-mono text-slate-300">
                  <pre className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 overflow-x-auto">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
