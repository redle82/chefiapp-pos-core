import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Pool } from "pg";
import { FiscalEventStore } from "../../fiscal-modules/FiscalEventStore";
import { TaxDocument } from "../../fiscal-modules/types";
import { randomUUID } from "crypto";

// NOTE: Ensure 'docker-compose up -d' is running
const TEST_DB_CONFIG = {
    user: "test_user",
    password: "test_password",
    host: "localhost",
    database: "chefiapp_core_test",
    port: 5432,
    max: 10,
    idleTimeoutMillis: 1000
};

describe("GATE 5.2: Fiscal Hardening", () => {
    let pool: Pool;
    let fiscalStore: FiscalEventStore;

    beforeAll(async () => {
        pool = new Pool(TEST_DB_CONFIG);
        try {
            await pool.query('SELECT NOW()');

            // Apply Hardening Schema if not present (simulating migration)
            // We reuse the updated schema logic here for check.
            await pool.query(`
                CREATE OR REPLACE FUNCTION fiscal_forbid_mutation()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'FISCAL_IMMUTABLE_VIOLATION: Fiscal history cannot be altered.';
                END;
                $$ LANGUAGE plpgsql;
            `);

            try {
                await pool.query(`
                    CREATE TRIGGER fiscal_immutable_protection
                    BEFORE UPDATE OR DELETE ON fiscal_event_store
                    FOR EACH ROW
                    EXECUTE FUNCTION fiscal_forbid_mutation();
                `);
            } catch (e: any) {
                // Ignore if exists
            }

            // Ensure Unique Constraint (might need Drop/Add if reusing table)
            // For test, we rely on the implementation assuming fresh or migrated DB
            // We can try to add it if missing.
            try {
                await pool.query(`ALTER TABLE fiscal_event_store ADD CONSTRAINT uq_fiscal_idempotency UNIQUE(ref_seal_id, doc_type)`);
            } catch (e) { /* ignore if exists */ }

        } catch (e) {
            console.error("DB Init error", e);
        }

        fiscalStore = new FiscalEventStore({ pool });
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        // We cannot TRUNCATE if we have the trigger? 
        // TRUNCATE is DDL/Special cmd, usually bypasses row triggers on some DBs, 
        // but let's check. If forbidden, we are in trouble for tests!
        // Usually forbid_mutation is on UPDATE/DELETE, not TRUNCATE.
        await pool.query('TRUNCATE TABLE fiscal_event_store RESTART IDENTITY CASCADE');
    });

    it("should enforce Idempotency (prevent duplicate doc for same seal)", async () => {
        const sealId = "seal_HARD_1";
        const docType = "MOCK";
        const eventId = randomUUID(); // Need valid UUID for ref if FK check? 
        // Note: ref_event_id has FK to event_store. We need to cheat or insert mock event.
        // Let's rely on weak FK for this specific unit test setup or insert pre-reqs.
        // The schema has REFERENCES. So we MUST insert parent event/seal.
        // BUT, our schema.sql defined FKs.

        // Let's insert fake parents manually to bypass Store overhead
        await pool.query(`INSERT INTO event_store (event_id, stream_type, stream_id, stream_version, event_type, payload, meta) VALUES ($1, 'TEST', 'test', 1, 'TEST', '{}', '{}')`, [eventId]);
        await pool.query(`INSERT INTO legal_seals (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot) VALUES ($1, 'TEST', 'test', 'SEALED', $2, 'hash', '{}')`, [sealId, eventId]);

        const doc = {
            doc_type: docType as any,
            ref_event_id: eventId,
            ref_seal_id: sealId,
            total_amount: 100,
            taxes: { icms: 0, pis: 0, cofins: 0 },
            items: [],
            raw_payload: {}
        };

        const result = { status: "ACCEPTED" as any, reported_at: new Date() };

        // 1. First Insert
        await fiscalStore.recordInteraction(doc, result);

        // 2. Second Insert (Duplicate)
        await expect(fiscalStore.recordInteraction(doc, result)).rejects.toThrow();
        // Should throw unique constraint violation
    });

    it("should enforce Immutability (prevent UPDATE/DELETE)", async () => {
        const sealId = "seal_HARD_2";
        const eventId = randomUUID();

        await pool.query(`INSERT INTO event_store (event_id, stream_type, stream_id, stream_version, event_type, payload, meta) VALUES ($1, 'TEST', 'test2', 1, 'TEST', '{}', '{}')`, [eventId]);
        await pool.query(`INSERT INTO legal_seals (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot) VALUES ($1, 'TEST', 'test2', 'SEALED', $2, 'hash', '{}')`, [sealId, eventId]);

        const doc: TaxDocument = {
            doc_type: "MOCK",
            ref_event_id: eventId,
            ref_seal_id: sealId,
            total_amount: 100,
            taxes: { icms: 0, pis: 0, cofins: 0 },
            items: [],
            raw_payload: {}
        };

        const fiscalId = await fiscalStore.recordInteraction(doc, { status: "ACCEPTED", reported_at: new Date() } as any);

        // Attempt Update
        await expect(
            pool.query(`UPDATE fiscal_event_store SET fiscal_status = 'HACKED' WHERE fiscal_event_id = $1`, [fiscalId])
        ).rejects.toThrow(/FISCAL_IMMUTABLE_VIOLATION/);

        // Attempt Delete
        await expect(
            pool.query(`DELETE FROM fiscal_event_store WHERE fiscal_event_id = $1`, [fiscalId])
        ).rejects.toThrow(/FISCAL_IMMUTABLE_VIOLATION/);
    });
});
