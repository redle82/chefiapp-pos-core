/**
 * OrchestratorLogger — Persists every OperationalOrchestrator decision
 *
 * Integrates with Docker Core via RPC (log_orchestrator_decision).
 * Fire-and-forget: logging failures never block operational decisions.
 *
 * Usage:
 *   OrchestratorLogger.logDecision(restaurantId, eventType, decision, state);
 *   const logs = await OrchestratorLogger.getLogs(restaurantId, { action: 'suppress' });
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { invokeRpc, type RpcResult } from "../infra/coreRpc";
import { Logger } from "../logger";
import type {
  OrchestratorDecision,
  OrchestratorEventType,
  OrchestratorState,
} from "./OperationalOrchestrator";

// ─── Types ──────────────────────────────────────────────

export interface OrchestratorLogEntry {
  id: string;
  restaurant_id: string;
  event_type: string;
  action: string;
  reason: string;
  state_snapshot: OrchestratorState;
  decided_at: string;
  metadata: Record<string, unknown>;
}

export interface OrchestratorLogQuery {
  from?: string; // ISO 8601
  to?: string; // ISO 8601
  action?: "generate" | "suppress" | "allow";
  limit?: number;
  offset?: number;
}

// ─── Restaurant Settings ────────────────────────────────

export interface RestaurantSettings {
  restaurant_id: string;
  orchestrator_enabled: boolean;
  idle_threshold_minutes: number;
  max_kds_load: number;
  updated_at: string;
}

// ─── Service ────────────────────────────────────────────

export class OrchestratorLogger {
  /**
   * Log a decision from OperationalOrchestrator.
   * Fire-and-forget: never throws, never blocks caller.
   */
  static async logDecision(
    restaurantId: string,
    eventType: OrchestratorEventType,
    decision: OrchestratorDecision,
    state: OrchestratorState,
    metadata?: Record<string, unknown>,
  ): Promise<{ logged: boolean; id?: string }> {
    if (getBackendType() !== BackendType.docker) {
      return { logged: false };
    }

    try {
      const result: RpcResult<{ id: string; logged: boolean }> =
        await invokeRpc("log_orchestrator_decision", {
          p_restaurant_id: restaurantId,
          p_event_type: eventType,
          p_action: decision.action,
          p_reason: decision.reason,
          p_state_snapshot: state,
          p_metadata: metadata ?? {},
        });

      if (result.error || !result.data) {
        Logger.warn("[OrchestratorLogger] RPC failed:", {
          error: result.error?.message,
        });
        return { logged: false };
      }

      return { logged: true, id: result.data.id };
    } catch (err) {
      Logger.warn("[OrchestratorLogger] Exception (non-blocking):", {
        error: String(err),
      });
      return { logged: false };
    }
  }

  /**
   * Query orchestrator decision logs.
   */
  static async getLogs(
    restaurantId: string,
    query?: OrchestratorLogQuery,
  ): Promise<OrchestratorLogEntry[]> {
    if (getBackendType() !== BackendType.docker) {
      return [];
    }

    try {
      const result = await invokeRpc<OrchestratorLogEntry[]>(
        "get_orchestrator_logs",
        {
          p_restaurant_id: restaurantId,
          p_from: query?.from ?? null,
          p_to: query?.to ?? null,
          p_action: query?.action ?? null,
          p_limit: query?.limit ?? 100,
          p_offset: query?.offset ?? 0,
        },
      );

      if (result.error || !result.data) {
        Logger.warn("[OrchestratorLogger] getLogs RPC failed:", {
          error: result.error?.message,
        });
        return [];
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (err) {
      Logger.warn("[OrchestratorLogger] getLogs exception:", {
        error: String(err),
      });
      return [];
    }
  }

  /**
   * Get restaurant operational settings.
   * Returns defaults if no row exists in DB.
   */
  static async getSettings(restaurantId: string): Promise<RestaurantSettings> {
    const defaults: RestaurantSettings = {
      restaurant_id: restaurantId,
      orchestrator_enabled: true,
      idle_threshold_minutes: 15,
      max_kds_load: 20,
      updated_at: new Date().toISOString(),
    };

    if (getBackendType() !== BackendType.docker) {
      return defaults;
    }

    try {
      const result = await invokeRpc<RestaurantSettings>(
        "get_restaurant_settings",
        { p_restaurant_id: restaurantId },
      );

      if (result.error || !result.data) {
        return defaults;
      }

      return result.data as RestaurantSettings;
    } catch {
      return defaults;
    }
  }

  /**
   * Update restaurant operational settings.
   * Upserts: creates row if missing, updates only provided fields.
   */
  static async updateSettings(
    restaurantId: string,
    settings: Partial<
      Pick<
        RestaurantSettings,
        "orchestrator_enabled" | "idle_threshold_minutes" | "max_kds_load"
      >
    >,
  ): Promise<RestaurantSettings | null> {
    if (getBackendType() !== BackendType.docker) {
      return null;
    }

    try {
      const result = await invokeRpc<RestaurantSettings>(
        "upsert_restaurant_settings",
        {
          p_restaurant_id: restaurantId,
          p_orchestrator_enabled: settings.orchestrator_enabled ?? null,
          p_idle_threshold_minutes: settings.idle_threshold_minutes ?? null,
          p_max_kds_load: settings.max_kds_load ?? null,
        },
      );

      if (result.error || !result.data) {
        Logger.error("[OrchestratorLogger] updateSettings failed:", {
          error: result.error?.message,
        });
        return null;
      }

      return result.data as RestaurantSettings;
    } catch (err) {
      Logger.error("[OrchestratorLogger] updateSettings exception:", {
        error: String(err),
      });
      return null;
    }
  }
}
