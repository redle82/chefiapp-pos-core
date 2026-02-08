import Stripe from 'stripe';
import { PaymentGatewayAdapter, PaymentIntentResult, VerifiedPayment } from './PaymentGatewayAdapter';

export class StripeGatewayAdapter implements PaymentGatewayAdapter {
    readonly providerId = "STRIPE_V1";
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(apiKey: string, webhookSecret: string) {
        this.stripe = new Stripe(apiKey, {
            // apiVersion: '2023-10-16', // Let library handle version or use account default
        });
        this.webhookSecret = webhookSecret;
    }

    /**
     * Creates a Stripe Payment Intent.
     */
    async createPaymentIntent(
        orderId: string,
        amountCents: number,
        currency: string,
        metadata?: Record<string, any>
    ): Promise<PaymentIntentResult> {

        const params: Stripe.PaymentIntentCreateParams = {
            amount: amountCents,
            currency: currency.toLowerCase(), // CRITICAL: Stripe requires lowercase currency codes
            metadata: {
                ...metadata,
                order_id: orderId
            },
            automatic_payment_methods: {
                enabled: true,
            },
        };

        const paymentIntent = await this.stripe.paymentIntents.create(params);

        return {
            gatewayReference: paymentIntent.id,
            clientSecret: paymentIntent.client_secret || undefined,
            expiresAt: undefined
        };
    }

    /**
     * Verifies the Cryptographic Signature of the Webhook.
     */
    async verifyWebhook(
        payload: any,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedPayment | null> {

        // GUARD: Stripe requires the RAW body (Buffer or string) for signature verification.
        // If 'payload' is already parsed JSON (e.g. by 'express.json()'), signature checks fail.
        if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
            throw new Error(
                "StripeGatewayAdapter: Invalid payload type. " +
                "verifyWebhook() requires a raw Buffer or string. " +
                "Ensure your webhook endpoint uses 'express.raw({type: 'application/json'})' " +
                "and is NOT processed by global body parsers."
            );
        }

        const signature = headers['stripe-signature'];
        if (!signature) {
            throw new Error("Missing stripe-signature header");
        }

        // Handle array header edge case
        const sig = Array.isArray(signature) ? signature[0] : signature;

        let event: Stripe.Event;

        try {
            // Note: payload MUST be the raw string/buffer
            event = this.stripe.webhooks.constructEvent(
                payload,
                sig,
                this.webhookSecret
            );
        } catch (err: any) {
            throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
        }

        // Map Event to VerifiedPayment
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const orderId = paymentIntent.metadata?.order_id;
            if (!orderId) {
                console.warn(`[StripeGateway] Payment ${paymentIntent.id} missing order_id metadata.`);
                return null;
            }

            return {
                gatewayReference: event.id, // IDEMPOTENCY KEY: Must be the EVENT ID (evt_...), not the Payment Intent ID
                orderId: orderId,
                amountCents: paymentIntent.amount_received,
                currency: paymentIntent.currency,
                status: 'PAID',
                occurredAt: new Date(paymentIntent.created * 1000),
                rawMetadata: {
                    stripe_status: paymentIntent.status,
                    payment_intent_id: paymentIntent.id // Store PI ID in metadata
                }
            };
        }

        return null;
    }
}
