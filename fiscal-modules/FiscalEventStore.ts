import { Pool } from "pg";
import { PostgresLink } from "../gate3-persistence/PostgresLink";
import { FiscalResult, TaxDocument } from "./types";
import { FailpointInjector } from "../tests/harness/FailpointInjector";

export interface FiscalEventRecord {
    fiscal_event_id: string;
    fiscal_sequence_id: string;
    ref_seal_id: string;
    ref_event_id: string;
    doc_type: string;
    gov_protocol?: string;
    payload_sent: any;
    response_received: any;
    fiscal_status: string;
    created_at: Date;
}

export class FiscalEventStore {
    constructor(private options: { pool?: Pool } = {}) { }

    private get pool(): Pool {
        return this.options.pool || PostgresLink.getInstance().getPool();
    }

    /**
     * Records an interaction with the Fiscal Authority.
     */
    async recordInteraction(
        doc: TaxDocument,
        result: FiscalResult
    ): Promise<string> { // Returns ID
        // Failpoint: simular falha fiscal antes de gravar
        await FailpointInjector.getInstance().checkpoint('FiscalEventStore.recordInteraction.before');

        const id = crypto.randomUUID();
        const query = `
            INSERT INTO fiscal_event_store
            (fiscal_event_id, ref_seal_id, ref_event_id, doc_type, gov_protocol, payload_sent, response_received, fiscal_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING fiscal_event_id
        `;

        const values = [
            id,
            doc.ref_seal_id,
            doc.ref_event_id,
            doc.doc_type,
            result.gov_protocol,
            JSON.stringify(doc.raw_payload || {}),
            JSON.stringify(result), // Store full result as evidence
            result.status
        ];

        try {
            await this.pool.query(query, values);

            // Failpoint: simular falha após gravar
            await FailpointInjector.getInstance().checkpoint('FiscalEventStore.recordInteraction.after');

            return id;
        } catch (err: any) {
            // If duplicate (idempotency key ref_seal_id + doc_type), we might handle or throw.
            // For strict audit, we throw.
            throw err;
        }
    }

    async getBySealId(sealId: string): Promise<FiscalEventRecord[]> {
        const query = `SELECT * FROM fiscal_event_store WHERE ref_seal_id = $1 ORDER BY fiscal_sequence_id ASC`;
        const res = await this.pool.query(query, [sealId]);
        return res.rows.map(this.mapRow);
    }

    private mapRow(row: any): FiscalEventRecord {
        return {
            fiscal_event_id: row.fiscal_event_id,
            fiscal_sequence_id: row.fiscal_sequence_id,
            ref_seal_id: row.ref_seal_id,
            ref_event_id: row.ref_event_id,
            doc_type: row.doc_type,
            gov_protocol: row.gov_protocol,
            payload_sent: row.payload_sent,
            response_received: row.response_received,
            fiscal_status: row.fiscal_status,
            created_at: new Date(row.created_at)
        };
    }
}
