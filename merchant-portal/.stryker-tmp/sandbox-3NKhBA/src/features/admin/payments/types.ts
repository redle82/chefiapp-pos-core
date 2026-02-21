/**
 * Módulo Pagos — tipos para transações e payouts.
 * Preparado para integração futura com gm_payments, fechamento de caixa e relatórios.
 */
// @ts-nocheck


export type TransactionStatus =
  | "PROCESSED"
  | "REFUNDED"
  | "FAILED"
  | "PENDING";

export type TransactionMethod =
  | "CASH"
  | "CARD"
  | "ONLINE"
  | "WALLET"
  | "OTHER";

export type TransactionChannel =
  | "POS"
  | "QR"
  | "DELIVERY"
  | "RESERVATION";

export type PayoutStatus = "SENT" | "PENDING";

export interface Transaction {
  id: string;
  orderId?: string;
  amount: number;
  currency: "EUR";
  status: TransactionStatus;
  method: TransactionMethod;
  channel: TransactionChannel;
  createdAt: string;
  processedBy?: string;
  provider?: "Stripe" | "SumUp" | "Internal";
}

export interface Payout {
  id: string;
  amount: number;
  currency: "EUR";
  periodStart: string;
  periodEnd: string;
  status: PayoutStatus;
  destination: "BANK_ACCOUNT";
  createdAt: string;
}

export interface TransactionsFilters {
  period?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface PayoutsFilters {
  period?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface TransactionSummary {
  count: number;
  totalReceived: number;
  totalRefunded: number;
}
