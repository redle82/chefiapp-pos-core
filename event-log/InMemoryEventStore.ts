/**
 * In-Memory Event Store
 * 
 * Append-only event store with:
 * - Optimistic concurrency control (stream_version)
 * - Idempotency (event_id uniqueness)
 * - Anti-tamper chain (hash_prev + hash)
 */

import type {
  CoreEvent,
  EventStore,
  StreamId,
  EventType,
  EventMetadata,
} from "./types";
import { createHash } from "crypto";

export class InMemoryEventStore implements EventStore {
  private events = new Map<string, CoreEvent>(); // event_id -> event
  private streams = new Map<StreamId, CoreEvent[]>(); // stream_id -> events[]
  private streamMetadata = new Map<StreamId, EventMetadata>(); // stream_id -> metadata
  private eventIds = new Set<string>(); // For fast duplicate detection
  private idempotencyKeys = new Map<string, string>(); // idempotency_key -> event_id

  async append(
    event: CoreEvent,
    expectedStreamVersion?: number
  ): Promise<void> {
    // 1. Validate event_id uniqueness
    if (this.eventIds.has(event.event_id)) {
      throw new Error(
        `Duplicate event_id: ${event.event_id}. Event already exists.`
      );
    }

    // 2. Check idempotency_key if provided
    if (event.idempotency_key) {
      const existingEventId = this.idempotencyKeys.get(event.idempotency_key);
      if (existingEventId) {
        // Idempotent: return existing event (no-op)
        return;
      }
    }

    // 3. Optimistic concurrency control
    const metadata = this.streamMetadata.get(event.stream_id);
    const currentVersion = metadata?.current_version ?? -1;

    if (expectedStreamVersion !== undefined) {
      if (currentVersion !== expectedStreamVersion) {
        throw new Error(
          `Stream version mismatch for ${event.stream_id}. Expected: ${expectedStreamVersion}, Current: ${currentVersion}`
        );
      }
    }

    // 4. Validate stream_version is sequential
    const expectedNextVersion = currentVersion + 1;
    if (event.stream_version !== expectedNextVersion) {
      throw new Error(
        `Invalid stream_version for ${event.stream_id}. Expected: ${expectedNextVersion}, Got: ${event.stream_version}`
      );
    }

    // 5. Build anti-tamper chain (hash_prev + hash)
    const lastEvent = this.getLastEvent(event.stream_id);
    if (lastEvent) {
      event.hash_prev = lastEvent.hash;
    } else {
      event.hash_prev = undefined;
    }

    // Calculate hash of this event
    event.hash = this.calculateHash(event);

    // 6. Append event
    this.events.set(event.event_id, event);
    this.eventIds.add(event.event_id);

    if (event.idempotency_key) {
      this.idempotencyKeys.set(event.idempotency_key, event.event_id);
    }

    // Add to stream
    const streamEvents = this.streams.get(event.stream_id) || [];
    streamEvents.push(event);
    this.streams.set(event.stream_id, streamEvents);

    // Update metadata
    this.streamMetadata.set(event.stream_id, {
      stream_id: event.stream_id,
      current_version: event.stream_version,
      last_event_id: event.event_id,
      last_event_at: event.occurred_at,
    });
  }

  async readStream(stream_id: StreamId): Promise<CoreEvent[]> {
    const events = this.streams.get(stream_id) || [];
    // Return sorted by stream_version (should already be sorted, but ensure)
    return [...events].sort((a, b) => a.stream_version - b.stream_version);
  }

  async readAll(filter?: {
    stream_id?: StreamId;
    type?: EventType;
    since?: Date;
    until?: Date;
  }): Promise<CoreEvent[]> {
    let events = Array.from(this.events.values());

    if (filter?.stream_id) {
      events = events.filter((e) => e.stream_id === filter.stream_id);
    }

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }

    if (filter?.since) {
      events = events.filter((e) => e.occurred_at >= filter.since!);
    }

    if (filter?.until) {
      events = events.filter((e) => e.occurred_at <= filter.until!);
    }

    // Sort by occurred_at, then stream_version
    return events.sort((a, b) => {
      const timeDiff = a.occurred_at.getTime() - b.occurred_at.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.stream_version - b.stream_version;
    });
  }

  async getStreamVersion(stream_id: StreamId): Promise<number> {
    const metadata = this.streamMetadata.get(stream_id);
    return metadata?.current_version ?? -1;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getLastEvent(stream_id: StreamId): CoreEvent | null {
    const events = this.streams.get(stream_id) || [];
    if (events.length === 0) return null;
    return events[events.length - 1];
  }

  private calculateHash(event: CoreEvent): string {
    // Hash: event_id + stream_id + stream_version + type + payload + occurred_at + hash_prev
    const hashInput = JSON.stringify({
      event_id: event.event_id,
      stream_id: event.stream_id,
      stream_version: event.stream_version,
      type: event.type,
      payload: event.payload,
      occurred_at: event.occurred_at.toISOString(),
      hash_prev: event.hash_prev,
    });

    return createHash("sha256").update(hashInput).digest("hex");
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  clear(): void {
    this.events.clear();
    this.streams.clear();
    this.streamMetadata.clear();
    this.eventIds.clear();
    this.idempotencyKeys.clear();
  }

  getMetadata(stream_id: StreamId): EventMetadata | undefined {
    return this.streamMetadata.get(stream_id);
  }
}

