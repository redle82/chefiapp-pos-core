// @ts-nocheck
import type {
  CoreEvent,
  EventStore,
  EventType,
  StreamId,
} from "../../../../event-log/types";
import { GlobalEventStore } from "../events/EventStore";
import type { EventEnvelope } from "../events/SealTypes";

// Browser-compatible EventStore implementation using IndexedDB (via GlobalEventStore)
export class BrowserEventStore implements EventStore {
  constructor(private tenantId: string) {}

  async append(
    event: CoreEvent,
    expectedStreamVersion?: number,
  ): Promise<void> {
    // 1. Concurrency Check (Optimistic)
    // GlobalEventStore doesn't natively enforce version per stream yet,
    // but we should eventually. For now, we trust the Kernel's checks or explicit checks here.
    if (expectedStreamVersion !== undefined) {
      const currentVersion = await this.getStreamVersion(event.stream_id);
      if (currentVersion !== expectedStreamVersion) {
        throw new Error(
          `[BrowserEventStore] Concurrency Violation: Expected ${expectedStreamVersion}, got ${currentVersion}`,
        );
      }
    }

    // 2. Map CoreEvent -> EventEnvelope
    const envelope: EventEnvelope = {
      eventId: event.event_id,
      type: event.type,
      payload: event.payload,
      stream_id: event.stream_id,
      stream_version: event.stream_version,
      occurred_at: event.occurred_at,
      meta: {
        timestamp: event.occurred_at.getTime(),
        actorId: event.meta.actor_ref || "system",
        version: 1,
        correlationId: event.meta.correlation_id,
        causationId: event.meta.causation_id,
      },
    };

    // 3. Persist
    await GlobalEventStore.append(envelope);
  }

  async readStream(stream_id: StreamId): Promise<CoreEvent[]> {
    // GlobalEventStore stores all events. We must filter by stream_id.
    // Ideally GlobalEventStore should support index by stream_id.
    // For MVP/Trial, getting all and filtering is (barely) acceptable but slow.
    // Improve GlobalEventStore later.

    // Use getAllSince(0) to get all
    const all = await GlobalEventStore.getAllSince(0);

    return all
      .filter((e) => e.stream_id === stream_id)
      .sort((a, b) => (a.stream_version || 0) - (b.stream_version || 0))
      .map(this.mapEnvelopeToCore);
  }

  async readAll(filter?: {
    stream_id?: StreamId;
    type?: EventType;
    since?: Date;
    until?: Date;
  }): Promise<CoreEvent[]> {
    const all = await GlobalEventStore.getAllSince(
      filter?.since?.getTime() || 0,
    );

    let filtered = all;

    if (filter?.stream_id) {
      filtered = filtered.filter((e) => e.stream_id === filter.stream_id);
    }
    if (filter?.type) {
      filtered = filtered.filter((e) => e.type === filter.type);
    }
    if (filter?.until) {
      filtered = filtered.filter(
        (e) =>
          (e.occurred_at?.getTime() || e.meta.timestamp) <=
          filter.until!.getTime(),
      );
    }

    return filtered.map(this.mapEnvelopeToCore);
  }

  async getStreamVersion(stream_id: StreamId): Promise<number> {
    const events = await this.readStream(stream_id);
    if (events.length === 0) return 0;
    return events[events.length - 1].stream_version;
  }

  private mapEnvelopeToCore(env: EventEnvelope): CoreEvent {
    return {
      event_id: env.eventId,
      stream_id: (env.stream_id || "UNKNOWN") as StreamId,
      stream_version: env.stream_version || 0,
      type: env.type as EventType,
      payload: env.payload,
      occurred_at: env.occurred_at || new Date(env.meta.timestamp),
      meta: {
        causation_id: env.meta.causationId,
        correlation_id: env.meta.correlationId,
        actor_ref: env.meta.actorId,
        server_timestamp: new Date(env.meta.timestamp).toISOString(),
      },
    };
  }
}
