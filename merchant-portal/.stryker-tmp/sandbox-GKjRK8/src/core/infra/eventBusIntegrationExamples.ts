/**
 * EVENT BUS INTEGRATION EXAMPLES
 *
 * Shows how to integrate Event Bus in different Core modules.
 *
 * PATTERN:
 * 1. Perform Core operation (write to Docker)
 * 2. Publish event (fire-and-forget, async)
 * 3. Never wait for event publish
 * 4. Catch errors silently (don't block Core)
 */

import { Logger } from "../logger";
import { createEvent, publishEvent } from "./eventBus";
import type {
  OrderCancelledEvent,
  OrderPaidEvent,
  ShiftClosedEvent,
  ShiftOpenedEvent,
} from "./eventTypes";

// ============================================================================
// EXAMPLE 1: Payment Processing
// ============================================================================

/**
 * After successfully processing payment in Core
 */
export async function onPaymentProcessed(params: {
  orderId: string;
  restaurantId: string;
  paymentMethod: string;
  amount: number;
  tip?: number;
  change?: number;
  userId?: string;
}): Promise<void> {
  // Publish event (fire-and-forget)
  publishEvent(
    createEvent<OrderPaidEvent>(
      "order.paid",
      {
        orderId: params.orderId,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        tip: params.tip,
        change: params.change,
      },
      params.restaurantId,
      params.userId,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish order.paid", err);
  });
}

// ============================================================================
// EXAMPLE 2: Shift Management
// ============================================================================

/**
 * After opening shift in Core
 */
export async function onShiftOpened(params: {
  shiftId: string;
  restaurantId: string;
  cashierId: string;
  initialCash: number;
  openedAt: string;
}): Promise<void> {
  publishEvent(
    createEvent<ShiftOpenedEvent>(
      "shift.opened",
      {
        shiftId: params.shiftId,
        cashierId: params.cashierId,
        initialCash: params.initialCash,
        openedAt: params.openedAt,
      },
      params.restaurantId,
      params.cashierId,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish shift.opened", err);
  });
}

/**
 * After closing shift in Core
 */
export async function onShiftClosed(params: {
  shiftId: string;
  restaurantId: string;
  cashierId: string;
  closedAt: string;
  finalCash: number;
  totalSales: number;
  transactionCount: number;
  discrepancy?: number;
}): Promise<void> {
  publishEvent(
    createEvent<ShiftClosedEvent>(
      "shift.closed",
      {
        shiftId: params.shiftId,
        cashierId: params.cashierId,
        closedAt: params.closedAt,
        finalCash: params.finalCash,
        totalSales: params.totalSales,
        transactionCount: params.transactionCount,
        discrepancy: params.discrepancy,
      },
      params.restaurantId,
      params.cashierId,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish shift.closed", err);
  });
}

// ============================================================================
// EXAMPLE 3: Order Cancellation
// ============================================================================

/**
 * After cancelling order in Core
 */
export async function onOrderCancelled(params: {
  orderId: string;
  restaurantId: string;
  reason: string;
  cancelledBy: string;
  userId?: string;
}): Promise<void> {
  publishEvent(
    createEvent<OrderCancelledEvent>(
      "order.cancelled",
      {
        orderId: params.orderId,
        reason: params.reason,
        cancelledBy: params.cancelledBy,
      },
      params.restaurantId,
      params.userId,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish order.cancelled", err);
  });
}

// ============================================================================
// INTEGRATION PATTERN (Copy-Paste Template)
// ============================================================================

/**
 * TEMPLATE: How to integrate Event Bus in any Core operation
 *
 * ```typescript
 * import { publishEvent, createEvent } from './eventBus';
 * import type { YourEventType } from './eventTypes';
 * import { Logger } from '../logger';
 *
 * // 1. Perform Core operation (critical path)
 * const result = await coreClient.rpc('your_function', params);
 *
 * if (result.error) {
 *   return { error: result.error };
 * }
 *
 * // 2. Log success (observability)
 * Logger.info('[YOUR_OPERATION]', { ... });
 *
 * // 3. Publish event (fire-and-forget, non-blocking)
 * publishEvent(
 *   createEvent<YourEventType>(
 *     'your.event_type',
 *     {
 *       // Event-specific payload
 *     },
 *     restaurantId,
 *     userId,
 *   ),
 * ).catch((err) => {
 *   // CRITICAL: Never throw, never block Core
 *   Logger.warn('[EVENT_BUS] Failed to publish your.event_type', err);
 * });
 *
 * // 4. Return result (never wait for event)
 * return { data: result.data, error: null };
 * ```
 */

// ============================================================================
// ANTI-PATTERNS (DON'T DO THIS)
// ============================================================================

/**
 * ❌ WRONG: Waiting for event publish (blocks Core)
 */
async function antipattern1_blocking(orderId: string): Promise<void> {
  // DON'T: await publishEvent()
  await publishEvent(
    createEvent(
      "order.created",
      { orderId, tableId: "1", items: [], totalAmount: 100 },
      "rest-1",
    ),
  );

  // This blocks Core operation until event is published
  // If InsForge is slow/down, Core is slow/down
}

/**
 * ❌ WRONG: Throwing errors on event publish failure
 */
async function antipattern2_throwing(orderId: string): Promise<void> {
  try {
    await publishEvent(
      createEvent(
        "order.created",
        { orderId, tableId: "1", items: [], totalAmount: 100 },
        "rest-1",
      ),
    );
  } catch (error) {
    // DON'T: throw on event publish failure
    throw new Error("Failed to publish event");
  }

  // This causes Core operations to fail when Cognitive Layer is down
  // Core MUST survive Cognitive Layer failures
}

/**
 * ❌ WRONG: Conditional Core logic based on event publish
 */
async function antipattern3_conditional(orderId: string): Promise<boolean> {
  const eventPublished = await publishEvent(
    createEvent(
      "order.created",
      { orderId, tableId: "1", items: [], totalAmount: 100 },
      "rest-1",
    ),
  )
    .then(() => true)
    .catch(() => false);

  if (!eventPublished) {
    // DON'T: change Core behavior based on event publish
    return false;
  }

  // Core operations MUST be deterministic
  // Event Bus is one-way communication (Core → Cognitive)
  return true;
}

/**
 * ❌ WRONG: Expecting response from Cognitive Layer
 */
async function antipattern4_expecting_response(
  orderId: string,
): Promise<string> {
  await publishEvent(
    createEvent("mission.requested", { missionType: "auto" }, "rest-1"),
  );

  // DON'T: expect immediate response from AI
  // There is no synchronous API
  // Cognitive Layer updates state asynchronously

  // CORRECT: Query state later via analyticsClient
  // or use WebSocket/polling for real-time updates
  return "Mission generated"; // This is a lie
}

// ============================================================================
// CORRECT PATTERN SUMMARY
// ============================================================================

/**
 * ✅ CORRECT: Fire-and-forget with error handling
 */
export async function correctPattern_fireAndForget(
  orderId: string,
): Promise<void> {
  // 1. Core operation (critical path)
  // ... perform core logic ...

  // 2. Publish event (fire-and-forget)
  publishEvent(
    createEvent(
      "order.created",
      { orderId, tableId: "1", items: [], totalAmount: 100 },
      "rest-1",
    ),
  ).catch((err) => {
    // Silent failure is OK for events
    // Core continues regardless
    Logger.warn("[EVENT_BUS] Failed to publish", err);
  });

  // 3. Return immediately (don't wait)
  // Event publishes in background
}
