/**
 * EVENT BUS — CORE → COGNITIVE COMMUNICATION
 *
 * Publishes events from Core to Cognitive layer (InsForge).
 *
 * ARCHITECTURE:
 * - Fire-and-forget (no blocking)
 * - Feature flag controlled
 * - Automatic retry on failure
 * - Dead letter queue for persistent failures
 * - Metrics and logging
 *
 * USAGE:
 * await eventBus.publish({
 *   eventType: 'order.created',
 *   orderId: '123',
 *   ...
 * });
 */
// @ts-nocheck


import { analyticsClient } from "./analyticsClient";
import type { CoreEvent } from "./eventTypes";
import { EVENT_METADATA } from "./eventTypes";
import { isCognitiveLayerEnabled, isFeatureEnabled } from "./featureFlags";

// ============================================================================
// TYPES
// ============================================================================

interface EventPublishResult {
  success: boolean;
  eventId: string;
  error?: string;
  retryable?: boolean;
}

interface EventMetrics {
  published: number;
  failed: number;
  retried: number;
  deadLettered: number;
  avgLatency: number;
}

// ============================================================================
// EVENT BUS CLASS
// ============================================================================

class EventBus {
  private metrics: EventMetrics = {
    published: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
    avgLatency: 0,
  };

  private latencies: number[] = [];
  private deadLetterQueue: CoreEvent[] = [];
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Publish event to cognitive layer
   *
   * Fire-and-forget: Returns immediately, errors logged but not thrown
   */
  async publish(event: CoreEvent): Promise<void> {
    // Check feature flag FIRST
    if (!isCognitiveLayerEnabled()) {
      if (isFeatureEnabled("ENABLE_EVENT_LOGGING")) {
        console.debug(
          "[EVENT_BUS] Cognitive layer disabled, skipping event:",
          event.eventType,
        );
      }
      return;
    }

    if (!isFeatureEnabled("ENABLE_EVENT_BUS")) {
      if (isFeatureEnabled("ENABLE_EVENT_LOGGING")) {
        console.debug(
          "[EVENT_BUS] Event bus disabled, skipping event:",
          event.eventType,
        );
      }
      return;
    }

    // Publish asynchronously (don't await, don't block)
    this.publishAsync(event).catch((error) => {
      console.error("[EVENT_BUS] Async publish failed:", error);
    });
  }

  /**
   * Internal async publish (with retry logic)
   */
  private async publishAsync(
    event: CoreEvent,
    attempt: number = 1,
  ): Promise<EventPublishResult> {
    const startTime = performance.now();
    const metadata = EVENT_METADATA[event.eventType];

    try {
      // Attempt to publish to InsForge
      const result = await this.sendToInsForge(event);

      // Success
      const latency = performance.now() - startTime;
      this.recordSuccess(latency);

      if (isFeatureEnabled("ENABLE_EVENT_LOGGING")) {
        console.log(
          `[EVENT_BUS] Published ${event.eventType} (${latency.toFixed(2)}ms)`,
        );
      }

      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      this.recordFailure();

      // Log error
      if (isFeatureEnabled("ENABLE_EVENT_LOGGING")) {
        console.warn(
          `[EVENT_BUS] Failed to publish ${event.eventType} (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS}):`,
          error,
        );
      }

      // Retry logic
      if (
        metadata.retryable &&
        attempt < this.MAX_RETRY_ATTEMPTS &&
        isFeatureEnabled("ENABLE_EVENT_RETRY")
      ) {
        this.recordRetry();
        await new Promise((resolve) =>
          setTimeout(resolve, this.RETRY_DELAY_MS * attempt),
        );
        return this.publishAsync(event, attempt + 1);
      }

      // Dead letter queue
      if (isFeatureEnabled("ENABLE_DEAD_LETTER_QUEUE")) {
        this.addToDeadLetterQueue(event);
      }

      return {
        success: false,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
        retryable: metadata.retryable,
      };
    }
  }

  /**
   * Send event to InsForge (actual network call)
   */
  private async sendToInsForge(event: CoreEvent): Promise<EventPublishResult> {
    // Use analyticsClient to send to InsForge
    // Store in 'events' table or trigger edge function
    const { error } = await analyticsClient.from("gm_events").insert({
      event_id: event.eventId,
      event_type: event.eventType,
      payload: event,
      restaurant_id: event.restaurantId,
      user_id: event.userId,
      created_at: event.timestamp,
    });

    if (error) {
      throw new Error(`InsForge insert failed: ${error.message}`);
    }

    return {
      success: true,
      eventId: event.eventId,
    };
  }

  /**
   * Add event to dead letter queue for manual retry
   */
  private addToDeadLetterQueue(event: CoreEvent): void {
    this.deadLetterQueue.push(event);
    this.metrics.deadLettered++;

    console.error(
      `[EVENT_BUS] Event ${event.eventId} added to dead letter queue`,
    );

    // Limit queue size (prevent memory leak)
    if (this.deadLetterQueue.length > 1000) {
      this.deadLetterQueue.shift();
      console.warn("[EVENT_BUS] Dead letter queue full, dropping oldest event");
    }
  }

  /**
   * Retry all events in dead letter queue
   */
  async retryDeadLetterQueue(): Promise<void> {
    console.log(
      `[EVENT_BUS] Retrying ${this.deadLetterQueue.length} dead letter events`,
    );

    const events = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const event of events) {
      await this.publishAsync(event);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<EventMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get dead letter queue size
   */
  getDeadLetterQueueSize(): number {
    return this.deadLetterQueue.length;
  }

  /**
   * Clear metrics
   */
  resetMetrics(): void {
    this.metrics = {
      published: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      avgLatency: 0,
    };
    this.latencies = [];
  }

  /**
   * Record successful publish
   */
  private recordSuccess(latency: number): void {
    this.metrics.published++;
    this.latencies.push(latency);

    if (isFeatureEnabled("ENABLE_EVENT_METRICS")) {
      // Calculate rolling average (last 100 events)
      if (this.latencies.length > 100) {
        this.latencies.shift();
      }
      this.metrics.avgLatency =
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }
  }

  /**
   * Record failed publish
   */
  private recordFailure(): void {
    this.metrics.failed++;
  }

  /**
   * Record retry attempt
   */
  private recordRetry(): void {
    this.metrics.retried++;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!isCognitiveLayerEnabled()) {
      return true; // Healthy (disabled is a valid state)
    }

    try {
      // Quick query to check InsForge connectivity
      const { error } = await analyticsClient
        .from("gm_events")
        .select("event_id")
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const eventBus = new EventBus();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Publish event (main API)
 */
export async function publishEvent(event: CoreEvent): Promise<void> {
  return eventBus.publish(event);
}

/**
 * Get event bus metrics
 */
export function getEventMetrics(): Readonly<EventMetrics> {
  return eventBus.getMetrics();
}

/**
 * Check if event bus is healthy
 */
export async function checkEventBusHealth(): Promise<boolean> {
  return eventBus.healthCheck();
}

/**
 * Retry failed events from dead letter queue
 */
export async function retryFailedEvents(): Promise<void> {
  return eventBus.retryDeadLetterQueue();
}
