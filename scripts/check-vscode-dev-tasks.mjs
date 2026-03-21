#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tasksPath = path.join(root, ".vscode/tasks.json");

if (!fs.existsSync(tasksPath)) {
  console.log("[vscode-dev-tasks] PASSED (no .vscode/tasks.json in repository)");
  process.exit(0);
}

const content = fs.readFileSync(tasksPath, "utf8");
const hasTasksVersion = content.includes('"version"') && content.includes('"tasks"');
if (!hasTasksVersion) {
  console.error("[vscode-dev-tasks] FAILED");
  console.error("[vscode-dev-tasks] INVALID_TASKS_SCHEMA: expected version/tasks fields");
  process.exit(1);
}

console.log("[vscode-dev-tasks] PASSED");
