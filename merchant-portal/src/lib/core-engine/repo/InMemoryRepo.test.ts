/**
 * InMemoryRepo Tests
 * 
 * Tests for transaction support in save methods.
 * TASK-1.1.1: Passar txId para saveOrder
 * TASK-1.1.2: Passar txId para saveSession
 * TASK-1.1.3: Passar txId para savePayment
 */

import { InMemoryRepo } from './InMemoryRepo';
import type { Order, Session, Payment } from './types';
import { ConcurrencyConflictError } from './errors';

describe('InMemoryRepo.saveOrder', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  afterEach(() => {
    repo.clear();
  });

  describe('TASK-1.1.1: Transaction Support', () => {
    it('should save order directly when txId is not provided', () => {
      const order: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 0,
      };

      repo.saveOrder(order);

      const saved = repo.getOrder('order-1');
      expect(saved).toBeDefined();
      expect(saved?.id).toBe('order-1');
      expect(saved?.state).toBe('OPEN');
      expect(saved?.version).toBe(1);
    });

    it('should save order in transaction when txId is provided', async () => {
      const order: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 0,
      };

      const txId = repo.beginTransaction();
      repo.saveOrder(order, txId);

      // Order should NOT be in main storage yet
      const beforeCommit = repo.getOrder('order-1');
      expect(beforeCommit).toBeUndefined();

      // After commit, order should be saved
      await repo.commit(txId);
      const afterCommit = repo.getOrder('order-1');
      expect(afterCommit).toBeDefined();
      expect(afterCommit?.id).toBe('order-1');
      expect(afterCommit?.state).toBe('OPEN');
    });

    it('should create snapshot when saving in transaction', () => {
      const repo = new InMemoryRepo();
      
      // Create initial order
      const initialOrder: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 1000,
      };
      repo.saveOrder(initialOrder);

      // Start transaction and modify
      const txId = repo.beginTransaction();
      const modifiedOrder: Order = {
        ...initialOrder,
        total_cents: 2000,
        version: 2,
      };
      repo.saveOrder(modifiedOrder, txId);

      // Snapshot should contain original
      const tx = (repo as any).transactions.get(txId);
      expect(tx).toBeDefined();
      expect(tx.snapshot.has('ORDER:order-1')).toBe(true);
      const snapshot = tx.snapshot.get('ORDER:order-1');
      expect(snapshot).toBeDefined();
      expect(snapshot.total_cents).toBe(1000); // Original value

      // Changes should contain modified
      expect(tx.changes.has('ORDER:order-1')).toBe(true);
      const change = tx.changes.get('ORDER:order-1');
      expect(change).toBeDefined();
      expect(change.total_cents).toBe(2000); // Modified value
    });

    it('should throw error if txId does not exist', () => {
      const order: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 0,
      };

      expect(() => {
        repo.saveOrder(order, 'invalid-tx-id');
      }).toThrow('Transaction invalid-tx-id not found');
    });

    it('should increment version when saving in transaction', () => {
      const order: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 0,
      };

      const txId = repo.beginTransaction();
      repo.saveOrder(order, txId);

      const tx = (repo as any).transactions.get(txId);
      const change = tx.changes.get('ORDER:order-1');
      expect(change).toBeDefined();
      expect(change.version).toBe(2); // Incremented from 1 to 2
    });

    it('should preserve order when rollback is called', async () => {
      // Create initial order
      const initialOrder: Order = {
        id: 'order-1',
        session_id: 'session-1',
        state: 'OPEN',
        version: 1,
        total_cents: 1000,
      };
      repo.saveOrder(initialOrder);

      // Start transaction and modify
      const txId = repo.beginTransaction();
      const modifiedOrder: Order = {
        ...initialOrder,
        total_cents: 2000,
        version: 2,
      };
      repo.saveOrder(modifiedOrder, txId);

      // Rollback transaction
      repo.rollback(txId);

      // Order should still have original value
      const saved = repo.getOrder('order-1');
      expect(saved).toBeDefined();
      expect(saved?.total_cents).toBe(1000); // Original value preserved
      expect(saved?.version).toBe(1); // Original version preserved
    });
  });

  describe('TASK-1.1.2: saveSession Transaction Support', () => {
    it('should save session directly when txId is not provided', () => {
      const session: Session = {
        id: 'session-1',
        state: 'INACTIVE',
        version: 1,
      };

      repo.saveSession(session);

      const saved = repo.getSession('session-1');
      expect(saved).toBeDefined();
      expect(saved?.id).toBe('session-1');
      expect(saved?.state).toBe('INACTIVE');
    });

    it('should save session in transaction when txId is provided', async () => {
      const session: Session = {
        id: 'session-1',
        state: 'INACTIVE',
        version: 1,
      };

      const txId = repo.beginTransaction();
      repo.saveSession(session, txId);

      // Session should NOT be in main storage yet
      const beforeCommit = repo.getSession('session-1');
      expect(beforeCommit).toBeUndefined();

      // After commit, session should be saved
      await repo.commit(txId);
      const afterCommit = repo.getSession('session-1');
      expect(afterCommit).toBeDefined();
      expect(afterCommit?.id).toBe('session-1');
    });

    it('should throw error if txId does not exist', () => {
      const session: Session = {
        id: 'session-1',
        state: 'INACTIVE',
        version: 1,
      };

      expect(() => {
        repo.saveSession(session, 'invalid-tx-id');
      }).toThrow('Transaction invalid-tx-id not found');
    });

    it('should increment version when saving in transaction', () => {
      const session: Session = {
        id: 'session-1',
        state: 'INACTIVE',
        version: 1,
      };

      const txId = repo.beginTransaction();
      repo.saveSession(session, txId);

      const tx = (repo as any).transactions.get(txId);
      const change = tx.changes.get('SESSION:session-1');
      expect(change).toBeDefined();
      expect(change.version).toBe(2); // Incremented from 1 to 2
    });
  });

  describe('TASK-1.1.3: savePayment Transaction Support', () => {
    it('should save payment directly when txId is not provided', () => {
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

      const saved = repo.getPayments('order-1');
      expect(saved).toBeDefined();
      expect(saved.length).toBe(1);
      expect(saved[0]?.id).toBe('payment-1');
    });

    it('should save payment in transaction when txId is provided', async () => {
      const payment: Payment = {
        id: 'payment-1',
        order_id: 'order-1',
        session_id: 'session-1',
        method: 'cash',
        amount_cents: 1000,
        state: 'PENDING',
        version: 1,
      };

      const txId = repo.beginTransaction();
      repo.savePayment(payment, txId);

      // Payment should NOT be in main storage yet
      const beforeCommit = repo.getPayments('order-1');
      expect(beforeCommit.length).toBe(0);

      // After commit, payment should be saved
      await repo.commit(txId);
      const afterCommit = repo.getPayments('order-1');
      expect(afterCommit.length).toBe(1);
      expect(afterCommit[0]?.id).toBe('payment-1');
    });

    it('should throw error if txId does not exist', () => {
      const payment: Payment = {
        id: 'payment-1',
        order_id: 'order-1',
        session_id: 'session-1',
        method: 'cash',
        amount_cents: 1000,
        state: 'PENDING',
        version: 1,
      };

      expect(() => {
        repo.savePayment(payment, 'invalid-tx-id');
      }).toThrow('Transaction invalid-tx-id not found');
    });

    it('should increment version when saving in transaction', () => {
      const payment: Payment = {
        id: 'payment-1',
        order_id: 'order-1',
        session_id: 'session-1',
        method: 'cash',
        amount_cents: 1000,
        state: 'PENDING',
        version: 1,
      };

      const txId = repo.beginTransaction();
      repo.savePayment(payment, txId);

      const tx = (repo as any).transactions.get(txId);
      const change = tx.changes.get('PAYMENT:payment-1');
      expect(change).toBeDefined();
      expect(change.version).toBe(2); // Incremented from 1 to 2
    });
  });
});

// ============================================================================
// TASK-1.2.1: Clone Profundo de Order
// ============================================================================

describe('InMemoryRepo.cloneOrder', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return independent copy of order', () => {
    const original: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
      table_id: 'table-1',
    };
    
    const cloned = repo.cloneOrder(original);
    
    // Verify it's a different object reference
    expect(cloned).not.toBe(original);
    
    // Verify all properties are copied
    expect(cloned.id).toBe(original.id);
    expect(cloned.session_id).toBe(original.session_id);
    expect(cloned.state).toBe(original.state);
    expect(cloned.version).toBe(original.version);
    expect(cloned.total_cents).toBe(original.total_cents);
    expect(cloned.table_id).toBe(original.table_id);
  });

  it('should not affect original when modifying clone', () => {
    const original: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    
    const cloned = repo.cloneOrder(original);
    
    // Modify clone
    cloned.state = 'LOCKED';
    cloned.version = 2;
    cloned.total_cents = 2000;
    cloned.table_id = 'table-2';
    
    // Verify original is unchanged
    expect(original.state).toBe('OPEN');
    expect(original.version).toBe(1);
    expect(original.total_cents).toBe(1000);
    expect(original.table_id).toBeUndefined();
    
    // Verify clone has new values
    expect(cloned.state).toBe('LOCKED');
    expect(cloned.version).toBe(2);
    expect(cloned.total_cents).toBe(2000);
    expect(cloned.table_id).toBe('table-2');
  });

  it('should handle order with all optional fields', () => {
    const original: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'LOCKED',
      version: 5,
      total_cents: 5000,
      table_id: 'table-10',
    };
    
    const cloned = repo.cloneOrder(original);
    
    // Verify all fields are cloned
    expect(cloned.id).toBe('order-1');
    expect(cloned.session_id).toBe('session-1');
    expect(cloned.state).toBe('LOCKED');
    expect(cloned.version).toBe(5);
    expect(cloned.total_cents).toBe(5000);
    expect(cloned.table_id).toBe('table-10');
    
    // Modify clone
    cloned.state = 'PAID';
    cloned.total_cents = 6000;
    
    // Original unchanged
    expect(original.state).toBe('LOCKED');
    expect(original.total_cents).toBe(5000);
  });

  it('should handle order with minimal fields', () => {
    const original: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    
    const cloned = repo.cloneOrder(original);
    
    // Verify minimal fields
    expect(cloned.id).toBe('order-1');
    expect(cloned.session_id).toBe('session-1');
    expect(cloned.state).toBe('OPEN');
    expect(cloned.version).toBe(1);
    expect(cloned.total_cents).toBeUndefined();
    expect(cloned.table_id).toBeUndefined();
    
    // Modify clone
    cloned.total_cents = 1000;
    
    // Original unchanged
    expect(original.total_cents).toBeUndefined();
  });
});

// ============================================================================
// TASK-1.2.2: Clone Profundo de Session
// ============================================================================

describe('InMemoryRepo.cloneSession', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return independent copy of session', () => {
    const original: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
      opened_at: new Date('2024-01-01T10:00:00Z'),
    };
    
    const cloned = repo.cloneSession(original);
    
    // Verify it's a different object reference
    expect(cloned).not.toBe(original);
    
    // Verify all properties are copied
    expect(cloned.id).toBe(original.id);
    expect(cloned.state).toBe(original.state);
    expect(cloned.version).toBe(original.version);
    expect(cloned.opened_at).toEqual(original.opened_at);
  });

  it('should not affect original when modifying clone', () => {
    const original: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    
    const cloned = repo.cloneSession(original);
    
    // Modify clone
    cloned.state = 'CLOSED';
    cloned.version = 2;
    cloned.opened_at = new Date('2024-01-01T10:00:00Z');
    cloned.closed_at = new Date('2024-01-01T18:00:00Z');
    
    // Verify original is unchanged
    expect(original.state).toBe('ACTIVE');
    expect(original.version).toBe(1);
    expect(original.opened_at).toBeUndefined();
    expect(original.closed_at).toBeUndefined();
    
    // Verify clone has new values
    expect(cloned.state).toBe('CLOSED');
    expect(cloned.version).toBe(2);
    expect(cloned.opened_at).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(cloned.closed_at).toEqual(new Date('2024-01-01T18:00:00Z'));
  });

  it('should handle session with all optional fields', () => {
    const original: Session = {
      id: 'session-1',
      state: 'CLOSED',
      version: 5,
      opened_at: new Date('2024-01-01T10:00:00Z'),
      closed_at: new Date('2024-01-01T18:00:00Z'),
    };
    
    const cloned = repo.cloneSession(original);
    
    // Verify all fields are cloned
    expect(cloned.id).toBe('session-1');
    expect(cloned.state).toBe('CLOSED');
    expect(cloned.version).toBe(5);
    expect(cloned.opened_at).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(cloned.closed_at).toEqual(new Date('2024-01-01T18:00:00Z'));
    
    // Modify clone
    cloned.state = 'INACTIVE';
    cloned.version = 6;
    
    // Original unchanged
    expect(original.state).toBe('CLOSED');
    expect(original.version).toBe(5);
  });

  it('should handle session with minimal fields', () => {
    const original: Session = {
      id: 'session-1',
      state: 'INACTIVE',
      version: 1,
    };
    
    const cloned = repo.cloneSession(original);
    
    // Verify minimal fields
    expect(cloned.id).toBe('session-1');
    expect(cloned.state).toBe('INACTIVE');
    expect(cloned.version).toBe(1);
    expect(cloned.opened_at).toBeUndefined();
    expect(cloned.closed_at).toBeUndefined();
    
    // Modify clone
    cloned.state = 'ACTIVE';
    cloned.opened_at = new Date();
    
    // Original unchanged
    expect(original.state).toBe('INACTIVE');
    expect(original.opened_at).toBeUndefined();
  });
});

// ============================================================================
// TASK-1.2.3: Clone Profundo de Payment
// ============================================================================

describe('InMemoryRepo.clonePayment', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return independent copy of payment', () => {
    const original: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'cash',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    
    const cloned = repo.clonePayment(original);
    
    // Verify it's a different object reference
    expect(cloned).not.toBe(original);
    
    // Verify all properties are copied
    expect(cloned.id).toBe(original.id);
    expect(cloned.order_id).toBe(original.order_id);
    expect(cloned.session_id).toBe(original.session_id);
    expect(cloned.method).toBe(original.method);
    expect(cloned.amount_cents).toBe(original.amount_cents);
    expect(cloned.state).toBe(original.state);
    expect(cloned.version).toBe(original.version);
  });

  it('should not affect original when modifying clone', () => {
    const original: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'cash',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    
    const cloned = repo.clonePayment(original);
    
    // Modify clone
    cloned.state = 'CONFIRMED';
    cloned.version = 2;
    cloned.amount_cents = 2000;
    cloned.method = 'card';
    
    // Verify original is unchanged
    expect(original.state).toBe('PENDING');
    expect(original.version).toBe(1);
    expect(original.amount_cents).toBe(1000);
    expect(original.method).toBe('cash');
    
    // Verify clone has new values
    expect(cloned.state).toBe('CONFIRMED');
    expect(cloned.version).toBe(2);
    expect(cloned.amount_cents).toBe(2000);
    expect(cloned.method).toBe('card');
  });

  it('should handle payment with all states', () => {
    const states: Payment['state'][] = ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELED'];
    
    for (const state of states) {
      const original: Payment = {
        id: `payment-${state}`,
        order_id: 'order-1',
        session_id: 'session-1',
        method: 'cash',
        amount_cents: 1000,
        state,
        version: 1,
      };
      
      const cloned = repo.clonePayment(original);
      
      // Verify state is cloned correctly
      expect(cloned.state).toBe(state);
      expect(cloned.id).toBe(`payment-${state}`);
      
      // Modify clone
      cloned.state = 'CONFIRMED';
      cloned.version = 2;
      
      // Original unchanged
      expect(original.state).toBe(state);
      expect(original.version).toBe(1);
    }
  });

  it('should handle payment with different methods', () => {
    const methods = ['cash', 'card', 'stripe', 'paypal'];
    
    for (const method of methods) {
      const original: Payment = {
        id: `payment-${method}`,
        order_id: 'order-1',
        session_id: 'session-1',
        method,
        amount_cents: 1000,
        state: 'PENDING',
        version: 1,
      };
      
      const cloned = repo.clonePayment(original);
      
      // Verify method is cloned correctly
      expect(cloned.method).toBe(method);
      
      // Modify clone
      cloned.method = 'other';
      
      // Original unchanged
      expect(original.method).toBe(method);
    }
  });
});

// ============================================================================
// TASK-1.2.4: getOrder retorna clone
// ============================================================================

describe('InMemoryRepo.getOrder (returns clone)', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return clone, not direct reference', () => {
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const retrieved = repo.getOrder('order-1');

    // Verify it's a different object reference
    expect(retrieved).not.toBe(order);
    expect(retrieved).toBeDefined();
    
    // Verify all properties are copied
    if (retrieved) {
      expect(retrieved.id).toBe(order.id);
      expect(retrieved.session_id).toBe(order.session_id);
      expect(retrieved.state).toBe(order.state);
      expect(retrieved.version).toBe(order.version);
      expect(retrieved.total_cents).toBe(order.total_cents);
    }
  });

  it('should not affect internal state when modifying returned order', () => {
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    const retrieved = repo.getOrder('order-1');
    expect(retrieved).toBeDefined();

    // Modify returned order
    if (retrieved) {
      retrieved.state = 'LOCKED';
      retrieved.version = 2;
      retrieved.total_cents = 2000;
      retrieved.table_id = 'table-1';
    }

    // Verify internal state is unchanged
    const internalOrder = (repo as any).orders.get('order-1');
    expect(internalOrder.state).toBe('OPEN');
    expect(internalOrder.version).toBe(1);
    expect(internalOrder.total_cents).toBe(1000);
    expect(internalOrder.table_id).toBeUndefined();
  });

  it('should return undefined for non-existent order', () => {
    const retrieved = repo.getOrder('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should return independent clones on multiple calls', () => {
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(order);

    const retrieved1 = repo.getOrder('order-1');
    const retrieved2 = repo.getOrder('order-1');

    // Both should be clones (different references)
    expect(retrieved1).not.toBe(retrieved2);
    expect(retrieved1).not.toBe(order);
    expect(retrieved2).not.toBe(order);

    // Modifying one should not affect the other
    if (retrieved1 && retrieved2) {
      retrieved1.state = 'LOCKED';
      expect(retrieved2.state).toBe('OPEN');
    }
  });
});

// ============================================================================
// TASK-1.2.5: getSession retorna clone
// ============================================================================

describe('InMemoryRepo.getSession (returns clone)', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return clone, not direct reference', () => {
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
      opened_at: new Date('2024-01-01T10:00:00Z'),
    };
    repo.saveSession(session);

    const retrieved = repo.getSession('session-1');

    // Verify it's a different object reference
    expect(retrieved).not.toBe(session);
    expect(retrieved).toBeDefined();
    
    // Verify all properties are copied
    if (retrieved) {
      expect(retrieved.id).toBe(session.id);
      expect(retrieved.state).toBe(session.state);
      expect(retrieved.version).toBe(session.version);
      expect(retrieved.opened_at).toEqual(session.opened_at);
    }
  });

  it('should not affect internal state when modifying returned session', () => {
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const retrieved = repo.getSession('session-1');
    expect(retrieved).toBeDefined();

    // Modify returned session
    if (retrieved) {
      retrieved.state = 'CLOSED';
      retrieved.version = 2;
      retrieved.opened_at = new Date('2024-01-01T10:00:00Z');
      retrieved.closed_at = new Date('2024-01-01T18:00:00Z');
    }

    // Verify internal state is unchanged
    const internalSession = (repo as any).sessions.get('session-1');
    expect(internalSession.state).toBe('ACTIVE');
    expect(internalSession.version).toBe(1);
    expect(internalSession.opened_at).toBeUndefined();
    expect(internalSession.closed_at).toBeUndefined();
  });

  it('should return undefined for non-existent session', () => {
    const retrieved = repo.getSession('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should return independent clones on multiple calls', () => {
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    const retrieved1 = repo.getSession('session-1');
    const retrieved2 = repo.getSession('session-1');

    // Both should be clones (different references)
    expect(retrieved1).not.toBe(retrieved2);
    expect(retrieved1).not.toBe(session);
    expect(retrieved2).not.toBe(session);

    // Modifying one should not affect the other
    if (retrieved1 && retrieved2) {
      retrieved1.state = 'CLOSED';
      expect(retrieved2.state).toBe('ACTIVE');
    }
  });
});

// ============================================================================
// TASK-1.2.6: getPayments retorna clones
// ============================================================================

describe('InMemoryRepo.getPayments (returns clones)', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should return clones, not direct references', () => {
    const payment1: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'cash',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    const payment2: Payment = {
      id: 'payment-2',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'card',
      amount_cents: 2000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(payment1);
    repo.savePayment(payment2);

    const retrieved = repo.getPayments('order-1');

    // Verify it's a different array
    const internalPayments = (repo as any).payments.get('order-1');
    expect(retrieved).not.toBe(internalPayments);
    expect(retrieved.length).toBe(2);
    
    // Verify payments are clones (different references)
    expect(retrieved[0]).not.toBe(payment1);
    expect(retrieved[1]).not.toBe(payment2);
    
    // Verify all properties are copied
    expect(retrieved[0].id).toBe(payment1.id);
    expect(retrieved[0].amount_cents).toBe(payment1.amount_cents);
    expect(retrieved[1].id).toBe(payment2.id);
    expect(retrieved[1].amount_cents).toBe(payment2.amount_cents);
  });

  it('should not affect internal state when modifying returned payments', () => {
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

    const retrieved = repo.getPayments('order-1');
    expect(retrieved.length).toBe(1);

    // Modify returned payment
    if (retrieved[0]) {
      retrieved[0].state = 'CONFIRMED';
      retrieved[0].version = 2;
      retrieved[0].amount_cents = 2000;
      retrieved[0].method = 'card';
    }

    // Verify internal state is unchanged
    const internalPayments = (repo as any).payments.get('order-1');
    expect(internalPayments[0].state).toBe('PENDING');
    expect(internalPayments[0].version).toBe(1);
    expect(internalPayments[0].amount_cents).toBe(1000);
    expect(internalPayments[0].method).toBe('cash');
  });

  it('should return empty array for order with no payments', () => {
    const retrieved = repo.getPayments('non-existent');
    expect(retrieved).toEqual([]);
    expect(Array.isArray(retrieved)).toBe(true);
  });

  it('should return independent clones on multiple calls', () => {
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

    const retrieved1 = repo.getPayments('order-1');
    const retrieved2 = repo.getPayments('order-1');

    // Both should be different arrays
    expect(retrieved1).not.toBe(retrieved2);
    
    // Payments should be clones (different references)
    expect(retrieved1[0]).not.toBe(retrieved2[0]);

    // Modifying one should not affect the other
    if (retrieved1[0] && retrieved2[0]) {
      retrieved1[0].state = 'CONFIRMED';
      expect(retrieved2[0].state).toBe('PENDING');
    }
  });
});

// ============================================================================
// TASK-1.2.7: Snapshot e Rollback
// ============================================================================

describe('InMemoryRepo.rollback (restores from snapshot)', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should restore order state from snapshot on rollback', () => {
    // Create initial order
    const initialOrder: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(initialOrder);

    // Start transaction and modify order
    const txId = repo.beginTransaction();
    const modifiedOrder: Order = {
      ...initialOrder,
      state: 'LOCKED',
      version: 2,
      total_cents: 2000,
    };
    repo.saveOrder(modifiedOrder, txId);

    // Verify order is modified in transaction but not committed
    const beforeRollback = repo.getOrder('order-1');
    expect(beforeRollback?.state).toBe('OPEN'); // Still original (not committed)
    expect(beforeRollback?.total_cents).toBe(1000);

    // Rollback transaction
    repo.rollback(txId);

    // Verify order is restored to original state
    const afterRollback = repo.getOrder('order-1');
    expect(afterRollback?.state).toBe('OPEN');
    expect(afterRollback?.version).toBe(1);
    expect(afterRollback?.total_cents).toBe(1000);
  });

  it('should restore session state from snapshot on rollback', () => {
    // Create initial session
    const initialSession: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(initialSession);

    // Start transaction and modify session
    const txId = repo.beginTransaction();
    const modifiedSession: Session = {
      ...initialSession,
      state: 'CLOSED',
      version: 2,
      closed_at: new Date(),
    };
    repo.saveSession(modifiedSession, txId);

    // Rollback transaction
    repo.rollback(txId);

    // Verify session is restored to original state
    const afterRollback = repo.getSession('session-1');
    expect(afterRollback?.state).toBe('ACTIVE');
    expect(afterRollback?.version).toBe(1);
    expect(afterRollback?.closed_at).toBeUndefined();
  });

  it('should restore payment state from snapshot on rollback', () => {
    // Create initial payment
    const initialPayment: Payment = {
      id: 'payment-1',
      order_id: 'order-1',
      session_id: 'session-1',
      method: 'cash',
      amount_cents: 1000,
      state: 'PENDING',
      version: 1,
    };
    repo.savePayment(initialPayment);

    // Start transaction and modify payment
    const txId = repo.beginTransaction();
    const modifiedPayment: Payment = {
      ...initialPayment,
      state: 'CONFIRMED',
      version: 2,
      amount_cents: 2000,
    };
    repo.savePayment(modifiedPayment, txId);

    // Rollback transaction
    repo.rollback(txId);

    // Verify payment is restored to original state
    const afterRollback = repo.getPayments('order-1');
    expect(afterRollback.length).toBe(1);
    expect(afterRollback[0].state).toBe('PENDING');
    expect(afterRollback[0].version).toBe(1);
    expect(afterRollback[0].amount_cents).toBe(1000);
  });

  it('should remove entity created in transaction on rollback', () => {
    // Start transaction and create new order
    const txId = repo.beginTransaction();
    const newOrder: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(newOrder, txId);

    // Verify order doesn't exist yet (not committed)
    const beforeRollback = repo.getOrder('order-1');
    expect(beforeRollback).toBeUndefined();

    // Rollback transaction
    repo.rollback(txId);

    // Verify order still doesn't exist (was never committed)
    const afterRollback = repo.getOrder('order-1');
    expect(afterRollback).toBeUndefined();
  });

  it('should restore multiple entities from snapshot on rollback', () => {
    // Create initial entities
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

    // Start transaction and modify all
    const txId = repo.beginTransaction();
    repo.saveSession({ ...session, state: 'CLOSED', version: 2 }, txId);
    repo.saveOrder({ ...order, state: 'LOCKED', version: 2, total_cents: 2000 }, txId);
    repo.savePayment({ ...payment, state: 'CONFIRMED', version: 2 }, txId);

    // Rollback transaction
    repo.rollback(txId);

    // Verify all entities are restored
    const restoredSession = repo.getSession('session-1');
    expect(restoredSession?.state).toBe('ACTIVE');
    expect(restoredSession?.version).toBe(1);

    const restoredOrder = repo.getOrder('order-1');
    expect(restoredOrder?.state).toBe('OPEN');
    expect(restoredOrder?.version).toBe(1);
    expect(restoredOrder?.total_cents).toBe(1000);

    const restoredPayments = repo.getPayments('order-1');
    expect(restoredPayments.length).toBe(1);
    expect(restoredPayments[0].state).toBe('PENDING');
    expect(restoredPayments[0].version).toBe(1);
  });
});

// ============================================================================
// TASK-1.3.1 e TASK-1.3.2: Detecção de Conflito de Versão
// ============================================================================

describe('InMemoryRepo.commit (version conflict detection)', () => {
  let repo: InMemoryRepo;

  beforeEach(() => {
    repo = new InMemoryRepo();
  });

  it('should throw ConcurrencyConflictError when order version changed', async () => {
    // Create initial order
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(order);

    // Start transaction and modify order
    const txId = repo.beginTransaction();
    const modifiedOrder: Order = {
      ...order,
      state: 'LOCKED',
      version: 2,
    };
    repo.saveOrder(modifiedOrder, txId);

    // Simulate concurrent modification: change order version externally
    const concurrentOrder: Order = {
      ...order,
      state: 'LOCKED',
      version: 2, // External modification changed version
    };
    repo.saveOrder(concurrentOrder); // Save directly (outside transaction)

    // Commit should detect version conflict
    await expect(repo.commit(txId)).rejects.toThrow(ConcurrencyConflictError);
    
    // Verify error details
    try {
      await repo.commit(txId);
      fail('Should have thrown ConcurrencyConflictError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ConcurrencyConflictError);
      if (error instanceof ConcurrencyConflictError) {
        expect(error.entityType).toBe('ORDER');
        expect(error.entityId).toBe('order-1');
        expect(error.expectedVersion).toBe(1); // Version from snapshot
        expect(error.actualVersion).toBe(2); // Current version
      }
    }
  });

  it('should throw ConcurrencyConflictError when session version changed', async () => {
    // Create initial session
    const session: Session = {
      id: 'session-1',
      state: 'ACTIVE',
      version: 1,
    };
    repo.saveSession(session);

    // Start transaction and modify session
    const txId = repo.beginTransaction();
    const modifiedSession: Session = {
      ...session,
      state: 'CLOSED',
      version: 2,
    };
    repo.saveSession(modifiedSession, txId);

    // Simulate concurrent modification
    const concurrentSession: Session = {
      ...session,
      state: 'CLOSED',
      version: 2,
    };
    repo.saveSession(concurrentSession);

    // Commit should detect version conflict
    await expect(repo.commit(txId)).rejects.toThrow(ConcurrencyConflictError);
    
    // Verify error details
    try {
      await repo.commit(txId);
      fail('Should have thrown ConcurrencyConflictError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ConcurrencyConflictError);
      if (error instanceof ConcurrencyConflictError) {
        expect(error.entityType).toBe('SESSION');
        expect(error.entityId).toBe('session-1');
        expect(error.expectedVersion).toBe(1);
        expect(error.actualVersion).toBe(2);
      }
    }
  });

  it('should throw ConcurrencyConflictError when payment version changed', async () => {
    // Create initial payment
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

    // Start transaction and modify payment
    const txId = repo.beginTransaction();
    const modifiedPayment: Payment = {
      ...payment,
      state: 'CONFIRMED',
      version: 2,
    };
    repo.savePayment(modifiedPayment, txId);

    // Simulate concurrent modification
    const concurrentPayment: Payment = {
      ...payment,
      state: 'CONFIRMED',
      version: 2,
    };
    repo.savePayment(concurrentPayment);

    // Commit should detect version conflict
    await expect(repo.commit(txId)).rejects.toThrow(ConcurrencyConflictError);
    
    // Verify error details
    try {
      await repo.commit(txId);
      fail('Should have thrown ConcurrencyConflictError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ConcurrencyConflictError);
      if (error instanceof ConcurrencyConflictError) {
        expect(error.entityType).toBe('PAYMENT');
        expect(error.entityId).toBe('payment-1');
        expect(error.expectedVersion).toBe(1);
        expect(error.actualVersion).toBe(2);
      }
    }
  });

  it('should commit successfully when version matches', async () => {
    // Create initial order
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(order);

    // Start transaction and modify order
    const txId = repo.beginTransaction();
    const modifiedOrder: Order = {
      ...order,
      state: 'LOCKED',
      version: 1, // Keep original version (saveOrder will increment it to 2)
    };
    repo.saveOrder(modifiedOrder, txId);

    // Commit should succeed (no concurrent modification)
    await expect(repo.commit(txId)).resolves.not.toThrow();

    // Verify order was committed
    // saveOrder increments version: 1 -> 2 in changes, so after commit it's 2
    const committed = repo.getOrder('order-1');
    expect(committed?.state).toBe('LOCKED');
    expect(committed?.version).toBe(2);
  });

  it('should commit successfully when creating new entity', async () => {
    // Start transaction and create new order (no snapshot = no version check)
    const txId = repo.beginTransaction();
    const newOrder: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
    };
    repo.saveOrder(newOrder, txId);

    // Commit should succeed (new entity has no version conflict)
    await expect(repo.commit(txId)).resolves.not.toThrow();

    // Verify order was created
    const created = repo.getOrder('order-1');
    expect(created).toBeDefined();
    expect(created?.state).toBe('OPEN');
  });
});
