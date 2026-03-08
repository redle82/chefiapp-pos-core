/**
 * DEVICE_CONTRACT — Tipos partilhados para dispositivos operacionais.
 *
 * Fonte de verdade:
 * - docs/contracts/DEVICE_CONTRACT.md
 * - docker-core/schema/migrations/20260303_device_install_tokens.sql
 * - docker-core/schema/migrations/20260203_gm_terminals.sql
 */

export type DeviceType =
  | "TPV"
  | "KDS"
  | "APPSTAFF"
  | "WAITER"
  | "WEB"
  | "BACKOFFICE"
  | "ADMIN";

export type DeviceRuntime = "electron" | "mobile" | "web";

export type DeviceStatus = "active" | "inactive" | "revoked";

/**
 * Estado lógico de provisioning. Hoje é derivado de gm_terminals + tokens +
 * heartbeats; pode ser materializado em coluna no futuro.
 */
export type ProvisioningStatus =
  | "UNPAIRED"
  | "PAIRING"
  | "PAIRED"
  | "ACTIVE"
  | "REVOKED";

export interface DeviceIdentity {
  id: string;
  restaurantId: string;
  type: DeviceType;
  name: string;
}

export interface DeviceTelemetry {
  appVersion?: string | null;
  os?:
    | "macos"
    | "windows"
    | "ios"
    | "android"
    | "linux"
    | "web"
    | null;
  runtime?: DeviceRuntime | null;
  userAgent?: string | null;
  screen?: string | null;
  [key: string]: unknown;
}

export interface DeviceRecord extends DeviceIdentity {
  registeredAt: string;
  lastHeartbeatAt: string | null;
  lastSeenAt: string | null;
  status: DeviceStatus;
  telemetry: DeviceTelemetry;
  provisioningStatus: ProvisioningStatus;
}

export interface DeviceInstallToken {
  id: string;
  restaurantId: string;
  token: string;
  deviceType: DeviceType;
  deviceName: string | null;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  terminalId: string | null;
}

/**
 * Função helper para mapear o row cru de gm_terminals (via PostgREST) para
 * DeviceRecord tipado e com provisioningStatus derivado.
 */
export function mapTerminalRowToDevice(record: {
  id: string;
  restaurant_id: string;
  type: DeviceType;
  name: string;
  registered_at: string;
  last_heartbeat_at: string | null;
  last_seen_at: string | null;
  status: DeviceStatus;
  metadata: Record<string, unknown>;
}): DeviceRecord {
  const now = Date.now();
  const lastHeartbeatAt = record.last_heartbeat_at;
  const hasRecentHeartbeat =
    !!lastHeartbeatAt &&
    now - new Date(lastHeartbeatAt).getTime() <= 120_000; // 2min janela padrão

  let provisioningStatus: ProvisioningStatus;
  if (record.status === "revoked") {
    provisioningStatus = "REVOKED";
  } else if (hasRecentHeartbeat) {
    provisioningStatus = "ACTIVE";
  } else if (record.registered_at) {
    provisioningStatus = "PAIRED";
  } else {
    provisioningStatus = "UNPAIRED";
  }

  const metadata = record.metadata ?? {};

  const telemetry: DeviceTelemetry = {
    appVersion:
      (metadata.app_version as string | undefined | null) ??
      (metadata.appVersion as string | undefined | null) ??
      null,
    os: (metadata.os as DeviceTelemetry["os"]) ?? null,
    runtime: (metadata.runtime as DeviceRuntime | undefined | null) ?? null,
    userAgent:
      (metadata.userAgent as string | undefined | null) ??
      (metadata.user_agent as string | undefined | null) ??
      null,
    screen: (metadata.screen as string | undefined | null) ?? null,
  };

  return {
    id: record.id,
    restaurantId: record.restaurant_id,
    type: record.type,
    name: record.name,
    registeredAt: record.registered_at,
    lastHeartbeatAt: record.last_heartbeat_at,
    lastSeenAt: record.last_seen_at,
    status: record.status,
    telemetry: {
      ...metadata,
      ...telemetry,
    },
    provisioningStatus,
  };
}

