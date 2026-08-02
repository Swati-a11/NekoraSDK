import { NekoCognitiveMemory } from "../memory/cognitive/cognitive.memory.js";

async function runMemoryIntelligenceTest() {
  console.log("=========================================");
  console.log("🧠 FEATURE 1: NEKO COGNITIVE MEMORY SYSTEM MANUAL TEST");
  console.log("=========================================\n");

  const cognitiveMemory = new NekoCognitiveMemory();

  // 1. Test Working Memory
  console.log("👉 Step 1: Testing Working Memory State...");
  cognitiveMemory.working.setGoal("Plan 7-day Japan Trip", ["budget <= $2000", "Tokyo & Kyoto"]);
  cognitiveMemory.working.setCurrentStep("finding hotels in Tokyo");
  cognitiveMemory.working.setPlan(["Search hotels", "Book flights", "Create itinerary"]);

  const workingState = cognitiveMemory.working.getState();
  console.log("  ✅ Goal:", workingState.goal);
  console.log("  ✅ Constraints:", workingState.constraints);
  console.log("  ✅ Current Step:", workingState.currentStep);

  // 2. Test Long-Term Memory (LTM) & Conflict Resolution
  console.log("\n👉 Step 2: Testing Long-Term Memory (LTM) & Conflict Resolution...");

  // Initial preference: Python
  cognitiveMemory.remember(
    "coding_preference",
    "language",
    "python",
    "User prefers Python for data science and AI",
    { importance: 0.8, confidence: 0.9 }
  );

  const initialLTM = cognitiveMemory.ltm.findByKey("coding_preference", "language");
  console.log(`  Initial Preference -> Key: ${initialLTM?.key}, Value: "${initialLTM?.value}"`);

  // Conflict Resolution: User updates preference to TypeScript
  console.log("  ⚡ Conflict Resolution: Updating preference to 'typescript'...");
  cognitiveMemory.remember(
    "coding_preference",
    "language",
    "typescript",
    "User prefers TypeScript for full-stack SDK development",
    { importance: 0.95, confidence: 0.98 }
  );

  const updatedLTM = cognitiveMemory.ltm.findByKey("coding_preference", "language");
  console.log(`  Updated Preference -> Key: ${updatedLTM?.key}, Value: "${updatedLTM?.value}"`);
  console.log("  ✅ In-Place Conflict Resolution Verified: Total LTM Entries =", cognitiveMemory.ltm.getAll().length);

  // Store additional preferences
  cognitiveMemory.remember("preference", "theme", "dark", "User prefers dark mode interfaces", { importance: 0.9 });
  cognitiveMemory.remember("fact", "location", "Bengaluru", "User lives in Bengaluru, India", { importance: 0.7 });

  // 3. Test Memory Retrieval & Decay Scoring
  console.log("\n👉 Step 3: Testing Cognitive Context Retrieval Block...");
  const retrievedPrompt = cognitiveMemory.retrieveContextBlock("What programming language and theme do I like?");
  console.log("  🤖 Formatted System Context Prompt:");
  console.log(retrievedPrompt);

  // 4. Test Inspection API (agent.memory.inspect())
  console.log("\n👉 Step 4: Testing Memory Inspection API (agent.memory.inspect())...");
  const inspection = cognitiveMemory.inspect();
  console.log("  📊 Inspection Summary:");
  console.log(`     - Working Memory Goal: ${inspection.workingMemory.goal}`);
  console.log(`     - Total Long-Term Knowledge Entries: ${inspection.longTermMemories.length}`);
  inspection.longTermMemories.forEach((item, idx) => {
    console.log(`     [${idx + 1}] (${item.category}:${item.key}): "${item.content}" | Confidence=${item.confidence * 100}% | DecayedImportance=${item.decayedImportance}`);
  });

  // 5. Test Working Memory Clear
  console.log("\n👉 Step 5: Clearing Working Memory on Task Completion...");
  cognitiveMemory.working.clear();
  console.log("  ✅ Working Memory Cleared. Goal = ", cognitiveMemory.working.getState().goal || "undefined");
}

runMemoryIntelligenceTest().catch(console.error);
