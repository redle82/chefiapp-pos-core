import type { CoreEvent, EventType, StreamId } from "./types";

export interface EventStoreFilter {
  stream_id?: StreamId;
  type?: EventType;
  since?: Date;
  until?: Date;
  correlation_id?: string;
  causation_id?: string;
}

export interface EventStoreAdapter {
  append(event: CoreEvent, expectedStreamVersion?: number): Promise<void>;
  appendMany(
    events: CoreEvent[],
    expectedStreamVersion?: number,
  ): Promise<void>;

  readStream(streamId: StreamId): Promise<CoreEvent[]>;
  readStreamFromVersion(
    streamId: StreamId,
    fromVersionInclusive: number,
  ): Promise<CoreEvent[]>;

  readAll(filter?: EventStoreFilter): Promise<CoreEvent[]>;
  getStreamVersion(streamId: StreamId): Promise<number>;
}

export interface EventStoreAdapterFactory {
  create(): EventStoreAdapter;
}
