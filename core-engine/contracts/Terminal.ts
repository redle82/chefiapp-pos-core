/**
 * TERMINAL — Contrato Centralizado
 *
 * ÚNICA fonte de verdade para dispositivos (terminais) da plataforma.
 * Absorvido do merchant-portal para atuar como Single Source of Truth (SSOT).
 */

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
