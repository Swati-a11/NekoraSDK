import { Message } from "../../providers/types.js";

export type MemoryCategory = "preference" | "fact" | "habit" | "coding_preference" | "communication_style";

export interface LTMEntry {
  id: string;
  category: MemoryCategory;
  key: string;
  value: unknown;
  content: string;
  importance: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  sourceSessionId?: string;
  sourceContext?: string;
}

export interface WorkingMemoryState {
  goal?: string;
  constraints: string[];
  currentStep?: string;
  activePlan?: string[];
  pendingActions: string[];
  temporaryDecisions: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface MemoryInspectionResult {
  shortTermMessageCount: number;
  workingMemory: WorkingMemoryState;
  longTermMemories: Array<{
    id: string;
    category: MemoryCategory;
    key: string;
    content: string;
    importance: number;
    confidence: number;
    decayedImportance: number;
    createdAt: string;
    lastAccessed: string;
    accessCount: number;
    source: string;
  }>;
}

export interface CognitiveMemoryOptions {
  maxShortTermMessages?: number;
  decayRateLambda?: number; // Decay rate for importance over time
  importanceThreshold?: number; // Minimum importance score to inject into context
}
