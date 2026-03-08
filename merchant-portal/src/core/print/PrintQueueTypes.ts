/**
 * Types for local print queue (offline spooler).
 * Jobs are sent to Core when back online.
 */

export type PrintJobType = "kitchen_ticket" | "receipt" | "fiscal";

export type PrintJobStatus = "pending" | "sent" | "failed";

export interface PrintQueueJob {
  id: string;
  type: PrintJobType;
  orderId: string;
  restaurantId: string;
  /** Snapshot for kitchen_ticket: { tableNumber, items, ... } for FiscalPrinter */
  payload: Record<string, unknown>;
  status: PrintJobStatus;
  createdAt: number;
  attempts: number;
  lastError?: string;
}
