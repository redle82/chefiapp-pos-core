/**
 * Identidade do dispositivo instalado (TPV / KDS).
 * Um restaurante não "loga" — é instalado. Depois disso, o dispositivo trabalha.
 */

const STORAGE_KEY = "chefiapp_installed_device";

export type InstalledDeviceModule = "tpv" | "kds";

export interface InstalledDevice {
  device_id: string;
  restaurant_id: string;
  module_id: InstalledDeviceModule;
  device_name: string;
}

export function getInstalledDevice(): InstalledDevice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as InstalledDevice;
    if (
      !data?.device_id ||
      !data?.restaurant_id ||
      !data?.module_id ||
      (data.module_id !== "tpv" && data.module_id !== "kds")
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setInstalledDevice(device: InstalledDevice): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
}

export function clearInstalledDevice(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** restaurant_id a usar no TPV: identidade instalada (tpv) ou null. */
export function getTpvRestaurantId(): string | null {
  const dev = getInstalledDevice();
  return dev?.module_id === "tpv" ? dev.restaurant_id : null;
}

/** restaurant_id a usar no KDS: identidade instalada (kds) ou null. */
export function getKdsRestaurantId(): string | null {
  const dev = getInstalledDevice();
  return dev?.module_id === "kds" ? dev.restaurant_id : null;
}
