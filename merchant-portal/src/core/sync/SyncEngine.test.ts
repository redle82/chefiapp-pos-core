import { beforeEach, describe, expect, it, vi } from "vitest";
import { DbWriteGate } from "../governance/DbWriteGate";
import { createOrderAtomic } from "../infra/CoreOrdersApi";
import { IndexedDBQueue } from "./IndexedDBQueue";
import { SyncEngine } from "./SyncEngine";

// Mock config so Core heartbeat is disabled (no fetch in tests)
vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "",
    OFFLINE_HEARTBEAT_ENABLED: false,
    OFFLINE_HEARTBEAT_INTERVAL_MS: 30000,
    OFFLINE_HEARTBEAT_FAILURES: 2,
  },
}));

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

vi.mock("../tpv/PaymentEngine", () => ({
  PaymentEngine: {
    processPayment: vi.fn().mockResolvedValue(undefined),
    processSplitPayment: vi.fn().mockResolvedValue(undefined),
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
        p_idempotency_key: "1",
      }),
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

  it("offline flow: item enqueued when offline then processed when back online (createOrderAtomic called)", async () => {
    // Simulate: user was offline, created order → item in queue (we mock getPending as if queue had one item)
    const enqueuedItem = {
      id: "offline-order-1",
      type: "ORDER_CREATE" as const,
      payload: {
        restaurant_id: "res-offline",
        table_number: 1,
        items: [
          {
            product_id: "p1",
            quantity: 1,
            name_snapshot: "Café",
            price: 150,
          },
        ],
      },
      attempts: 0,
      status: "queued" as const,
      createdAt: Date.now(),
    };
    (IndexedDBQueue.getPending as any).mockResolvedValue([enqueuedItem]);
    (createOrderAtomic as any).mockResolvedValue({
      data: { id: "synced-order-1" },
      error: null,
    });

    // Simulate back online
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("online"));

    await SyncEngine.processQueue();

    expect(IndexedDBQueue.getPending).toHaveBeenCalled();
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
      "offline-order-1",
      "syncing",
    );
    expect(createOrderAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        p_restaurant_id: "res-offline",
        p_items: expect.any(Array),
        p_idempotency_key: "offline-order-1",
      }),
    );
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
      "offline-order-1",
      "applied",
    );
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
      expect.any(Number),
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
      expect.any(Object),
    );
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith("3", "applied");
  });

  it("should update listeners on state change", () => {
    const listener = vi.fn();
    const unsubscribe = SyncEngine.subscribe(listener);

    // Initial call (isProcessing may vary if queue processing is in-flight)
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0]).toEqual(
      expect.objectContaining({ networkStatus: "online" }),
    );

    // Trigger processing implies change?
    // Mock processQueue to be instant or force state change if we exposed verified set method.
    // But we can test network change event.

    window.dispatchEvent(new Event("offline"));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ networkStatus: "offline" }),
    );

    window.dispatchEvent(new Event("online"));
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ networkStatus: "online" }),
    );

    unsubscribe();
  });

  it("idempotency: ORDER_PAY uses item idempotency_key so retry does not duplicate payment", async () => {
    const { ConnectivityService } = await import("./ConnectivityService");
    const { PaymentEngine } = await import("../tpv/PaymentEngine");
    const getConnectivity = vi
      .spyOn(ConnectivityService, "getConnectivity")
      .mockReturnValue("online");

    const pendingItems = [
      {
        id: "pay-1",
        type: "ORDER_PAY" as const,
        payload: {
          orderId: "ord-1",
          restaurantId: "res-1",
          amountCents: 1000,
          method: "cash",
          cashRegisterId: "reg-1",
        },
        attempts: 0,
        status: "queued" as const,
        createdAt: Date.now(),
        idempotency_key: "order-pay-ord-1-1000-cash",
      },
    ];
    (IndexedDBQueue.getPending as any).mockResolvedValue(pendingItems);

    await SyncEngine.processQueue();

    getConnectivity.mockRestore();

    expect(PaymentEngine.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-1",
        amountCents: 1000,
        idempotencyKey: "order-pay-ord-1-1000-cash",
      }),
    );
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
      "pay-1",
      "applied",
    );
  });

  it("degraded: processQueue still processes pending items when connectivity is degraded", async () => {
    const { ConnectivityService } = await import("./ConnectivityService");
    const getConnectivity = vi
      .spyOn(ConnectivityService, "getConnectivity")
      .mockReturnValue("degraded");

    const pendingItems = [
      {
        id: "deg-1",
        type: "ORDER_CREATE" as const,
        payload: {
          restaurant_id: "res-1",
          items: [{ id: "p1", name: "X", quantity: 1, unit_price: 100 }],
        },
        attempts: 0,
        status: "queued" as const,
        createdAt: Date.now(),
        idempotency_key: "order-create-deg-1",
      },
    ];
    (IndexedDBQueue.getPending as any).mockResolvedValue(pendingItems);
    (createOrderAtomic as any).mockResolvedValue({
      data: { id: "synced-1" },
      error: null,
    });

    await SyncEngine.processQueue();

    expect(IndexedDBQueue.getPending).toHaveBeenCalled();
    expect(createOrderAtomic).toHaveBeenCalled();
    expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
      "deg-1",
      "applied",
    );
    getConnectivity.mockRestore();
  });
});
