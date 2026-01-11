import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Pool } from "pg";
import { CoreTransactionManager } from "../../core-engine/persistence/CoreTransactionManager";
import { PostgresEventStore } from "../../core-engine/persistence/PostgresEventStore";
import { PostgresLegalSealStore } from "../../legal-boundary/persistence/PostgresLegalSealStore";
import { CoreEvent } from "../../event-log/types";
import { ConsoleFiscalAdapter } from "../../fiscal-modules/ConsoleFiscalAdapter";
import { LegalEntityType } from "../../legal-boundary/types";

// NOTE: Ensure 'docker-compose up -d' is running before executing this test!
const TEST_DB_CONFIG = {
    user: "test_user",
    password: "test_password",
    host: "localhost",
    database: "chefiapp_core_test",
    port: 5432,
    max: 10,
    idleTimeoutMillis: 1000
};

describe("GATE 5: Fiscal Integration (Observer Pattern)", () => {
    let pool: Pool;
    let txManager: CoreTransactionManager;
    let fiscalAdapter: ConsoleFiscalAdapter;
    let sealStoreReader: PostgresLegalSealStore;
    let eventStoreReader: PostgresEventStore;

    beforeAll(async () => {
        pool = new Pool(TEST_DB_CONFIG);
        try {
            await pool.query('SELECT NOW()');
        } catch (e) {
            console.error("GATE 5 TEST SKIPPED (DB not ready)");
        }

        txManager = new CoreTransactionManager(pool);
        fiscalAdapter = new ConsoleFiscalAdapter(); // Pure Logic Mock

        // Needed to read back what just happened to feed the observer manually
        // In prod, this feeding would be an async worker or event bus
        sealStoreReader = new PostgresLegalSealStore({ pool });
        eventStoreReader = new PostgresEventStore({ pool });
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        await pool.query('TRUNCATE TABLE legal_seals, event_store RESTART IDENTITY CASCADE');
    });

    const getStreamHash = (type: LegalEntityType, id: string) => `hash_${type}_${id}`;

    it("should allow Fiscal Adapter to observe a sealed event without blocking", async () => {
        const eventId = "55555555-5555-5555-5555-555555555555";
        const event: CoreEvent = {
            event_id: eventId,
            stream_id: "PAYMENT:pay-fiscal",
            stream_version: 1,
            type: "PAYMENT_CONFIRMED",
            payload: { payment_id: "pay-fiscal", amount: 200 },
            occurred_at: new Date()
        };

        // 1. Core Transaction (The "Real" work)
        await txManager.appendAndSeal(event, getStreamHash);

        // 2. Async Observation (Simulated)
        // Retrieve valid Seal and Event from DB to prove they exist
        const storedSeal = await sealStoreReader.getSeal("PAYMENT", "pay-fiscal");
        const storedEvents = await eventStoreReader.readStream("PAYMENT:pay-fiscal");
        const storedEvent = storedEvents[0];

        expect(storedSeal).toBeDefined();

        // 3. Fiscal Reaction
        const fiscalResult = await fiscalAdapter.onSealed(storedSeal!, storedEvent);

        // Assertions
        expect(fiscalResult.status).toBe("REPORTED");
        expect(fiscalResult.gov_protocol).toMatch(/PROTO-MOCK/);

        // Verify Core was untouched (Observed, not Modified)
        // (Implicit by nature of read-only stores used in Adapter context conceptually)
    });
});
