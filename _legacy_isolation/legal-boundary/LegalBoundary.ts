import { LegalSealStore } from "./LegalSealStore";
import { LegalEntityType, LegalSeal, LegalState } from "./types";

// Basic interface for Core Event minimal compatibility
export interface CoreEvent {
    event_id?: string;
    type: string;
    payload?: any;
    meta?: any;
}

/**
 * Legal Boundary Layer
 * 
 * CRITICAL ASSUMPTION:
 * This layer assumes the CORE has already validated causal correctness.
 * 
 * Legal Boundary DOES NOT validate:
 * - Whether ORDER was paid before closing
 * - Whether PAYMENT amount matches ORDER total
 * - Whether SESSION is active
 * 
 * Legal Boundary ONLY:
 * - Observes events from CORE
 * - Creates immutable legal seals
 * - Enforces immutability on sealed entities
 * 
 * Mixing validation logic here violates architectural separation.
 * See legal-boundary/README.md for detailed explanation.
 */
export class LegalBoundary {
    constructor(private sealStore: LegalSealStore) { }

    async observe(
        coreEvents: CoreEvent[],
        getStreamHashFn: (entityType: LegalEntityType, entityId: string) => string
    ): Promise<void> {
        for (const event of coreEvents) {
            await this.processEvent(event, getStreamHashFn);
        }
    }

    private async processEvent(
        event: CoreEvent,
        getStreamHashFn: (entityType: LegalEntityType, entityId: string) => string
    ): Promise<void> {
        // 1. PAYMENT_CONFIRMED -> PAYMENT_SEALED
        if (event.type === "PAYMENT_CONFIRMED") {
            const paymentId = event.payload?.payment_id || event.payload?.id; // Robustness
            if (!paymentId) return;

            await this.trySeal(
                "PAYMENT",
                paymentId,
                "PAYMENT_SEALED",
                getStreamHashFn,
                JSON.stringify(event.payload), // financial_state derived
                event.event_id
            );
        }

        // 2. ORDER_PAID -> ORDER_DECLARED
        if (event.type === "ORDER_PAID") {
            const orderId = event.payload?.order_id || event.payload?.id;
            if (!orderId) return;

            await this.trySeal(
                "ORDER",
                orderId,
                "ORDER_DECLARED",
                getStreamHashFn,
                JSON.stringify(event.payload),
                event.event_id
            )
        }

        // 3. ORDER_CLOSED -> ORDER_FINAL
        if (event.type === "ORDER_CLOSED") {
            const orderId = event.payload?.order_id || event.payload?.id;
            if (!orderId) return;

            await this.trySeal(
                "ORDER",
                orderId,
                "ORDER_FINAL",
                getStreamHashFn,
                JSON.stringify(event.payload),
                event.event_id
            )
        }
    }

    private async trySeal(
        entityType: LegalEntityType,
        entityId: string,
        legalState: LegalState,
        getStreamHashFn: (t: LegalEntityType, i: string) => string,
        financialState: string,
        eventId?: string
    ): Promise<void> {
        // Check if already sealed with this state (Idempotency / Replay protection)
        const existingSeals = await this.sealStore.listSealsByEntity(entityType, entityId);
        const alreadySealed = existingSeals.find(s => s.legal_state === legalState);
        if (alreadySealed) {
            return; // Idempotent: already has this seal
        }

        const sequence = await this.sealStore.nextSequence();
        const sealId = `seal_${entityType}_${entityId}_${legalState}_${sequence}`;
        const streamHash = getStreamHashFn(entityType, entityId);

        const seal: LegalSeal = {
            seal_id: sealId,
            entity_type: entityType,
            entity_id: entityId,
            seal_event_id: eventId || "TODO_LINK_TO_EVENT_ID",
            stream_hash: streamHash,
            sealed_at: new Date(),
            sequence: sequence,
            financial_state: financialState,
            legal_state: legalState,
        };

        await this.sealStore.createSeal(seal);
    }

    async assertNotSealed(entity_type: LegalEntityType, entity_id: string): Promise<void> {
        if (await this.sealStore.isSealed(entity_type, entity_id)) {
            throw new Error(`LEGAL_SEALED: Entity ${entity_type}:${entity_id} is immutable.`);
        }
    }
}
