/**
 * AUDITORIA A3 — Billing Webhook Server
 * 
 * Servidor para testar webhooks de BILLING (seu Stripe)
 * 
 * USO:
 *   1. Terminal 1: npm run server:billing
 *   2. Terminal 2: stripe listen --forward-to localhost:3001/webhooks/billing
 *   3. Terminal 3: stripe trigger customer.subscription.created
 * 
 * IMPORTANTE: Este servidor testa apenas billing, não payments.
 */

import * as http from 'http';
import { StripeBillingService, StripeBillingConfig } from '../billing-core/StripeBillingService';

// ============================================================================
// CONFIG
// ============================================================================

const PORT = 3099;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY required');
  console.error('   export STRIPE_SECRET_KEY=sk_test_xxx');
  process.exit(1);
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET required');
  console.error('   Get it from: stripe listen (shows whsec_xxx)');
  process.exit(1);
}

// ============================================================================
// BILLING SERVICE SETUP
// ============================================================================

const billingConfig: StripeBillingConfig = {
  apiKey: STRIPE_SECRET_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
  testMode: true,
};

const billingService = new StripeBillingService(billingConfig);

// Stats
let webhooksReceived = 0;
let webhooksProcessed = 0;
let webhooksIgnored = 0;
let webhooksFailed = 0;
const eventLog: Array<{ time: string; type: string; status: string; details?: string }> = [];

const log = (msg: string) => {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[${time}] ${msg}`);
};

// ============================================================================
// HTTP SERVER
// ============================================================================

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      webhooks: {
        received: webhooksReceived,
        processed: webhooksProcessed,
        ignored: webhooksIgnored,
        failed: webhooksFailed,
      },
      recent: eventLog.slice(-10),
    }));
    return;
  }

  // Stats page (HTML)
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>A3 Billing Webhook Server</title></head>
      <body style="font-family: monospace; padding: 20px;">
        <h1>🔵 AUDITORIA A3 — Billing Webhook Server</h1>
        <p><strong>Status:</strong> Running on port ${PORT}</p>
        <h2>Stats</h2>
        <ul>
          <li>Received: ${webhooksReceived}</li>
          <li>Processed: ${webhooksProcessed}</li>
          <li>Ignored: ${webhooksIgnored}</li>
          <li>Failed: ${webhooksFailed}</li>
        </ul>
        <h2>Recent Events</h2>
        <pre>${eventLog.slice(-20).map(e => `${e.time} | ${e.type.padEnd(40)} | ${e.status} ${e.details || ''}`).join('\n') || 'No events yet'}</pre>
        <p><a href="/health">JSON Stats</a></p>
        <p><em>Refresh to update</em></p>
      </body>
      </html>
    `);
    return;
  }

  // BILLING WEBHOOK ENDPOINT
  if (req.method === 'POST' && req.url === '/webhooks/billing') {
    webhooksReceived++;
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => chunks.push(chunk));

    req.on('end', async () => {
      const rawBody = Buffer.concat(chunks);
      const signature = req.headers['stripe-signature'] as string;

      log(`📩 Webhook received (${rawBody.length} bytes)`);

      if (!signature) {
        log('❌ Missing stripe-signature header');
        webhooksFailed++;
        eventLog.push({ time: new Date().toISOString(), type: 'UNKNOWN', status: 'FAIL', details: 'No signature' });
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing signature' }));
        return;
      }

      try {
        const result = await billingService.handleWebhook(rawBody, signature);

        // Check if already processed (idempotency)
        if (result.already_processed) {
          log(`⚠️  Duplicate: ${result.event_id}`);
          eventLog.push({ time: new Date().toISOString(), type: result.event_type || 'UNKNOWN', status: 'DUPLICATE' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, duplicate: true }));
          return;
        }

        if (!result.success) {
          webhooksFailed++;
          log(`❌ Failed: ${result.error}`);
          eventLog.push({ time: new Date().toISOString(), type: result.event_type || 'UNKNOWN', status: 'FAIL', details: result.error });
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: result.error }));
          return;
        }

        // SUCCESS
        webhooksProcessed++;
        log(`✅ Processed: ${result.event_type}`);
        
        if (result.subscription_update) {
          log(`   └─ Subscription: ${result.subscription_update.stripe_subscription_id}`);
          log(`   └─ Status: ${result.subscription_update.status}`);
          if (result.subscription_update.merchant_id) {
            log(`   └─ Merchant: ${result.subscription_update.merchant_id}`);
          }
        }

        if (result.payment_event) {
          log(`   └─ Payment: ${result.payment_event.type} (${result.payment_event.amount_cents} cents)`);
        }

        eventLog.push({
          time: new Date().toISOString(),
          type: result.event_type || 'UNKNOWN',
          status: 'OK',
          details: result.subscription_update?.status,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          received: true,
          processed: true,
          event_type: result.event_type,
          subscription_update: result.subscription_update,
          payment_event: result.payment_event,
        }));

      } catch (error: any) {
        webhooksFailed++;
        log(`❌ Error: ${error.message}`);
        eventLog.push({ time: new Date().toISOString(), type: 'ERROR', status: 'FAIL', details: error.message });
        
        if (error.message.includes('signature') || error.message.includes('Signature')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid signature' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
    });

    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ============================================================================
// START
// ============================================================================

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔵 AUDITORIA A3 — Billing Webhook Server');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  📡 Server: http://localhost:${PORT}`);
  console.log(`  🎯 Webhook: http://localhost:${PORT}/webhooks/billing`);
  console.log(`  📊 Stats:   http://localhost:${PORT}/health`);
  console.log('');
  console.log('  Next step:');
  console.log('  stripe listen --forward-to localhost:3001/webhooks/billing');
  console.log('');
  console.log('  Test commands:');
  console.log('  stripe trigger customer.subscription.created');
  console.log('  stripe trigger customer.subscription.updated');
  console.log('  stripe trigger invoice.paid');
  console.log('  stripe trigger invoice.payment_failed');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
});
