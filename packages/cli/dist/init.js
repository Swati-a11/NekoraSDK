import * as fs from "node:fs";
import * as path from "node:path";
export function initProject(options = {}) {
    const name = options.projectName || "my-nekora-agent";
    const targetDir = options.targetDir
        ? path.resolve(options.targetDir)
        : path.join(process.cwd(), name);
    console.log(`\n🐾 Initializing new Nekora AI Agent project: ${name}...`);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const srcDir = path.join(targetDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    // 1. package.json
    const pkgJson = {
        name,
        version: "1.0.0",
        type: "module",
        scripts: {
            dev: "tsx src/index.ts",
            build: "tsc",
        },
        dependencies: {
            "@nekora-ai/core": "^1.0.0",
            zod: "^3.23.8",
        },
        devDependencies: {
            "@types/node": "^24.0.0",
            tsx: "^4.19.0",
            typescript: "^5.9.0",
        },
    };
    fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify(pkgJson, null, 2));
    // 2. tsconfig.json
    const tsConfig = {
        compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            skipLibCheck: true,
        },
        include: ["src/**/*"],
    };
    fs.writeFileSync(path.join(targetDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));
    // 3. .env.example
    const envContent = `GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
`;
    fs.writeFileSync(path.join(targetDir, ".env.example"), envContent);
    // 4. src/config.ts
    const configCode = `export const agentConfig = {
  name: "My Assistant",
  instructions: "You are a helpful AI assistant with tool execution capabilities.",
  timeoutMs: 10000,
};
`;
    fs.writeFileSync(path.join(srcDir, "config.ts"), configCode);
    // 5. src/tools.ts
    const toolsCode = `import { tool } from "@nekora-ai/core";
import { z } from "zod";

export const weatherTool = tool({
  name: "get_weather",
  description: "Get current weather for a specified location",
  schema: z.object({
    location: z.string().describe("City or location name"),
  }),
  execute: async ({ location }) => {
    return { location, temperature: "22°C", condition: "Sunny" };
  },
});

export const defaultTools = [weatherTool];
`;
    fs.writeFileSync(path.join(srcDir, "tools.ts"), toolsCode);
    // 6. src/agent.ts
    const agentCode = `import { Agent } from "@nekora-ai/core";
import { agentConfig } from "./config.js";
import { defaultTools } from "./tools.js";

const agent = new Agent({
  name: agentConfig.name,
  instructions: agentConfig.instructions,
  tools: defaultTools,
});

export default agent;
`;
    fs.writeFileSync(path.join(srcDir, "agent.ts"), agentCode);
    // 7. src/index.ts
    const indexCode = `import agent from "./agent.js";

async function main() {
  console.log("🐾 Running Nekora AI Agent...");
  const result = await agent.run("What is the weather in Tokyo?");
  console.log("Response:", result.output);
}

main().catch(console.error);
`;
    fs.writeFileSync(path.join(srcDir, "index.ts"), indexCode);
    console.log(`\n✨ Project scaffolded at ${targetDir}`);
    console.log(`Files created:`);
    console.log(`  - src/agent.ts`);
    console.log(`  - src/tools.ts`);
    console.log(`  - src/config.ts`);
    console.log(`  - src/index.ts`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${name}`);
    console.log(`  pnpm install (or npm install)`);
    console.log(`  pnpm dev\n`);
}
//# sourceMappingURL=init.js.map