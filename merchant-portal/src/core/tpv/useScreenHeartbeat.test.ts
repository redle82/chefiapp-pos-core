// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useScreenHeartbeat,
  SCREEN_CHANNEL_NAME,
  HEARTBEAT_INTERVAL_MS,
  type ScreenMessage,
} from "./useScreenHeartbeat";

/* ── Mock BroadcastChannel ──────────────────────────────────────────── */

const postedMessages: ScreenMessage[] = [];
let lastCloseCalled = false;

class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(msg: ScreenMessage) {
    postedMessages.push(msg);
  }
  close() {
    lastCloseCalled = true;
  }
}

vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-1234" });

describe("useScreenHeartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    postedMessages.length = 0;
    lastCloseCalled = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends 'open' message on mount", () => {
    renderHook(() => useScreenHeartbeat("kds", "Kitchen Display"));

    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0].action).toBe("open");
    expect(postedMessages[0].type).toBe("kds");
    expect(postedMessages[0].title).toBe("Kitchen Display");
    expect(postedMessages[0].instanceId).toBe("test-uuid-1234");
  });

  it("sends heartbeat every 10 seconds", () => {
    renderHook(() => useScreenHeartbeat("kds", "Kitchen Display"));

    // 1 message (open)
    expect(postedMessages).toHaveLength(1);

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    expect(postedMessages).toHaveLength(2);
    expect(postedMessages[1].action).toBe("heartbeat");

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    expect(postedMessages).toHaveLength(3);
    expect(postedMessages[2].action).toBe("heartbeat");
  });

  it("sends 'close' message on unmount", () => {
    const { unmount } = renderHook(() =>
      useScreenHeartbeat("customer_display", "Customer Display"),
    );

    expect(postedMessages).toHaveLength(1); // open

    unmount();

    const closeMsg = postedMessages.find((m) => m.action === "close");
    expect(closeMsg).toBeDefined();
    expect(closeMsg!.type).toBe("customer_display");
    expect(lastCloseCalled).toBe(true);
  });
});
