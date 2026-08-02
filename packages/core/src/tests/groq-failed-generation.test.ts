import { describe, it, expect } from "vitest";
import { GroqProvider } from "../providers/groq.provider.js";

describe("GroqProvider Failed Generation Recovery Tests", () => {
  it("Recovers tool calls from failed_generation 400 error payloads", async () => {
    const provider = new GroqProvider({ apiKey: "gsk_dummy_key_for_test" });

    // Mock fetch to simulate Groq 400 failed_generation error
    const rawErrorPayload = {
      error: {
        message: 'Failed to call a function. failed_generation: <function=code_executor>{"code":"console.log(\\"Hello Nekora\\")","language":"javascript"}</function>',
        type: "invalid_request_error",
      },
    };

    global.fetch = async () =>
      ({
        ok: false,
        status: 400,
        json: async () => rawErrorPayload,
      } as any);

    const response = await provider.generate([{ role: "user", content: "Run this code" }]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls?.length).toBe(1);
    expect(response.toolCalls?.[0]?.name).toBe("code_executor");
    expect(response.toolCalls?.[0]?.arguments).toEqual({
      code: 'console.log("Hello Nekora")',
      language: "javascript",
    });
  });
});
