import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { PostgresEventStore } from "../../core-engine/persistence/PostgresEventStore";
import { PostgresLegalSealStore } from "../../legal-boundary/persistence/PostgresLegalSealStore";
import { CoreTransactionManager } from "../../core-engine/persistence/CoreTransactionManager";
import { CoreEvent } from "../../event-log/types";
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

/** Aplica migração event_store + legal_seals para garantir schema esperado pelo Gate 4. */
async function applyGate4Migration(pool: Pool): Promise<void> {
    const migrationPath = path.join(process.cwd(), "docker-core/schema/migrations/20260128_event_store_and_legal_seals.sql");
    if (!fs.existsSync(migrationPath)) return;
    const sql = fs.readFileSync(migrationPath, "utf8");
    const statements = sql
        .split(";")
        .map((s) => s.replace(/--[^\n]*/g, "").trim())
        .filter((s) => s.length > 0);
    for (const st of statements) {
        try {
            await pool.query(st + ";");
        } catch (e: any) {
            if (e.code !== "42P07") throw e; // ignore "relation already exists" etc.
        }
    }
}

describe("GATE 4: Integration (PostgreSQL)", () => {
    let pool: Pool;
    let eventStoreReader: PostgresEventStore;
    let sealStoreReader: PostgresLegalSealStore;
    let txManager: CoreTransactionManager;

    beforeAll(async () => {
        pool = new Pool(TEST_DB_CONFIG);
        try {
            await pool.query("SELECT NOW()");
            await applyGate4Migration(pool);
        } catch (e) {
            console.error("GATE 4 TEST SKIPPED: DB not running. Please run 'docker-compose up -d'");
        }

        eventStoreReader = new PostgresEventStore({ pool });
        sealStoreReader = new PostgresLegalSealStore({ pool });
        txManager = new CoreTransactionManager(pool);
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        // TRUNCATE to ensure clean state
        await pool.query('TRUNCATE TABLE legal_seals, event_store RESTART IDENTITY CASCADE');
    });

    const getStreamHash = (type: LegalEntityType, id: string) => `hash_${type}_${id}`;

    it("should atomically persist Event and Seal using TransactionManager", async () => {
        const eventId = "11111111-1111-1111-1111-111111111111"; // UUID
        const event: CoreEvent = {
            event_id: eventId,
            stream_id: "PAYMENT:pay-atomic",
            stream_version: 1,
            type: "PAYMENT_CONFIRMED",
            payload: { payment_id: "pay-atomic", amount: 100 },
            occurred_at: new Date(),
            meta: {},
        };

        // Use the Manager to append and seal in one transaction
        await txManager.appendAndSeal(event, getStreamHash);

        // Assert: Event Exists
        const storedEvents = await eventStoreReader.readStream("PAYMENT:pay-atomic");
        expect(storedEvents.length).toBe(1);

        // Assert: Seal Exists
        const storedSeals = await sealStoreReader.listSealsByEntity("PAYMENT", "pay-atomic");
        expect(storedSeals.length).toBe(1);
        expect(storedSeals[0].legal_state).toBe("PAYMENT_SEALED");
    });

    it("should succeed idempotently when seal already exists (observe no-op)", async () => {
        // SCENARIO: Seal already exists for this entity/state. LegalBoundary.observe is idempotent:
        // it finds existing seal and skips createSeal, so appendAndSeal commits and event is persisted.

        const event: CoreEvent = {
            event_id: "22222222-2222-2222-2222-222222222222",
            stream_id: "PAYMENT:pay-fail",
            stream_version: 1,
            type: "PAYMENT_CONFIRMED",
            payload: { payment_id: "pay-fail" },
            occurred_at: new Date(),
            meta: {},
        };

        // Pre-insert seal so "already sealed" for this entity/state
        await pool.query(`
            INSERT INTO legal_seals (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
         `, [
            "seal_PAYMENT_pay-fail_PAYMENT_SEALED_1",
            "PAYMENT",
            "pay-fail",
            "PAYMENT_SEALED",
            "00000000-0000-0000-0000-000000000000",
            "hash_PAYMENT_pay-fail",
            "{}"
        ]);

        // Idempotent: should not throw; event is appended, seal step is no-op
        await txManager.appendAndSeal(event, getStreamHash);

        const events = await eventStoreReader.readStream("PAYMENT:pay-fail");
        expect(events.length).toBe(1);
        const seals = await sealStoreReader.listSealsByEntity("PAYMENT", "pay-fail");
        expect(seals.length).toBe(1);
    });

    it("should enforce optimistic concurrency on EventStore", async () => {
        const event1: CoreEvent = {
            event_id: "33333333-3333-3333-3333-333333333333",
            stream_id: "ORDER:occ",
            stream_version: 1,
            type: "ORDER_CREATED",
            payload: {},
            occurred_at: new Date(),
            meta: {},
        };

        // Append first version
        await eventStoreReader.append(event1);

        // Attempt duplicate version via Transaction Manager
        // This tests that the Manager correctly bubbles up the Concurrency Exception
        // and rolls back (though here there is nothing to rollback except the failed insert).
        const event2: CoreEvent = {
            event_id: "44444444-4444-4444-4444-444444444444",
            stream_id: "ORDER:occ",
            stream_version: 1, // CONFLICT!
            type: "ORDER_LOCKED",
            payload: {},
            occurred_at: new Date(),
            meta: {},
        };

        await expect(txManager.appendAndSeal(event2, getStreamHash)).rejects.toThrow(/Concurrency Exception/);
    });
});
