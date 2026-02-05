import { describe, it, expect, beforeEach } from "@jest/globals";
import { InMemoryLegalSealStore } from "../legal-boundary/InMemoryLegalSealStore";
import { LegalBoundary, CoreEvent } from "../legal-boundary/LegalBoundary";
import { LegalEntityType } from "../legal-boundary/types";

describe("GATE 2: Legal Boundary", () => {
    let store: InMemoryLegalSealStore;
    let boundary: LegalBoundary;

    beforeEach(() => {
        store = new InMemoryLegalSealStore();
        boundary = new LegalBoundary(store);
    });

    const getStreamHash = (type: LegalEntityType, id: string) => `hash_${type}_${id}`;

    it("should create PAYMENT_SEALED on PAYMENT_CONFIRMED", async () => {
        const events: CoreEvent[] = [
            { type: "PAYMENT_CONFIRMED", payload: { payment_id: "pay-123", amount: 100 } }
        ];

        await boundary.observe(events, getStreamHash);

        const seal = await store.getSeal("PAYMENT", "pay-123");
        expect(seal).toBeDefined();
        expect(seal?.legal_state).toBe("PAYMENT_SEALED");
        expect(seal?.entity_id).toBe("pay-123");
        expect(seal?.sequence).toBe(1);
    });

    it("should create ORDER_DECLARED on ORDER_PAID", async () => {
        const events: CoreEvent[] = [
            { type: "ORDER_PAID", payload: { order_id: "ord-123" } }
        ];

        await boundary.observe(events, getStreamHash);

        const seal = await store.getSeal("ORDER", "ord-123");
        expect(seal?.legal_state).toBe("ORDER_DECLARED");
        expect(seal?.sequence).toBe(1);
    });

    it("should create ORDER_FINAL on ORDER_CLOSED", async () => {
        const events: CoreEvent[] = [
            { type: "ORDER_CLOSED", payload: { order_id: "ord-123" } }
        ];

        await boundary.observe(events, getStreamHash);

        const seal = await store.getSeal("ORDER", "ord-123");
        expect(seal?.legal_state).toBe("ORDER_FINAL");
    });

    it("should maintain monotonic sequence across multiple events", async () => {
        const events: CoreEvent[] = [
            { type: "PAYMENT_CONFIRMED", payload: { payment_id: "pay-1" } },
            { type: "PAYMENT_CONFIRMED", payload: { payment_id: "pay-2" } }
        ];

        await boundary.observe(events, getStreamHash);

        const seal1 = await store.getSeal("PAYMENT", "pay-1");
        const seal2 = await store.getSeal("PAYMENT", "pay-2");

        expect(seal1?.sequence).toBe(1);
        expect(seal2?.sequence).toBe(2);
    });

    it("should ensure idempotency (replay protection)", async () => {
        const events: CoreEvent[] = [
            { type: "PAYMENT_CONFIRMED", payload: { payment_id: "pay-replay" } }
        ];

        // 1st Run
        await boundary.observe(events, getStreamHash);
        const seal1 = await store.getSeal("PAYMENT", "pay-replay");
        const seq1 = seal1?.sequence;
        expect(seq1).toBe(1);

        // 2nd Run (Replay)
        await boundary.observe(events, getStreamHash);
        const seals = await store.listSealsByEntity("PAYMENT", "pay-replay");

        // Should still only have one unique seal for this state
        expect(seals.length).toBe(1);
        expect(seals[0].sequence).toBe(seq1);

        // Store counter should not have incremented for the ignored replay
        expect(await store.nextSequence()).toBe(2); // Was 1, next is 2
    });

    it("should enforce assertNotSealed", async () => {
        const events: CoreEvent[] = [
            { type: "ORDER_CLOSED", payload: { order_id: "ord-blocked" } }
        ];

        await boundary.observe(events, getStreamHash);

        // Should be sealed now
        expect(await store.isSealed("ORDER", "ord-blocked")).toBe(true);

        // Assert should throw
        await expect(boundary.assertNotSealed("ORDER", "ord-blocked")).rejects.toThrow("LEGAL_SEALED");
    });

    it("should not allow duplicate seals in storage layer directly", async () => {
        // Create a seal
        const seal = {
            seal_id: "test_seal",
            entity_type: "ORDER" as any,
            entity_id: "ord-dup",
            seal_event_id: "evt",
            stream_hash: "hash",
            sealed_at: new Date(),
            sequence: 1,
            financial_state: "{}",
            legal_state: "ORDER_FINAL" as any
        };

        await store.createSeal(seal);

        // Try to create exact same seal (should fail by seal_id)
        await expect(store.createSeal(seal)).rejects.toThrow();

        // Try to create different seal ID but same Entity+State
        const seal2 = { ...seal, seal_id: "test_seal_2" };
        await expect(store.createSeal(seal2)).rejects.toThrow();
    });

    it("should store immutable copies", async () => {
        const sealInput: any = {
            seal_id: "seal_mut",
            entity_type: "ORDER",
            entity_id: "ord-mut",
            legal_state: "ORDER_FINAL",
            sequence: 123
        };

        await store.createSeal(sealInput);

        const retrieved = await store.getSeal("ORDER", "ord-mut");

        // Modify original
        sealInput.sequence = 999;

        // Stored should not change
        expect(retrieved?.sequence).toBe(123);

        // Retrieved should be frozen
        expect(Object.isFrozen(retrieved)).toBe(true);
    });
});
