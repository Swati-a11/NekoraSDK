import { Router, Request, Response, NextFunction } from "express";
import { AgentService } from "../services/agent.service.js";
import { ChatRequest, ChatResponse } from "../types/index.js";

export function createAgentRouter(agentService: AgentService): Router {
  const router = Router();

  // POST /api/chat
  router.post(
    "/chat",
    async (
      req: Request<{}, {}, ChatRequest>,
      res: Response<ChatResponse>,
      next: NextFunction
    ) => {
      try {
        const { message, sessionId, provider } = req.body;
        const result = await agentService.runAgent(message, sessionId, provider);

        res.locals.provider = provider || "groq";
        res.locals.toolsUsed = result.toolsUsed;
        res.locals.runId = result.runId;

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET or POST /api/chat/stream (Server-Sent Events)
  const handleStream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message =
        req.method === "POST" ? req.body.message : (req.query.message as string);
      const sessionId =
        req.method === "POST"
          ? req.body.sessionId
          : (req.query.sessionId as string | undefined);
      const provider =
        req.method === "POST"
          ? req.body.provider
          : (req.query.provider as string | undefined);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      res.locals.provider = provider || "groq";
      const toolsUsedSet = new Set<string>();

      await agentService.streamAgent(message, sessionId, provider, (streamEvent) => {
        if (streamEvent.event === "tool_started" && streamEvent.data?.toolName) {
          toolsUsedSet.add(streamEvent.data.toolName);
        }
        res.write(`event: ${streamEvent.event}\ndata: ${JSON.stringify(streamEvent.data)}\n\n`);
      });

      res.locals.toolsUsed = Array.from(toolsUsedSet);
      res.end();
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            code: "STREAM_ERROR",
            message: (error as any)?.message || String(error),
          })}\n\n`
        );
        res.end();
      }
    }
  };

  router.get("/chat/stream", handleStream);
  router.post("/chat/stream", handleStream);

  return router;
}
