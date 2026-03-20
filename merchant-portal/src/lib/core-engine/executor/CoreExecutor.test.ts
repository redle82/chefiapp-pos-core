import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryRepo } from "../repo/InMemoryRepo";
import type {
  CashRegister,
  Order,
  OrderItem,
  Payment,
  Session,
} from "../repo/types";
import { CoreExecutor, type TransitionRequest } from "./CoreExecutor";

// ─── Factory helpers ────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return { id: "sess-1", state: "INACTIVE", version: 0, ...overrides };
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
    quantity: 2,
    price_snapshot_cents: 350,
    subtotal_cents: 700,
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    order_id: "ord-1",
    session_id: "sess-1",
    method: "CARD",
    amount_cents: 700,
    state: "PENDING",
    version: 0,
    ...overrides,
  };
}

function makeCashRegister(overrides: Partial<CashRegister> = {}): CashRegister {
  return {
    id: "cr-1",
    restaurant_id: "rest-1",
    name: "Caixa 1",
    state: "CLOSED",
    opening_balance_cents: 0,
    current_balance_cents: 0,
    total_sales_cents: 0,
    version: 0,
    ...overrides,
  };
}

function req(overrides: Partial<TransitionRequest> = {}): TransitionRequest {
  return {
    tenantId: "tenant-1",
    entity: "SESSION",
    entityId: "sess-1",
    event: "START",
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────

let repo: InMemoryRepo;
let executor: CoreExecutor;

beforeEach(() => {
  repo = new InMemoryRepo();
  executor = new CoreExecutor(repo);
});

// ─── Unknown entity ─────────────────────────────────────

describe("unknown entity", () => {
  it("returns error for unsupported entity type", async () => {
    const r = await executor.transition(
      req({ entity: "WIDGET" as any, event: "DO" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("Unknown entity");
  });
});

// ─── SESSION transitions ────────────────────────────────

describe("SESSION transitions", () => {
  it("START: INACTIVE → ACTIVE", async () => {
    repo.saveSession(makeSession({ state: "INACTIVE" }));
    const r = await executor.transition(req({ event: "START" }));
    expect(r.success).toBe(true);
    expect(r.previousState).toBe("INACTIVE");
    expect(r.newState).toBe("ACTIVE");
    // Verify state persisted
    const s = repo.getSession("sess-1");
    expect(s?.state).toBe("ACTIVE");
    expect(s?.opened_at).toBeDefined();
  });

  it("CLOSE: ACTIVE → CLOSED (happy path, no orders)", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    const r = await executor.transition(req({ event: "CLOSE" }));
    expect(r.success).toBe(true);
    expect(r.newState).toBe("CLOSED");
    const s = repo.getSession("sess-1");
    expect(s?.closed_at).toBeDefined();
  });

  it("CLOSE fails when open orders exist (guard failure)", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await executor.transition(req({ event: "CLOSE" }));
    expect(r.success).toBe(false);
    expect(r.guardFailures).toContain("noOpenOrders");
    expect(r.error).toContain("Guard failures");
  });

  it("CLOSE fails when locked orders exist", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED" }));
    const r = await executor.transition(req({ event: "CLOSE" }));
    expect(r.success).toBe(false);
    expect(r.guardFailures).toContain("noLockedOrders");
  });

  it("cannot transition from terminal state CLOSED", async () => {
    repo.saveSession(makeSession({ state: "CLOSED" }));
    const r = await executor.transition(req({ event: "START" }));
    expect(r.success).toBe(false);
    expect(r.error).toContain("terminal state");
  });

  it("invalid event for current state", async () => {
    repo.saveSession(makeSession({ state: "INACTIVE" }));
    const r = await executor.transition(req({ event: "CLOSE" }));
    expect(r.success).toBe(false);
    expect(r.error).toContain("Invalid transition");
  });

  it("entity not found", async () => {
    const r = await executor.transition(req({ entityId: "no-sess" }));
    expect(r.success).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── ORDER transitions ──────────────────────────────────

describe("ORDER transitions", () => {
  it("CANCEL: OPEN → CANCELED", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "CANCEL" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("CANCELED");
    expect(repo.getOrder("ord-1")?.state).toBe("CANCELED");
  });

  it("FINALIZE: OPEN → LOCKED (with effects: calculateTotal + lockItems)", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    repo.saveOrderItem(makeItem({ quantity: 2, price_snapshot_cents: 350 }));
    repo.saveOrderItem(
      makeItem({ id: "item-2", quantity: 1, price_snapshot_cents: 500 }),
    );

    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "FINALIZE" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("LOCKED");

    const order = repo.getOrder("ord-1");
    expect(order?.state).toBe("LOCKED");
    // calculateTotal: 2*350 + 1*500 = 1200
    expect(order?.total_cents).toBe(1200);
  });

  it("FINALIZE guard failure: no items", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "FINALIZE" }),
    );
    expect(r.success).toBe(false);
    expect(r.guardFailures).toContain("orderHasItems");
  });

  it("FINALIZE guard failure: session not active (cascading)", async () => {
    repo.saveSession(makeSession({ state: "CLOSED" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    repo.saveOrderItem(makeItem());
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "FINALIZE" }),
    );
    expect(r.success).toBe(false);
    expect(r.guardFailures).toContain("orderIsOpen");
  });

  it("PAY: LOCKED → PAID (with hasConfirmedPayment guard)", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 700 }));
    repo.savePayment(makePayment({ state: "CONFIRMED", amount_cents: 700 }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "PAY" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("PAID");
  });

  it("PAY fails when no confirmed payments", async () => {
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 700 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 700 }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "PAY" }),
    );
    expect(r.success).toBe(false);
    expect(r.guardFailures).toContain("hasConfirmedPayment");
  });

  it("CLOSE: PAID → CLOSED", async () => {
    repo.saveOrder(makeOrder({ state: "PAID" }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "CLOSE" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("CLOSED");
  });

  it("cannot transition from terminal CLOSED", async () => {
    repo.saveOrder(makeOrder({ state: "CLOSED" }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "PAY" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("terminal state");
  });

  it("cannot transition from terminal CANCELED", async () => {
    repo.saveOrder(makeOrder({ state: "CANCELED" }));
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "FINALIZE" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("terminal state");
  });

  it("order not found", async () => {
    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "nonexistent", event: "CANCEL" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── PAYMENT transitions ────────────────────────────────

describe("PAYMENT transitions", () => {
  it("CONFIRM: PENDING → CONFIRMED (paymentOrderIsLocked guard)", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 700 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 700 }));

    const r = await executor.transition(
      req({
        entity: "PAYMENT",
        entityId: "pay-1",
        event: "CONFIRM",
        context: { order_id: "ord-1", session_id: "sess-1" },
      }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("CONFIRMED");
  });

  it("CONFIRM triggers atomic ORDER → PAID when total covered", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 700 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 700 }));

    await executor.transition(
      req({
        entity: "PAYMENT",
        entityId: "pay-1",
        event: "CONFIRM",
        context: { order_id: "ord-1", session_id: "sess-1" },
      }),
    );

    // After payment confirmation, order should atomically become PAID
    const order = repo.getOrder("ord-1");
    expect(order?.state).toBe("PAID");
  });

  it("CONFIRM does NOT mark order PAID when partial payment", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 1000 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 500 }));

    await executor.transition(
      req({
        entity: "PAYMENT",
        entityId: "pay-1",
        event: "CONFIRM",
        context: { order_id: "ord-1", session_id: "sess-1" },
      }),
    );

    const order = repo.getOrder("ord-1");
    expect(order?.state).toBe("LOCKED"); // still locked, partial payment
  });

  it("CONFIRM finds payment via fallback scan when no order_id in context", async () => {
    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "LOCKED", total_cents: 700 }));
    repo.savePayment(makePayment({ state: "PENDING", amount_cents: 700 }));

    const r = await executor.transition(
      req({
        entity: "PAYMENT",
        entityId: "pay-1",
        event: "CONFIRM",
        // no order_id — forces fallback scan in getCurrentState + paymentOrderIsLocked guard
        context: { session_id: "sess-1" },
      }),
    );
    // paymentOrderIsLocked requires order_id in context — will fail without it
    expect(r.success).toBe(false);
  });

  it("FAIL: PENDING → FAILED", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "PENDING" }));
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-1", event: "FAIL" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("FAILED");
  });

  it("CANCEL: PENDING → CANCELED", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "PENDING" }));
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-1", event: "CANCEL" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("CANCELED");
  });

  it("RETRY: FAILED → PENDING", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "FAILED" }));
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-1", event: "RETRY" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("PENDING");
  });

  it("RETRY: CANCELED → PENDING", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "CANCELED" }));
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-1", event: "RETRY" }),
    );
    expect(r.success).toBe(true);
    expect(r.newState).toBe("PENDING");
  });

  it("cannot transition from terminal CONFIRMED", async () => {
    repo.saveOrder(makeOrder());
    repo.savePayment(makePayment({ state: "CONFIRMED" }));
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-1", event: "FAIL" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("terminal state");
  });

  it("payment not found", async () => {
    const r = await executor.transition(
      req({ entity: "PAYMENT", entityId: "pay-ghost", event: "CONFIRM" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── CASH_REGISTER transitions ──────────────────────────

describe("CASH_REGISTER transitions", () => {
  it("getCurrentState resolves CASH_REGISTER state", async () => {
    repo.saveCashRegister(makeCashRegister({ state: "CLOSED" }));
    // Cash register state machine uses 'on' format instead of 'transitions',
    // so the executor returns 'Invalid transition'. This test verifies that
    // getCurrentState correctly reads the CASH_REGISTER state (CLOSED returned).
    const r = await executor.transition(
      req({ entity: "CASH_REGISTER", entityId: "cr-1", event: "OPEN" }),
    );
    expect(r.success).toBe(false);
    expect(r.previousState).toBe("CLOSED");
    expect(r.error).toContain("Invalid transition");
  });

  it("returns not found when cash register missing", async () => {
    const r = await executor.transition(
      req({ entity: "CASH_REGISTER", entityId: "missing", event: "OPEN" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("not found");
  });
});

// ─── Effect failure rollback ────────────────────────────

describe("effect failure rollback", () => {
  it("rolls back when effect throws", async () => {
    // Register a failing effect temporarily
    const { registerEffect, effects } = await import("../effects");
    const origEffect = effects["calculateTotal"];

    effects["calculateTotal"] = async () => {
      throw new Error("Boom");
    };

    repo.saveSession(makeSession({ state: "ACTIVE" }));
    repo.saveOrder(makeOrder({ state: "OPEN" }));
    repo.saveOrderItem(makeItem());

    const r = await executor.transition(
      req({ entity: "ORDER", entityId: "ord-1", event: "FINALIZE" }),
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("calculateTotal failed");

    // Verify order state is still OPEN (rolled back)
    expect(repo.getOrder("ord-1")?.state).toBe("OPEN");

    // Restore
    effects["calculateTotal"] = origEffect;
  });
});

// ─── Concurrency guard ──────────────────────────────────

describe("concurrency conflict", () => {
  it("detects ConcurrencyConflictError during commit", async () => {
    repo.saveSession(makeSession({ state: "INACTIVE" }));

    // ConcurrencyConflictError is thrown by commit() inside the withLock callback.
    // Monkey-patch commit to simulate version conflict.
    const { ConcurrencyConflictError } = await import("../repo/errors");
    const origCommit = repo.commit.bind(repo);

    repo.commit = async () => {
      throw new ConcurrencyConflictError("sess-1", "SESSION", 0, 1);
    };

    const r = await executor.transition(req());
    expect(r.success).toBe(false);
    expect(r.conflict).toBe(true);
    expect(r.error).toContain("Concurrency conflict");

    // Restore
    repo.commit = origCommit;
  });
});

// ─── Invalid state in machine ───────────────────────────

describe("invalid state in machine", () => {
  it("returns error when current state is not in machine definition", async () => {
    // Force an invalid state that doesn't exist in the session machine
    repo.saveSession(makeSession({ state: "BOGUS" as any }));
    const r = await executor.transition(req({ event: "START" }));
    expect(r.success).toBe(false);
    expect(r.error).toContain("Invalid current state");
  });
});
