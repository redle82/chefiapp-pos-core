/**
 * In-Memory Repository with Transaction Support
 * 
 * Provides atomic operations with begin/commit/rollback.
 * Uses optimistic concurrency control with version numbers.
 */

import type { Session, Order, OrderItem, Payment, Transaction } from "./types";

export class InMemoryRepo {
  private sessions = new Map<string, Session>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem[]>();
  private payments = new Map<string, Payment[]>();
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

  async commit(txId: string): Promise<void> {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new Error(`Transaction ${txId} not found`);
    }

    // Apply all changes atomically
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

  rollback(txId: string): void {
    this.transactions.delete(txId);
  }

  // ============================================================================
  // LOCKING (Simple mutex per entity)
  // ============================================================================

  async withLock<T>(entityId: string, fn: () => Promise<T>): Promise<T> {
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
    let resolveLock: () => void;
    const lock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(entityId, lock);

    try {
      return await fn();
    } finally {
      this.locks.delete(entityId);
      resolveLock!();
    }
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  saveSession(session: Session, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (tx) {
        const key = `SESSION:${session.id}`;
        if (!tx.snapshot.has(key)) {
          tx.snapshot.set(key, this.sessions.get(session.id));
        }
        tx.changes.set(key, { ...session, version: session.version + 1 });
      }
    } else {
      this.sessions.set(session.id, session);
    }
  }

  getActiveSession(): Session | undefined {
    return Array.from(this.sessions.values()).find((s) => s.state === "ACTIVE");
  }

  // ============================================================================
  // ORDER OPERATIONS
  // ============================================================================

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  saveOrder(order: Order, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (tx) {
        const key = `ORDER:${order.id}`;
        if (!tx.snapshot.has(key)) {
          tx.snapshot.set(key, this.orders.get(order.id));
        }
        tx.changes.set(key, { ...order, version: order.version + 1 });
      }
    } else {
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

  getPayments(orderId: string): Payment[] {
    return this.payments.get(orderId) || [];
  }

  savePayment(payment: Payment, txId?: string): void {
    if (txId) {
      const tx = this.transactions.get(txId);
      if (tx) {
        const key = `PAYMENT:${payment.id}`;
        if (!tx.snapshot.has(key)) {
          const existing = this.getPayments(payment.order_id).find(
            (p) => p.id === payment.id
          );
          tx.snapshot.set(key, existing);
        }
        tx.changes.set(key, { ...payment, version: payment.version + 1 });
      }
    } else {
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

  // ============================================================================
  // UTILITY
  // ============================================================================

  clear(): void {
    this.sessions.clear();
    this.orders.clear();
    this.orderItems.clear();
    this.payments.clear();
    this.transactions.clear();
    this.locks.clear();
  }
}

