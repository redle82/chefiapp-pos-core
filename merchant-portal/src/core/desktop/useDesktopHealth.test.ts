/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkDesktopHealthMock = vi.fn();

vi.mock("./DesktopBridgeClient", () => ({
  checkDesktopHealth: (...args: unknown[]) => checkDesktopHealthMock(...args),
}));

// Import AFTER mock setup
import { useDesktopHealth } from "./useDesktopHealth";

describe("useDesktopHealth", () => {
  beforeEach(() => {
    checkDesktopHealthMock.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'detected' when Desktop bridge responds ok:true", async () => {
    checkDesktopHealthMock.mockResolvedValue({
      ok: true,
      version: "1.2.0",
      instanceId: "abc",
    });

    const { result } = renderHook(() => useDesktopHealth());

    await waitFor(() => expect(result.current.status).toBe("detected"));

    expect(result.current.health?.ok).toBe(true);
    expect(result.current.health?.version).toBe("1.2.0");
  });

  it("returns 'not_found' when Desktop bridge responds ok:false", async () => {
    checkDesktopHealthMock.mockResolvedValue({
      ok: false,
      error: "ECONNREFUSED",
    });

    const { result } = renderHook(() => useDesktopHealth());

    await waitFor(() => expect(result.current.status).toBe("not_found"));

    expect(result.current.health?.ok).toBe(false);
  });

  it("returns 'not_found' when probe throws", async () => {
    checkDesktopHealthMock.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useDesktopHealth());

    await waitFor(() => expect(result.current.status).toBe("not_found"));

    expect(result.current.health?.ok).toBe(false);
    expect(result.current.health?.error).toBe("PROBE_EXCEPTION");
  });

  it("recheck() re-probes the bridge", async () => {
    checkDesktopHealthMock
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, version: "2.0.0" });

    const { result } = renderHook(() => useDesktopHealth());

    await waitFor(() => expect(result.current.status).toBe("not_found"));

    result.current.recheck();

    await waitFor(() => expect(result.current.status).toBe("detected"));
    expect(result.current.health?.version).toBe("2.0.0");
  });

  it("uses sessionStorage cache on second mount within TTL", async () => {
    checkDesktopHealthMock.mockResolvedValue({
      ok: true,
      version: "1.0.0",
    });

    const { result, unmount } = renderHook(() => useDesktopHealth());
    await waitFor(() => expect(result.current.status).toBe("detected"));
    unmount();

    // Reset mock to ensure second mount uses cache, not a new probe
    checkDesktopHealthMock.mockReset();

    const { result: result2 } = renderHook(() => useDesktopHealth());

    // Should immediately be detected from cache (no probe needed)
    expect(result2.current.status).toBe("detected");
    expect(result2.current.health?.version).toBe("1.0.0");
  });
});
