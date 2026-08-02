import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  // Load environment variables from workspace root and packages/core
  const rootEnv = loadEnv(mode, path.resolve(__dirname, "../../"), "");
  const coreEnv = loadEnv(mode, path.resolve(__dirname, "../core"), "");

  const geminiKey = process.env.GEMINI_API_KEY || rootEnv.GEMINI_API_KEY || coreEnv.GEMINI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || rootEnv.OPENAI_API_KEY || coreEnv.OPENAI_API_KEY || "";
  const anthropicKey = process.env.ANTHROPIC_API_KEY || rootEnv.ANTHROPIC_API_KEY || coreEnv.ANTHROPIC_API_KEY || "";
  const groqKey = process.env.GROQ_API_KEY || rootEnv.GROQ_API_KEY || coreEnv.GROQ_API_KEY || "";

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiKey),
      "process.env.OPENAI_API_KEY": JSON.stringify(openaiKey),
      "process.env.ANTHROPIC_API_KEY": JSON.stringify(anthropicKey),
      "process.env.GROQ_API_KEY": JSON.stringify(groqKey),
    },
  };
});
