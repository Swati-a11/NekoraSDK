#!/usr/bin/env node

import { initProject } from "../dist/init.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  const projectName = args[1];
  initProject({ projectName });
} else {
  console.log(`
🐾 Nekora AI CLI

Usage:
  npx nekora init [project-name]   Scaffold a new Nekora AI Agent project
`);
}
