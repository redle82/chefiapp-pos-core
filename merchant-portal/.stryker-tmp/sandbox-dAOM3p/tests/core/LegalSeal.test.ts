// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { SealGenerator } from '../../src/core/events/SealGenerator';
import { EventEnvelope } from '../../src/core/events/SystemEvents';

// Mock Web Crypto API for Node environment (Vitest)
// In a real browser this exists. In Node 20+ it exists as 'crypto'.
import { webcrypto } from 'node:crypto';
if (!global.crypto) {
    (global as any).crypto = webcrypto;
}

describe('LegalSeal (The Notary)', () => {

    const mockEvent: EventEnvelope = {
        eventId: 'ev_123',
        type: 'ORDER_CREATED',
        payload: { total: 100 },
        meta: { timestamp: 123456789, actorId: 'user_1' }
    };

    it('should generate a consistent SHA-256 seal', async () => {
        const seal = await SealGenerator.seal(mockEvent, 'prev_hash_000');
        expect(seal.hash).toBeDefined();
        expect(seal.hash).toHaveLength(64); // SHA-256 hex
    });

    it('should VERIFY a valid seal', async () => {
        const seal = await SealGenerator.seal(mockEvent, 'prev_hash_000');
        const sealedEvent = { ...mockEvent, seal };

        const isValid = await SealGenerator.verify(sealedEvent, 'prev_hash_000');
        expect(isValid).toBe(true);
    });

    it('should DETECT TAMPERING (Invalid Payload)', async () => {
        const seal = await SealGenerator.seal(mockEvent, 'prev_hash_000');

        // Attacker modifies the payload amount!
        const tamperedEvent = {
            ...mockEvent,
            payload: { total: 9999 }, // Fraud!
            seal
        };

        const isValid = await SealGenerator.verify(tamperedEvent, 'prev_hash_000');
        expect(isValid).toBe(false); // CAUGHT!
    });

    it('should DETECT BROKEN CHAIN (Wrong PrevHash)', async () => {
        const seal = await SealGenerator.seal(mockEvent, 'correct_chain_hash');
        const sealedEvent = { ...mockEvent, seal };

        // Verification against wrong history
        const isValid = await SealGenerator.verify(sealedEvent, 'wrong_chain_hash');
        expect(isValid).toBe(false); // CAUGHT!
    });
});
