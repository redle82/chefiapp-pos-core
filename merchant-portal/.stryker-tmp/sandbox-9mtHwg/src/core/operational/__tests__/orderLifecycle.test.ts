/**
 * Integration test: processOrderLifecycle → useOperationalStore
 *
 * Valida o ciclo completo (Fase 2 — backend integration):
 *   startOrder → addItem → sendToKitchen → finalizeOrder
 *
 * Backend calls (createOrder, updateOrderStatus) são mocked.
 * Sem React, sem DOM — testa os stores Zustand de forma direta.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderLifecycle } from "../processOrderLifecycle";
import { useOperationalStore } from "../useOperationalStore";

// ─── Mock backend calls ─────────────────────────────────────────────
const { MOCK_ORDER_ID } = vi.hoisted(() => ({
  MOCK_ORDER_ID: "00000000-0000-0000-0000-000000aaa111",
}));

vi.mock("../../../infra/writers/OrderWriter", () => ({
  createOrder: vi.fn().mockResolvedValue({
    id: MOCK_ORDER_ID,
    total_cents: 0,
  }),
}));

vi.mock("../../infra/CoreOrdersApi", () => ({
  updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../../logger/Logger", () => ({
  Logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

function getState() {
  return useOperationalStore.getState();
}

describe("processOrderLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset completo do store antes de cada teste
    useOperationalStore.setState({
      kpis: {
        dailyRevenueCents: 0,
        activeOrdersCount: 0,
        averageTicketCents: 0,
        kitchenStatus: "GREEN",
      },
      currentOrder: {
        orderId: null,
        status: "IDLE",
        startedAt: null,
        sentToKitchenAt: null,
        readyAt: null,
        paidAt: null,
        mode: null,
        tableNumber: null,
      },
      kitchen: {
        avgPrepTimeSeconds: null,
        delayedOrdersCount: 0,
      },
      stock: {},
      hardware: {
        printerStatusByStation: {},
      },
      tasks: {
        missionsSummary: null,
      },
    });
  });

  // ─── startOrder ────────────────────────────────────────────────────
  it("startOrder creates a DRAFT order and increments activeOrdersCount", () => {
    const lifecycle = createOrderLifecycle();
    const orderId = lifecycle.startOrder("dine_in", "5");

    const s = getState();
    expect(orderId).toMatch(/^LOCAL-/);
    expect(s.currentOrder.orderId).toBe(orderId);
    expect(s.currentOrder.status).toBe("DRAFT");
    expect(s.currentOrder.mode).toBe("dine_in");
    expect(s.currentOrder.tableNumber).toBe("5");
    expect(s.currentOrder.startedAt).toBeTruthy();
    expect(s.kpis.activeOrdersCount).toBe(1);
  });

  // ─── addItem ──────────────────────────────────────────────────────
  it("addItem reserves stock and updates average ticket", () => {
    const lifecycle = createOrderLifecycle();

    // Seed stock (stockTotal + currentQty = available)
    useOperationalStore.getState().updateStock("p1", {
      currentQty: 10,
      stockTotal: 10,
      stockReserved: 0,
      criticalThreshold: 3,
      isUnavailable: false,
      marginPct: 65,
    });

    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });

    const s = getState();
    // Reservation model: total=10, reserved=1, available=9
    expect(s.stock["p1"].stockReserved).toBe(1);
    expect(s.stock["p1"].currentQty).toBe(9);
    expect(s.kpis.averageTicketCents).toBeGreaterThan(0);
  });

  it("addItem marks product unavailable when available stock reaches 0", () => {
    const lifecycle = createOrderLifecycle();

    useOperationalStore.getState().updateStock("p2", {
      currentQty: 1,
      stockTotal: 1,
      stockReserved: 0,
      criticalThreshold: 2,
      isUnavailable: false,
    });

    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p2",
      name: "Água",
      priceCents: 100,
      costCents: 30,
    });

    const s = getState();
    expect(s.stock["p2"].currentQty).toBe(0);
    expect(s.stock["p2"].isUnavailable).toBe(true);
  });

  // ─── sendToKitchen ────────────────────────────────────────────────
  it("sendToKitchen transitions order to SENT and sets sentToKitchenAt", async () => {
    const lifecycle = createOrderLifecycle();
    lifecycle.startOrder("dine_in", "3");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });

    const result = await lifecycle.sendToKitchen(RESTAURANT_ID);

    expect(result.success).toBe(true);
    expect(result.orderId).toBe(MOCK_ORDER_ID);
    const s = getState();
    expect(s.currentOrder.status).toBe("SENT");
    expect(s.currentOrder.sentToKitchenAt).toBeTruthy();
  });

  it("sendToKitchen returns error when no orderId", async () => {
    const lifecycle = createOrderLifecycle();
    // Don't call startOrder
    const result = await lifecycle.sendToKitchen(RESTAURANT_ID);

    expect(result.success).toBe(false);
    const s = getState();
    expect(s.currentOrder.status).toBe("IDLE");
    expect(s.currentOrder.sentToKitchenAt).toBeNull();
  });

  // ─── finalizeOrder ────────────────────────────────────────────────
  it("finalizeOrder adds to dailyRevenue and resets current order", async () => {
    const lifecycle = createOrderLifecycle();
    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 350,
      costCents: 100,
    });
    await lifecycle.sendToKitchen(RESTAURANT_ID);
    await lifecycle.finalizeOrder(RESTAURANT_ID, 350);

    const s = getState();
    expect(s.kpis.dailyRevenueCents).toBe(350);
    expect(s.kpis.activeOrdersCount).toBe(0);
    // Order foi reset
    expect(s.currentOrder.orderId).toBeNull();
    expect(s.currentOrder.status).toBe("IDLE");
  });

  // ─── cancelOrder ──────────────────────────────────────────────────
  it("cancelOrder decrements active orders and resets order", async () => {
    const lifecycle = createOrderLifecycle();
    lifecycle.startOrder("dine_in", "1");

    expect(getState().kpis.activeOrdersCount).toBe(1);

    await lifecycle.cancelOrder();

    const s = getState();
    expect(s.kpis.activeOrdersCount).toBe(0);
    expect(s.currentOrder.status).toBe("IDLE");
    expect(s.currentOrder.orderId).toBeNull();
  });

  // ─── holdOrder ────────────────────────────────────────────────────
  it("holdOrder keeps order in DRAFT without resetting", () => {
    const lifecycle = createOrderLifecycle();
    const orderId = lifecycle.startOrder("dine_in", "7");
    lifecycle.holdOrder();

    const s = getState();
    expect(s.currentOrder.status).toBe("DRAFT");
    expect(s.currentOrder.orderId).toBe(orderId);
  });

  // ─── Full cycle ───────────────────────────────────────────────────
  it("full lifecycle: start → add(2x) → sendToKitchen → finalize", async () => {
    const lifecycle = createOrderLifecycle();

    // Seed stock (reservation model)
    const store = getState();
    store.updateStock("p1", {
      currentQty: 20,
      stockTotal: 20,
      stockReserved: 0,
      criticalThreshold: 5,
      isUnavailable: false,
      marginPct: 60,
    });
    store.updateStock("p2", {
      currentQty: 15,
      stockTotal: 15,
      stockReserved: 0,
      criticalThreshold: 3,
      isUnavailable: false,
      marginPct: 45,
    });

    // 1. Iniciar pedido
    const orderId = lifecycle.startOrder("dine_in", "4");
    expect(getState().currentOrder.orderId).toBe(orderId);

    // 2. Adicionar dois itens (reservation: total stays, reserved increases)
    lifecycle.addItem({
      id: "p1",
      name: "Bife",
      priceCents: 1500,
      costCents: 600,
    });
    lifecycle.addItem({
      id: "p2",
      name: "Vinho",
      priceCents: 800,
      costCents: 350,
    });

    expect(getState().stock["p1"].currentQty).toBe(19); // 20 - 1 reserved
    expect(getState().stock["p2"].currentQty).toBe(14); // 15 - 1 reserved

    // 3. Enviar para cozinha (async → backend)
    const sendResult = await lifecycle.sendToKitchen(RESTAURANT_ID);
    expect(sendResult.success).toBe(true);
    expect(getState().currentOrder.status).toBe("SENT");

    // 4. Finalizar (async → backend)
    await lifecycle.finalizeOrder(RESTAURANT_ID, 2300);
    const final = getState();
    expect(final.kpis.dailyRevenueCents).toBe(2300);
    expect(final.currentOrder.status).toBe("IDLE");
    expect(final.kpis.activeOrdersCount).toBe(0);
  });

  // ─── confirmAndPay (takeaway shortcut) ────────────────────────────
  it("confirmAndPay creates and closes order atomically", async () => {
    const { createOrder } = await import("../../../infra/writers/OrderWriter");
    (createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: MOCK_ORDER_ID,
      total_cents: 500,
    });

    const lifecycle = createOrderLifecycle();
    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });

    const result = await lifecycle.confirmAndPay(RESTAURANT_ID, "cash");
    expect(result.success).toBe(true);
    expect(result.orderId).toBe(MOCK_ORDER_ID);

    const s = getState();
    expect(s.kpis.dailyRevenueCents).toBe(500);
    expect(s.currentOrder.status).toBe("IDLE");
    expect(s.kpis.activeOrdersCount).toBe(0);
  });

  // ─── Multiple orders ─────────────────────────────────────────────
  it("multiple sequential orders accumulate revenue", async () => {
    const { createOrder } = await import("../../../infra/writers/OrderWriter");
    const mockCreate = createOrder as ReturnType<typeof vi.fn>;

    const lifecycle = createOrderLifecycle();

    // Order 1
    mockCreate.mockResolvedValueOnce({ id: "order-1", total_cents: 250 });
    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });
    await lifecycle.confirmAndPay(RESTAURANT_ID, "cash");

    // Order 2
    mockCreate.mockResolvedValueOnce({ id: "order-2", total_cents: 250 });
    lifecycle.startOrder("take_away");
    lifecycle.addItem({
      id: "p1",
      name: "Café",
      priceCents: 250,
      costCents: 80,
    });
    await lifecycle.confirmAndPay(RESTAURANT_ID, "cash");

    expect(getState().kpis.dailyRevenueCents).toBe(500);
  });
});
