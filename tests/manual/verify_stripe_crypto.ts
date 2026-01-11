import { StripeGatewayAdapter } from '../../gateways/StripeGatewayAdapter';
import * as crypto from 'crypto';

// 1. Setup Dummy Secrets
const API_KEY = 'sk_test_dummy';
const WEBHOOK_SECRET = 'whsec_dummy_secret';

// 2. Instantiate Adapter
const adapter = new StripeGatewayAdapter(API_KEY, WEBHOOK_SECRET);

// 3. Construct Fake Payload
// Note: verifyWebhook expects RAW BODY (string)
const payloadString = JSON.stringify({
    id: 'evt_test_123',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'payment_intent.succeeded',
    data: {
        object: {
            id: 'pi_test_123',
            object: 'payment_intent',
            amount_received: 1000,
            currency: 'brl',
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000),
            metadata: {
                order_id: 'ord_123'
            }
        }
    }
});

// 4. Generate Valid Signature
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payloadString}`;
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(signedPayload);
const signature = hmac.digest('hex');
const header = `t=${timestamp},v1=${signature}`;

// 5. Test Verification
async function run() {
    console.log("--> Testing Stripe Signature Verification...");
    try {
        // Pass payloadString (Raw Body) and Header Record
        const result = await adapter.verifyWebhook(
            payloadString,
            { 'stripe-signature': header }
        );

        if (result && result.status === 'PAID' && result.amountCents === 1000) {
            console.log("✅ SUCCESS: Webhook Verified Correctly!");
            console.log("Verified Payment:", result);
        } else {
            console.error("❌ FAILURE: Result did not match expected payload.", result);
            process.exit(1);
        }

    } catch (err) {
        console.error("❌ CRITICAL FAILURE:", err);
        process.exit(1);
    }
}

run();
