/**
 * CoreExecutor State-Machine Transition Tests
 *
 * Tests that the CoreExecutor validates state-machine transitions,
 * guards, and effects correctly using the InMemoryRepo.
 */

import { CoreExecutor } from "../../core-engine/executor/CoreExecutor";
import { InMemoryRepo } from "../../core-engine/repo/InMemoryRepo";
import type { Order, OrderItem, Session } from "../../core-engine/repo/types";

describe("CoreExecutor: Session Transitions", () => {
  let repo: InMemoryRepo;
  let executor: CoreExecutor;

  beforeEach(() => {
    repo = new InMemoryRepo();
    executor = new CoreExecutor(repo);
  });

  afterEach(() => repo.clear());

  it("INACTIVE → START → ACTIVE", async () => {
    const session: Session = { id: "s1", state: "INACTIVE", version: 1 };
    repo.saveSession(session);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "SESSION",
      entityId: "s1",
      event: "START",
    });

    expect(result.success).toBe(true);
    expect(result.previousState).toBe("INACTIVE");
    expect(result.newState).toBe("ACTIVE");
  });

  it("ACTIVE → CLOSE → CLOSED (no open orders)", async () => {
    const session: Session = { id: "s1", state: "ACTIVE", version: 1 };
    repo.saveSession(session);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "SESSION",
      entityId: "s1",
      event: "CLOSE",
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBe("CLOSED");
  });

  it("ACTIVE → CLOSE fails with open orders (guard)", async () => {
    const session: Session = { id: "s1", state: "ACTIVE", version: 1 };
    repo.saveSession(session);
    const order: Order = {
      id: "o1",
      session_id: "s1",
      state: "OPEN",
      version: 1,
    };
    repo.saveOrder(order);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "SESSION",
      entityId: "s1",
      event: "CLOSE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid event from INACTIVE", async () => {
    const session: Session = { id: "s1", state: "INACTIVE", version: 1 };
    repo.saveSession(session);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "SESSION",
      entityId: "s1",
      event: "CLOSE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown entity type", async () => {
    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "NONEXISTENT" as any,
      entityId: "x",
      event: "START",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown entity");
  });
});

describe("CoreExecutor: Order Transitions", () => {
  let repo: InMemoryRepo;
  let executor: CoreExecutor;

  beforeEach(() => {
    repo = new InMemoryRepo();
    executor = new CoreExecutor(repo);
    // Pre-create session for order tests
    repo.saveSession({ id: "s1", state: "ACTIVE", version: 1 });
  });

  afterEach(() => repo.clear());

  it("OPEN + ADD_ITEM requires Supabase — effect fails gracefully without backend", async () => {
    // ADD_ITEM effect calls supabase.rpc('add_order_item_atomic').
    // Without supabase configured, the effect fails, making result.success = false.
    const order: Order = {
      id: "o1",
      session_id: "s1",
      state: "OPEN",
      version: 1,
    };
    repo.saveOrder(order);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "ORDER",
      entityId: "o1",
      event: "ADD_ITEM",
      context: {
        product_id: "prod-1",
        name: "Cafe",
        quantity: 2,
        price_snapshot_cents: 150,
      },
    });

    // Effect fails → success = false (expected without supabase)
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("OPEN → FINALIZE → LOCKED (with items)", async () => {
    const order: Order = {
      id: "o1",
      session_id: "s1",
      state: "OPEN",
      version: 1,
    };
    repo.saveOrder(order);

    const item: OrderItem = {
      id: "item-1",
      order_id: "o1",
      product_id: "p1",
      name: "Bica",
      quantity: 1,
      price_snapshot_cents: 100,
      subtotal_cents: 100,
    };
    repo.saveOrderItem(item);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "ORDER",
      entityId: "o1",
      event: "FINALIZE",
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBe("LOCKED");
  });

  it("OPEN → FINALIZE fails without items (guard: orderHasItems)", async () => {
    const order: Order = {
      id: "o1",
      session_id: "s1",
      state: "OPEN",
      version: 1,
    };
    repo.saveOrder(order);
    // No items added

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "ORDER",
      entityId: "o1",
      event: "FINALIZE",
    });

    expect(result.success).toBe(false);
  });

  it("OPEN → CANCEL → CANCELED", async () => {
    const order: Order = {
      id: "o1",
      session_id: "s1",
      state: "OPEN",
      version: 1,
    };
    repo.saveOrder(order);

    const result = await executor.transition({
      tenantId: "tenant-1",
      entity: "ORDER",
      entityId: "o1",
      event: "CANCEL",
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBe("CANCELED");
  });
});
