/**
 * Device Pairing MVP — CODE_AND_DEVICE_PAIRING_CONTRACT.
 * Types and pairLocal(); role from contract/invite, not from code text.
 * TODO: secure storage for deviceSecret (e.g. when backend exists).
 */

import type { StaffRole } from "../../../pages/AppStaff/context/StaffCoreTypes";

export interface PairingRequest {
  pairingPin: string;
  expiresAt: number;
  restaurantId: string;
  deviceType?: "tpv" | "kds";
  assignedRole?: StaffRole;
}

export interface PairingResult {
  deviceId: string;
  deviceSecret: string;
  restaurantId: string;
  deviceType: "tpv" | "kds";
  assignedRole?: StaffRole;
}

export interface DeviceIdentity {
  deviceId: string;
  deviceSecret: string;
  type: "tpv" | "kds";
  assignedRole?: StaffRole;
  restaurantId: string;
}

// --- Active pairing request (admin generates PIN; one active per origin for MVP) ---
const ACTIVE_PAIRING_KEY = "chefiapp_pairing_request_active";

export function getActivePairingRequest(): PairingRequest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_PAIRING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PairingRequest;
    if (!data?.pairingPin || !data?.expiresAt || !data?.restaurantId) return null;
    return data;
  } catch {
    return null;
  }
}

export function setActivePairingRequest(request: PairingRequest): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PAIRING_KEY, JSON.stringify(request));
}

export function clearActivePairingRequest(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_PAIRING_KEY);
}

// --- Paired device identity (on device; TODO: secure storage) ---
const PAIRED_DEVICE_KEY = "chefiapp_paired_device_identity";

export function getPairedDeviceIdentity(): DeviceIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAIRED_DEVICE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DeviceIdentity;
    if (!data?.deviceId || !data?.deviceSecret || !data?.restaurantId || !data?.type) return null;
    return data;
  } catch {
    return null;
  }
}

export function setPairedDeviceIdentity(identity: DeviceIdentity): void {
  if (typeof window === "undefined") return;
  // TODO: use secure storage when available (e.g. backend-backed or secure enclave)
  localStorage.setItem(PAIRED_DEVICE_KEY, JSON.stringify(identity));
}

export function clearPairedDeviceIdentity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PAIRED_DEVICE_KEY);
}

// --- Devices list (shared for admin UI and heartbeat; MVP localStorage) ---
const DEVICES_LIST_KEY = "chefiapp_devices_list";

export interface DeviceListEntry {
  id: string;
  type: "tpv" | "kds";
  name: string;
  assignedRole?: string;
  lastHeartbeat: string; // ISO
  deviceSecret?: string; // not stored in list when shared; device has it locally
}

function getDevicesListRaw(): DeviceListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEVICES_LIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DeviceListEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setDevicesListRaw(list: DeviceListEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICES_LIST_KEY, JSON.stringify(list));
}

export function getDevicesList(): DeviceListEntry[] {
  return getDevicesListRaw();
}

export function addDeviceToList(entry: Omit<DeviceListEntry, "lastHeartbeat">): void {
  const list = getDevicesListRaw();
  const now = new Date().toISOString();
  const existing = list.findIndex((d) => d.id === entry.id);
  const newEntry: DeviceListEntry = { ...entry, lastHeartbeat: now };
  if (existing >= 0) {
    list[existing] = newEntry;
  } else {
    list.push(newEntry);
  }
  setDevicesListRaw(list);
}

export function updateDeviceHeartbeat(deviceId: string): void {
  const list = getDevicesListRaw();
  const idx = list.findIndex((d) => d.id === deviceId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], lastHeartbeat: new Date().toISOString() };
    setDevicesListRaw(list);
  }
}

// --- pairLocal: validate PIN, return PairingResult, persist identity and list ---
export function pairLocal(pin: string): PairingResult | null {
  const request = getActivePairingRequest();
  if (!request) return null;
  if (request.pairingPin !== pin) return null;
  if (Date.now() > request.expiresAt) {
    clearActivePairingRequest();
    return null;
  }
  const deviceId = crypto.randomUUID();
  const deviceSecret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const deviceType = request.deviceType ?? "tpv";
  const identity: DeviceIdentity = {
    deviceId,
    deviceSecret,
    type: deviceType,
    restaurantId: request.restaurantId,
    assignedRole: request.assignedRole,
  };
  setPairedDeviceIdentity(identity);
  clearActivePairingRequest();
  addDeviceToList({
    id: deviceId,
    type: deviceType,
    name: `${deviceType.toUpperCase()}_${deviceId.slice(0, 8)}`,
    assignedRole: request.assignedRole,
  });
  return {
    deviceId,
    deviceSecret,
    restaurantId: request.restaurantId,
    deviceType,
    assignedRole: request.assignedRole,
  };
}

// --- Heartbeat mock: call from device to update lastHeartbeat in shared list ---
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatMock(deviceId: string, intervalMs = 30_000): void {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  updateDeviceHeartbeat(deviceId);
  heartbeatInterval = setInterval(() => updateDeviceHeartbeat(deviceId), intervalMs);
}

export function stopHeartbeatMock(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
