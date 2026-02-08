/**
 * Webhook Test Server
 *
 * Servidor mínimo para receber webhooks reais do Stripe CLI
 *
 * USO:
 *   STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx npx ts-node server/webhook-server.ts
 *
 * STRIPE CLI:
 *   stripe listen --forward-to localhost:3000/webhooks/stripe
 */

import * as crypto from 'crypto';
import * as http from 'http';
import { InMemoryEventStore } from '../event-log/InMemoryEventStore';
import { CoreEvent } from '../event-log/types';
import { StripeGatewayAdapter } from '../gateways/StripeGatewayAdapter';

// ============================================================================
// ENVIRONMENT CHECK
// ============================================================================
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Missing environment variables:');
    if (!STRIPE_SECRET_KEY) console.error('   - STRIPE_SECRET_KEY');
    if (!STRIPE_WEBHOOK_SECRET) console.error('   - STRIPE_WEBHOOK_SECRET');
    console.error('\nUsage:');
    console.error('  STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx npx ts-node server/webhook-server.ts');
    process.exit(1);
}

// ============================================================================
// CORE SETUP
// ============================================================================
const eventStore = new InMemoryEventStore();
const stripeAdapter = new StripeGatewayAdapter(STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET);

// Track processed webhook event IDs (idempotency)
const processedWebhookIds = new Set<string>();
let eventCount = 0;

console.log('✅ Core initialized (InMemory mode)');
console.log('✅ Stripe adapter ready');

// ============================================================================
// HTTP SERVER
// ============================================================================
const server = http.createServer(async (req, res) => {
    // Health check
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', events: eventCount }));
        return;
    }

    // Stripe Webhook
    if (req.method === 'POST' && req.url === '/webhooks/stripe') {
        const chunks: Buffer[] = [];

        req.on('data', (chunk: Buffer) => chunks.push(chunk));

        req.on('end', async () => {
            const rawBody = Buffer.concat(chunks);
            const headers = req.headers as Record<string, string | string[] | undefined>;

            console.log('\n📩 Webhook received');
            console.log(`   Size: ${rawBody.length} bytes`);
            const sig = headers['stripe-signature'];
            console.log(`   Signature: ${typeof sig === 'string' ? sig.slice(0, 50) : '(array)'}...`);

            try {
                // 1. Verify signature (CRITICAL)
                const verified = await stripeAdapter.verifyWebhook(rawBody, headers);

                if (!verified) {
                    console.log('⚠️  Event type not relevant (not payment_intent.succeeded)');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ received: true, processed: false }));
                    return;
                }

                console.log(`✅ Signature verified`);
                console.log(`   Gateway Reference: ${verified.gatewayReference}`);
                console.log(`   Order ID: ${verified.orderId}`);
                console.log(`   Amount: ${verified.amountCents} ${verified.currency}`);

                // 2. Idempotency check
                if (processedWebhookIds.has(verified.gatewayReference)) {
                    console.log('⚠️  Duplicate webhook - already processed');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ received: true, duplicate: true }));
                    return;
                }

                // 3. Create PAYMENT_CONFIRMED event
                const paymentEvent: CoreEvent = {
                    event_id: crypto.randomUUID(),
                    stream_id: `PAYMENT:${verified.gatewayReference}`,
                    stream_version: 0,  // New stream starts at 0
                    type: 'PAYMENT_CONFIRMED',
                    payload: {
                        id: verified.gatewayReference,
                        order_id: verified.orderId,
                        gateway_reference: verified.gatewayReference,
                        amount_cents: verified.amountCents,
                        currency: verified.currency,
                        gateway: 'STRIPE_V1',
                    },
                    occurred_at: verified.occurredAt,
                    idempotency_key: `stripe:${verified.gatewayReference}`,
                    meta: {
                        server_timestamp: new Date().toISOString(),
                        actor_ref: 'STRIPE_WEBHOOK'
                    }
                };

                // 4. Append to event store
                await eventStore.append(paymentEvent, -1);  // New stream expected version is -1
                eventCount++;
                console.log(`✅ Event appended: ${paymentEvent.event_id}`);

                // 5. Mark as processed
                processedWebhookIds.add(verified.gatewayReference);

                console.log('💰 Payment processed successfully!\n');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    received: true,
                    processed: true,
                    eventId: paymentEvent.event_id,
                }));

            } catch (error: any) {
                console.error('❌ Webhook processing failed:', error.message);

                if (error.message.includes('Signature')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid signature' }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal error' }));
                }
            }
        });

        return;
    }

    // Create Payment Intent (for testing)
    if (req.method === 'POST' && req.url === '/api/create-payment-intent') {
        const chunks: Buffer[] = [];

        req.on('data', (chunk: Buffer) => chunks.push(chunk));

        req.on('end', async () => {
            try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                const { orderId, amountCents, currency = 'brl' } = body;

                if (!orderId || !amountCents) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing orderId or amountCents' }));
                    return;
                }

                const intent = await stripeAdapter.createPaymentIntent(
                    orderId,
                    amountCents,
                    currency,
                    { source: 'webhook_test_server' }
                );

                console.log(`\n💳 Payment Intent created`);
                console.log(`   Order: ${orderId}`);
                console.log(`   Amount: ${amountCents} ${currency}`);
                if (intent.clientSecret) {
                    console.log(`   Client Secret: ${intent.clientSecret.slice(0, 30)}...`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(intent));

            } catch (error: any) {
                console.error('❌ Create intent failed:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        return;
    }

    // Stats endpoint
    if (req.method === 'GET' && req.url === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalEvents: eventCount,
            processedWebhooks: processedWebhookIds.size,
            webhookIds: Array.from(processedWebhookIds).slice(-10),
        }, null, 2));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    CHEFIAPP WEBHOOK SERVER                      ║
╠════════════════════════════════════════════════════════════════╣
║  Status: RUNNING                                                ║
║  Port: ${PORT}                                                      ║
║  Mode: TEST (InMemory)                                          ║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                     ║
║    POST /webhooks/stripe          ← Stripe webhooks             ║
║    POST /api/create-payment-intent  Create new payment          ║
║    GET  /api/stats                  View stats                  ║
║    GET  /health                     Health check                ║
╠════════════════════════════════════════════════════════════════╣
║  Stripe CLI:                                                    ║
║    stripe listen --forward-to localhost:${PORT}/webhooks/stripe     ║
║                                                                 ║
║  Test payment:                                                  ║
║    stripe trigger payment_intent.succeeded                      ║
╚════════════════════════════════════════════════════════════════╝
`);
});
