/**
 * Stripe Integration Tests
 * 
 * Testes de integração real com Stripe sandbox
 * 
 * SETUP:
 * 1. export STRIPE_TEST_KEY=sk_test_xxx
 * 2. export STRIPE_WEBHOOK_SECRET=whsec_xxx
 * 3. npm run test:stripe
 */

import {
    StripeBillingService,
    StripeBillingConfig,
} from '../../billing-core/StripeBillingService';
import {
    StripeGatewayAdapterV2,
} from '../../gateways/StripeGatewayAdapterV2';
import {
    GatewayCredentials,
} from '../../gateways/PaymentGatewayInterface';
import { v4 as uuid } from 'uuid';

// ============================================================================
// CONFIG
// ============================================================================

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_KEY || 'sk_test_PLACEHOLDER';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_PLACEHOLDER';

const isRealStripe = STRIPE_TEST_KEY.startsWith('sk_test_') && 
                     !STRIPE_TEST_KEY.includes('PLACEHOLDER');

// ============================================================================
// BILLING SERVICE TESTS
// ============================================================================

describe('StripeBillingService', () => {
    let service: StripeBillingService;
    
    beforeAll(() => {
        if (!isRealStripe) {
            console.log('⚠️  Skipping real Stripe tests (no valid test key)');
        }
        
        const config: StripeBillingConfig = {
            apiKey: STRIPE_TEST_KEY,
            webhookSecret: STRIPE_WEBHOOK_SECRET,
            testMode: true,
        };
        
        service = new StripeBillingService(config);
    });
    
    describe('Customer Management', () => {
        it('should create a customer', async () => {
            if (!isRealStripe) return;
            
            const restaurantId = `rest_test_${uuid().slice(0, 8)}`;
            
            const customer = await service.createCustomer({
                restaurant_id: restaurantId,
                email: `test-${restaurantId}@chefiapp.test`,
                restaurant_name: 'Test Restaurant',
                owner_name: 'Test Owner',
            });
            
            expect(customer.customer_id).toMatch(/^cus_/);
            expect(customer.merchant_id).toBe(restaurantId);
            expect(customer.email).toContain('@chefiapp.test');
        });
    });
    
    describe('Subscription Management', () => {
        it('should create subscription with trial', async () => {
            if (!isRealStripe) return;
            
            const restaurantId = `rest_test_${uuid().slice(0, 8)}`;
            
            // Create customer first
            const customer = await service.createCustomer({
                restaurant_id: restaurantId,
                email: `test-${restaurantId}@chefiapp.test`,
                restaurant_name: 'Test Restaurant',
            });
            
            // Create subscription
            const subscription = await service.createSubscription({
                restaurant_id: restaurantId,
                customer_id: customer.customer_id,
                plan_id: 'plan_professional_v1',
                start_trial: true,
            });
            
            expect(subscription.subscription_id).toMatch(/^sub_/);
            expect(subscription.status).toBe('TRIAL');
            expect(subscription.trial_end).toBeDefined();
        });
    });
    
    describe('Invoice Management', () => {
        it('should list invoices for customer', async () => {
            if (!isRealStripe) return;
            
            const restaurantId = `rest_test_${uuid().slice(0, 8)}`;
            
            const customer = await service.createCustomer({
                restaurant_id: restaurantId,
                email: `test-${restaurantId}@chefiapp.test`,
                restaurant_name: 'Test Restaurant',
            });
            
            const invoices = await service.listInvoices(customer.customer_id);
            
            // New customer should have no invoices
            expect(Array.isArray(invoices)).toBe(true);
        });
    });
});

// ============================================================================
// GATEWAY ADAPTER TESTS
// ============================================================================

describe('StripeGatewayAdapterV2', () => {
    let gateway: StripeGatewayAdapterV2;
    
    beforeAll(() => {
        const credentials: GatewayCredentials = {
            api_key: STRIPE_TEST_KEY,
            webhook_secret: STRIPE_WEBHOOK_SECRET,
        };
        
        gateway = new StripeGatewayAdapterV2(credentials);
    });
    
    describe('Payment Intent', () => {
        it('should create payment intent', async () => {
            if (!isRealStripe) return;
            
            const orderId = `order_test_${uuid().slice(0, 8)}`;
            const restaurantId = `rest_test_${uuid().slice(0, 8)}`;
            
            const intent = await gateway.createPaymentIntent({
                amount_cents: 1000, // €10.00
                currency: 'EUR',
                order_id: orderId,
                restaurant_id: restaurantId,
                description: 'Test payment',
                idempotency_key: uuid(),
            });
            
            expect(intent.intent_id).toMatch(/^pi_/);
            expect(intent.gateway).toBe('STRIPE');
            expect(intent.amount_cents).toBe(1000);
            expect(intent.currency).toBe('EUR');
            expect(intent.status).toBe('CREATED');
            expect(intent.client_secret).toBeDefined();
        });
        
        it('should get payment status', async () => {
            if (!isRealStripe) return;
            
            // First create an intent
            const intent = await gateway.createPaymentIntent({
                amount_cents: 500,
                currency: 'EUR',
                order_id: `order_${uuid().slice(0, 8)}`,
                restaurant_id: `rest_${uuid().slice(0, 8)}`,
            });
            
            // Then get status
            const status = await gateway.getPaymentStatus(intent.intent_id);
            
            expect(status.intent_id).toBe(intent.intent_id);
            expect(status.amount_cents).toBe(500);
        });
        
        it('should cancel payment intent', async () => {
            if (!isRealStripe) return;
            
            const intent = await gateway.createPaymentIntent({
                amount_cents: 500,
                currency: 'EUR',
                order_id: `order_${uuid().slice(0, 8)}`,
                restaurant_id: `rest_${uuid().slice(0, 8)}`,
            });
            
            const result = await gateway.cancelPayment(intent.intent_id);
            
            expect(result.status).toBe('CANCELLED');
        });
    });
    
    describe('Health Check', () => {
        it('should return healthy status', async () => {
            if (!isRealStripe) return;
            
            const health = await gateway.healthCheck();
            
            expect(health.gateway).toBe('STRIPE');
            expect(health.healthy).toBe(true);
            expect(health.latency_ms).toBeGreaterThan(0);
        });
    });
    
    describe('Idempotency', () => {
        it('should return same intent for same idempotency key', async () => {
            if (!isRealStripe) return;
            
            const idempotencyKey = uuid();
            const orderId = `order_${uuid().slice(0, 8)}`;
            const restaurantId = `rest_${uuid().slice(0, 8)}`;
            
            const input = {
                amount_cents: 1500,
                currency: 'EUR',
                order_id: orderId,
                restaurant_id: restaurantId,
                idempotency_key: idempotencyKey,
            };
            
            const intent1 = await gateway.createPaymentIntent(input);
            const intent2 = await gateway.createPaymentIntent(input);
            
            expect(intent1.intent_id).toBe(intent2.intent_id);
        });
    });
});

// ============================================================================
// WEBHOOK VERIFICATION TESTS
// ============================================================================

describe('Webhook Verification', () => {
    it('should reject invalid signature', async () => {
        const credentials: GatewayCredentials = {
            api_key: STRIPE_TEST_KEY,
            webhook_secret: 'whsec_test_invalid',
        };
        
        const gateway = new StripeGatewayAdapterV2(credentials);
        
        const result = await gateway.verifyWebhook(
            '{"type":"test"}',
            { 'stripe-signature': 'invalid_signature' }
        );
        
        expect(result).toBeNull();
    });
    
    it('should reject missing signature header', async () => {
        const credentials: GatewayCredentials = {
            api_key: STRIPE_TEST_KEY,
            webhook_secret: STRIPE_WEBHOOK_SECRET,
        };
        
        const gateway = new StripeGatewayAdapterV2(credentials);
        
        const result = await gateway.verifyWebhook(
            '{"type":"test"}',
            {}
        );
        
        expect(result).toBeNull();
    });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
    it('should throw GatewayError for invalid API key', async () => {
        const credentials: GatewayCredentials = {
            api_key: 'sk_test_invalid_key_12345',
        };
        
        const gateway = new StripeGatewayAdapterV2(credentials);
        
        await expect(
            gateway.createPaymentIntent({
                amount_cents: 1000,
                currency: 'EUR',
                order_id: 'test',
                restaurant_id: 'test',
            })
        ).rejects.toThrow();
    });
    
    it('should throw GatewayError for non-existent intent', async () => {
        if (!isRealStripe) return;
        
        const credentials: GatewayCredentials = {
            api_key: STRIPE_TEST_KEY,
        };
        
        const gateway = new StripeGatewayAdapterV2(credentials);
        
        await expect(
            gateway.getPaymentStatus('pi_nonexistent_12345')
        ).rejects.toThrow();
    });
});

// ============================================================================
// SKIP MARKER FOR CI
// ============================================================================

// Para CI sem Stripe key configurada
if (!isRealStripe) {
    describe('Stripe Integration (SKIPPED - no test key)', () => {
        it('should skip all tests when no Stripe key configured', () => {
            console.log('Set STRIPE_TEST_KEY to run real Stripe tests');
            expect(true).toBe(true);
        });
    });
}
