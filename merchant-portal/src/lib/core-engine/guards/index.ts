/**
 * Guard Engine
 * 
 * Real guard implementations based on 03_CORE_CONSTRAINTS.md
 * Each guard validates a business rule before state transition.
 */

import type { InMemoryRepo } from "../repo/InMemoryRepo";
import type { Session, Order, Payment } from "../repo/types";

export interface GuardContext {
  repo: InMemoryRepo;
  entityId: string;
  currentState: string;
  targetState?: string;
  [key: string]: any;
}

export type GuardResult = {
  passed: boolean;
  error?: string;
};

// ============================================================================
// SESSION GUARDS
// ============================================================================

export async function noOpenOrders(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const session = repo.getSession(entityId);
  if (!session) {
    return { passed: false, error: `Session ${entityId} not found` };
  }

  const orders = repo.getOrdersBySession(entityId);
  const openOrders = orders.filter((o) => o.state === "OPEN");
  if (openOrders.length > 0) {
    return {
      passed: false,
      error: `Cannot close session: ${openOrders.length} OPEN order(s) exist`,
    };
  }

  return { passed: true };
}

export async function noLockedOrders(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const session = repo.getSession(entityId);
  if (!session) {
    return { passed: false, error: `Session ${entityId} not found` };
  }

  const orders = repo.getOrdersBySession(entityId);
  const lockedOrders = orders.filter((o) => o.state === "LOCKED");
  if (lockedOrders.length > 0) {
    return {
      passed: false,
      error: `Cannot close session: ${lockedOrders.length} LOCKED order(s) exist`,
    };
  }

  return { passed: true };
}

export async function sessionIsActive(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, session_id } = context;
  if (!session_id) {
    return { passed: false, error: "session_id is required" };
  }

  const session = repo.getSession(session_id);
  if (!session) {
    return { passed: false, error: `Session ${session_id} not found` };
  }

  if (session.state !== "ACTIVE") {
    return {
      passed: false,
      error: `Session ${session_id} is not ACTIVE (current: ${session.state})`,
    };
  }

  return { passed: true };
}

// ============================================================================
// ORDER GUARDS
// ============================================================================

export async function orderIsOpen(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    return { passed: false, error: `Order ${entityId} not found` };
  }

  // Check session is active
  const sessionCheck = await sessionIsActive({
    repo,
    session_id: order.session_id,
    entityId: "",
    currentState: "",
  } as GuardContext);
  if (!sessionCheck.passed) {
    return sessionCheck;
  }

  if (order.state !== "OPEN") {
    return {
      passed: false,
      error: `Order ${entityId} is not OPEN (current: ${order.state})`,
    };
  }

  return { passed: true };
}

export async function orderIsLocked(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    return { passed: false, error: `Order ${entityId} not found` };
  }

  if (order.state !== "LOCKED") {
    return {
      passed: false,
      error: `Order ${entityId} is not LOCKED (current: ${order.state})`,
    };
  }

  return { passed: true };
}

export async function orderHasItems(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const items = repo.getOrderItems(entityId);
  if (items.length === 0) {
    return {
      passed: false,
      error: `Order ${entityId} has no items`,
    };
  }

  return { passed: true };
}

export async function orderNotTerminal(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    return { passed: false, error: `Order ${entityId} not found` };
  }

  if (order.state === "CLOSED" || order.state === "CANCELED") {
    return {
      passed: false,
      error: `Order ${entityId} is in terminal state: ${order.state}`,
    };
  }

  return { passed: true };
}

export async function hasConfirmedPayment(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId } = context;
  const order = repo.getOrder(entityId);
  if (!order) {
    return { passed: false, error: `Order ${entityId} not found` };
  }

  const payments = repo.getPayments(entityId);
  const confirmedPayments = payments.filter((p) => p.state === "CONFIRMED");
  if (confirmedPayments.length === 0) {
    return {
      passed: false,
      error: `Order ${entityId} has no CONFIRMED payments`,
    };
  }

  // Check if sum of confirmed payments >= order total (using CENTS - integers only)
  const totalPaidCents = confirmedPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  if (order.total_cents && totalPaidCents < order.total_cents) {
    return {
      passed: false,
      error: `Order ${entityId} total (${order.total_cents} cents) not fully paid (${totalPaidCents} cents)`,
    };
  }

  return { passed: true };
}

// ============================================================================
// PAYMENT GUARDS
// ============================================================================

export async function paymentOrderIsLocked(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, order_id, session_id } = context;
  if (!order_id) {
    return { passed: false, error: "order_id is required" };
  }

  // Check session is active
  if (session_id) {
    const sessionCheck = await sessionIsActive({
      repo,
      session_id,
      entityId: "",
      currentState: "",
    } as GuardContext);
    if (!sessionCheck.passed) {
      return sessionCheck;
    }
  }

  const order = repo.getOrder(order_id);
  if (!order) {
    return { passed: false, error: `Order ${order_id} not found` };
  }

  if (order.state !== "LOCKED") {
    return {
      passed: false,
      error: `Payment cannot be created: Order ${order_id} is not LOCKED (current: ${order.state})`,
    };
  }

  return { passed: true };
}

export async function paymentNotConfirmed(
  context: GuardContext
): Promise<GuardResult> {
  const { repo, entityId, order_id } = context;
  // Find payment - use order_id if provided, otherwise search
  let payment = null;
  
  if (order_id) {
    const payments = repo.getPayments(order_id);
    payment = payments.find((p) => p.id === entityId);
  } else {
    // Search all orders (fallback)
    for (const orderId of Array.from((repo as any).orders.keys()) as string[]) {
      const payments = repo.getPayments(orderId);
      const found = payments.find((p) => p.id === entityId);
      if (found) {
        payment = found;
        break;
      }
    }
  }

  if (!payment) {
    return { passed: false, error: `Payment ${entityId} not found` };
  }

  if (payment.state === "CONFIRMED") {
    return {
      passed: false,
      error: `Payment ${entityId} is CONFIRMED and cannot be modified`,
    };
  }

  return { passed: true };
}

// ============================================================================
// GUARD REGISTRY
// ============================================================================

export const guards = {
  // SESSION
  noOpenOrders,
  noLockedOrders,
  sessionIsActive,

  // ORDER
  orderIsOpen,
  orderIsLocked,
  orderHasItems,
  orderNotTerminal,
  hasConfirmedPayment,

  // PAYMENT
  paymentOrderIsLocked,
  paymentNotConfirmed,
};

export async function executeGuard(
  guardName: string,
  context: GuardContext
): Promise<GuardResult> {
  const guard = guards[guardName as keyof typeof guards];
  if (!guard) {
    return {
      passed: false,
      error: `Guard ${guardName} not found`,
    };
  }

  return await guard(context);
}

