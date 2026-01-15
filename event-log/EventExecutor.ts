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
import { ExecutionContext } from "../core-engine/kernel/ExecutionContext";

// Robust UUID Generator (Browser + Node)
const generateUUID = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class EventExecutor {
  private coreExecutor: CoreExecutor;
  private repo: InMemoryRepo;

  constructor(
    private eventStore: EventStore,
    repo: InMemoryRepo,
    private boundTenantId: string,   // [FENCE] Structural Binding
    private boundExecutionId: string // [FENCE] Lifecycle Binding
  ) {
    this.repo = repo;
    this.coreExecutor = new CoreExecutor(this.repo);
  }

  /**
   * Execute transition and generate event
   * [ECC] Enforced Execution Context
   */
  async execute(
    request: TransitionRequest,
    context: ExecutionContext, // [ECC] Mandatory Envelope
    options?: {
      causation_id?: string;
      idempotency_key?: string;
    }
  ): Promise<TransitionResult & { event_id?: string }> {
    // 0. [ECC] Validate Context
    if (context.tenantId !== request.tenantId) {
      throw new Error(`[EventExecutor] FATAL: Tenant Mismatch. Context: ${context.tenantId} vs Request: ${request.tenantId}`);
    }
    if (context.lifecycle !== 'ACTIVE') {
      throw new Error(`[EventExecutor] FATAL: Attempted execution on dead Kernel. Lifecycle: ${context.lifecycle}`);
    }

    // [FENCE] Execution Fence Check
    // Prevents an external caller from using a valid Context on the WRONG Executor instance.
    if (context.tenantId !== this.boundTenantId) {
      throw new Error(`[EventExecutor] FENCE BREACH: Context Tenant (${context.tenantId}) != Bound Tenant (${this.boundTenantId})`);
    }
    if (context.executionId !== this.boundExecutionId) {
      throw new Error(`[EventExecutor] FENCE BREACH: Context ExecutionID (${context.executionId}) != Bound ID (${this.boundExecutionId})`);
    }
    // 1. Get current stream version for optimistic concurrency
    const streamId = this.getStreamId(request.tenantId, request.entity, request.entityId);
    const currentVersion = await this.eventStore.getStreamVersion(streamId);

    // 2. Rebuild current state from events (ensures repo is in sync)
    await this.rebuildProjection(streamId);

    // 3. Execute core transition (validates guards, applies effects)
    const result = await this.coreExecutor.transition(request);

    if (!result.success) {
      return result;
    }

    // 4. Generate event from transition
    const event = await this.createEvent(
      request,
      result,
      currentVersion + 1,
      context,
      options
    );

    // 5. Append event to store (with optimistic concurrency)
    try {
      await this.eventStore.append(event, currentVersion);
    } catch (error: any) {
      // If append fails (concurrency), rollback state change
      // In real implementation, this would be part of transaction
      if (error.message.includes('Concurrency Exception') || error.code === 'CONCURRENCY_CONFLICT') {
        return {
          success: false,
          previousState: result.previousState,
          newState: result.previousState,
          error: "CONCURRENCY_RETRY", // Standard Error Code
        };
      }
      throw error;
    }

    // 6. Rebuild state from events (or apply incrementally)
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
  private getStreamId(tenantId: string, entity: string, entityId: string): StreamId {
    // [TENANCY-CONTRACT] StreamId MUST be scoped by TenantId
    if (!tenantId) {
      throw new Error("CRITICAL: Missing TenantId in StreamId generation. Violation of Tenancy Contract.");
    }

    // [HARDENING] Normalize Entity (UPPERCASE) and EntityID (Safe)
    const safeEntity = entity.toUpperCase();
    const safeId = encodeURIComponent(entityId); // Prevent ':' injection

    return `${tenantId}:${safeEntity}:${safeId}`;
  }

  private async createEvent(
    request: TransitionRequest,
    result: TransitionResult,
    streamVersion: number,
    context: ExecutionContext,
    options?: {
      causation_id?: string;
      idempotency_key?: string;
    }
  ): Promise<CoreEvent> {
    const streamId = this.getStreamId(request.tenantId, request.entity, request.entityId);
    const eventType = this.getEventType(request.entity, request.event);

    // Get current entity state for payload
    const payload = await this.getEventPayload(
      request.entity,
      request.entityId,
      result
    );

    const eventId = generateUUID();

    return {
      event_id: eventId,
      stream_id: streamId,
      stream_version: streamVersion,
      type: eventType,
      payload: payload,
      occurred_at: new Date(),
      meta: {
        causation_id: options?.causation_id,
        correlation_id: context.correlationRoot, // [ECC] Root Trace
        actor_ref: `kernel:${context.executionId}`, // [ECC] Execution Binding
        idempotency_key: options?.idempotency_key,
        server_timestamp: new Date().toISOString()
      },
    };
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
      CASH_REGISTER: {
        OPEN: "CASH_REGISTER_OPENED",
        CLOSE: "CASH_REGISTER_CLOSED",
        DROP: "CASH_REGISTER_DROP",
        ADD: "CASH_REGISTER_ADD",
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
        // [SURGICAL FIX 2] Use encapsulated lookup
        const payment = this.repo.getPaymentById(entityId);
        return {
          payment_id: entityId,
          order_id: payment?.order_id,
          session_id: payment?.session_id,
          amount_cents: payment?.amount_cents,
          method: payment?.method,
          state: result.newState,
        };
      }
      case "CASH_REGISTER": {
        const register = this.repo.getCashRegister(entityId);
        return {
          cash_register_id: entityId,
          state: result.newState,
          opening_balance_cents: register?.opening_balance_cents,
          current_balance_cents: register?.current_balance_cents,
          total_sales_cents: register?.total_sales_cents,
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
