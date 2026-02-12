/**
 * CONFIG_RUNTIME_CONTRACT §2.2, §2.3 — Device Gate: dispositivo ativo inicia TPV; inativo/inexistente bloqueia com mensagem clara.
 * Ver docs/contracts/CONFIG_RUNTIME_CONTRACT.md (checklist Dispositivos).
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TerminalEquipmentRow } from "../../core-boundary/readers/EquipmentReader";
import type { InstalledDevice } from "../storage/installedDeviceStorage";
import { useDeviceGate } from "./useDeviceGate";

const mockGetInstalledDevice = vi.fn();
const mockListEquipmentByRestaurant = vi.fn();

vi.mock("../storage/installedDeviceStorage", () => ({
  getInstalledDevice: () => mockGetInstalledDevice(),
}));

vi.mock("../../core-boundary/readers/EquipmentReader", () => ({
  listEquipmentByRestaurant: (restaurantId: string) =>
    mockListEquipmentByRestaurant(restaurantId),
}));

vi.mock("../../config", () => ({
  CONFIG: {
    DEBUG_DIRECT_FLOW: false,
    TERMINAL_INSTALLATION_TRACK: true,
  },
}));

const RESTAURANT_ID = "rest-123";
const DEVICE_ID = "device-tpv-1";

const installedDevice: InstalledDevice = {
  device_id: DEVICE_ID,
  restaurant_id: RESTAURANT_ID,
  module_id: "tpv",
  device_name: "TPV Sala",
};

function equipmentRow(
  overrides: Partial<TerminalEquipmentRow> = {},
): TerminalEquipmentRow {
  return {
    id: DEVICE_ID,
    name: "TPV Sala",
    kind: "TPV",
    is_active: true,
    ...overrides,
  };
}

describe("useDeviceGate (CONFIG_RUNTIME_CONTRACT — Dispositivos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("device ativo: permite TPV (allowed=true) quando dispositivo instalado e ativo na Config", async () => {
    mockGetInstalledDevice.mockReturnValue(installedDevice);
    mockListEquipmentByRestaurant.mockResolvedValue([
      equipmentRow({ id: DEVICE_ID, is_active: true }),
    ]);

    const { result } = renderHook(() => useDeviceGate(RESTAURANT_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(true);
    expect(result.current.reason).toBeUndefined();
    expect(mockGetInstalledDevice).toHaveBeenCalled();
    expect(mockListEquipmentByRestaurant).toHaveBeenCalledWith(RESTAURANT_ID);
  });

  it("device inativo: bloqueia TPV (allowed=false, reason=DEVICE_DISABLED) quando is_active=false na Config", async () => {
    mockGetInstalledDevice.mockReturnValue(installedDevice);
    mockListEquipmentByRestaurant.mockResolvedValue([
      equipmentRow({ id: DEVICE_ID, is_active: false }),
    ]);

    const { result } = renderHook(() => useDeviceGate(RESTAURANT_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toBe("DEVICE_DISABLED");
  });

  it("device inexistente: bloqueia TPV (allowed=false, reason=DEVICE_NOT_IN_CONFIG) quando dispositivo não consta na Config", async () => {
    mockGetInstalledDevice.mockReturnValue(installedDevice);
    mockListEquipmentByRestaurant.mockResolvedValue([]);

    const { result } = renderHook(() => useDeviceGate(RESTAURANT_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toBe("DEVICE_NOT_IN_CONFIG");
  });

  it("device não instalado: bloqueia TPV (allowed=false, reason=DEVICE_NOT_INSTALLED) quando getInstalledDevice retorna null", async () => {
    mockGetInstalledDevice.mockReturnValue(null);
    mockListEquipmentByRestaurant.mockResolvedValue([]);

    const { result } = renderHook(() => useDeviceGate(RESTAURANT_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toBe("DEVICE_NOT_INSTALLED");
    expect(mockListEquipmentByRestaurant).not.toHaveBeenCalled();
  });

  it("restaurantId null: bloqueia (allowed=false, reason=DEVICE_RESTAURANT_MISMATCH)", async () => {
    mockGetInstalledDevice.mockReturnValue(installedDevice);

    const { result } = renderHook(() => useDeviceGate(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toBe("DEVICE_RESTAURANT_MISMATCH");
    expect(mockListEquipmentByRestaurant).not.toHaveBeenCalled();
  });
});
