import { Agent } from "../agent/agent.js";
import { ProviderRegistry } from "../providers/registry.js";
import { FallbackProvider } from "../providers/fallback.provider.js";
import { ModelProvider, ModelResponse } from "../providers/types.js";

// Mock Primary Provider that fails to trigger fallback
class FailingPrimaryProvider implements ModelProvider {
  readonly id = "primary_failing";
  readonly modelName = "failing-model";

  async generate(): Promise<ModelResponse> {
    throw new Error("Primary provider HTTP 429 RateLimitExceeded");
  }

  async *generateStream(): AsyncIterable<any> {
    throw new Error("Primary stream failed");
  }
}

// Mock Backup Provider
class BackupSuccessProvider implements ModelProvider {
  readonly id = "backup_success";
  readonly modelName = "backup-model";

  async generate(): Promise<ModelResponse> {
    return {
      text: "Response delivered successfully from Backup Fallback Provider!",
      finishReason: "stop",
    };
  }

  async *generateStream(): AsyncIterable<any> {
    yield { deltaText: "Backup stream" };
  }
}

async function runProviderTest() {
  console.log("=========================================");
  console.log("🔌 TASK 5 & 6 & 7: PROVIDER REGISTRY & FALLBACK MANUAL TEST");
  console.log("=========================================\n");

  // 1. Test ProviderRegistry
  console.log("👉 Test 1: Testing ProviderRegistry...");
  const registry = new ProviderRegistry();
  const backupProvider = new BackupSuccessProvider();
  registry.register("backup", backupProvider);

  console.log("  Registered providers in registry:", registry.list());
  console.log("  Registry has 'backup':", registry.has("backup"));

  // 2. Test Dynamic Provider Switching via agent.useModel()
  console.log("\n👉 Test 2: Testing agent.useModel() dynamic switching...");
  const agent = new Agent({
    name: "Provider Test Agent",
    instructions: "Helpful agent",
    model: backupProvider,
  });

  console.log("  Initial model:", agent.getModel().modelName);

  const newMockModel: ModelProvider = {
    id: "switched_provider",
    modelName: "switched-model-v2",
    async generate() {
      return { text: "Switched provider output", finishReason: "stop" };
    },
    async *generateStream() {
      yield { deltaText: "Switched stream" };
    },
  };

  agent.useModel(newMockModel);
  console.log("  Updated model after useModel():", agent.getModel().modelName);
  const switchedRes = await agent.run("Test switched model");
  console.log("  Agent Output:", switchedRes.output);

  // 3. Test Production Fallback Engine
  console.log("\n👉 Test 3: Testing FallbackProvider & provider.fallback event...");
  let fallbackEventEmitted = false;

  const fallback = new FallbackProvider([new FailingPrimaryProvider(), backupProvider], {
    onFallback: (primary, fallback, reason) => {
      fallbackEventEmitted = true;
      console.log(`  ⚡ [FALLBACK EVENT]: Switch triggered from '${primary}' to '${fallback}'. Reason: ${reason}`);
    },
  });

  const fallbackAgent = new Agent({
    name: "Fallback Agent",
    instructions: "Resilient agent",
    model: fallback,
  });

  const fallbackResult = await fallbackAgent.run("Test query");
  console.log("  🤖 Final Agent Output:", fallbackResult.output);
  console.log("  ✅ [VERIFIED]: Fallback event triggered =", fallbackEventEmitted);
}

runProviderTest().catch(console.error);
