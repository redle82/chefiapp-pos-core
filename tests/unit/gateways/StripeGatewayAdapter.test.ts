import { StripeGatewayAdapter } from '../../../gateways/StripeGatewayAdapter';
import * as crypto from 'crypto';

// Setup Logic
const API_KEY = 'sk_test_mock';
const WEBHOOK_SECRET = 'whsec_mock';

describe('StripeGatewayAdapter (Production Hardening)', () => {
    let adapter: StripeGatewayAdapter;

    beforeEach(() => {
        adapter = new StripeGatewayAdapter(API_KEY, WEBHOOK_SECRET);
    });

    const createPayload = () => JSON.stringify({
        id: 'evt_TEST_EVENT_ID',
        object: 'event',
        type: 'payment_intent.succeeded',
        created: 1700000000,
        data: {
            object: {
                id: 'pi_TEST_PAYMENT',
                object: 'payment_intent',
                amount_received: 5000,
                currency: 'brl',
                status: 'succeeded',
                created: 1700000000,
                metadata: {
                    order_id: 'ord_TEST_ORDER'
                }
            }
        }
    });

    const sign = (payload: string | Buffer) => {
        const timestamp = Math.floor(Date.now() / 1000);
        // CRITICAL: Se payload for Buffer, converter para string UTF-8 antes de assinar
        // A Stripe assina timestamp + "." + RAW_BODY_STRING (conteúdo real)
        const raw = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
        const signedPayload = `${timestamp}.${raw}`;
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        hmac.update(signedPayload, 'utf8');
        const signature = hmac.digest('hex');
        return `t=${timestamp},v1=${signature}`;
    }

    test('Should ACCEPT raw Buffer with valid signature', async () => {
        const payloadStr = createPayload();
        const payloadBuf = Buffer.from(payloadStr);
        const header = sign(payloadBuf);

        const result = await adapter.verifyWebhook(payloadBuf, { 'stripe-signature': header });

        expect(result).not.toBeNull();
        expect(result?.gatewayReference).toBe('evt_TEST_EVENT_ID'); // Verify Idempotency Mapping
        expect(result?.rawMetadata.payment_intent_id).toBe('pi_TEST_PAYMENT');
        expect(result?.orderId).toBe('ord_TEST_ORDER');
    });

    test('Should REJECT parsed JSON object (Safety Guard)', async () => {
        const payloadStr = createPayload();
        const payloadObj = JSON.parse(payloadStr);
        const header = sign(payloadStr);

        await expect(adapter.verifyWebhook(payloadObj, { 'stripe-signature': header }))
            .rejects
            .toThrow("verifyWebhook() requires a raw Buffer or string");
    });

    test('Should REJECT missing signature', async () => {
        const payloadBuf = Buffer.from(createPayload());

        await expect(adapter.verifyWebhook(payloadBuf, {}))
            .rejects
            .toThrow("Missing stripe-signature header");
    });

    test('Should REJECT invalid signature', async () => {
        const payloadBuf = Buffer.from(createPayload());
        const header = "t=123,v1=bad_signature";

        await expect(adapter.verifyWebhook(payloadBuf, { 'stripe-signature': header }))
            .rejects
            .toThrow("Webhook Signature Verification Failed");
    });
});
