import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryRepo } from "../repo/InMemoryRepo";
import type { Order, OrderItem, Payment, Session } from "../repo/types";
import type { GuardContext } from "./index";
import {
  executeGuard,
  hasConfirmedPayment,
  noLockedOrders,
  noOpenOrders,
  orderHasItems,
  orderIsLocked,
  orderIsOpen,
  orderNotTerminal,
  paymentNotConfirmed,
  paymentOrderIsLocked,
  sessionIsActive,
} from "./index";

// ─── Factory helpers ────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return { id: "sess-1", state: "ACTIVE", version: 0, ...overrides };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    session_id: "sess-1",
    state: "OPEN",
    version: 0,
    ...overrides,
  };
}

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    order_id: "ord-1",
    product_id: "prod-1",
    name: "Café",
    quantity: 1,
    price_snapshot_cents: 350,
    subtotal_cents: 350,
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    order_id: "ord-1",
    session_id: "sess-1",
    method: "CARD",
    amount_cents: 1000,
    state: "PENDING",
    version: 0,
    ...overrides,
  };
}

function ctx(
  repo: InMemoryRepo,
  overrides: Partial<GuardContext> = {},
): GuardContext {
  return {
    repo,
    entityId: "ord-1",
    currentState: "OPEN",
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────

let repo: InMemoryRepo;

beforeEach(() => {
  repo = new InMemoryRepo();
});

// ─── noOpenOrders ───────────────────────────────────────

describe("noOpenOrders", () => {
  it("passes when session has no open orders", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "PAID" }));
    const r = await noOpenOrders(ctx(repo, { entityId: "sess-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when session has OPEN orders", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await noOpenOrders(ctx(repo, { entityId: "sess-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("1 OPEN order(s) exist");
  });

  it("fails when session not found", async () => {
    const r = await noOpenOrders(ctx(repo, { entityId: "no-session" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });

  it("passes when session has no orders at all", async () => {
    repo.saveSession(makeSession());
    const r = await noOpenOrders(ctx(repo, { entityId: "sess-1" }));
    expect(r.passed).toBe(true);
  });
});

// ─── noLockedOrders ─────────────────────────────────────

describe("noLockedOrders", () => {
  it("passes when no LOCKED orders", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await noLockedOrders(ctx(repo, { entityId: "sess-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when LOCKED orders exist", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await noLockedOrders(ctx(repo, { entityId: "sess-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("1 LOCKED order(s) exist");
  });

  it("fails when session not found", async () => {
    const r = await noLockedOrders(ctx(repo, { entityId: "ghost" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── sessionIsActive ────────────────────────────────────

describe("sessionIsActive", () => {
  it("passes when session is ACTIVE", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    const r = await sessionIsActive(ctx(repo, { session_id: "sess-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when session is CLOSED", async () => {
    repo.saveSession(makeSession({ state: "CLOSED" }));
    const r = await sessionIsActive(ctx(repo, { session_id: "sess-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not ACTIVE");
  });

  it("fails when session is INACTIVE", async () => {
    repo.saveSession(makeSession({ state: "INACTIVE" }));
    const r = await sessionIsActive(ctx(repo, { session_id: "sess-1" }));
    expect(r.passed).toBe(false);
  });

  it("fails when session_id is missing", async () => {
    const r = await sessionIsActive(ctx(repo, { session_id: undefined }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("session_id is required");
  });

  it("fails when session not found", async () => {
    const r = await sessionIsActive(ctx(repo, { session_id: "nope" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── orderIsOpen ────────────────────────────────────────

describe("orderIsOpen", () => {
  it("passes when order is OPEN and session is ACTIVE", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await orderIsOpen(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when order is LOCKED", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await orderIsOpen(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not OPEN");
  });

  it("fails when order not found", async () => {
    const r = await orderIsOpen(ctx(repo, { entityId: "phantom" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });

  it("fails when session is not ACTIVE (cascading check)", async () => {
    repo.saveSession(makeSession({ state: "CLOSED" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await orderIsOpen(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not ACTIVE");
  });
});

// ─── orderIsLocked ──────────────────────────────────────

describe("orderIsLocked", () => {
  it("passes when order is LOCKED", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await orderIsLocked(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when order is OPEN", async () => {
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await orderIsLocked(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not LOCKED");
  });

  it("fails when order not found", async () => {
    const r = await orderIsLocked(ctx(repo, { entityId: "missing" }));
    expect(r.passed).toBe(false);
  });
});

// ─── orderHasItems ──────────────────────────────────────

describe("orderHasItems", () => {
  it("passes when order has items", async () => {
    repo.saveOrder(makeOrder());
    repo.saveOrderItem(makeItem());
    const r = await orderHasItems(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when order has no items", async () => {
    repo.saveOrder(makeOrder());
    const r = await orderHasItems(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("no items");
  });
});

// ─── orderNotTerminal ───────────────────────────────────

describe("orderNotTerminal", () => {
  it("passes for OPEN order", async () => {
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await orderNotTerminal(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("passes for LOCKED order", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await orderNotTerminal(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("passes for PAID order", async () => {
    repo.saveOrder(makeOrder({ state: "PAID" }));
    const r = await orderNotTerminal(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails for CLOSED order", async () => {
    repo.saveOrder(makeOrder({ state: "CLOSED" }));
    const r = await orderNotTerminal(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("terminal state: CLOSED");
  });

  it("fails for CANCELED order", async () => {
    repo.saveOrder(makeOrder({ state: "CANCELED" }));
    const r = await orderNotTerminal(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("terminal state: CANCELED");
  });

  it("fails when order not found", async () => {
    const r = await orderNotTerminal(ctx(repo, { entityId: "gone" }));
    expect(r.passed).toBe(false);
  });
});

// ─── hasConfirmedPayment ────────────────────────────────

describe("hasConfirmedPayment", () => {
  it("passes when confirmed payments cover total", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 1000 }));
    repo.savePayment(makePayment({ state: "CONFIRMED", amount_cents: 1000 }));
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when no confirmed payments", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 1000 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 1000 }));
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("no CONFIRMED payments");
  });

  it("fails when confirmed payments < total_cents", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 2000 }));
    repo.savePayment(makePayment({ state: "CONFIRMED", amount_cents: 500 }));
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not fully paid");
  });

  it("passes when no total_cents set (null check skipped)", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: undefined }));
    repo.savePayment(makePayment({ state: "CONFIRMED", amount_cents: 500 }));
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("passes with multiple partial confirmed payments summing to total", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 1000 }));
    repo.savePayment(
      makePayment({ id: "pay-1", state: "CONFIRMED", amount_cents: 600 }),
    );
    repo.savePayment(
      makePayment({ id: "pay-2", state: "CONFIRMED", amount_cents: 400 }),
    );
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when order not found", async () => {
    const r = await hasConfirmedPayment(ctx(repo, { entityId: "void" }));
    expect(r.passed).toBe(false);
  });
});

// ─── paymentOrderIsLocked ───────────────────────────────

describe("paymentOrderIsLocked", () => {
  it("passes when order is LOCKED and session is ACTIVE", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await paymentOrderIsLocked(
      ctx(repo, { order_id: "ord-1", session_id: "sess-1" }),
    );
    expect(r.passed).toBe(true);
  });

  it("fails when order is OPEN (not LOCKED)", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await paymentOrderIsLocked(
      ctx(repo, { order_id: "ord-1", session_id: "sess-1" }),
    );
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not LOCKED");
  });

  it("fails when session is not ACTIVE", async () => {
    repo.saveSession(makeSession({ state: "CLOSED" }));
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await paymentOrderIsLocked(
      ctx(repo, { order_id: "ord-1", session_id: "sess-1" }),
    );
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not ACTIVE");
  });

  it("passes without session_id (skips session check)", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await paymentOrderIsLocked(ctx(repo, { order_id: "ord-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when order_id is missing", async () => {
    const r = await paymentOrderIsLocked(ctx(repo, { order_id: undefined }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("order_id is required");
  });

  it("fails when order not found", async () => {
    const r = await paymentOrderIsLocked(ctx(repo, { order_id: "nope" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── paymentNotConfirmed ────────────────────────────────

describe("paymentNotConfirmed", () => {
  it("passes when payment is PENDING", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "PENDING" }));
    const r = await paymentNotConfirmed(
      ctx(repo, { entityId: "pay-1", order_id: "ord-1" }),
    );
    expect(r.passed).toBe(true);
  });

  it("passes when payment is FAILED", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "FAILED" }));
    const r = await paymentNotConfirmed(
      ctx(repo, { entityId: "pay-1", order_id: "ord-1" }),
    );
    expect(r.passed).toBe(true);
  });

  it("fails when payment is CONFIRMED", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "CONFIRMED" }));
    const r = await paymentNotConfirmed(
      ctx(repo, { entityId: "pay-1", order_id: "ord-1" }),
    );
    expect(r.passed).toBe(false);
    expect(r.error).toContain("CONFIRMED and cannot be modified");
  });

  it("fails when payment not found (with order_id)", async () => {
    repo.saveOrder(makeOrder());
    const r = await paymentNotConfirmed(
      ctx(repo, { entityId: "pay-ghost", order_id: "ord-1" }),
    );
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });

  it("finds payment via fallback scan when no order_id", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "PENDING" }));
    const r = await paymentNotConfirmed(ctx(repo, { entityId: "pay-1" }));
    expect(r.passed).toBe(true);
  });

  it("fails when payment not found via fallback scan", async () => {
    const r = await paymentNotConfirmed(ctx(repo, { entityId: "pay-none" }));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── executeGuard (registry) ────────────────────────────

describe("executeGuard", () => {
  it("dispatches to correct guard by name", async () => {
    repo.saveSession(makeSession());
    const r = await executeGuard(
      "sessionIsActive",
      ctx(repo, { session_id: "sess-1" }),
    );
    expect(r.passed).toBe(true);
  });

  it("returns error for unknown guard", async () => {
    const r = await executeGuard("nonexistentGuard", ctx(repo));
    expect(r.passed).toBe(false);
    expect(r.error).toContain("not found");
  });

  it("dispatches noOpenOrders correctly", async () => {
    repo.saveSession(makeSession());
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await executeGuard(
      "noOpenOrders",
      ctx(repo, { entityId: "sess-1" }),
    );
    expect(r.passed).toBe(false);
  });

  it("dispatches orderHasItems correctly", async () => {
    repo.saveOrder(makeOrder());
    repo.saveOrderItem(makeItem());
    const r = await executeGuard(
      "orderHasItems",
      ctx(repo, { entityId: "ord-1" }),
    );
    expect(r.passed).toBe(true);
  });
});
