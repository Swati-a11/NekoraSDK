import React, { useState } from "react";
import { ChatPlayground } from "./components/ChatPlayground";
import { TraceViewer, TraceStepNode } from "./components/TraceViewer";
import { MessageSquare, GitFork, Sparkles } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "trace">("chat");
  const [traceSteps, setTraceSteps] = useState<TraceStepNode[]>([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#090d16", color: "#f8fafc" }}>
      {/* Top Header */}
      <header style={{ height: "60px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={24} color="#38bdf8" />
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px" }}>Nekora AI</span>
          <span style={{ fontSize: "12px", background: "#1e293b", padding: "2px 8px", borderRadius: "12px", color: "#94a3b8" }}>SDK Playground</span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "4px", borderRadius: "8px" }}>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              background: activeTab === "chat" ? "#3b82f6" : "transparent",
              color: activeTab === "chat" ? "#fff" : "#94a3b8",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <MessageSquare size={14} /> Agent Chat
          </button>
          <button
            onClick={() => setActiveTab("trace")}
            style={{
              background: activeTab === "trace" ? "#3b82f6" : "transparent",
              color: activeTab === "trace" ? "#fff" : "#94a3b8",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <GitFork size={14} /> Visual Trace DAG
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "16px", overflow: "hidden" }}>
        {activeTab === "chat" ? (
          <ChatPlayground onTraceUpdate={(steps) => setTraceSteps(steps)} />
        ) : (
          <TraceViewer traceSteps={traceSteps} />
        )}
      </main>
    </div>
  );
};
