import { createClient } from "@insforge/sdk";

const baseUrl =
  import.meta.env.VITE_INSFORGE_BASE_URL ||
  "https://vv5bwyz6.us-east.insforge.app";
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || "";

if (!baseUrl || !anonKey) {
  console.warn("InsForge credentials not configured. Check .env file.");
}

export const insforge = createClient({
  baseUrl,
  anonKey,
});
