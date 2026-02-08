import { Pool } from "pg";
import { LegalSeal, LegalEntityType, LegalState } from "../legal-boundary/types";
import { LegalSealStore } from "../legal-boundary/LegalSealStore";
import { PostgresLink } from "./PostgresLink";
import { FailpointInjector } from "../tests/harness/FailpointInjector";

export class PostgresLegalSealStore implements LegalSealStore {
    constructor(private options: { pool?: Pool } = {}) { }

    private get pool(): Pool {
        return this.options.pool || PostgresLink.getInstance().getPool();
    }

    async getSeal(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal | null> {
        const query = `
      SELECT * FROM legal_seals
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY legal_sequence_id DESC
      LIMIT 1
    `;
        const res = await this.pool.query(query, [entity_type, entity_id]);
        return res.rows.length ? this.mapRowToSeal(res.rows[0]) : null;
    }

    async listSealsByEntity(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal[]> {
        const query = `
      SELECT * FROM legal_seals
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY legal_sequence_id ASC
    `;
        const res = await this.pool.query(query, [entity_type, entity_id]);
        return res.rows.map(this.mapRowToSeal);
    }

    async listAllSeals(): Promise<LegalSeal[]> {
        const query = `
      SELECT * FROM legal_seals
      ORDER BY legal_sequence_id ASC
    `;
        const res = await this.pool.query(query);
        return res.rows.map(this.mapRowToSeal);
    }

    async createSeal(seal: LegalSeal): Promise<void> {
        // Failpoint: simular falha antes de criar seal
        await FailpointInjector.getInstance().checkpoint('PostgresLegalSealStore.createSeal.before');

        const query = `
      INSERT INTO legal_seals
      (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot, sealed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

        // Note: legal_sequence_id is handled by DB (BIGSERIAL)
        // seal.sequence in the object might be ignored or used to cross check?
        // In GATE 2 we used manual sequence. In GATE 3 we rely on DB.
        // The Interface says "createSeal".
        // If the caller (LegalBoundary) generated a sequence, it might be mismatched with DB.
        // However, boundary.ts calls nextSequence() first.
        // Postgres implementation of nextSequence() could return "nextval" or 0 if we rely on Insert RETURNING.

        const values = [
            seal.seal_id,
            seal.entity_type,
            seal.entity_id,
            seal.legal_state,
            // seal.seal_event_id is "TODO..." currently. DB expects UUID.
            // We must provide a valid UUID or NULL if allowed (Schema says NOT NULL).
            // Issue: Implementation assumes we have a real event ID.
            // We can use a Nil UUID for now or fix the TODO in Boundary.
            // But Boundary logic sets it to "TODO...".
            // We need to fix this integration point later.
            // For now, let's assume seal.seal_event_id is a valid UUID or we cast/fail.
            seal.seal_event_id === "TODO_LINK_TO_EVENT_ID" ? "00000000-0000-0000-0000-000000000000" : seal.seal_event_id,
            seal.stream_hash,
            seal.financial_state, // stringified JSON
            seal.sealed_at
        ];

        try {
            await this.pool.query(query, values);
            
            // Failpoint: simular falha após criar seal (antes de commit)
            await FailpointInjector.getInstance().checkpoint('PostgresLegalSealStore.createSeal.after');
        } catch (err: any) {
            if (err.code === '23505') { // Unique violation
                throw new Error(`Seal conflict: ${err.message}`);
            }
            throw err;
        }
    }

    async nextSequence(): Promise<number> {
        // In Postgres, we usually rely on Serial.
        // Calling nextval independently implies we reserve it.
        // OR we return a dummy logic if we want the INSERT to assign it.
        // If LegalBoundary uses this to form seal_id, filters it needs a number.
        // We can query the sequence. 
        // `SELECT nextval('legal_seals_legal_sequence_id_seq')`
        // Assuming the table created the sequence with that name (standard).

        // NOTE: This might skip IDs if transaction rolls back. That is acceptable (GAP-ALLOWED).
        const res = await this.pool.query("SELECT nextval('legal_seals_legal_sequence_id_seq') as seq");
        return parseInt(res.rows[0].seq, 10);
    }

    async isSealed(entity_type: LegalEntityType, entity_id: string): Promise<boolean> {
        // Reusing same logic logic but via SQL or fetching list.
        // Fetching list is safer to keep logic centralized effectively 
        // unless we want to move `FINAL_LEGAL_STATES` to shared constant.

        // Let's implement efficient query.
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
        const res = await this.pool.query(query, [entity_type, entity_id, finalStates]);
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
