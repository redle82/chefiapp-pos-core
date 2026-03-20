import { Pool, PoolClient } from "pg";
import { PostgresLink } from "../../gate3-persistence/PostgresLink";
import { PostgresEventStore } from "./PostgresEventStore";
import { PostgresLegalSealStore } from "../../legal-boundary/persistence/PostgresLegalSealStore";
import { LegalBoundary } from "../../legal-boundary/LegalBoundary";
import { CoreEvent } from "../../event-log/types";
import { LegalEntityType } from "../../legal-boundary/types";
import { FailpointInjector } from "../../tests/harness/FailpointInjector";

// Helper Interface for dependency injection of stores inside transaction
export interface TransactionContext {
    eventStore: PostgresEventStore;
    sealStore: PostgresLegalSealStore;
    legalBoundary: LegalBoundary; // Boundary configured with the transactional seal store
}

export class CoreTransactionManager {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || PostgresLink.getInstance().getPool();
    }

    /**
     * Execute a unit of work transactionally.
     * If the work throws, the transaction rolls back.
     * If the work returns, the transaction commits.
     */
    async execute<T>(
        work: (context: TransactionContext) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            // Instantiate Transactonal Adapters
            const eventStore = new PostgresEventStore({ pool: client });
            const sealStore = new PostgresLegalSealStore({ pool: client });
            const legalBoundary = new LegalBoundary(sealStore);

            const context: TransactionContext = {
                eventStore,
                sealStore,
                legalBoundary
            };

            const result = await work(context);

            await client.query("COMMIT");
            return result;

        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Convenience method to just write an event + seal atomically.
     * This matches the exact requirement of Gate 4 Atomicity.
     */
    async appendAndSeal(
        event: CoreEvent,
        getStreamHashFn: (t: LegalEntityType, i: string) => string
    ): Promise<void> {
        // Failpoint: simular falha de rede/DB antes do append
        await FailpointInjector.getInstance().checkpoint('CoreTransactionManager.appendAndSeal.before');

        return this.execute(async (ctx) => {
            // 1. Append to Event Store (Optimistic Lock happens here)
            await ctx.eventStore.append(event);

            // Failpoint: simular falha entre append e seal
            await FailpointInjector.getInstance().checkpoint('CoreTransactionManager.appendAndSeal.middle');

            // 2. Observe and Seal (Idempotent)
            await ctx.legalBoundary.observe([event], getStreamHashFn);

            // Failpoint: simular falha antes do commit
            await FailpointInjector.getInstance().checkpoint('CoreTransactionManager.appendAndSeal.after');
        });
    }
}
