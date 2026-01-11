import { Pool, PoolClient } from "pg";
import { LegalSeal, LegalEntityType, LegalState } from "../../legal-boundary/types";
import { LegalSealStore } from "../../legal-boundary/LegalSealStore";
import { PostgresLink } from "../../gate3-persistence/PostgresLink"; // Shared link

type DBClient = Pool | PoolClient;

export class PostgresLegalSealStore implements LegalSealStore {
    constructor(private options: { pool?: DBClient } = {}) { }

    private get db(): DBClient {
        return this.options.pool || PostgresLink.getInstance().getPool();
    }

    async getSeal(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal | null> {
        const query = `
      SELECT * FROM legal_seals
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY legal_sequence_id DESC
      LIMIT 1
    `;
        const res = await this.db.query(query, [entity_type, entity_id]);
        return res.rows.length ? this.mapRowToSeal(res.rows[0]) : null;
    }

    async listSealsByEntity(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal[]> {
        const query = `
      SELECT * FROM legal_seals
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY legal_sequence_id ASC
    `;
        const res = await this.db.query(query, [entity_type, entity_id]);
        return res.rows.map(this.mapRowToSeal);
    }

    async listAllSeals(): Promise<LegalSeal[]> {
        const query = `
      SELECT * FROM legal_seals
      ORDER BY legal_sequence_id ASC
    `;
        const res = await this.db.query(query);
        return res.rows.map(this.mapRowToSeal);
    }

    async createSeal(seal: LegalSeal): Promise<void> {
        const query = `
      INSERT INTO legal_seals
      (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot, sealed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

        const values = [
            seal.seal_id,
            seal.entity_type,
            seal.entity_id,
            seal.legal_state,
            // Handle TODO event ID. In production transaction wrapping, this will be passed.
            // For now, if invalid UUID, we might use NIL UUID "0000..." or require it.
            seal.seal_event_id === "TODO_LINK_TO_EVENT_ID" ? "00000000-0000-0000-0000-000000000000" : seal.seal_event_id,
            seal.stream_hash,
            seal.financial_state,
            seal.sealed_at
        ];

        try {
            await this.db.query(query, values);
        } catch (err: any) {
            if (err.code === '23505') {
                // Idempotency check: harmless rejection technically, but explicit per requirements?
                // "Trying to seal the same state twice results in a harmless rejection or no-op"
                // Throwing allows caller to know it was duplicate.
                throw new Error(`Seal conflict: ${err.message}`);
            }
            throw err;
        }
    }

    async nextSequence(): Promise<number> {
        // Gap-Allowed unique sequence
        const res = await this.db.query("SELECT nextval('legal_seals_legal_sequence_id_seq') as seq");
        return parseInt(res.rows[0].seq, 10);
    }

    async isSealed(entity_type: LegalEntityType, entity_id: string): Promise<boolean> {
        const FINAL_STATES_MAP: any = {
            ORDER: ["ORDER_FINAL"],
            PAYMENT: ["PAYMENT_SEALED"],
            SESSION: []
        };
        const finalStates = FINAL_STATES_MAP[entity_type] || [];
        if (finalStates.length === 0) return false;

        const query = `
        SELECT 1 FROM legal_seals 
        WHERE entity_type = $1 AND entity_id = $2 AND legal_state = ANY($3::text[])
        LIMIT 1
    `;
        const res = await this.db.query(query, [entity_type, entity_id, finalStates]);
        return (res.rowCount || 0) > 0;
    }

    private mapRowToSeal(row: any): LegalSeal {
        return {
            seal_id: row.seal_id,
            entity_type: row.entity_type as any,
            entity_id: row.entity_id,
            seal_event_id: row.seal_event_id,
            stream_hash: row.stream_hash,
            sealed_at: new Date(row.sealed_at),
            sequence: parseInt(row.legal_sequence_id, 10),
            financial_state: JSON.stringify(row.financial_state_snapshot),
            legal_state: row.legal_state as any
        };
    }
}
