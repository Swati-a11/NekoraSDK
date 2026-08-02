import { describe, it, expect } from "vitest";
import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";

describe("Neko Cognitive Memory System (Area 2)", () => {
  it("1. Short-Term Memory (STM) sliding window & context compression", async () => {
    const memory = new NekoCognitiveMemory({ maxShortTermMessages: 4 });
    const sessionId = "stm_session_1";

    // Add 6 messages to trigger compression threshold (limit 4)
    await memory.saveMessage(sessionId, { role: "user", content: "Msg 1" });
    await memory.saveMessage(sessionId, { role: "assistant", content: "Reply 1" });
    await memory.saveMessage(sessionId, { role: "user", content: "Msg 2" });
    await memory.saveMessage(sessionId, { role: "assistant", content: "Reply 2" });
    await memory.saveMessage(sessionId, { role: "user", content: "Msg 3" });
    await memory.saveMessage(sessionId, { role: "assistant", content: "Reply 3" });

    const history = await memory.getHistory(sessionId);
    expect(history.length).toBeLessThanOrEqual(6);
    expect(history.some((m) => m.content.includes("ShortTermMemory Compression"))).toBe(true);
  });

  it("2. Working Memory task state management and clearing", () => {
    const memory = new NekoCognitiveMemory();

    memory.working.setGoal("Build Nekora SDK", ["TypeScript strict", "zero bloat"]);
    memory.working.setCurrentStep("unit testing");
    memory.working.setPlan(["Plan", "Build", "Test"]);

    const state = memory.working.getState();
    expect(state.goal).toBe("Build Nekora SDK");
    expect(state.constraints.length).toBe(2);
    expect(state.currentStep).toBe("unit testing");

    // Format context prompt
    const prompt = memory.working.formatContextPrompt();
    expect(prompt).toContain("Goal: Build Nekora SDK");

    // Clear on task completion
    memory.working.clear();
    expect(memory.working.getState().goal).toBeUndefined();
    expect(memory.working.formatContextPrompt()).toBe("");
  });

  it("3. Long-Term Memory (LTM) decay scoring at t=0 and future time", () => {
    const memory = new NekoCognitiveMemory({ decayRateLambda: 0.01 });

    const entry = memory.remember("preference", "theme", "dark", "User prefers dark themes", {
      importance: 0.9,
      confidence: 1.0,
    });

    const now = Date.now();
    const scoreAtT0 = memory.retriever.calculateDecayedScore(entry, now);
    expect(scoreAtT0).toBeCloseTo(0.9, 2);

    // 10 hours into the future -> decayed score should decrease
    const future10h = now + 10 * 60 * 60 * 1000;
    const scoreAt10h = memory.retriever.calculateDecayedScore(entry, future10h);
    expect(scoreAt10h).toBeLessThan(scoreAtT0);
  });

  it("4. In-place Memory Conflict Resolution (updating contradicting preferences)", () => {
    const memory = new NekoCognitiveMemory();

    // Initial preference
    memory.remember("preference", "theme", "dark", "User prefers dark mode", { importance: 0.8 });
    expect(memory.ltm.getAll().length).toBe(1);
    expect(memory.ltm.findByKey("preference", "theme")?.value).toBe("dark");

    // Contradicting update
    memory.remember("preference", "theme", "light", "User prefers light mode now", { importance: 0.95 });

    // Assert zero duplicate entries created and entry value updated in-place
    expect(memory.ltm.getAll().length).toBe(1);
    const updated = memory.ltm.findByKey("preference", "theme");
    expect(updated?.value).toBe("light");
    expect(updated?.content).toBe("User prefers light mode now");
    expect(updated?.importance).toBe(0.95);
  });

  it("5. Memory Inspection API (memory.inspect()) returns accurate structured report", () => {
    const memory = new NekoCognitiveMemory();
    memory.remember("fact", "lang", "ts", "Prefers TypeScript", { importance: 0.9, confidence: 0.95 });

    const report = memory.inspect();
    expect(report.longTermMemories.length).toBe(1);
    expect(report.longTermMemories[0]?.key).toBe("lang");
    expect(report.longTermMemories[0]?.confidence).toBe(0.95);
    expect(report.longTermMemories[0]?.createdAt).toBeDefined();
  });
});
