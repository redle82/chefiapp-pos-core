/**
 * Guardrail: isDebugMode() returns false in production (import.meta.env.PROD).
 * chefiapp_debug must never create mock session in prod.
 *
 * Note: PROD check is enforced at build time; unit tests run in dev mode.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("debugMode", () => {
  const originalSessionStorage = globalThis.sessionStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: originalSessionStorage,
      writable: true,
    });
  });

  it("returns true when sessionStorage has chefiapp_debug=1 (dev)", async () => {
    (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("1");

    const { isDebugMode } = await import("./debugMode");

    expect(isDebugMode()).toBe(true);
  });

  it("returns false when sessionStorage has no chefiapp_debug (dev)", async () => {
    (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { isDebugMode } = await import("./debugMode");

    expect(isDebugMode()).toBe(false);
  });

  it("returns false when window is undefined (SSR)", async () => {
    const win = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
    });

    const { isDebugMode } = await import("./debugMode");
    expect(isDebugMode()).toBe(false);

    Object.defineProperty(globalThis, "window", { value: win, writable: true });
  });
});
