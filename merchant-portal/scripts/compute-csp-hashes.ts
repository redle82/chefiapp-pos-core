#!/usr/bin/env npx tsx
/**
 * Compute SHA-256 hashes of inline <script> tags in the built index.html.
 * These hashes are used in Content-Security-Policy script-src directives
 * to allow specific inline scripts without 'unsafe-inline'.
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/compute-csp-hashes.ts
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(htmlPath)) {
  console.error("dist/index.html not found. Run `vite build` first.");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf-8");
const scriptRegex = /<script>([^]*?)<\/script>/g;

let match: RegExpExecArray | null;
let i = 0;
const hashes: string[] = [];

while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  const content = match[1];
  const hash = crypto.createHash("sha256").update(content).digest("base64");
  const cspHash = `'sha256-${hash}'`;
  hashes.push(cspHash);
  console.log(`Script ${i}: ${cspHash}`);
  // Print first 60 chars for identification
  const preview = content.trim().slice(0, 60).replace(/\n/g, " ");
  console.log(`  Preview: ${preview}...`);
  console.log();
}

if (hashes.length === 0) {
  console.log("No inline <script> tags found. CSP script-src 'self' is sufficient.");
} else {
  console.log("CSP script-src directive:");
  console.log(`  script-src 'self' ${hashes.join(" ")}`);
}
