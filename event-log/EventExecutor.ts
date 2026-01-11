/**
 * Event Executor
 * 
 * Integrates CoreExecutor with EventStore.
 * Transitions generate events; state is rebuilt from events.
 */

import { CoreExecutor, type TransitionRequest, type TransitionResult } from "../core-engine/executor/CoreExecutor";
import { InMemoryRepo } from "../core-engine/repo/InMemoryRepo";
import type { EventStore, CoreEvent, StreamId } from "./types";
import { rebuildState } from "../projections";
import { randomUUID } from "crypto";

// Fallback for environments without randomUUID
function generateUUID(): string {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class EventExecutor {
  private coreExecutor: CoreExecutor;
  private repo: InMemoryRepo;

  constructor(
    private eventStore: EventStore,
    repo?: InMemoryRepo
  ) {
    this.repo = repo || new InMemoryRepo();
    this.coreExecutor = new CoreExecutor(this.repo);
  }

  /**
   * Execute transition and generate event
   */
  async transition(
    request: TransitionRequest,
    options?: {
      causation_id?: string;
      correlation_id?: string;
      actor_ref?: string;
      idempotency_key?: string;
    }
  ): Promise<TransitionResult & { event_id?: string }> {
    // 1. Get current stream version for optimistic concurrency
    const streamId = this.getStreamId(request.entity, request.entityId);
    const currentVersion = await this.eventStore.getStreamVersion(streamId);

    // 2. Rebuild current state from events (ensures repo is in sync)
    await this.rebuildProjection(streamId);

    // 3. Execute core transition (validates guards, applies effects)
    const result = await this.coreExecutor.transition(request);

    if (!result.success) {
      return result;
    }

    // 3. Generate event from transition
    const event = await this.createEvent(
      request,
      result,
      currentVersion + 1,
      options
    );

    // 4. Append event to store (with optimistic concurrency)
    try {
      await this.eventStore.append(event, currentVersion);
    } catch (error: any) {
      // If append fails (concurrency), rollback state change
      // In real implementation, this would be part of transaction
      return {
        success: false,
        previousState: result.previousState,
        newState: result.previousState,
        error: `Event append failed: ${error.message}`,
      };
    }

    // 5. Rebuild state from events (or apply incrementally)
    await this.rebuildProjection(streamId);

    return {
      ...result,
      event_id: event.event_id,
    };
  }

  /**
   * Rebuild projection from events
   */
  async rebuildProjection(streamId: StreamId): Promise<void> {
    const events = await this.eventStore.readStream(streamId);
    const state = rebuildState(events);

    // Update repo with projected state
    // In real implementation, this would be more efficient (incremental update)
    for (const [id, session] of state.sessions.entries()) {
      this.repo.saveSession(session);
    }
    for (const [id, order] of state.orders.entries()) {
      this.repo.saveOrder(order);
    }
    for (const [orderId, items] of state.orderItems.entries()) {
      for (const item of items) {
        this.repo.saveOrderItem(item);
      }
    }
    for (const [orderId, payments] of state.payments.entries()) {
      for (const payment of payments) {
        this.repo.savePayment(payment);
      }
    }
  }

  /**
   * Create event from transition
   */
  private async createEvent(
    request: TransitionRequest,
    result: TransitionResult,
    streamVersion: number,
    options?: {
      causation_id?: string;
      correlation_id?: string;
      actor_ref?: string;
      idempotency_key?: string;
    }
  ): Promise<CoreEvent> {
    const streamId = this.getStreamId(request.entity, request.entityId);
    const eventType = this.getEventType(request.entity, request.event);

    // Get current entity state for payload
    const payload = await this.getEventPayload(
      request.entity,
      request.entityId,
      result
    );

    return {
      event_id: generateUUID(),
      stream_id: streamId,
      stream_version: streamVersion,
      type: eventType,
      payload,
      occurred_at: new Date(),
      causation_id: options?.causation_id,
      correlation_id: options?.correlation_id || generateUUID(),
      actor_ref: options?.actor_ref,
      idempotency_key: options?.idempotency_key,
    };
  }

  private getStreamId(entity: string, entityId: string): StreamId {
    return `${entity}:${entityId}`;
  }

  private getEventType(entity: string, event: string): CoreEvent["type"] {
    const mapping: Record<string, Record<string, CoreEvent["type"]>> = {
      SESSION: {
        START: "SESSION_STARTED",
        CLOSE: "SESSION_CLOSED",
        RESET: "SESSION_RESET",
      },
      ORDER: {
        FINALIZE: "ORDER_LOCKED",
        PAY: "ORDER_PAID",
        CLOSE: "ORDER_CLOSED",
        CANCEL: "ORDER_CANCELED",
      },
      PAYMENT: {
        CONFIRM: "PAYMENT_CONFIRMED",
        FAIL: "PAYMENT_FAILED",
        CANCEL: "PAYMENT_CANCELED",
        RETRY: "PAYMENT_RETRIED",
      },
    };

    return mapping[entity]?.[event] || ("UNKNOWN" as any);
  }

  private async getEventPayload(
    entity: string,
    entityId: string,
    result: TransitionResult
  ): Promise<Record<string, any>> {
    // Get current entity state for event payload
    switch (entity) {
      case "SESSION": {
        const session = this.repo.getSession(entityId);
        return {
          session_id: entityId,
          state: result.newState,
        };
      }
      case "ORDER": {
        const order = this.repo.getOrder(entityId);
        const items = this.repo.getOrderItems(entityId);
        return {
          order_id: entityId,
          state: result.newState,
          total_cents: order?.total_cents,
          session_id: order?.session_id,
          table_id: order?.table_id,
          items_count: items.length,
        };
      }
      case "PAYMENT": {
        // Find payment
        let payment: any = null;
        for (const orderId of Array.from((this.repo as any).orders.keys()) as string[]) {
          const payments = this.repo.getPayments(orderId);
          const found = payments.find((p) => p.id === entityId);
          if (found) {
            payment = found;
            break;
          }
        }
        return {
          payment_id: entityId,
          order_id: payment?.order_id,
          session_id: payment?.session_id,
          amount_cents: payment?.amount_cents,
          method: payment?.method,
          state: result.newState,
        };
      }
      default:
        return {};
    }
  }

  getRepo(): InMemoryRepo {
    return this.repo;
  }
}

