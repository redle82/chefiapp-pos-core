/**
 * devicesApi — API layer for device provisioning (PostgREST RPCs + table queries).
 *
 * Uses gm_terminals (list / heartbeat) and gm_device_install_tokens (provisioning).
 * All calls go through Docker Core PostgREST.
 */

import { coreClient } from "../../../../core/infra/coreClient";
import { Logger } from "../../../../core/logger";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TerminalType =
  | "TPV"
  | "KDS"
  | "APPSTAFF"
  | "WAITER"
  | "WEB"
  | "BACKOFFICE"
  | "ADMIN";
export type TerminalStatus = "active" | "inactive" | "revoked";

export interface Terminal {
  id: string;
  restaurant_id: string;
  type: TerminalType;
  name: string;
  registered_at: string;
  last_heartbeat_at: string | null;
  last_seen_at: string | null;
  status: TerminalStatus;
  metadata: Record<string, unknown>;
}

export interface InstallToken {
  id: string;
  restaurant_id: string;
  token: string;
  device_type: TerminalType;
  device_name: string | null;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  terminal_id: string | null;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/** Fetch all terminals for a restaurant. */
export async function fetchTerminals(
  restaurantId: string,
): Promise<Terminal[]> {
  const { data, error } = await coreClient
    .from("gm_terminals")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("registered_at", { ascending: false });

  if (error) throw new Error(`fetchTerminals: ${error.message}`);
  return (data ?? []) as Terminal[];
}

/** Fetch active (not yet consumed, not expired) install tokens. */
export async function fetchPendingTokens(
  restaurantId: string,
): Promise<InstallToken[]> {
  const { data, error } = await coreClient
    .from("gm_device_install_tokens")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .is("consumed_at", null)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchPendingTokens: ${error.message}`);
  return (data ?? []) as InstallToken[];
}

/* ------------------------------------------------------------------ */
/*  RPCs                                                               */
/* ------------------------------------------------------------------ */

/** Create a new install token (returns the token row with the secret). */
export async function createInstallToken(
  restaurantId: string,
  deviceType: TerminalType = "APPSTAFF",
  deviceName?: string,
  ttlMinutes = 15, // 15 minutes: enough time to scan QR and complete installation
): Promise<InstallToken> {
  const { data, error } = await coreClient.rpc("create_device_install_token", {
    p_restaurant_id: restaurantId,
    p_device_type: deviceType,
    p_device_name: deviceName ?? null,
    p_ttl_minutes: ttlMinutes,
  });

  if (error) throw new Error(`createInstallToken: ${error.message}`);
  // RPC returns a set — PostgREST wraps it in an array
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("createInstallToken: empty result");
  return row as InstallToken;
}

/** Consume a token from a device side. */
export async function consumeInstallToken(
  token: string,
  meta: Record<string, unknown> = {},
): Promise<Terminal> {
  Logger.debug("[devicesApi] Consuming token:", {
    token: token.substring(0, 12) + "...",
    meta,
  });

  const { data, error } = await coreClient.rpc("consume_device_install_token", {
    p_token: token,
    p_device_meta: meta,
  });

  Logger.debug("[devicesApi] RPC Response:", { data, error });

  if (error) {
    Logger.error("[devicesApi] RPC Error Details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`consumeInstallToken: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    Logger.error("[devicesApi] Empty result from RPC");
    throw new Error("consumeInstallToken: empty result");
  }

  Logger.debug("[devicesApi] Terminal created:", {
    id: row.id,
    restaurant_id: row.restaurant_id,
    type: row.type,
  });

  return row as Terminal;
}

/** Send a heartbeat from a device. */
export async function sendHeartbeat(
  terminalId: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await coreClient.rpc("device_heartbeat", {
    p_terminal_id: terminalId,
    p_meta: meta,
  });
  if (error) throw new Error(`sendHeartbeat: ${error.message}`);
}

/** Revoke a terminal. */
export async function revokeTerminal(terminalId: string): Promise<void> {
  const { error } = await coreClient.rpc("revoke_terminal", {
    p_terminal_id: terminalId,
  });
  if (error) throw new Error(`revokeTerminal: ${error.message}`);
}

/* ------------------------------------------------------------------ */
/*  Desktop Pairing Codes                                              */
/* ------------------------------------------------------------------ */

/** Create a short pairing code for desktop device provisioning (XXXX-XX). */
export async function createDevicePairingCode(
  restaurantId: string,
  deviceType: TerminalType = "TPV",
  deviceName?: string,
  ttlMinutes = 5,
): Promise<InstallToken> {
  const { data, error } = await coreClient.rpc("create_device_pairing_code", {
    p_restaurant_id: restaurantId,
    p_device_type: deviceType,
    p_device_name: deviceName ?? null,
    p_ttl_minutes: ttlMinutes,
  });

  if (error) throw new Error(`createDevicePairingCode: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("createDevicePairingCode: empty result");
  return row as InstallToken;
}

/** Consume a pairing code from the desktop app side. */
export async function consumeDevicePairingCode(
  code: string,
  meta: Record<string, unknown> = {},
): Promise<Terminal> {
  const { data, error } = await coreClient.rpc("consume_device_pairing_code", {
    p_code: code,
    p_device_meta: meta,
  });

  if (error) throw new Error(`consumeDevicePairingCode: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("consumeDevicePairingCode: empty result");
  return row as Terminal;
}
