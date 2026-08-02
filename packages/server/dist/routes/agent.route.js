import { Router } from "express";
export function createAgentRouter(agentService) {
    const router = Router();
    // POST /api/chat
    router.post("/chat", async (req, res, next) => {
        try {
            const { message, sessionId, provider } = req.body;
            const result = await agentService.runAgent(message, sessionId, provider);
            res.locals.provider = provider || "groq";
            res.locals.toolsUsed = result.toolsUsed;
            res.locals.runId = result.runId;
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // GET or POST /api/chat/stream (Server-Sent Events)
    const handleStream = async (req, res, next) => {
        try {
            const message = req.method === "POST" ? req.body.message : req.query.message;
            const sessionId = req.method === "POST"
                ? req.body.sessionId
                : req.query.sessionId;
            const provider = req.method === "POST"
                ? req.body.provider
                : req.query.provider;
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders();
            res.locals.provider = provider || "groq";
            const toolsUsedSet = new Set();
            await agentService.streamAgent(message, sessionId, provider, (streamEvent) => {
                if (streamEvent.event === "tool_started" && streamEvent.data?.toolName) {
                    toolsUsedSet.add(streamEvent.data.toolName);
                }
                res.write(`event: ${streamEvent.event}\ndata: ${JSON.stringify(streamEvent.data)}\n\n`);
            });
            res.locals.toolsUsed = Array.from(toolsUsedSet);
            res.end();
        }
        catch (error) {
            if (!res.headersSent) {
                next(error);
            }
            else {
                res.write(`event: error\ndata: ${JSON.stringify({
                    code: "STREAM_ERROR",
                    message: error?.message || String(error),
                })}\n\n`);
                res.end();
            }
        }
    };
    router.get("/chat/stream", handleStream);
    router.post("/chat/stream", handleStream);
    return router;
}
//# sourceMappingURL=agent.route.js.map