import { Message } from "../../../providers/types.js";

export class ShortTermMemoryManager {
  private sessions: Map<string, Message[]> = new Map();
  private maxMessages: number;

  constructor(maxMessages: number = 20) {
    this.maxMessages = maxMessages;
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    const history = this.sessions.get(sessionId) || [];
    history.push(message);

    // Apply context window sliding & compression threshold
    if (history.length > this.maxMessages) {
      const systemMsgs = history.filter((m) => m.role === "system");
      const overflowCount = history.length - this.maxMessages;
      const retainedNonSystem = history.filter((m) => m.role !== "system").slice(overflowCount);

      // Create compressed context summary marker
      const summaryMsg: Message = {
        role: "system",
        content: `[ShortTermMemory Compression]: ${overflowCount} older message(s) summarized and archived.`,
      };

      this.sessions.set(sessionId, [...systemMsgs, summaryMsg, ...retainedNonSystem]);
      return;
    }

    this.sessions.set(sessionId, history);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.sessions.get(sessionId) || [];
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
