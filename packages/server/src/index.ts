import { createApp } from "./server.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`🚀 Nekora AI Server running on http://localhost:${PORT}`);
  console.log(`   Health check: GET http://localhost:${PORT}/api/health`);
  console.log(`   Code execution: POST http://localhost:${PORT}/api/code/execute`);
  console.log(`   Agent chat: POST http://localhost:${PORT}/api/chat`);
  console.log(`   Agent streaming: GET http://localhost:${PORT}/api/chat/stream`);
});

process.on("SIGTERM", () => {
  console.log("Shutting down Nekora AI Server...");
  server.close(() => {
    process.exit(0);
  });
});

export { createApp };
export * from "./types/index.js";
export * from "./services/index.js";
export * from "./middleware/error.js";
