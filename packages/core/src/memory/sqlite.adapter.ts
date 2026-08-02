import { MemoryAdapter, MemoryRecord } from "./types.js";
import { Message } from "../providers/types.js";
import * as fs from "node:fs";
import * as path from "node:path";

export class SQLiteMemoryAdapter implements MemoryAdapter {
  private filePath: string;
  private db: Map<string, MemoryRecord[]> = new Map();

  constructor(filename = ":memory:") {
    this.filePath = filename;
    if (this.filePath !== ":memory:" && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.db.set(k, v as MemoryRecord[]);
        }
      } catch {
        // ignore init read errors
      }
    }
  }

  private persist() {
    if (this.filePath === ":memory:") return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj = Object.fromEntries(this.db.entries());
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2));
    } catch {
      // ignore write errors
    }
  }

  async saveMessage(sessionId: string, message: Message): Promise<MemoryRecord> {
    const record: MemoryRecord = {
      id: `sql-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      message,
      timestamp: Date.now(),
    };

    const records = this.db.get(sessionId) || [];
    records.push(record);
    this.db.set(sessionId, records);
    this.persist();
    return record;
  }

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    const records = this.db.get(sessionId) || [];
    const msgs = records.map((r) => r.message);
    return limit ? msgs.slice(-limit) : msgs;
  }

  async clearHistory(sessionId: string): Promise<void> {
    this.db.delete(sessionId);
    this.persist();
  }
}
