/**
 * ConflictResolver — Docker Core compatible
 *
 * Strategy: LWW (Last-Write-Wins) + Optimistic Version Check
 *   1. Fetches remote updated_at + version from Core via PostgREST
 *   2. LWW: if local timestamp >= remote updated_at → apply
 *   3. Version: if version mismatch on write → conflict detected
 *
 * Uses getTableClient() for Docker Core compatibility (replaces legacy supabase import).
 */
import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";

export const ConflictResolver = {
  /**
   * Checks if local change should be applied based on LWW (Last-Write-Wins) strategy.
   * Uses getTableClient() for Docker Core PostgREST compatibility.
   *
   * @param table Table name (e.g., 'gm_orders')
   * @param id Record ID
   * @param localTimestamp Timestamp of the local change (ms)
   * @returns Promise<boolean> true if local change is newer or record doesn't exist
   */
  async shouldApplyUpdate(
    table: string,
    id: string,
    localTimestamp: number,
  ): Promise<boolean> {
    try {
      const client = await getTableClient();
      const { data, error } = await client
        .from(table)
        .select("updated_at,version")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        Logger.warn(
          `[ConflictResolver] Failed to check remote state for ${table}:${id}`,
          error,
        );
        // Fail safe: Attempt to apply. DB constraints might stop it, or it will overwrite.
        // In LWW, we usually favor applying if we can't check.
        return true;
      }

      if (!data) {
        // Record doesn't exist remotely (maybe deleted or not yet synced).
        return true;
      }

      const remoteTime = new Date(data.updated_at).getTime();

      // LWW Logic:
      // If Local > Remote -> Apply
      // If Local < Remote -> Discard (Stale)
      // If Local == Remote -> Apply (Idempotent or irrelevant)

      const isNewer = localTimestamp >= remoteTime;

      if (!isNewer) {
        Logger.info(
          `[ConflictResolver] Update for ${table}:${id} is stale. Local: ${localTimestamp}, Remote: ${remoteTime}. Skipping.`,
        );
      }

      return isNewer;
    } catch (e) {
      Logger.error("[ConflictResolver] Exception checking conflict", e);
      return true;
    }
  },

  /**
   * Get current version of a record for optimistic locking.
   * Returns null if record doesn't exist.
   */
  async getVersion(table: string, id: string): Promise<number | null> {
    try {
      const client = await getTableClient();
      const { data, error } = await client
        .from(table)
        .select("version")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;
      return data.version ?? null;
    } catch {
      return null;
    }
  },
};
