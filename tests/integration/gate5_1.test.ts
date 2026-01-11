import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Pool } from "pg";
import { CoreTransactionManager } from "../../core-engine/persistence/CoreTransactionManager";
import { PostgresEventStore } from "../../core-engine/persistence/PostgresEventStore";
import { PostgresLegalSealStore } from "../../legal-boundary/persistence/PostgresLegalSealStore";
import { FiscalEventStore } from "../../fiscal-modules/FiscalEventStore";
import { CoreEvent } from "../../event-log/types";
import { ConsoleFiscalAdapter } from "../../fiscal-modules/ConsoleFiscalAdapter";
import { LegalEntityType } from "../../legal-boundary/types";

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

describe("GATE 5.1: Fiscal Persistence", () => {
    let pool: Pool;
    let txManager: CoreTransactionManager;
    let fiscalStore: FiscalEventStore;
    let sealStoreReader: PostgresLegalSealStore;
    let eventStoreReader: PostgresEventStore;

    beforeAll(async () => {
        pool = new Pool(TEST_DB_CONFIG);
        try {
            // Ensure schema exists for tests (usually handled by init.sql, but for new table we might need to run it)
            // In a real env, migration runs. Here, let's try to run the NEW schema sql if needed.
            // Or assume user re-ran docker compose down/up with new init?
            // Let's safe-guard by trying to create the table if missing via raw query, 
            // mimicking migration.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS fiscal_event_store (
                    fiscal_event_id UUID PRIMARY KEY,
                    fiscal_sequence_id BIGSERIAL NOT NULL, 
                    ref_seal_id VARCHAR(255) NOT NULL, -- Weak ref for test simplicity or strong? Schema says strong.
                    ref_event_id UUID NOT NULL,
                    doc_type VARCHAR(50) NOT NULL,
                    gov_protocol VARCHAR(255),
                    payload_sent JSONB NOT NULL,
                    response_received JSONB,
                    fiscal_status VARCHAR(50) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
        } catch (e) {
            console.error("DB Init error", e);
        }

        txManager = new CoreTransactionManager(pool);
        fiscalStore = new FiscalEventStore({ pool });
        sealStoreReader = new PostgresLegalSealStore({ pool });
        eventStoreReader = new PostgresEventStore({ pool });
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        // Truncate relevant tables
        await pool.query('TRUNCATE TABLE fiscal_event_store, legal_seals, event_store RESTART IDENTITY CASCADE');
    });

    const getStreamHash = (type: LegalEntityType, id: string) => `hash_${type}_${id}`;

    it("should persist a fiscal report linked to a legal seal", async () => {
        // 1. Core Event + Seal
        const eventId = "66666666-6666-6666-6666-666666666666";
        const event: CoreEvent = {
            event_id: eventId,
            stream_id: "PAYMENT:pay-persist",
            stream_version: 1,
            type: "PAYMENT_CONFIRMED",
            payload: { payment_id: "pay-persist", amount: 300 },
            occurred_at: new Date()
        };

        await txManager.appendAndSeal(event, getStreamHash);

        // 2. Fetch Seal
        const seal = await sealStoreReader.getSeal("PAYMENT", "pay-persist");
        expect(seal).toBeDefined();

        // 3. Simulate Fiscal Reporting (Adapter Logic)
        const mockAdapter = new ConsoleFiscalAdapter(); // Just for mapping logic
        // We can expose the mapping method or just manually create the doc
        // Let's look at ConsoleFiscalAdapter... it maps internally onSealed.
        // Let's modify ConsoleFiscalAdapter later to use Store?
        // For this test, we test the STORE directly.

        const taxDoc = {
            doc_type: "MOCK" as const,
            ref_event_id: eventId,
            ref_seal_id: seal!.seal_id,
            total_amount: 300,
            taxes: { icms: 0, pis: 0, cofins: 0 },
            items: [],
            raw_payload: { xml: "<mock></mock>" }
        };

        const fiscalResult = {
            status: "REPORTED" as const,
            gov_protocol: "PROTO-PERSIST-1",
            reported_at: new Date()
        };

        // 4. Record Persistence
        await fiscalStore.recordInteraction(taxDoc, fiscalResult);

        // 5. Verify
        const records = await fiscalStore.getBySealId(seal!.seal_id);
        expect(records.length).toBe(1);
        expect(records[0].gov_protocol).toBe("PROTO-PERSIST-1");
        expect(records[0].ref_event_id).toBe(eventId);
    });
});
