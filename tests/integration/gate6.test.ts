import { LocalMockGateway } from "../../gateways/LocalMockGateway";
import { GatewayRegistry } from "../../gateways/GatewayRegistry";
import { CoreTransactionManager } from "../../core-engine/persistence/CoreTransactionManager";
import { LegalEntityType } from "../../legal-boundary/types";

// --- MOCK SETUP ---
const mockQuery = jest.fn();
const mockClient = {
    query: mockQuery,
    release: jest.fn(),
};
const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: mockQuery, // Pool.query shortcut
    on: jest.fn(),
    end: jest.fn(),
};

// Mock PostgresLink to return our mock pool
jest.mock('../../gate3-persistence/PostgresLink', () => ({
    PostgresLink: {
        getInstance: () => ({
            getPool: () => mockPool,
            close: jest.fn(),
            query: mockQuery
        })
    }
}));

// Mock 'pg' module used by CoreTransactionManager
jest.mock('pg', () => ({
    Pool: jest.fn(() => mockPool)
}));

describe("Gate 6: Payment Gateway Abstraction (Witness Pattern)", () => {
    let mockGateway: LocalMockGateway;
    let txManager: CoreTransactionManager;
    let orderId: string;

    beforeAll(async () => {
        // Instantiate manager (it uses new Pool(), which is mocked)
        txManager = new CoreTransactionManager(mockPool as any);
        mockGateway = new LocalMockGateway();
        GatewayRegistry.getInstance().register(mockGateway);
    });

    beforeEach(async () => {
        mockQuery.mockReset();
        // Default Mock Responses for successful flow

        mockQuery.mockResolvedValue({ rowCount: 1, rows: [] }); // Default

        // Setup payload
        const newOrderId = `ord_gate6_${Date.now()}`;
        orderId = newOrderId;
    });

    const getStreamHash = (type: LegalEntityType, id: string) => `hash_${type}_${id}`;

    test("Mock Gateway should issue valid Intent", async () => {
        const intent = await mockGateway.createPaymentIntent(orderId, 1000, "BRL");
        expect(intent.gatewayReference).toContain("mock_ref_");
        expect(intent.clientSecret).toBeDefined();
    });

    test("Mock Gateway webhook should result in Sealed Payment", async () => {
        // 1. Simulate Webhook
        const successPayload = mockGateway.generateSuccessPayload(orderId, 1000);
        const headers = { 'x-mock-signature': 'valid' };

        // 2. Gateway verifies source (Witness Step)
        const verified = await mockGateway.verifyWebhook(successPayload, headers);
        expect(verified).not.toBeNull();
        expect(verified!.status).toBe("PAID");

        // 3. Simulate Core Bridge Logic (Judge Step)
        const paymentId = `pay_${verified!.gatewayReference}`;
        const factEvent: any = {
            event_id: `evt_pay_${Date.now()}`,
            stream_id: `PAYMENT:${paymentId}`,
            stream_version: 1,
            type: "PAYMENT_CONFIRMED",
            payload: {
                payment_id: paymentId,
                order_id: verified!.orderId,
                amount_cents: verified!.amountCents,
                gateway_ref: verified!.gatewayReference,
                method: "CREDIT_CARD",
                status: "CONFIRMED"
            },
            occurred_at: new Date(),
            correlation_id: verified!.gatewayReference,
        };

        // Prepare Mock Sequence for appendAndSeal
        // 6 calls expected:
        mockQuery.mockResolvedValueOnce({}); // 1. BEGIN
        mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // 2. INSERT INTO event_store

        // LegalBoundary Logic:
        mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // 3. SELECT * FROM legal_seals (Check)
        mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ seq: '100' }] }); // 4. SELECT nextval (Sequence)
        mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ legal_state: 'PAYMENT_SEALED' }] }); // 5. INSERT INTO legal_seals

        mockQuery.mockResolvedValueOnce({}); // 6. COMMIT

        // 4. Core Transaction (Seal Step) - PASS THE HASH FN
        await txManager.appendAndSeal(factEvent, getStreamHash);

        // 5. Verification
        // Check that queries were executed
        expect(mockQuery).toHaveBeenCalledTimes(6);

        // Assert: First call is BEGIN
        expect(mockQuery.mock.calls[0][0]).toBe("BEGIN");

        // Assert: Second is Event Append
        const insertEventSql = mockQuery.mock.calls[1][0];
        const insertEventParams = mockQuery.mock.calls[1][1];
        expect(insertEventSql).toContain("INSERT INTO event_store");
        // Param 1 is stream_type ("PAYMENT")
        expect(insertEventParams[1]).toBe("PAYMENT");
        // Param 2 is stream_id ("pay_...")
        expect(insertEventParams[2]).toBe(paymentId);

        // Assert: Third is Select Check
        expect(mockQuery.mock.calls[2][0]).toContain("SELECT");

        // Assert: Fourth is Sequence
        expect(mockQuery.mock.calls[3][0]).toContain("nextval");

        // Assert: Fifth is Seal Creation (INSERT)
        const insertSealSql = mockQuery.mock.calls[4][0];
        const insertSealParams = mockQuery.mock.calls[4][1];
        expect(insertSealSql).toContain("INSERT INTO legal_seals");
        expect(insertSealParams[1]).toBe("PAYMENT"); // entity_type
        expect(insertSealParams[2]).toBe(paymentId); // entity_id

        // Assert: Sixth is COMMIT
        expect(mockQuery.mock.calls[5][0]).toBe("COMMIT");
    });
});
