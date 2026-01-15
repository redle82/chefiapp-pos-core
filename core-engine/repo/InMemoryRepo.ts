/**
 * In-Memory Repository with Transaction Support
 * 
 * Provides atomic operations with begin/commit/rollback.
 * Uses optimistic concurrency control with version numbers.
 */

import type { Session, Order, OrderItem, Payment, Transaction, CashRegister } from "./types";
import { ConcurrencyConflictError } from "./errors";

export class InMemoryRepo {
  private sessions = new Map<string, Session>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem[]>();
  private payments = new Map<string, Payment[]>();
  private cashRegisters = new Map<string, CashRegister>();
  private transactions = new Map<string, Transaction>();
  private locks = new Map<string, Promise<void>>(); // Simple mutex per entity

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  beginTransaction(): string {
    const txId = `tx-${Date.now()}-${Math.random()}`;
    const transaction: Transaction = {
      id: txId,
      snapshot: new Map(),
      changes: new Map(),
    };
    this.transactions.set(txId, transaction);
    return txId;
  }

  /**
   * TASK-1.3.1: commit compara versão antes de aplicar mudanças
   * 
   * Verifica se a versão atual do objeto corresponde à versão do snapshot.
   * Se diferente, lança ConcurrencyConflictError (otimistic locking).
   */
  async commit(txId: string): Promise<void> {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new Error(`Transaction ${txId} not found`);
    }

    // TASK-1.3.1: Check version conflicts before applying changes
    for (const [key, value] of tx.changes.entries()) {
      const [entityType, id] = key.split(":");
      const snapshotValue = tx.snapshot.get(key);

      // Only check version if entity existed before (snapshot is not undefined/null)
      if (snapshotValue !== undefined && snapshotValue !== null) {
        let currentVersion: number | undefined;
        let currentEntity: any;

        switch (entityType) {
          case "SESSION":
            currentEntity = this.sessions.get(id);
            currentVersion = currentEntity?.version;
            break;
          case "ORDER":
            currentEntity = this.orders.get(id);
            currentVersion = currentEntity?.version;
            break;
          case "PAYMENT":
            // Find payment in payments array
            for (const [orderId, payments] of this.payments.entries()) {
              const payment = payments.find((p) => p.id === id);
              if (payment) {
                currentEntity = payment;
                currentVersion = payment.version;
                break;
              }
            }
            break;
          case "ORDER_ITEM":
            // OrderItem doesn't have version field, skip check
            break;
        }

        // Compare versions (only for entities with version field)
        if (currentVersion !== undefined && snapshotValue.version !== undefined) {
          const expectedVersion = snapshotValue.version;
          if (currentVersion !== expectedVersion) {
            // Version conflict detected - entity was modified by another transaction
            throw new ConcurrencyConflictError(
              entityType,
              id,
              expectedVersion,
              currentVersion
            );
          }
        }
      }
    }

    // Apply all changes atomically (only if no conflicts)
    for (const [key, value] of tx.changes.entries()) {
      const [entityType, id] = key.split(":");
      switch (entityType) {
        case "SESSION":
          this.sessions.set(id, value as Session);
          break;
        case "ORDER":
          this.orders.set(id, value as Order);
          break;
        case "ORDER_ITEM":
          const items = this.orderItems.get(value.order_id) || [];
          const existingIndex = items.findIndex((item) => item.id === id);
          if (existingIndex >= 0) {
            items[existingIndex] = value as OrderItem;
          } else {
            items.push(value as OrderItem);
          }
          this.orderItems.set(value.order_id, items);
          break;
        case "PAYMENT":
          const payments = this.payments.get(value.order_id) || [];
          const paymentIndex = payments.findIndex((p) => p.id === id);
          if (paymentIndex >= 0) {
            payments[paymentIndex] = value as Payment;
          } else {
            payments.push(value as Payment);
          }
          this.payments.set(value.order_id, payments);
          break;
      }
    }

    this.transactions.delete(txId);
  }

  /**
   * TASK-1.2.7: rollback restaura estado do snapshot
   * 
   * Restaura todos os objetos que foram modificados na transação
   * para o estado original capturado no snapshot.
   */
  rollback(txId: string): void {
    const tx = this.transactions.get(txId);
    if (!tx) {
      // Transaction already deleted or never existed - that's OK
      return;
    }

    // Restore all entities from snapshot
    for (const [key, snapshotValue] of tx.snapshot.entries()) {
      const [entityType, id] = key.split(":");

      if (snapshotValue === undefined || snapshotValue === null) {
        // Entity didn't exist before transaction - remove it
        switch (entityType) {
          case "SESSION":
            this.sessions.delete(id);
            break;
          case "ORDER":
            this.orders.delete(id);
            break;
          case "ORDER_ITEM":
            // Find and remove item from orderItems array
            for (const [orderId, items] of this.orderItems.entries()) {
              const index = items.findIndex((item) => item.id === id);
              if (index >= 0) {
                items.splice(index, 1);
                if (items.length === 0) {
                  this.orderItems.delete(orderId);
                }
                break;
              }
            }
            break;
          case "PAYMENT":
            // Find and remove payment from payments array
            for (const [orderId, payments] of this.payments.entries()) {
              const index = payments.findIndex((p) => p.id === id);
              if (index >= 0) {
                payments.splice(index, 1);
                if (payments.length === 0) {
                  this.payments.delete(orderId);
                }
                break;
              }
            }
            break;
        }
      } else {
        // Entity existed - restore it
        switch (entityType) {
          case "SESSION":
            this.sessions.set(id, snapshotValue as Session);
            break;
          case "ORDER":
            this.orders.set(id, snapshotValue as Order);
            break;
          case "ORDER_ITEM":
            const item = snapshotValue as OrderItem;
            const items = this.orderItems.get(item.order_id) || [];
            const existingIndex = items.findIndex((i) => i.id === id);
            if (existingIndex >= 0) {
              items[existingIndex] = item;
            } else {
              items.push(item);
            }
            this.orderItems.set(item.order_id, items);
            break;
          case "PAYMENT":
            const payment = snapshotValue as Payment;
            const payments = this.payments.get(payment.order_id) || [];
            const paymentIndex = payments.findIndex((p) => p.id === id);
            if (paymentIndex >= 0) {
              payments[paymentIndex] = payment;
            } else {
              payments.push(payment);
            }
            this.payments.set(payment.order_id, payments);
            break;
        }
      }
    }

    // Delete transaction
    this.transactions.delete(txId);
  }

  // ============================================================================
  // LOCKING (Simple mutex per entity)
  // ============================================================================

  /**
   * TASK-1.4.1: Lock múltiplo para evitar deadlocks
   * 
   * Aceita um único entityId (backward compatible) ou array de entityIds.
   * Ordem determinística (sorted) previne deadlocks.
   */
  async withLock<T>(entityIdOrIds: string | string[], fn: () => Promise<T>): Promise<T> {
    // Normalizar para array e ordenar (ordem determinística previne deadlock)
    const entityIds = Array.isArray(entityIdOrIds)
      ? [...entityIdOrIds].sort() // Sort para ordem determinística
      : [entityIdOrIds];

    // TASK-1.4.1: Adquirir todos os locks na ordem determinística
    const acquiredLocks: Array<{ id: string; resolve: () => void }> = [];

    try {
      // Adquirir locks sequencialmente na ordem determinística
      for (const entityId of entityIds) {
        // Wait in loop until we can acquire the lock (prevents race condition)
        while (true) {
          const existingLock = this.locks.get(entityId);
          if (!existingLock) {
            // No lock exists, we can acquire it
            break;
          }
          // Wait for existing lock to be released
          await existingLock;
          // After waiting, check again (another waiter might have acquired it)
          // Loop continues until we successfully acquire the lock
        }

        // Create new lock atomically (we've verified no lock exists)
        let resolveLock: (() => void) | undefined;
        const lock = new Promise<void>((resolve) => {
          resolveLock = resolve;
        });
        this.locks.set(entityId, lock);
        if (resolveLock) {
          acquiredLocks.push({ id: entityId, resolve: resolveLock });
        }
      }

      // Todos os locks adquiridos, executar função
      return await fn();
    } finally {
      // Liberar todos os locks na ordem inversa (boa prática)
      for (let i = acquiredLocks.length - 1; i >= 0; i--) {
        const { id, resolve } = acquiredLocks[i];
        this.locks.delete(id);
        resolve();
      }
    }
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  /**
   * TASK-1.2.5: getSession retorna clone para evitar mutação externa
   * 
   * Retorna uma cópia independente da Session, garantindo que modificações
   * no objeto retornado não afetem o estado interno do repositório.
   */
  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }
    return this.cloneSession(session);
  }

  saveSession(session: Session, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (!tx) {
        throw new Error(`Transaction ${txId} not found`);
      }
      const key = `SESSION:${session.id}`;
      // TASK-1.2.7: Snapshot: salvar estado atual (clone) se ainda não foi salvo
      if (!tx.snapshot.has(key)) {
        const current = this.sessions.get(session.id);
        // Store clone to preserve original state
        tx.snapshot.set(key, current ? this.cloneSession(current) : undefined);
      }
      // Changes: salvar mudança na transação
      tx.changes.set(key, { ...session, version: session.version + 1 });
    } else {
      // Backward compatibility: salvar direto se não há txId
      this.sessions.set(session.id, session);
    }
  }

  getActiveSession(): Session | undefined {
    return Array.from(this.sessions.values()).find((s) => s.state === "ACTIVE");
  }

  // ============================================================================
  // ORDER OPERATIONS
  // ============================================================================

  /**
   * TASK-1.2.4: getOrder retorna clone para evitar mutação externa
   * 
   * Retorna uma cópia independente do Order, garantindo que modificações
   * no objeto retornado não afetem o estado interno do repositório.
   */
  getOrder(id: string): Order | undefined {
    const order = this.orders.get(id);
    if (!order) {
      return undefined;
    }
    return this.cloneOrder(order);
  }

  saveOrder(order: Order, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (!tx) {
        throw new Error(`Transaction ${txId} not found`);
      }
      const key = `ORDER:${order.id}`;
      // TASK-1.2.7: Snapshot: salvar estado atual (clone) se ainda não foi salvo
      if (!tx.snapshot.has(key)) {
        const current = this.orders.get(order.id);
        // Store clone to preserve original state
        tx.snapshot.set(key, current ? this.cloneOrder(current) : undefined);
      }
      // Changes: salvar mudança na transação
      tx.changes.set(key, { ...order, version: order.version + 1 });
    } else {
      // Backward compatibility: salvar direto se não há txId
      this.orders.set(order.id, order);
    }
  }

  getOrdersBySession(sessionId: string): Order[] {
    return Array.from(this.orders.values()).filter(
      (o) => o.session_id === sessionId
    );
  }

  getOrdersByState(state: Order["state"]): Order[] {
    return Array.from(this.orders.values()).filter((o) => o.state === state);
  }

  // ============================================================================
  // ORDER_ITEM OPERATIONS
  // ============================================================================

  getOrderItems(orderId: string): OrderItem[] {
    return this.orderItems.get(orderId) || [];
  }

  saveOrderItem(item: OrderItem, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (tx) {
        const key = `ORDER_ITEM:${item.id}`;
        if (!tx.snapshot.has(key)) {
          const existing = this.getOrderItems(item.order_id).find(
            (i) => i.id === item.id
          );
          tx.snapshot.set(key, existing);
        }
        tx.changes.set(key, item);
      }
    } else {
      const items = this.orderItems.get(item.order_id) || [];
      const existingIndex = items.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        items[existingIndex] = item;
      } else {
        items.push(item);
      }
      this.orderItems.set(item.order_id, items);
    }
  }

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  /**
   * TASK-1.2.6: getPayments retorna clones para evitar mutação externa
   * 
   * Retorna uma cópia independente do array de Payments, garantindo que modificações
   * nos objetos retornados não afetem o estado interno do repositório.
   */
  getPayments(orderId: string): Payment[] {
    const payments = this.payments.get(orderId) || [];
    // Clone each payment in the array
    return payments.map(payment => this.clonePayment(payment));
  }

  savePayment(payment: Payment, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (!tx) {
        throw new Error(`Transaction ${txId} not found`);
      }
      const key = `PAYMENT:${payment.id}`;
      // Snapshot: salvar estado atual se ainda não foi salvo
      if (!tx.snapshot.has(key)) {
        const existing = this.getPayments(payment.order_id).find(
          (p) => p.id === payment.id
        );
        tx.snapshot.set(key, existing);
      }
      // Changes: salvar mudança na transação
      tx.changes.set(key, { ...payment, version: payment.version + 1 });
    } else {
      // Backward compatibility: salvar direto se não há txId
      const payments = this.payments.get(payment.order_id) || [];
      const existingIndex = payments.findIndex((p) => p.id === payment.id);
      if (existingIndex >= 0) {
        payments[existingIndex] = payment;
      } else {
        payments.push(payment);
      }
      this.payments.set(payment.order_id, payments);
    }
  }

  getConfirmedPaymentsTotalCents(orderId: string): number {
    const payments = this.getPayments(orderId);
    return payments
      .filter((p) => p.state === "CONFIRMED")
      .reduce((sum, p) => sum + p.amount_cents, 0);
  }

  // TASK-1.5: Direct Lookup to avoid O(N) Global Scan
  getPaymentById(paymentId: string): Payment | undefined {
    // This is still technically O(N) relative to orders if we don't index payments globally.
    // Optimizing for simple in-memory: Scan all payments maps? No, build a reverse index?
    // For now, let's keep the scan INSIDE the repo to encapsulate the ugly.
    // Ideally: Maintain a `paymentId -> orderId` map or `paymentId -> Payment` map.

    // Fast path: Scan all order buckets (Plan B)
    for (const payments of this.payments.values()) {
      const found = payments.find(p => p.id === paymentId);
      if (found) return this.clonePayment(found);
    }
    return undefined;
  }


  // ============================================================================
  // CLONING (Deep Clone for Isolation)
  // ============================================================================

  /**
   * TASK-1.2.1: Clone profundo de Order
   * 
   * Retorna uma cópia independente do Order, garantindo que modificações
   * na cópia não afetem o original.
   */
  cloneOrder(order: Order): Order {
    // Use structuredClone if available (Node 17+), otherwise fallback to JSON
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(order);
    }
    // Fallback: JSON serialization (works for plain objects)
    return JSON.parse(JSON.stringify(order)) as Order;
  }

  /**
   * TASK-1.2.2: Clone profundo de Session
   * 
   * Retorna uma cópia independente da Session, garantindo que modificações
   * na cópia não afetem o original.
   */
  cloneSession(session: Session): Session {
    // Use structuredClone if available (Node 17+), otherwise fallback to JSON
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(session);
    }
    // Fallback: JSON serialization (works for plain objects)
    // Note: Date objects will be serialized as strings, need to restore them
    const cloned = JSON.parse(JSON.stringify(session)) as any;
    if (cloned.opened_at) cloned.opened_at = new Date(cloned.opened_at);
    if (cloned.closed_at) cloned.closed_at = new Date(cloned.closed_at);
    return cloned as Session;
  }

  /**
   * TASK-1.2.3: Clone profundo de Payment
   * 
   * Retorna uma cópia independente do Payment, garantindo que modificações
   * na cópia não afetem o original.
   */
  clonePayment(payment: Payment): Payment {
    // Use structuredClone if available (Node 17+), otherwise fallback to JSON
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(payment);
    }
    // Fallback: JSON serialization (works for plain objects)
    return JSON.parse(JSON.stringify(payment)) as Payment;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  // ============================================================================
  // CASH REGISTER OPERATIONS
  // ============================================================================

  getCashRegister(id: string): CashRegister | undefined {
    const register = this.cashRegisters.get(id);
    return register ? this.cloneCashRegister(register) : undefined;
  }

  saveCashRegister(register: CashRegister, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (tx) {
        const key = `CASH_REGISTER:${register.id}`;
        if (!tx.snapshot.has(key)) {
          const existing = this.cashRegisters.get(register.id);
          tx.snapshot.set(key, existing ? this.cloneCashRegister(existing) : null);
        }
        tx.changes.set(key, this.cloneCashRegister(register));
      }
    } else {
      this.cashRegisters.set(register.id, this.cloneCashRegister(register));
    }
  }

  private cloneCashRegister(register: CashRegister): CashRegister {
    return JSON.parse(JSON.stringify(register)) as CashRegister;
  }

  clear(): void {
    this.sessions.clear();
    this.orders.clear();
    this.orderItems.clear();
    this.payments.clear();
    this.cashRegisters.clear();
    this.transactions.clear();
    this.locks.clear();
  }

  getDebugStats() {
    return {
      sessions: this.sessions.size,
      orders: this.orders.size,
      payments: this.payments.size,
      cashRegisters: this.cashRegisters.size,
    };
  }
}

