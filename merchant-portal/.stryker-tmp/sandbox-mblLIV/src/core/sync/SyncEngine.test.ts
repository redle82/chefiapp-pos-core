import { beforeEach, describe, expect, it, vi } from "vitest";
import { DbWriteGate } from "../governance/DbWriteGate";
import { createOrderAtomic } from "../infra/CoreOrdersApi";
import { IndexedDBQueue } from "./IndexedDBQueue";
import { SyncEngine } from "./SyncEngine";

// Mock dependencies
vi.mock("./IndexedDBQueue", () => ({
  IndexedDBQueue: {
    getPending: vi.fn(),
    updateStatus: vi.fn(),
    put: vi.fn(),
    getAll: vi.fn(),
    remove: vi.fn(),
    open: vi.fn(),
  },
}));

vi.mock("../supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock("../infra/CoreOrdersApi", () => ({
  createOrderAtomic: vi.fn(),
}));

vi.mock("../governance/DbWriteGate", () => ({
  DbWriteGate: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock Logger to silence output
vi.mock("../logger", () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SyncEngine Stress Test", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset Network Status
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("online"));

    // Wait for any async effects or promises to settle
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("should process pending items when online", async () => {
    // Mock Pending Items
    const pendingItems = [
      {
        id: "1",
        type: "ORDER_CREATE",
        payload: { restaurantId: "res-1", items: [{ id: "p1" }] },
        attempts: 0,
        status: "queued",
      },
    ];
    (IndexedDBQueue.getPending as any).mockResolvedValue(pendingItems);
    (createOrderAtomic as any).mockResolvedValue({
      data: { id: "real_1" },
      error: null,
    });

    // Simulate Online
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    // Trigger Process
    await SyncEngine.processQueue();

    // Verify Flow (SyncEngine uses CoreOrdersApi.createOrderAtomic, not supabase.rpc)
    expect(IndexedDBQueue.getPending).toHaveBeenCalled();
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith("1", "syncing");
    expect(createOrderAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        p_restaurant_id: "res-1",
        p_items: expect.any(Array),
      })
    );
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith("1", "applied");
  });

  it("should NOT process queue when offline", async () => {
    // Mock Offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    // Force update internal state if needed, or rely on internal check
    // We trigger the event listener manually?
    window.dispatchEvent(new Event("offline"));

    // Clear mocks to ignore any calls triggered by state change
    vi.clearAllMocks();

    await SyncEngine.processQueue();

    expect(IndexedDBQueue.getPending).not.toHaveBeenCalled();
  });

  it("should handle sync error and schedule retry", async () => {
    // Mock Pending Items
    const pendingItems = [
      {
        id: "2",
        type: "ORDER_CREATE",
        payload: { restaurantId: "res-1", items: [{ id: "p1" }] },
        attempts: 0,
        status: "queued",
      },
    ];
    (IndexedDBQueue.getPending as any).mockResolvedValue(pendingItems);
    // FailureClassifier: "fetch failed" → degradation (retry); "Network Error" → critical (dead_letter)
    (createOrderAtomic as any).mockResolvedValue({
      data: null,
      error: { message: "fetch failed" },
    });

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await SyncEngine.processQueue();

    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith("2", "syncing");
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
      "2",
      "failed",
      "fetch failed",
      expect.any(Number)
    );
  });

  it("should handle ORDER_UPDATE via DbWriteGate", async () => {
    const pendingItems = [
      {
        id: "3",
        type: "ORDER_UPDATE",
        payload: {
          orderId: "real_1",
          restaurantId: "rest_1",
          action: "add_item",
          items: [{ id: "p2", price: 10, quantity: 1, name: "Burger" }],
        },
        attempts: 0,
        status: "queued",
      },
    ];
    (IndexedDBQueue.getPending as any).mockResolvedValue(pendingItems);

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await SyncEngine.processQueue();

    expect(DbWriteGate.insert).toHaveBeenCalledWith(
      "SyncEngine",
      "gm_order_items",
      expect.arrayContaining([expect.objectContaining({ product_id: "p2" })]),
      expect.any(Object)
    );
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith("3", "applied");
  });

  it("should update listeners on state change", () => {
    const listener = vi.fn();
    const unsubscribe = SyncEngine.subscribe(listener);

    // Initial call
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ isProcessing: false })
    );

    // Trigger processing implies change?
    // Mock processQueue to be instant or force state change if we exposed verified set method.
    // But we can test network change event.

    window.dispatchEvent(new Event("offline"));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ networkStatus: "offline" })
    );

    window.dispatchEvent(new Event("online"));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ networkStatus: "online" })
    );

    unsubscribe();
  });
});
