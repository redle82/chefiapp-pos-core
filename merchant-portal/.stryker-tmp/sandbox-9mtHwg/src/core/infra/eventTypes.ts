/**
 * EVENT SCHEMA — CORE → COGNITIVE
 *
 * Defines all events that flow from Core (operational) to Cognitive (AI/Analytics).
 *
 * RULES:
 * - Events are immutable (readonly properties)
 * - Events are fire-and-forget (no response expected)
 * - Events never block Core operations
 * - All timestamps are ISO 8601 strings
 */

// ============================================================================
// BASE EVENT
// ============================================================================

export interface BaseEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: string; // ISO 8601
  readonly restaurantId: string;
  readonly userId?: string;
}

// ============================================================================
// ORDER EVENTS (High Frequency)
// ============================================================================

export interface OrderCreatedEvent extends BaseEvent {
  readonly eventType: "order.created";
  readonly orderId: string;
  readonly tableId: string;
  readonly items: ReadonlyArray<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  readonly totalAmount: number;
}

export interface OrderItemAddedEvent extends BaseEvent {
  readonly eventType: "order.item_added";
  readonly orderId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly price: number;
}

export interface OrderItemRemovedEvent extends BaseEvent {
  readonly eventType: "order.item_removed";
  readonly orderId: string;
  readonly productId: string;
  readonly quantity: number;
}

export interface OrderStatusChangedEvent extends BaseEvent {
  readonly eventType: "order.status_changed";
  readonly orderId: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly reason?: string;
}

export interface OrderPaidEvent extends BaseEvent {
  readonly eventType: "order.paid";
  readonly orderId: string;
  readonly paymentMethod: string;
  readonly amount: number;
  readonly tip?: number;
  readonly change?: number;
}

export interface OrderCancelledEvent extends BaseEvent {
  readonly eventType: "order.cancelled";
  readonly orderId: string;
  readonly reason: string;
  readonly cancelledBy: string;
}

// ============================================================================
// SHIFT EVENTS (Medium Frequency)
// ============================================================================

export interface ShiftOpenedEvent extends BaseEvent {
  readonly eventType: "shift.opened";
  readonly shiftId: string;
  readonly cashierId: string;
  readonly initialCash: number;
  readonly openedAt: string;
}

export interface ShiftClosedEvent extends BaseEvent {
  readonly eventType: "shift.closed";
  readonly shiftId: string;
  readonly cashierId: string;
  readonly closedAt: string;
  readonly finalCash: number;
  readonly totalSales: number;
  readonly transactionCount: number;
  readonly discrepancy?: number;
}

// ============================================================================
// ANALYTICS EVENTS (Low-Medium Frequency)
// ============================================================================

export interface ProductPerformanceEvent extends BaseEvent {
  readonly eventType: "product.performance";
  readonly productId: string;
  readonly period: "hour" | "day" | "week";
  readonly salesCount: number;
  readonly revenue: number;
  readonly avgPreparationTime?: number;
}

export interface StaffMetricsEvent extends BaseEvent {
  readonly eventType: "staff.metrics";
  readonly staffId: string;
  readonly period: "shift" | "day" | "week";
  readonly ordersServed: number;
  readonly avgServiceTime: number;
  readonly customerSatisfaction?: number;
}

export interface TableTurnoverEvent extends BaseEvent {
  readonly eventType: "table.turnover";
  readonly tableId: string;
  readonly occupancyStart: string;
  readonly occupancyEnd: string;
  readonly duration: number; // minutes
  readonly revenue: number;
}

// ============================================================================
// AI TRIGGER EVENTS (Low Frequency)
// ============================================================================

export interface OnboardingStartedEvent extends BaseEvent {
  readonly eventType: "onboarding.started";
  readonly onboardingType: "trial" | "free" | "paid";
  readonly plan?: string;
}

export interface TrialActivatedEvent extends BaseEvent {
  readonly eventType: "trial.activated";
  readonly trialDays: number;
  readonly features: ReadonlyArray<string>;
}

export interface MissionRequestedEvent extends BaseEvent {
  readonly eventType: "mission.requested";
  readonly missionType: "auto" | "manual";
  readonly context?: Record<string, unknown>;
}

export interface AlertTriggeredEvent extends BaseEvent {
  readonly eventType: "alert.triggered";
  readonly alertType: "stock" | "performance" | "financial" | "operational";
  readonly severity: "info" | "warning" | "critical";
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
}

// ============================================================================
// UNION TYPE (All Events)
// ============================================================================

export type CoreEvent =
  | OrderCreatedEvent
  | OrderItemAddedEvent
  | OrderItemRemovedEvent
  | OrderStatusChangedEvent
  | OrderPaidEvent
  | OrderCancelledEvent
  | ShiftOpenedEvent
  | ShiftClosedEvent
  | ProductPerformanceEvent
  | StaffMetricsEvent
  | TableTurnoverEvent
  | OnboardingStartedEvent
  | TrialActivatedEvent
  | MissionRequestedEvent
  | AlertTriggeredEvent;

// ============================================================================
// EVENT METADATA (for routing, filtering, monitoring)
// ============================================================================

export interface EventMetadata {
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly category: "operational" | "analytical" | "ai_trigger";
  readonly retryable: boolean;
  readonly ttl?: number; // seconds, for dead letter queue
}

export const EVENT_METADATA: Record<CoreEvent["eventType"], EventMetadata> = {
  "order.created": {
    priority: "high",
    category: "operational",
    retryable: true,
  },
  "order.item_added": {
    priority: "medium",
    category: "operational",
    retryable: true,
  },
  "order.item_removed": {
    priority: "medium",
    category: "operational",
    retryable: true,
  },
  "order.status_changed": {
    priority: "high",
    category: "operational",
    retryable: true,
  },
  "order.paid": {
    priority: "critical",
    category: "operational",
    retryable: true,
    ttl: 3600,
  },
  "order.cancelled": {
    priority: "high",
    category: "operational",
    retryable: true,
  },
  "shift.opened": {
    priority: "high",
    category: "operational",
    retryable: true,
  },
  "shift.closed": {
    priority: "critical",
    category: "operational",
    retryable: true,
    ttl: 7200,
  },
  "product.performance": {
    priority: "low",
    category: "analytical",
    retryable: false,
  },
  "staff.metrics": {
    priority: "low",
    category: "analytical",
    retryable: false,
  },
  "table.turnover": {
    priority: "low",
    category: "analytical",
    retryable: false,
  },
  "onboarding.started": {
    priority: "medium",
    category: "ai_trigger",
    retryable: true,
  },
  "trial.activated": {
    priority: "medium",
    category: "ai_trigger",
    retryable: true,
  },
  "mission.requested": {
    priority: "high",
    category: "ai_trigger",
    retryable: true,
  },
  "alert.triggered": {
    priority: "high",
    category: "ai_trigger",
    retryable: true,
  },
};

// ============================================================================
// HELPER: Event ID Generator
// ============================================================================

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// HELPER: Create Event
// ============================================================================

export function createEvent<T extends CoreEvent>(
  eventType: T["eventType"],
  payload: Omit<T, keyof BaseEvent>,
  restaurantId: string,
  userId?: string,
): T {
  return {
    eventId: generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    restaurantId,
    userId,
    ...payload,
  } as T;
}
