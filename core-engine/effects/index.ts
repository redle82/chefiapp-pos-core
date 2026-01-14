/**
 * Effect Engine
 * 
 * Real effect implementations for state transitions.
 * Effects perform data mutations after guard validation.
 */

import type { InMemoryRepo } from "../repo/InMemoryRepo";
import type { Order, Payment } from "../repo/types";

export interface EffectContext {
  repo: InMemoryRepo;
  entityId: string;
  currentState: string;
  newState: string;
  [key: string]: any;
}

// ============================================================================
// ORDER EFFECTS
// ============================================================================

export async function calculateTotal(
  context: EffectContext
): Promise<void> {
  const { repo, entityId, txId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    throw new Error(`Order ${entityId} not found`);
  }

  if (order.state !== "OPEN") {
    throw new Error(`Cannot calculate total: Order ${entityId} is not OPEN`);
  }

  const items = repo.getOrderItems(entityId);
  if (items.length === 0) {
    throw new Error(`Cannot calculate total: Order ${entityId} has no items`);
  }

  // Calculate total from items (using CENTS - integers only)
  const totalCents = items.reduce((sum, item) => {
    const subtotalCents = item.quantity * item.price_snapshot_cents;
    return sum + subtotalCents;
  }, 0);

  // Update order total (will be immutable after LOCKED)
  order.total_cents = totalCents;
  // TASK-1.1.4: Pass txId to saveOrder
  repo.saveOrder(order, txId);
}

export async function lockItems(context: EffectContext): Promise<void> {
  const { repo, entityId, txId } = context;
  // TASK-1.2.4: getOrder returns clone, but we need to preserve changes already in transaction
  // Check if order is already in transaction changes (from calculateTotal)
  const tx = (repo as any).transactions?.get(txId);
  const key = `ORDER:${entityId}`;
  let order: any;
  
  if (tx && tx.changes?.has(key)) {
    // Use order from transaction (preserves changes from calculateTotal)
    order = tx.changes.get(key);
  } else {
    // Get fresh clone if not in transaction yet
    order = repo.getOrder(entityId);
  }
  
  if (!order) {
    throw new Error(`Order ${entityId} not found`);
  }

  // Items are already "locked" by virtue of order state being LOCKED
  // This effect ensures order state is updated
  if (order.state !== "OPEN") {
    throw new Error(`Cannot lock items: Order ${entityId} is not OPEN`);
  }

  order.state = "LOCKED";
  // TASK-1.1.5: Pass txId to saveOrder
  repo.saveOrder(order, txId);
}

export async function applyPaymentToOrder(
  context: EffectContext
): Promise<void> {
  const { repo, entityId, txId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    throw new Error(`Order ${entityId} not found`);
  }

  if (order.state !== "LOCKED") {
    // Order might already be PAID, that's OK
    return;
  }

  // Get all confirmed payments for this order (using CENTS - integers only)
  const payments = repo.getPayments(entityId);
  const confirmedPayments = payments.filter((p) => p.state === "CONFIRMED");
  const totalPaidCents = confirmedPayments.reduce((sum, p) => sum + p.amount_cents, 0);

  // If total paid >= order total, mark as PAID
  if (order.total_cents && totalPaidCents >= order.total_cents) {
    order.state = "PAID";
    // TASK-1.1.6: Pass txId to saveOrder
    repo.saveOrder(order, txId);
  }
}

// ============================================================================
// PAYMENT EFFECTS
// ============================================================================

export async function markIrreversible(
  context: EffectContext
): Promise<void> {
  const { repo, entityId } = context;

  // Find payment by searching all orders (entityId is payment_id, not order_id)
  let payment: any = null;
  for (const orderId of Array.from((repo as any).orders.keys()) as string[]) {
    const payments = repo.getPayments(orderId);
    const found = payments.find((p) => p.id === entityId);
    if (found) {
      payment = found;
      break;
    }
  }

  if (!payment) {
    throw new Error(`Payment ${entityId} not found`);
  }

  // Payment state is updated by CoreExecutor AFTER effects run
  // This effect is for audit/logging - the state change happens in updateState()
  // For now, we just validate the payment exists and will be marked
}

// ============================================================================
// EFFECT REGISTRY
// ============================================================================

export const effects = {
  // ORDER
  calculateTotal,
  lockItems,
  applyPaymentToOrder,

  // PAYMENT
  markIrreversible,
};

export async function executeEffect(
  effectName: string,
  context: EffectContext
): Promise<void> {
  const effect = effects[effectName as keyof typeof effects];
  if (!effect) {
    throw new Error(`Effect ${effectName} not found`);
  }

  await effect(context);
}

