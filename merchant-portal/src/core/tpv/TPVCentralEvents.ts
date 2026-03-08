/**
 * 📡 TPV Central Events — Communication Contract
 *
 * Defines the event contract between Mini-TPV (waiter phones) and TPV Central.
 *
 * Flow Examples:
 * 1. Waiter flags exception → Central receives alert → Operator decides → Waiter gets resolution
 * 2. Kitchen pressure changes → Central updates War Map → Operator sees situation
 * 3. Table needs attention → Central highlights → Operator investigates
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

import { Logger } from "../logger";

export type TPVCentralEventType =
  | "order.exception" // Waiter flagged an issue
  | "order.pending_decision" // Awaiting central decision
  | "order.decision_made" // Central resolved issue
  | "kitchen.pressure_change" // Kitchen load changed
  | "table.alert" // Table needs attention
  | "table.status_change" // Table status updated
  | "operator.broadcast" // Central announces to all
  | "sync.request" // Request full state sync
  | "sync.response" // Full state response
  | "ui.voice_command"; // Internal voice command (TPV only)

// ============================================================================
// EVENT PAYLOADS
// ============================================================================

export interface OrderExceptionPayload {
  orderId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  exceptionType:
    | "item_unavailable"
    | "customer_complaint"
    | "delayed"
    | "payment_issue"
    | "other";
  description: string;
  itemId?: string;
  itemName?: string;
  timestamp: Date;
}

export interface PendingDecisionPayload {
  orderId: string;
  tableNumber: number;
  exceptionType: string;
  description: string;
  options: {
    id: string;
    label: string;
    action: "approve" | "reject" | "substitute" | "discount" | "cancel";
  }[];
}

export interface DecisionMadePayload {
  orderId: string;
  tableNumber: number;
  decisionId: string;
  action: string;
  operatorId: string;
  operatorName: string;
  message?: string;
  timestamp: Date;
}

export interface KitchenPressurePayload {
  previousLevel: "low" | "medium" | "high";
  currentLevel: "low" | "medium" | "high";
  activeOrders: number;
  delayedOrders: number;
  averageWaitMinutes: number;
}

export interface TableAlertPayload {
  tableId: string;
  tableNumber: number;
  alertType: "delayed" | "waiting_payment" | "customer_request" | "order_ready";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
}

export interface TableStatusChangePayload {
  tableId: string;
  tableNumber: number;
  previousStatus: "free" | "occupied" | "reserved" | "alert";
  currentStatus: "free" | "occupied" | "reserved" | "alert";
}

export interface OperatorBroadcastPayload {
  operatorId: string;
  operatorName: string;
  message: string;
  priority: "info" | "warning" | "urgent";
  timestamp: Date;
}

export interface SyncRequestPayload {
  requesterId: string;
  requesterType: "mini-tpv" | "central" | "kds";
}

export interface SyncResponsePayload {
  tables: { id: string; number: number; status: string }[];
  activeOrders: { id: string; tableNumber: number; status: string }[];
  kitchenPressure: "low" | "medium" | "high";
  pendingExceptions: OrderExceptionPayload[];
}

export interface VoiceCommandPayload {
  command: "resolve_exception";
  tableNumber: number;
  args?: any;
}

// ============================================================================
// EVENT ENVELOPE
// ============================================================================

export interface TPVCentralEvent<T = unknown> {
  id: string;
  type: TPVCentralEventType;
  source: "mini-tpv" | "central" | "kds" | "system";
  sourceId: string;
  payload: T;
  timestamp: Date;
  correlationId?: string; // Links related events together
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export type TPVEventHandler<T = unknown> = (
  event: TPVCentralEvent<T>,
) => void | Promise<void>;

export interface TPVCentralEventBus {
  // Subscribe to events
  on<T>(
    eventType: TPVCentralEventType,
    handler: TPVEventHandler<T>,
  ): () => void;

  // Emit events
  emit<T>(event: TPVCentralEvent<T>): void;

  // Request-response pattern
  request<TReq, TRes>(
    event: TPVCentralEvent<TReq>,
    timeoutMs?: number,
  ): Promise<TPVCentralEvent<TRes>>;
}

// ============================================================================
// EVENT BUS IMPLEMENTATION (In-Memory for same-app communication)
// ============================================================================

class InMemoryEventBus implements TPVCentralEventBus {
  private handlers: Map<TPVCentralEventType, Set<TPVEventHandler>> = new Map();
  private pendingRequests: Map<
    string,
    { resolve: (e: TPVCentralEvent) => void; timeout: NodeJS.Timeout }
  > = new Map();

  on<T>(
    eventType: TPVCentralEventType,
    handler: TPVEventHandler<T>,
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as TPVEventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as TPVEventHandler);
    };
  }

  emit<T>(event: TPVCentralEvent<T>): void {
    Logger.debug(`[TPVCentralEvents] Emit: ${event.type}`);

    // Handle response to pending request
    if (event.correlationId && this.pendingRequests.has(event.correlationId)) {
      const { resolve, timeout } = this.pendingRequests.get(
        event.correlationId,
      )!;
      clearTimeout(timeout);
      this.pendingRequests.delete(event.correlationId);
      resolve(event as TPVCentralEvent);
      return;
    }

    // Notify all handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event as TPVCentralEvent);
        } catch (err) {
          Logger.error("[TPVCentralEvents] Handler error:", err);
        }
      });
    }
  }

  async request<TReq, TRes>(
    event: TPVCentralEvent<TReq>,
    timeoutMs = 5000,
  ): Promise<TPVCentralEvent<TRes>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(event.id);
        reject(new Error(`Request timeout for event ${event.id}`));
      }, timeoutMs);

      this.pendingRequests.set(event.id, {
        resolve: resolve as (e: TPVCentralEvent) => void,
        timeout,
      });

      this.emit(event);
    });
  }
}

// Singleton instance
export const tpvEventBus = new InMemoryEventBus();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let eventIdCounter = 0;

export function createEvent<T>(
  type: TPVCentralEventType,
  payload: T,
  source: "mini-tpv" | "central" | "kds" | "system" = "central",
  sourceId = "tpv-main",
): TPVCentralEvent<T> {
  return {
    id: `evt_${++eventIdCounter}_${Date.now()}`,
    type,
    source,
    sourceId,
    payload,
    timestamp: new Date(),
  };
}

// ============================================================================
// CONVENIENCE EMITTERS
// ============================================================================

export const TPVCentralEmitters = {
  // Waiter reports exception
  reportException(payload: OrderExceptionPayload, waiterId: string): void {
    tpvEventBus.emit(
      createEvent("order.exception", payload, "mini-tpv", waiterId),
    );
  },

  // Central makes decision
  makeDecision(payload: DecisionMadePayload): void {
    tpvEventBus.emit(createEvent("order.decision_made", payload, "central"));
  },

  // Kitchen pressure update
  updateKitchenPressure(payload: KitchenPressurePayload): void {
    tpvEventBus.emit(createEvent("kitchen.pressure_change", payload, "system"));
  },

  // Table alert
  alertTable(payload: TableAlertPayload): void {
    tpvEventBus.emit(createEvent("table.alert", payload, "system"));
  },

  // Operator broadcast
  broadcast(
    message: string,
    priority: "info" | "warning" | "urgent",
    operatorId: string,
    operatorName: string,
  ): void {
    tpvEventBus.emit(
      createEvent(
        "operator.broadcast",
        {
          operatorId,
          operatorName,
          message,
          priority,
          timestamp: new Date(),
        },
        "central",
      ),
    );
  },
};

export default tpvEventBus;
