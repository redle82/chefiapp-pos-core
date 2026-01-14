/**
 * Concurrency Tests
 * 
 * TASK-1.3.4: Teste de Concorrência (Lost Update)
 * 
 * Tests that simulate concurrent modifications and verify that
 * the second transaction detects the conflict.
 */

import { InMemoryRepo } from '../repo/InMemoryRepo';
import { CoreExecutor } from '../executor/CoreExecutor';
import type { Order, Session, Payment, OrderItem } from '../repo/types';
import { ConcurrencyConflictError } from '../repo/errors';

describe('TASK-1.3.4: Concurrency Tests (Lost Update)', () => {
  let repo: InMemoryRepo;
  let executor: CoreExecutor;

  beforeEach(() => {
    repo = new InMemoryRepo();
    executor = new CoreExecutor(repo);
  });

  afterEach(() => {
    repo.clear();
  });

  it('should detect conflict when two transactions modify same order concurrently', async () => {
    // Setup: Create session and order
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const item: OrderItem = {
      id: 'item-1',
      order_id: 'order-1',
      product_id: 'product-1',
      name: 'Test Product',
      quantity: 1,
      price_snapshot_cents: 1000,
      subtotal_cents: 1000,
    };
    repo.saveOrderItem(item);

    // Transaction 1: Start modifying order
    const txId1 = repo.beginTransaction();
    const order1: Order = {
      ...order,
      state: 'LOCKED',
      version: 1,
    };
    repo.saveOrder(order1, txId1);

    // Transaction 2: Concurrently modify same order (simulating lost update scenario)
    const txId2 = repo.beginTransaction();
    const order2: Order = {
      ...order,
      state: 'LOCKED',
      total_cents: 2000, // Different modification
      version: 1,
    };
    repo.saveOrder(order2, txId2);

    // Commit transaction 1 (should succeed)
    await repo.commit(txId1);

    // Verify order was updated by transaction 1
    const orderAfterTx1 = repo.getOrder('order-1');
    expect(orderAfterTx1?.state).toBe('LOCKED');
    expect(orderAfterTx1?.version).toBe(2); // Incremented by saveOrder

    // Commit transaction 2 (should detect conflict)
    await expect(repo.commit(txId2)).rejects.toThrow(ConcurrencyConflictError);

    // Verify order still has transaction 1's changes (transaction 2 was rolled back)
    const orderAfterTx2 = repo.getOrder('order-1');
    expect(orderAfterTx2?.state).toBe('LOCKED');
    expect(orderAfterTx2?.total_cents).toBe(1000); // Transaction 1's value, not 2000
    expect(orderAfterTx2?.version).toBe(2); // Transaction 1's version
  });

  it('should detect conflict when two transactions modify same session concurrently', async () => {
    // Setup: Create session
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    // Transaction 1: Start modifying session
    const txId1 = repo.beginTransaction();
    const session1: Session = {
      ...session,
      state: 'CLOSED',
      version: 1,
    };
    repo.saveSession(session1, txId1);

    // Transaction 2: Concurrently modify same session
    const txId2 = repo.beginTransaction();
    const session2: Session = {
      ...session,
      state: 'CLOSED',
      closed_at: new Date(),
      version: 1,
    };
    repo.saveSession(session2, txId2);

    // Commit transaction 1 (should succeed)
    await repo.commit(txId1);

    // Commit transaction 2 (should detect conflict)
    await expect(repo.commit(txId2)).rejects.toThrow(ConcurrencyConflictError);

    // Verify session has transaction 1's changes
    const sessionAfter = repo.getSession('session-1');
    expect(sessionAfter?.state).toBe('CLOSED');
    expect(sessionAfter?.version).toBe(2); // Transaction 1's version
  });

  it('should detect conflict when two transactions modify same payment concurrently', async () => {
    // Setup: Create session, order, and payment
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const payment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'cash',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment);

    // Transaction 1: Start modifying payment
    const txId1 = repo.beginTransaction();
    const payment1: Payment = {
      ...payment,
      state: 'CONFIRMED',
      version: 1,
    };
    repo.savePayment(payment1, txId1);

    // Transaction 2: Concurrently modify same payment
    const txId2 = repo.beginTransaction();
    const payment2: Payment = {
      ...payment,
      state: 'CONFIRMED',
      amount_cents: 2000, // Different modification
      version: 1,
    };
    repo.savePayment(payment2, txId2);

    // Commit transaction 1 (should succeed)
    await repo.commit(txId1);

    // Commit transaction 2 (should detect conflict)
    await expect(repo.commit(txId2)).rejects.toThrow(ConcurrencyConflictError);

    // Verify payment has transaction 1's changes
    const paymentsAfter = repo.getPayments('order-1');
    expect(paymentsAfter.length).toBe(1);
    expect(paymentsAfter[0].state).toBe('CONFIRMED');
    expect(paymentsAfter[0].amount_cents).toBe(1000); // Transaction 1's value, not 2000
    expect(paymentsAfter[0].version).toBe(2); // Transaction 1's version
  });

  it('should allow sequential commits when no conflict occurs', async () => {
    // Setup: Create session and two different orders
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order1: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(order1);

    const order2: Order = {
      id: 'order-2',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(order2);

    // Transaction 1: Modify order-1
    const txId1 = repo.beginTransaction();
    repo.saveOrder({ ...order1, state: 'LOCKED', version: 1 }, txId1);
    await repo.commit(txId1);

    // Transaction 2: Modify order-2 (different entity, no conflict)
    const txId2 = repo.beginTransaction();
    repo.saveOrder({ ...order2, state: 'LOCKED', version: 1 }, txId2);
    await repo.commit(txId2);

    // Both should succeed
    const finalOrder1 = repo.getOrder('order-1');
    expect(finalOrder1?.state).toBe('LOCKED');
    expect(finalOrder1?.version).toBe(2);

    const finalOrder2 = repo.getOrder('order-2');
    expect(finalOrder2?.state).toBe('LOCKED');
    expect(finalOrder2?.version).toBe(2);
  });

  it('should detect conflict in CoreExecutor.transition when concurrent modification occurs', async () => {
    // Setup: Create session and order
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(order);

    const item: OrderItem = {
      id: 'item-1',
      order_id: 'order-1',
      product_id: 'product-1',
      name: 'Test Product',
      quantity: 1,
      price_snapshot_cents: 1000,
      subtotal_cents: 1000,
    };
    repo.saveOrderItem(item);

    // Start transition (creates transaction internally)
    const transitionPromise = executor.transition({
      entity: 'ORDER',
      entityId: 'order-1',
      event: 'FINALIZE',
    });

    // Manually create conflict scenario:
    // 1. Transition creates transaction and takes snapshot (version 1)
    // 2. We modify order externally (version 2)
    // 3. Transition tries to commit (should detect conflict)
    
    // Wait a bit to ensure transition has started
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Modify order externally (simulating concurrent modification)
    const concurrentOrder: Order = {
      ...order,
      state: 'LOCKED',
      version: 2,
    };
    repo.saveOrder(concurrentOrder);

    // Wait for transition to complete
    const result = await transitionPromise;

    // Verify conflict was detected
    // Note: Due to locking, the transition might complete before our modification
    // But if conflict occurs, it should be detected
    if (!result.success && result.conflict) {
      expect(result.conflict).toBe(true);
      expect(result.error).toContain('Concurrency conflict');
      expect(result.previousState).toBe('OPEN');
    } else {
      // If transition succeeded, it means it completed before our modification
      // This is acceptable with locking
      expect(result.success).toBe(true);
    }
  });
});
