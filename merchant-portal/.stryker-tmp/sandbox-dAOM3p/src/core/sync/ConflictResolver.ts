// @ts-nocheck
// LEGACY / LAB — blocked in Docker mode
import { Logger } from "../logger";
import { supabase } from "../supabase";

export const ConflictResolver = {
  /**
   * Checks if local change should be applied based on LWW (Last-Write-Wins) strategy.
   *
   * @param table Table name (e.g., 'gm_orders')
   * @param id Record ID
   * @param localTimestamp Timestamp of the local change (ms)
   * @returns Promise<boolean> true if local change is newer or record doesn't exist
   */
  async shouldApplyUpdate(
    table: string,
    id: string,
    localTimestamp: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("updated_at")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        Logger.warn(
          `[ConflictResolver] Failed to check remote state for ${table}:${id}`,
          error
        );
        // Fail safe: Attempt to apply. DB constraints might stop it, or it will overwrite.
        // In LWW, we usually favor applying if we can't check.
        return true;
      }

      if (!data) {
        // Record doesn't exist remotely (maybe deleted?).
        // If distinct 'updated_at' column check, assume it's a new record or acceptable.
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
          `[ConflictResolver] Updates for ${table}:${id} are stale. Local: ${localTimestamp}, Remote: ${remoteTime}. Skipping.`
        );
      }

      return isNewer;
    } catch (e) {
      Logger.error("[ConflictResolver] Exception checking conflict", e);
      return true;
    }
  },
};
