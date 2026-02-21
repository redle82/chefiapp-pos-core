/**
 * InsForge Client — Production BaaS for ChefIApp
 *
 * Replaces Docker Core (local PostgREST) for production deployment.
 * Provides: Database (PostgREST), Auth, Storage, Realtime, Functions, AI.
 *
 * The InsForge SDK exposes `insforge.database.from()` which follows the
 * same PostgREST query-builder pattern our codebase already uses via
 * `dockerCoreFetchClient`. This means migration is incremental:
 *   dockerCoreClient.from("table")  →  insforge.database.from("table")
 *
 * Usage:
 *   import { insforge } from "@/core/infra/insforgeClient";
 *   const { data, error } = await insforge.database.from("gm_orders").select("*");
 */

import { createClient } from "@insforge/sdk";
import { CONFIG } from "../../config";

/**
 * InsForge client singleton.
 * Configured via VITE_INSFORGE_URL + VITE_INSFORGE_ANON_KEY env vars.
 */
export const insforge = createClient({
  baseUrl: CONFIG.INSFORGE_URL,
  anonKey: CONFIG.INSFORGE_ANON_KEY,
});

/**
 * Health check — verifies InsForge backend is reachable.
 */
export async function checkInsforgeHealth(): Promise<boolean> {
  try {
    const { error } = await insforge.database
      .from("gm_restaurants")
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
