// @ts-nocheck
export interface EventEnvelope<P = any> {
    eventId: string;
    type: string;
    payload: P;

    // Core Schema Alignment (Phase 11.2)
    stream_id?: string; // INVENTORY:GLOBAL, ORDER:{id}
    stream_version?: number;
    occurred_at?: Date; // The true time
    causation_id?: string;
    correlation_id?: string;

    meta: {
        timestamp: number;
        actorId: string;
        deviceId?: string;
        version: number;
        sessionId?: string;
        /** @deprecated Use top-level causation_id (Phase 11.2) */
        causationId?: string;
    };
    seal?: LegalSeal;
}

export interface LegalSeal {
    hash: string;
    timestamp: number;
    witnessId?: string;
    signature?: string; // Digital Signature if we go hardcore
}
