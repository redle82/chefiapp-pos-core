// @ts-nocheck
import type {
  Payout,
  PayoutsFilters,
  Transaction,
  TransactionSummary,
  TransactionsFilters,
} from "../types";

// TODO: integrar com gm_payments / orders; estrutura pronta para backend.
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    orderId: "ord_101",
    amount: 42.5,
    currency: "EUR",
    status: "PROCESSED",
    method: "CARD",
    channel: "POS",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    provider: "Internal",
  },
  {
    id: "tx_2",
    orderId: "ord_102",
    amount: 18.0,
    currency: "EUR",
    status: "PROCESSED",
    method: "ONLINE",
    channel: "QR",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    provider: "Stripe",
  },
  {
    id: "tx_3",
    orderId: "ord_103",
    amount: 35.0,
    currency: "EUR",
    status: "REFUNDED",
    method: "CARD",
    channel: "POS",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    provider: "Internal",
  },
];

const MOCK_PAYOUTS: Payout[] = [
  {
    id: "po_1",
    amount: 1250.0,
    currency: "EUR",
    periodStart: new Date(Date.now() - 86400000 * 14).toISOString(),
    periodEnd: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: "SENT",
    destination: "BANK_ACCOUNT",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getTransactions(
  _locationId: string,
  _filters?: TransactionsFilters
): Promise<Transaction[]> {
  await delay(250);
  // Mock: retornar lista; filtros ignorados até integrar backend.
  return [...MOCK_TRANSACTIONS];
}

export async function getTransactionSummary(
  _locationId: string,
  _filters?: TransactionsFilters
): Promise<TransactionSummary> {
  await delay(200);
  const list = MOCK_TRANSACTIONS;
  const totalReceived = list
    .filter((t) => t.status === "PROCESSED")
    .reduce((s, t) => s + t.amount, 0);
  const totalRefunded = list
    .filter((t) => t.status === "REFUNDED")
    .reduce((s, t) => s + t.amount, 0);
  return {
    count: list.length,
    totalReceived,
    totalRefunded,
  };
}

export async function getPayouts(
  _locationId: string,
  _filters?: PayoutsFilters
): Promise<Payout[]> {
  await delay(200);
  return [...MOCK_PAYOUTS];
}
