import { PaymentGatewayAdapter, PaymentIntentResult, VerifiedPayment } from "./PaymentGatewayAdapter";

/**
 * Local Mock Gateway
 * 
 * Simulates a real payment provider without network calls.
 * Useful for:
 * - Local Development
 * - Integration Tests
 * - "Cash" payments (conceptual)
 */
export class LocalMockGateway implements PaymentGatewayAdapter {
    readonly providerId = "mock_local";

    async createPaymentIntent(
        orderId: string,
        amountCents: number,
        currency: string,
        metadata?: Record<string, any>
    ): Promise<PaymentIntentResult> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));

        const gatewayReference = `mock_ref_${orderId}_${Date.now()}`;

        return {
            gatewayReference,
            clientSecret: `mock_secret_${gatewayReference}`,
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        };
    }

    async verifyWebhook(
        payload: any,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedPayment | null> {
        // In the mock, we assume the payload IS the VerifiedPayment structure 
        // passing through a "fake" webhook for testing loopback.

        if (!payload || !payload.orderId || !payload.amountCents) {
            // Invalid mock payload
            return null;
        }

        // Simulate signature check
        if (headers['x-mock-signature'] !== 'valid') {
            throw new Error("Invalid Mock Signature");
        }

        return {
            gatewayReference: payload.gatewayReference || `mock_verified_${Date.now()}`,
            orderId: payload.orderId,
            amountCents: payload.amountCents,
            currency: payload.currency || "BRL",
            status: payload.status || "PAID",
            occurredAt: new Date(),
            rawMetadata: payload
        };
    }

    /**
     * Helper for tests to generate a valid "webhook" payload
     */
    generateSuccessPayload(orderId: string, amountCents: number) {
        return {
            gatewayReference: `mock_tx_${Date.now()}`,
            orderId,
            amountCents,
            currency: "BRL",
            status: "PAID"
        };
    }
}
