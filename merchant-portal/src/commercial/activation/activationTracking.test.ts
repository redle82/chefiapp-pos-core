/**
 * Activation Tracking — Unit tests
 * Idempotency via localStorage, event emission at milestones.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  emitFirstLogin,
  emitFirstMenuCreated,
  emitFirstPaymentReceived,
  emitFirstShiftOpened,
} from "./activationTracking";

const mockTrack = vi.fn();

vi.mock("../tracking", () => ({
  commercialTracking: { track: (...args: unknown[]) => mockTrack(...args) },
  isCommercialTrackingEnabled: () => true,
  detectDevice: () => "desktop",
}));

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  mockTrack.mockClear();
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    },
    writable: true,
  });
  if (typeof window !== "undefined") {
    (window as any).location = { pathname: "/op/tpv" };
  }
});

describe("activationTracking", () => {
  it("emitFirstLogin calls track with first_login", () => {
    emitFirstLogin("r1");
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "first_login",
        restaurant_id: "r1",
      }),
    );
  });

  it("emitFirstLogin is idempotent per restaurant", () => {
    emitFirstLogin("r1");
    emitFirstLogin("r1");
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it("emitFirstMenuCreated calls track and is idempotent", () => {
    emitFirstMenuCreated("r1");
    emitFirstMenuCreated("r1");
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "first_menu_created",
        restaurant_id: "r1",
      }),
    );
  });

  it("emitFirstShiftOpened includes optional shift_id", () => {
    emitFirstShiftOpened("r1", "shift-123");
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "first_shift_opened",
        restaurant_id: "r1",
        shift_id: "shift-123",
      }),
    );
  });

  it("emitFirstPaymentReceived includes order_id and amount_cents", () => {
    emitFirstPaymentReceived("r1", "ord-456", 1500);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "first_payment_received",
        restaurant_id: "r1",
        order_id: "ord-456",
        amount_cents: 1500,
      }),
    );
  });

  it("different restaurants each emit once", () => {
    emitFirstLogin("r1");
    emitFirstLogin("r2");
    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockTrack).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ restaurant_id: "r1" }),
    );
    expect(mockTrack).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ restaurant_id: "r2" }),
    );
  });
});
