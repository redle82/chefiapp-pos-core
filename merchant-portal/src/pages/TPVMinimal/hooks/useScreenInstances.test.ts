// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useScreenInstances,
  STALE_THRESHOLD_MS,
  OFFLINE_THRESHOLD_MS,
} from "./useScreenInstances";
import type { ScreenMessage } from "../../../core/tpv/useScreenHeartbeat";

/* ── Mock BroadcastChannel ──────────────────────────────────────────── */

type Listener = (ev: MessageEvent<ScreenMessage>) => void;

let channelListener: Listener | null = null;

class MockBroadcastChannel {
  name: string;
  onmessage: Listener | null = null;
  constructor(name: string) {
    this.name = name;
    // Capture the setter so tests can dispatch messages
    const self = this;
    Object.defineProperty(this, "onmessage", {
      get: () => channelListener,
      set: (fn: Listener | null) => {
        channelListener = fn;
      },
    });
  }
  postMessage() {}
  close() {}
}

vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

function simulateMessage(msg: ScreenMessage) {
  if (channelListener) {
    channelListener(new MessageEvent("message", { data: msg }));
  }
}

describe("useScreenInstances", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    channelListener = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initially returns empty instances", () => {
    const { result } = renderHook(() => useScreenInstances());

    expect(result.current.instances).toHaveLength(0);
    expect(result.current.activeCount).toBe(0);
  });

  it("receiving a heartbeat message adds an instance", () => {
    const { result } = renderHook(() => useScreenInstances());

    act(() => {
      simulateMessage({
        action: "open",
        instanceId: "inst-1",
        type: "kds",
        title: "Kitchen Display",
        timestamp: Date.now(),
      });
    });

    expect(result.current.instances).toHaveLength(1);
    expect(result.current.instances[0].type).toBe("kds");
    expect(result.current.instances[0].status).toBe("online");
    expect(result.current.activeCount).toBe(1);
  });

  it("no heartbeat for 30s marks as stale", () => {
    const { result } = renderHook(() => useScreenInstances());

    const now = Date.now();
    act(() => {
      simulateMessage({
        action: "open",
        instanceId: "inst-2",
        type: "kds",
        title: "Kitchen",
        timestamp: now,
      });
    });

    expect(result.current.instances[0].status).toBe("online");

    // Advance past stale threshold but not offline
    act(() => {
      vi.advanceTimersByTime(STALE_THRESHOLD_MS + 1000);
    });

    // The periodic check (every 5s) should have fired
    expect(result.current.instances[0].status).toBe("stale");
  });

  it("no heartbeat for 60s marks as offline", () => {
    const { result } = renderHook(() => useScreenInstances());

    const now = Date.now();
    act(() => {
      simulateMessage({
        action: "open",
        instanceId: "inst-3",
        type: "customer_display",
        title: "Customer Display",
        timestamp: now,
      });
    });

    act(() => {
      vi.advanceTimersByTime(OFFLINE_THRESHOLD_MS + 1000);
    });

    expect(result.current.instances[0].status).toBe("offline");
  });

  it("close message removes instance", () => {
    const { result } = renderHook(() => useScreenInstances());

    act(() => {
      simulateMessage({
        action: "open",
        instanceId: "inst-4",
        type: "kds",
        title: "Kitchen",
        timestamp: Date.now(),
      });
    });

    expect(result.current.instances).toHaveLength(1);

    act(() => {
      simulateMessage({
        action: "close",
        instanceId: "inst-4",
        type: "kds",
        title: "Kitchen",
        timestamp: Date.now(),
      });
    });

    expect(result.current.instances).toHaveLength(0);
  });

  it("activeCount counts only online instances", () => {
    const { result } = renderHook(() => useScreenInstances());

    const now = Date.now();

    act(() => {
      // Online instance
      simulateMessage({
        action: "open",
        instanceId: "inst-a",
        type: "kds",
        title: "Kitchen 1",
        timestamp: now,
      });
      // Instance that will become stale
      simulateMessage({
        action: "open",
        instanceId: "inst-b",
        type: "kds",
        title: "Kitchen 2",
        timestamp: now - STALE_THRESHOLD_MS - 1000,
      });
    });

    // inst-a is online, inst-b is stale (opened 31s ago with no subsequent heartbeat)
    expect(result.current.activeCount).toBe(1);
  });

  it("getStatusForType returns correct status", () => {
    const { result } = renderHook(() => useScreenInstances());

    // Unknown type
    expect(result.current.getStatusForType("kds")).toBe("unknown");

    act(() => {
      simulateMessage({
        action: "open",
        instanceId: "inst-c",
        type: "kds",
        title: "Kitchen",
        timestamp: Date.now(),
      });
    });

    expect(result.current.getStatusForType("kds")).toBe("online");
    expect(result.current.getStatusForType("customer_display")).toBe("unknown");
  });
});
