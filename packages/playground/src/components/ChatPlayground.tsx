import React, { useState, useRef, useEffect } from "react";
import { Send, Cpu, Wrench, History, ShieldCheck, Loader2, AlertCircle, Terminal, Play } from "lucide-react";
import { TraceStepNode } from "./TraceViewer";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  toolsUsed?: string[];
  streaming?: boolean;
}

interface ChatPlaygroundProps {
  onTraceUpdate?: (steps: TraceStepNode[]) => void;
}

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({ onTraceUpdate }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"groq" | "gemini" | "openai" | "demo">("groq");
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<{ status: string; version: string; uptime: number } | null>(null);

  // Direct sandbox code execution tester state
  const [testLanguage, setTestLanguage] = useState<"javascript" | "typescript" | "python">("javascript");
  const [testCode, setTestCode] = useState<string>("console.log('Hello from Nekora Backend Sandbox!');");
  const [executingCode, setExecutingCode] = useState(false);
  const [codeResult, setCodeResult] = useState<{ success?: boolean; stdout?: string; stderr?: string; executionTime?: number; error?: string } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "agent",
      text: "Hello! I am your Nekora AI Agent running on Express Server Backend. My runtime, cognitive memory, guardrails, and code sandbox execution all run safely on the server. How can I help you today?",
    },
  ]);

  const [memoryHistory, setMemoryHistory] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! I am your Nekora AI Agent running on Express Server Backend..." },
  ]);

  const sessionIdRef = useRef(`sess_playground_${Date.now()}`);

  // Fetch Server Health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setServerHealth(data))
      .catch((err) => console.warn("Backend server health check failed:", err));
  }, []);

  const handleExecuteSandboxCode = async () => {
    if (!testCode.trim() || executingCode) return;
    setExecutingCode(true);
    setCodeResult(null);

    try {
      const res = await fetch("/api/code/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: testLanguage, code: testCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      setCodeResult(data);
    } catch (err: any) {
      setCodeResult({
        success: false,
        stdout: "",
        stderr: err.message || String(err),
        error: err.message || String(err),
      });
    } finally {
      setExecutingCode(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setApiError(null);
    const userMsgId = String(Date.now());
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: currentInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setMemoryHistory((prev) => [...prev, { role: "user", content: currentInput }]);

    const agentMsgId = String(Date.now() + 1);
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: "agent",
        text: "",
        streaming: true,
        toolsUsed: [],
      },
    ]);

    const startTime = Date.now();

    try {
      // Connect to Server-Sent Events (SSE) streaming endpoint
      const streamUrl = `/api/chat/stream?message=${encodeURIComponent(currentInput)}&provider=${selectedProvider}&sessionId=${sessionIdRef.current}`;
      
      const response = await fetch(streamUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || errorData.code || "Server communication failed");
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      const toolsExecutedSet = new Set<string>();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventName = "message";
          let dataStr = "";

          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) {
              eventName = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.substring(6).trim();
            }
          }

          if (dataStr) {
            try {
              const parsedData = JSON.parse(dataStr);

              if (eventName === "text_stream" && parsedData.delta) {
                accumulatedText += parsedData.delta;
                const currentText = accumulatedText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === agentMsgId
                      ? { ...msg, text: currentText, streaming: true, toolsUsed: Array.from(toolsExecutedSet) }
                      : msg
                  )
                );
              } else if (eventName === "tool_started" && parsedData.toolName) {
                toolsExecutedSet.add(parsedData.toolName);
              } else if (eventName === "run_completed") {
                const finalResult = parsedData.result;
                const finalText =
                  typeof finalResult?.output === "string"
                    ? finalResult.output
                    : accumulatedText || JSON.stringify(finalResult || "");

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === agentMsgId
                      ? { ...msg, text: finalText, streaming: false, toolsUsed: Array.from(toolsExecutedSet) }
                      : msg
                  )
                );
              }
            } catch (err) {
              console.warn("Error parsing SSE data chunk:", err);
            }
          }
        }
      }

      setMemoryHistory((prev) => [...prev, { role: "assistant", content: accumulatedText || "Completed" }]);

      if (onTraceUpdate) {
        const traceNodes: TraceStepNode[] = [
          { id: "1", type: "userInput", label: "User Input", subText: `"${currentInput}"` },
          { id: "2", type: "modelCall", label: `Nekora Server (${selectedProvider})`, subText: "SSE Stream Completed" },
        ];

        if (toolsExecutedSet.size > 0) {
          traceNodes.push({
            id: "3",
            type: "toolExecution",
            label: "Tools Executed on Server",
            subText: Array.from(toolsExecutedSet).join(", "),
          });
        }

        traceNodes.push({
          id: String(traceNodes.length + 1),
          type: "finalOutput",
          label: "Server Response Delivered",
          subText: `Server Latency: ${Date.now() - startTime}ms`,
        });

        onTraceUpdate(traceNodes);
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      setApiError(errorMsg);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                text: `⚠️ Backend Error: ${errorMsg}`,
                streaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px", height: "100%" }}>
      {/* Left Column: Server Agent Chat */}
      <div style={{ display: "flex", flexDirection: "column", background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "16px" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #1e293b", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={20} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 600 }}>Nekora Agent (Server Runtime)</h2>
              <span style={{ fontSize: "11px", color: serverHealth ? "#4ade80" : "#94a3b8" }}>
                ● Server Status: {serverHealth ? `Online (v${serverHealth.version})` : "Connecting to localhost:3001..."}
              </span>
            </div>
          </div>

          {/* Provider Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              style={{
                background: "#1e293b",
                color: "#38bdf8",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
                outline: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="groq">Groq Llama 3.3 (⚡ Server Fast)</option>
              <option value="gemini">Gemini 2.0 Flash</option>
              <option value="openai">OpenAI GPT-4o Mini</option>
              <option value="demo">Server Demo Mode</option>
            </select>
          </div>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div style={{ background: "#451a03", border: "1px solid #9a3412", color: "#fdba74", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <AlertCircle size={14} color="#f97316" />
              <span>Server Request Notice</span>
            </div>
            <div style={{ marginTop: "4px" }}>{apiError}</div>
          </div>
        )}

        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "8px" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                background: m.sender === "user" ? "#2563eb" : "#1e293b",
                color: "#f8fafc",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <div>
                {m.text}
                {m.streaming && (
                  <span style={{ display: "inline-flex", alignItems: "center", marginLeft: "8px" }}>
                    <Loader2 size={14} className="animate-spin" color="#38bdf8" />
                  </span>
                )}
              </div>
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
                  <Wrench size={12} color="#f97316" />
                  <span style={{ fontSize: "11px", color: "#fdba74" }}>
                    Server tools executed: {m.toolsUsed.join(", ")}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <input
            type="text"
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask agent to run code, fetch weather, or answer questions..."
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#f8fafc",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              background: isLoading ? "#475569" : "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 18px",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isLoading ? "Executing..." : "Send"}
          </button>
        </div>
      </div>

      {/* Right Column: Server Sandbox & Inspectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        {/* Direct Sandbox Execution Tester */}
        <div style={{ background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Terminal size={16} color="#38bdf8" />
              <h3 style={{ fontSize: "14px", margin: 0, fontWeight: 600 }}>Server Sandbox Executor</h3>
            </div>
            <select
              value={testLanguage}
              onChange={(e) => setTestLanguage(e.target.value as any)}
              style={{
                background: "#1e293b",
                color: "#38bdf8",
                border: "1px solid #334155",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "11px",
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </div>

          <textarea
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "8px",
              color: "#a7f3d0",
              fontFamily: "monospace",
              fontSize: "11px",
              outline: "none",
              resize: "vertical",
            }}
          />

          <button
            onClick={handleExecuteSandboxCode}
            disabled={executingCode}
            style={{
              marginTop: "8px",
              width: "100%",
              background: executingCode ? "#475569" : "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: executingCode ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {executingCode ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {executingCode ? "Executing on Server..." : "Execute via POST /api/code/execute"}
          </button>

          {codeResult && (
            <div style={{ marginTop: "10px", background: "#020617", padding: "8px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace" }}>
              <div style={{ color: codeResult.success ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                Status: {codeResult.success ? "Success" : "Failed"} {codeResult.executionTime != null && `(${codeResult.executionTime}ms)`}
              </div>
              {codeResult.stdout && <div style={{ color: "#e2e8f0", marginTop: "4px" }}>stdout: {codeResult.stdout}</div>}
              {codeResult.stderr && <div style={{ color: "#fca5a5", marginTop: "4px" }}>stderr: {codeResult.stderr}</div>}
              {codeResult.error && <div style={{ color: "#ef4444", marginTop: "4px" }}>error: {codeResult.error}</div>}
            </div>
          )}
        </div>

        {/* Server Registered Tools */}
        <div style={{ background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Wrench size={16} color="#f97316" />
            <h3 style={{ fontSize: "14px", margin: 0 }}>Server Registered Tools</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {["weather_fetcher", "database_query", "code_executor"].map((t) => (
              <div key={t} style={{ background: "#1e293b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", color: "#fdba74" }}>
                🔧 {t}
              </div>
            ))}
          </div>
        </div>

        {/* Server Guardrails */}
        <div style={{ background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <ShieldCheck size={16} color="#10b981" />
            <h3 style={{ fontSize: "14px", margin: 0 }}>Active Server Guardrails</h3>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            <div style={{ color: "#a7f3d0", padding: "4px 0" }}>✓ Output PII Sanitizer</div>
            <div style={{ color: "#a7f3d0", padding: "4px 0" }}>✓ Input Pattern Filter</div>
          </div>
        </div>

        {/* Cognitive Memory Inspection */}
        <div style={{ flex: 1, background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <History size={16} color="#a855f7" />
            <h3 style={{ fontSize: "14px", margin: 0 }}>Server Cognitive Memory</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", fontSize: "11px", fontFamily: "monospace", color: "#cbd5e1" }}>
            {memoryHistory.map((m, idx) => (
              <div key={idx} style={{ padding: "4px 0", borderBottom: "1px dashed #334155" }}>
                <strong>[{m.role}]:</strong> {m.content.slice(0, 45)}...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
