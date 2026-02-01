import { Pool, PoolClient } from "pg";
import { CoreEvent, EventStore, StreamId } from "../event-log/types";
import { PostgresLink } from "./PostgresLink";

export class PostgresEventStore implements EventStore {
    constructor(private options: { pool?: Pool } = {}) { }

    private get pool(): Pool {
        return this.options.pool || PostgresLink.getInstance().getPool();
    }

    async append(event: CoreEvent, expectedStreamVersion?: number): Promise<void> {
        const streamParts = event.stream_id.split(":");
        if (streamParts.length < 2) throw new Error("Invalid stream_id format");

        const streamType = streamParts[0];
        const streamId = streamParts.slice(1).join(":");

        // If expectedStreamVersion is provided, we use the constraint.
        // If not, we might be trusting the event's stream_version directly or just appending?
        // In strict Event Sourcing, we trust expectedStreamVersion.
        // However, the CoreEvent object ALREADY has stream_version (it represents the new state).
        // So we insert THAT.

        // Note: If event.stream_version is NOT expectedStreamVersion + 1, that's a logic error in CORE.
        // But the DB constraint will catch duplicates.

        const query = `
      INSERT INTO event_store 
      (event_id, stream_type, stream_id, stream_version, event_type, payload, meta, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

        const values = [
            event.event_id,
            streamType,
            streamId,
            event.stream_version,
            event.type,
            JSON.stringify(event.payload),
            JSON.stringify({ ...event, payload: undefined, type: undefined }), // Store rest as meta? Or specific fields?
            // Standard: meta is separate.
            // CoreEvent structure has top-level fields: correlation_id, causation_id, etc.
            // We should put those in meta column.
            event.occurred_at
        ];

        // Refine meta construction
        const metaObj: any = {
            causation_id: event.causation_id,
            correlation_id: event.correlation_id,
            actor_ref: event.actor_ref,
            idempotency_key: event.idempotency_key,
            hash: event.hash,
            hash_prev: event.hash_prev
        };
        values[6] = JSON.stringify(metaObj);


        try {
            await this.pool.query(query, values);
        } catch (err: any) {
            if (err.code === '23505') { // Unique violation
                if (err.constraint === 'uq_event_stream_version') {
                    throw new Error(`Concurrency Exception: Stream ${event.stream_id} version ${event.stream_version} already exists.`);
                }
                if (err.constraint === 'event_store_event_id_key') {
                    throw new Error(`Duplicate Event ID: ${event.event_id}`);
                }
            }
            throw err;
        }
    }

    async readStream(stream_id: StreamId): Promise<CoreEvent[]> {
        const streamParts = stream_id.split(":");
        const streamType = streamParts[0];
        const id = streamParts.slice(1).join(":");

        const query = `
      SELECT * FROM event_store 
      WHERE stream_type = $1 AND stream_id = $2
      ORDER BY stream_version ASC
    `;

        const res = await this.pool.query(query, [streamType, id]);

        return res.rows.map(this.mapRowToEvent);
    }

    async readAll(filter?: {
        stream_id?: StreamId;
        type?: string;
        since?: Date;
        until?: Date;
    }): Promise<CoreEvent[]> {
        let query = `SELECT * FROM event_store WHERE 1=1`;
        const params: any[] = [];
        let pIdx = 1;

        if (filter?.stream_id) {
            const parts = filter.stream_id.split(":");
            query += ` AND stream_type = $${pIdx++} AND stream_id = $${pIdx++}`;
            params.push(parts[0], parts.slice(1).join(":"));
        }

        if (filter?.type) {
            query += ` AND event_type = $${pIdx++}`;
            params.push(filter.type);
        }

        if (filter?.since) {
            query += ` AND created_at >= $${pIdx++}`;
            params.push(filter.since);
        }

        if (filter?.until) {
            query += ` AND created_at <= $${pIdx++}`;
            params.push(filter.until);
        }

        query += ` ORDER BY sequence_id ASC`; // Global order

        const res = await this.pool.query(query, params);
        return res.rows.map(this.mapRowToEvent);
    }

    async getStreamVersion(stream_id: StreamId): Promise<number> {
        const streamParts = stream_id.split(":");
        const streamType = streamParts[0];
        const id = streamParts.slice(1).join(":");

        const query = `
        SELECT MAX(stream_version) as ver 
        FROM event_store 
        WHERE stream_type = $1 AND stream_id = $2
    `;

        const res = await this.pool.query(query, [streamType, id]);
        return res.rows[0].ver || 0;
    }

    private mapRowToEvent(row: any): CoreEvent {
        const meta = row.meta || {};
        return {
            event_id: row.event_id,
            stream_id: `${row.stream_type}:${row.stream_id}`,
            stream_version: row.stream_version,
            type: row.event_type as any,
            payload: row.payload,
            occurred_at: new Date(row.created_at), // Using DB timestamp as source of truth
            causation_id: meta.causation_id,
            correlation_id: meta.correlation_id,
            actor_ref: meta.actor_ref,
            idempotency_key: meta.idempotency_key,
            hash: meta.hash,
            hash_prev: meta.hash_prev
        };
    }
}
