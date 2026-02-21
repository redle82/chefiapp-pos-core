import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sanity check for Core environment variables.
 * Ensures VITE_CORE_URL, VITE_CORE_ANON_KEY, VITE_API_BASE, and VITE_MODE are set.
 */
export function checkEnv() {
  const projectRoot = path.resolve(__dirname, "..");
  const env = loadEnv("development", projectRoot, "VITE_");

  const required = [
    "VITE_CORE_URL",
    "VITE_CORE_ANON_KEY",
    "VITE_API_BASE",
    "VITE_MODE",
  ];

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.error(
      `[CONFIG] Missing environment variables: ${missing.join(", ")}`,
    );
    console.error("[CONFIG] Create or update .env.local with:");
    console.error(
      "  VITE_CORE_URL=http://localhost:3001",
      "\n  VITE_CORE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long",
      "\n  VITE_API_BASE=http://localhost:4320",
      "\n  VITE_MODE=local",
    );
    process.exit(1);
  }

  console.log("[CONFIG] Environment check passed", {
    CORE_URL: env.VITE_CORE_URL,
    API_BASE: env.VITE_API_BASE,
    MODE: env.VITE_MODE,
  });
}

if (import.meta.url.endsWith(process.argv[1])) {
  checkEnv();
}
