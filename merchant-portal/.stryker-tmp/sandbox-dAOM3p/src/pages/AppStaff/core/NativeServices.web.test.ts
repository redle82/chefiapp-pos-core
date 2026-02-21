// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BiometricService } from "./BiometricService";
import { ScannerService } from "./ScannerService";

const originalCapacitor = (globalThis as { Capacitor?: unknown }).Capacitor;

describe("Native services on web", () => {
  beforeEach(() => {
    (
      globalThis as { Capacitor?: { isNativePlatform: () => boolean } }
    ).Capacitor = {
      isNativePlatform: () => false,
    };
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    (globalThis as { Capacitor?: unknown }).Capacitor = originalCapacitor;
    vi.restoreAllMocks();
  });

  it("BiometricService returns safe defaults when not native", async () => {
    await expect(BiometricService.checkAvailability()).resolves.toBe(false);
    await expect(BiometricService.registerUser("user")).resolves.toBe(false);
    await expect(BiometricService.verifyUser()).resolves.toBe(null);
    await expect(BiometricService.clearCredentials()).resolves.toBe(undefined);
  });

  it("ScannerService returns safe defaults when not native", async () => {
    await expect(ScannerService.checkPermission()).resolves.toBe(false);
    await expect(ScannerService.requestPermission()).resolves.toBe(false);
    await expect(ScannerService.scan()).resolves.toBe(null);
    await expect(ScannerService.installGoogleModule()).resolves.toBe(undefined);
    expect(globalThis.alert).not.toHaveBeenCalled();
  });
});
