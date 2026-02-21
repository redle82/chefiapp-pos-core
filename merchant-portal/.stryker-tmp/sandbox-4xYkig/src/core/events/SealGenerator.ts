import type { EventEnvelope, LegalSeal } from './SealTypes';

// ⚖️ THE NOTARY
// "Every truth must be signed."

export class SealGenerator {

    /**
     * Generates a Legal Seal for an event.
     * Logic: SHA-256(prevHash + eventId + timestamp + actorId + JSON(payload))
     */
    static async seal(
        event: Omit<EventEnvelope, 'seal'>,
        prevHash: string = 'GENESIS_HASH',
        witnessId?: string
    ): Promise<LegalSeal> {

        const dataToSign = [
            prevHash,
            event.eventId,
            event.meta.timestamp,
            event.meta.actorId,
            JSON.stringify(event.payload), // Deterministic serialization expected
            witnessId || ''
        ].join('|');

        const buffer = new TextEncoder().encode(dataToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            hash: hashHex,
            timestamp: Date.now(),
            witnessId
        };
    }

    /**
     * Verifies if a Seal is valid for a given event and lineage.
     */
    static async verify(
        event: EventEnvelope,
        prevHash: string
    ): Promise<boolean> {
        if (!event.seal) return false;

        const { seal, ...unsealedEvent } = event;
        const reconstructed = await this.seal(
            unsealedEvent,
            prevHash,
            seal?.witnessId
        );

        return reconstructed.hash === event.seal.hash;
    }
}
