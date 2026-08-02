import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../server.js";
import { SandboxService } from "../services/sandbox.service.js";
import { CodeExecutionProvider, CodeExecutionRequest, CodeExecutionResult } from "@nekora-ai/core";

describe("Nekora AI Express Server API Tests", () => {
  let app: any;

  beforeEach(() => {
    app = createApp();
  });

  describe("GET /api/health", () => {
    it("returns health status, version, and uptime", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "ok");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("uptime");
      expect(typeof res.body.uptime).toBe("number");
    });
  });

  describe("POST /api/code/execute", () => {
    it("executes valid JavaScript code in sandbox", async () => {
      const res = await request(app)
        .post("/api/code/execute")
        .send({
          language: "javascript",
          code: "console.log('Server test output');",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.stdout).toBe("Server test output");
      expect(res.body).toHaveProperty("executionTime");
    });

    it("returns 400 ValidationError for missing required fields", async () => {
      const res = await request(app)
        .post("/api/code/execute")
        .send({
          code: "console.log(1)",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");
    });

    it("handles SANDBOX_UNAVAILABLE error gracefully when mock provider returns error", async () => {
      const unavailableProvider: CodeExecutionProvider = {
        name: "mock_unavailable",
        execute: async (): Promise<CodeExecutionResult> => ({
          success: false,
          stdout: "",
          stderr: "Sandbox unavailable",
          exitCode: 1,
          executionTimeMs: 0,
          errorCode: "SANDBOX_UNAVAILABLE",
          error: "Sandbox environment unavailable",
        }),
      };

      const customSandboxService = new SandboxService(unavailableProvider);
      const customApp = createApp({ sandboxService: customSandboxService });

      const res = await request(customApp)
        .post("/api/code/execute")
        .send({
          language: "javascript",
          code: "console.log(123)",
        });

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty("code", "SANDBOX_UNAVAILABLE");
    });

    it("handles EXECUTION_TIMEOUT error gracefully when mock provider times out", async () => {
      const timeoutProvider: CodeExecutionProvider = {
        name: "mock_timeout",
        execute: async (): Promise<CodeExecutionResult> => ({
          success: false,
          stdout: "",
          stderr: "Execution timed out",
          exitCode: null,
          executionTimeMs: 5000,
          errorCode: "EXECUTION_TIMEOUT",
          error: "Code execution timed out",
        }),
      };

      const customSandboxService = new SandboxService(timeoutProvider);
      const customApp = createApp({ sandboxService: customSandboxService });

      const res = await request(customApp)
        .post("/api/code/execute")
        .send({
          language: "javascript",
          code: "while(true);",
        });

      expect(res.status).toBe(408);
      expect(res.body).toHaveProperty("code", "EXECUTION_TIMEOUT");
    });
  });

  describe("POST /api/chat", () => {
    it("processes agent chat in demo provider mode", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          message: "What is the capital of France?",
          provider: "demo",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("response");
      expect(res.body).toHaveProperty("runId");
      expect(res.body).toHaveProperty("toolsUsed");
      expect(res.body).toHaveProperty("traceId");
    });

    it("executes weather tool when asked about weather in demo mode", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          message: "What is the weather in Tokyo?",
          provider: "demo",
        });

      expect(res.status).toBe(200);
      expect(res.body.toolsUsed).toContain("weather_fetcher");
    });

    it("returns 400 ValidationError for empty message", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          message: "",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("GET /api/chat/stream", () => {
    it("streams agent events using SSE format", async () => {
      const res = await request(app)
        .get("/api/chat/stream?message=What is the weather in Tokyo?&provider=demo");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/event-stream");
      expect(res.text).toContain("event: agent_started");
      expect(res.text).toContain("event: run_completed");
    });
  });
});
