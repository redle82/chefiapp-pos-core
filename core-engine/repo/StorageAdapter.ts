import type { CashRegister, Order, OrderItem, Payment, Session } from "./types";

export type LockId = string;

export interface PaymentLookupResult {
  orderId: string;
  payment: Payment;
}

export interface StorageAdapter {
  beginTransaction(): string;
  commit(txId: string): Promise<void>;
  rollback(txId: string): void;

  withLock<T>(id: LockId | LockId[], operation: () => Promise<T>): Promise<T>;

  getSession(id: string): Session | undefined;
  saveSession(session: Session, txId?: string): void;

  getOrder(id: string): Order | undefined;
  saveOrder(order: Order, txId?: string): void;
  getOrdersBySession(sessionId: string): Order[];

  getOrderItems(orderId: string): OrderItem[];
  saveOrderItem(item: OrderItem, txId?: string): void;

  getPayments(orderId: string): Payment[];
  savePayment(payment: Payment, txId?: string): void;
  getPaymentById(paymentId: string): Payment | undefined;
  getConfirmedPaymentsTotalCents(orderId: string): number;

  getCashRegister(id: string): CashRegister | undefined;
  saveCashRegister(register: CashRegister, txId?: string): void;

  findPaymentById(paymentId: string): PaymentLookupResult | null;
}

export interface StorageAdapterFactory {
  create(): StorageAdapter;
}
