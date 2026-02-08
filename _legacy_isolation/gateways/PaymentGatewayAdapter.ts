/**
 * Payment Gateway Adapter Interface (Gate 6)
 * 
 * This contract defines how external payment providers (Witnesses)
 * communicate with the System of Record (Judge).
 * 
 * CORE PRINCIPLE:
 * Gateways do not create money. They witness value transfer.
 * The Core validates the witness testimony and creates the financial fact.
 */

export interface VerifiedPayment {
    gatewayReference: string;  // Unique ID from provider (e.g., "ch_3Lk...")
    orderId: string;           // The Order this payment aims to settle
    amountCents: number;       // The amount ACTUALLY authorized/captured
    currency: string;          // "BRL", "USD", etc.
    status: "PAID" | "FAILED" | "REFUNDED" | "PENDING";
    occurredAt: Date;
    rawMetadata: any;          // Full provider payload for audit trail
}

export interface PaymentIntentResult {
    gatewayReference: string;  // ID to track this intent
    clientSecret?: string;     // For UI SDKs (Stripe Elements, etc.)
    qrCodeUrl?: string;        // For Pix / Crypto
    expiresAt?: Date;
}

export interface PaymentGatewayAdapter {
    /**
     * Unique identifier for the provider (e.g., "stripe", "pix_bank_a", "mock")
     */
    readonly providerId: string;

    /**
     * 1. INTENT (Outbound)
     * Asks the provider to prepare for a payment.
     * This does NOT create a Core Event. It only sets up the external transaction.
     */
    createPaymentIntent(
        orderId: string,
        amountCents: number,
        currency: string,
        metadata?: Record<string, any>
    ): Promise<PaymentIntentResult>;

    /**
     * 2. TESTIMONY (Inbound)
     * Validates that a webhook or callback payload is authentic and maps it
     * to a standardized VerifiedPayment structure.
     * 
     * @param payload The raw body from the webhook
     * @param headers The headers (for signature verification)
     * @returns VerifiedPayment if valid, null if ignored event, throws if invalid signature
     */
    verifyWebhook(
        payload: any,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedPayment | null>;

    /**
     * Optional: Check status manually (Polling fallback)
     */
    checkStatus?(gatewayReference: string): Promise<VerifiedPayment>;
}
