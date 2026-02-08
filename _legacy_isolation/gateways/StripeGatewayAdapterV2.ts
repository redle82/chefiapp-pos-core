/**
 * Stripe Gateway Adapter V2
 * 
 * STRIPE DO RESTAURANTE - Para pagamentos web/mesa
 * 
 * SEPARAÇÃO CLARA:
 * - StripeBillingService = VOCÊ cobra o restaurante
 * - Este adapter = Restaurante cobra o cliente final
 * 
 * O dinheiro vai DIRETO para a conta Stripe do restaurante.
 * ChefI NÃO toca, NÃO processa, NÃO repassa.
 * 
 * Implementa a interface PaymentGateway imutável.
 */

import Stripe from 'stripe';
import {
    PaymentGateway,
    GatewayIntent,
    GatewayResult,
    VerifiedWebhookEvent,
    WebhookEventType,
    CreateIntentInput,
    ConfirmPaymentInput,
    CreateRefundInput,
    RefundResult,
    GatewayHealthStatus,
    GatewayError,
    GatewayCredentials,
} from './PaymentGatewayInterface';
import { GatewayType } from '../billing-core/types';

// ============================================================================
// STRIPE GATEWAY ADAPTER V2
// ============================================================================

export class StripeGatewayAdapterV2 implements PaymentGateway {
    readonly gateway: GatewayType = 'STRIPE';
    
    private stripe: Stripe;
    private webhookSecret?: string;
    
    constructor(credentials: GatewayCredentials) {
        this.stripe = new Stripe(credentials.api_key);
        this.webhookSecret = credentials.webhook_secret;
    }
    
    // ========================================================================
    // PAYMENT INTENT
    // ========================================================================
    
    async createPaymentIntent(input: CreateIntentInput): Promise<GatewayIntent> {
        try {
            const params: Stripe.PaymentIntentCreateParams = {
                amount: input.amount_cents,
                currency: input.currency.toLowerCase(),
                metadata: {
                    order_id: input.order_id,
                    restaurant_id: input.restaurant_id,
                    ...(input.metadata || {}),
                },
                description: input.description,
                receipt_email: input.customer_email,
                capture_method: input.capture_method === 'MANUAL' ? 'manual' : 'automatic',
                automatic_payment_methods: {
                    enabled: true,
                },
            };
            
            // Idempotency key
            const options: Stripe.RequestOptions = {};
            if (input.idempotency_key) {
                options.idempotencyKey = input.idempotency_key;
            }
            
            const intent = await this.stripe.paymentIntents.create(params, options);
            
            return {
                intent_id: intent.id,
                gateway: 'STRIPE',
                amount_cents: intent.amount,
                currency: intent.currency.toUpperCase(),
                status: this.mapIntentStatus(intent.status),
                client_secret: intent.client_secret || undefined,
                created_at: new Date(intent.created * 1000),
                metadata: intent.metadata as Record<string, string>,
            };
        } catch (error) {
            throw this.mapError(error);
        }
    }
    
    async confirmPayment(input: ConfirmPaymentInput): Promise<GatewayResult> {
        try {
            const params: Stripe.PaymentIntentConfirmParams = {};
            
            if (input.payment_method_id) {
                params.payment_method = input.payment_method_id;
            }
            if (input.return_url) {
                params.return_url = input.return_url;
            }
            
            const intent = await this.stripe.paymentIntents.confirm(
                input.intent_id,
                params
            );
            
            return this.intentToResult(intent);
        } catch (error) {
            throw this.mapError(error);
        }
    }
    
    async cancelPayment(intentId: string): Promise<GatewayResult> {
        try {
            const intent = await this.stripe.paymentIntents.cancel(intentId);
            return this.intentToResult(intent);
        } catch (error) {
            throw this.mapError(error);
        }
    }
    
    async getPaymentStatus(intentId: string): Promise<GatewayResult> {
        try {
            const intent = await this.stripe.paymentIntents.retrieve(intentId);
            return this.intentToResult(intent);
        } catch (error) {
            throw this.mapError(error);
        }
    }
    
    // ========================================================================
    // WEBHOOK VERIFICATION
    // ========================================================================
    
    async verifyWebhook(
        rawPayload: string | Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedWebhookEvent | null> {
        if (!this.webhookSecret) {
            console.warn('Webhook secret not configured');
            return null;
        }
        
        const signature = headers['stripe-signature'];
        if (!signature || Array.isArray(signature)) {
            return null;
        }
        
        try {
            const event = this.stripe.webhooks.constructEvent(
                rawPayload,
                signature,
                this.webhookSecret
            );
            
            const webhookType = this.mapWebhookType(event.type);
            if (!webhookType) {
                // Tipo de evento não mapeado - still return basic info
                return {
                    event_id: event.id,
                    gateway: 'STRIPE',
                    type: event.type as WebhookEventType,
                    status: 'unknown',
                    occurred_at: new Date(event.created * 1000),
                    raw_payload: typeof rawPayload === 'string' 
                        ? rawPayload 
                        : rawPayload.toString('utf8'),
                    signature_verified: true,
                };
            }
            
            // Extrair dados do evento
            let intentId: string | undefined;
            let amountCents: number | undefined;
            let currency: string | undefined;
            let status: string = event.type;
            
            if (event.type.startsWith('payment_intent.')) {
                const pi = event.data.object as Stripe.PaymentIntent;
                intentId = pi.id;
                amountCents = pi.amount;
                currency = pi.currency.toUpperCase();
                status = pi.status;
            } else if (event.type.startsWith('charge.')) {
                const charge = event.data.object as Stripe.Charge;
                intentId = charge.payment_intent as string;
                amountCents = charge.amount;
                currency = charge.currency.toUpperCase();
                status = charge.status;
            }
            
            return {
                event_id: event.id,
                gateway: 'STRIPE',
                type: webhookType,
                intent_id: intentId,
                amount_cents: amountCents,
                currency,
                status,
                occurred_at: new Date(event.created * 1000),
                raw_payload: typeof rawPayload === 'string' 
                    ? rawPayload 
                    : rawPayload.toString('utf8'),
                signature_verified: true,
            };
        } catch (error) {
            console.error('Webhook verification failed:', error);
            return null;
        }
    }
    
    // ========================================================================
    // REFUNDS
    // ========================================================================
    
    async createRefund(input: CreateRefundInput): Promise<RefundResult> {
        try {
            const params: Stripe.RefundCreateParams = {
                payment_intent: input.intent_id,
            };
            
            if (input.amount_cents) {
                params.amount = input.amount_cents;
            }
            
            if (input.reason) {
                params.reason = this.mapRefundReason(input.reason);
            }
            
            const options: Stripe.RequestOptions = {};
            if (input.idempotency_key) {
                options.idempotencyKey = input.idempotency_key;
            }
            
            const refund = await this.stripe.refunds.create(params, options);
            
            return {
                success: refund.status === 'succeeded',
                refund_id: refund.id,
                intent_id: input.intent_id,
                amount_cents: refund.amount,
                status: this.mapRefundStatus(refund.status),
                failure_reason: refund.failure_reason || undefined,
                created_at: new Date(refund.created * 1000),
            };
        } catch (error) {
            throw this.mapError(error);
        }
    }
    
    // ========================================================================
    // HEALTH CHECK
    // ========================================================================
    
    async healthCheck(): Promise<GatewayHealthStatus> {
        const start = Date.now();
        
        try {
            // Tentar operação leve
            await this.stripe.balance.retrieve();
            
            return {
                gateway: 'STRIPE',
                healthy: true,
                latency_ms: Date.now() - start,
                last_check: new Date(),
            };
        } catch (error) {
            return {
                gateway: 'STRIPE',
                healthy: false,
                latency_ms: Date.now() - start,
                last_check: new Date(),
                error_message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    
    // ========================================================================
    // HELPERS
    // ========================================================================
    
    private intentToResult(intent: Stripe.PaymentIntent): GatewayResult {
        const charge = intent.latest_charge as Stripe.Charge | null;
        
        return {
            success: intent.status === 'succeeded',
            intent_id: intent.id,
            gateway: 'STRIPE',
            status: this.mapResultStatus(intent.status),
            amount_cents: intent.amount,
            currency: intent.currency.toUpperCase(),
            fee_cents: charge?.balance_transaction 
                ? (charge.balance_transaction as Stripe.BalanceTransaction)?.fee 
                : undefined,
            net_cents: charge?.balance_transaction
                ? (charge.balance_transaction as Stripe.BalanceTransaction)?.net
                : undefined,
            failure_code: intent.last_payment_error?.code || undefined,
            failure_message: intent.last_payment_error?.message || undefined,
            processed_at: new Date(),
            gateway_reference: charge?.id || intent.id,
            receipt_url: charge?.receipt_url || undefined,
        };
    }
    
    private mapIntentStatus(status: Stripe.PaymentIntent.Status): GatewayIntent['status'] {
        switch (status) {
            case 'requires_payment_method':
            case 'requires_confirmation':
                return 'CREATED';
            case 'requires_action':
                return 'REQUIRES_ACTION';
            case 'processing':
                return 'PROCESSING';
            default:
                return 'CREATED';
        }
    }
    
    private mapResultStatus(status: Stripe.PaymentIntent.Status): GatewayResult['status'] {
        switch (status) {
            case 'succeeded':
                return 'SUCCEEDED';
            case 'canceled':
                return 'CANCELLED';
            case 'requires_action':
                return 'REQUIRES_ACTION';
            default:
                return 'FAILED';
        }
    }
    
    private mapWebhookType(stripeType: string): WebhookEventType | null {
        const map: Record<string, WebhookEventType> = {
            'payment_intent.created': 'payment_intent.created',
            'payment_intent.succeeded': 'payment_intent.succeeded',
            'payment_intent.payment_failed': 'payment_intent.payment_failed',
            'payment_intent.canceled': 'payment_intent.canceled',
            'charge.succeeded': 'charge.succeeded',
            'charge.failed': 'charge.failed',
            'charge.refunded': 'charge.refunded',
            'refund.created': 'refund.created',
            'refund.updated': 'refund.succeeded',
            'refund.failed': 'refund.failed',
        };
        
        return map[stripeType] || null;
    }
    
    private mapRefundReason(
        reason: 'DUPLICATE' | 'FRAUDULENT' | 'REQUESTED_BY_CUSTOMER'
    ): Stripe.RefundCreateParams.Reason {
        switch (reason) {
            case 'DUPLICATE':
                return 'duplicate';
            case 'FRAUDULENT':
                return 'fraudulent';
            case 'REQUESTED_BY_CUSTOMER':
                return 'requested_by_customer';
        }
    }
    
    private mapRefundStatus(status: string | null): RefundResult['status'] {
        switch (status) {
            case 'succeeded':
                return 'SUCCEEDED';
            case 'failed':
            case 'canceled':
                return 'FAILED';
            default:
                return 'PENDING';
        }
    }
    
    private mapError(error: unknown): GatewayError {
        if (error instanceof Stripe.errors.StripeError) {
            const code = this.mapStripeErrorCode(error);
            return new GatewayError('STRIPE', code, error.message, error);
        }
        
        if (error instanceof Error) {
            return new GatewayError('STRIPE', 'UNKNOWN', error.message, error);
        }
        
        return new GatewayError('STRIPE', 'UNKNOWN', 'Unknown error');
    }
    
    private mapStripeErrorCode(error: Stripe.errors.StripeError): GatewayError['code'] {
        switch (error.type) {
            case 'StripeAuthenticationError':
                return 'AUTHENTICATION_FAILED';
            case 'StripeRateLimitError':
                return 'RATE_LIMIT';
            case 'StripeConnectionError':
                return 'NETWORK_ERROR';
            case 'StripeCardError':
                switch (error.code) {
                    case 'card_declined':
                        return 'CARD_DECLINED';
                    case 'insufficient_funds':
                        return 'INSUFFICIENT_FUNDS';
                    case 'expired_card':
                        return 'EXPIRED_CARD';
                    default:
                        return 'CARD_DECLINED';
                }
            case 'StripeInvalidRequestError':
                if (error.message?.includes('No such payment_intent')) {
                    return 'INTENT_NOT_FOUND';
                }
                return 'INVALID_REQUEST';
            default:
                return 'PROCESSING_ERROR';
        }
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Cria StripeGatewayAdapterV2 a partir de credenciais
 */
export function createStripeGatewayV2(credentials: GatewayCredentials): StripeGatewayAdapterV2 {
    return new StripeGatewayAdapterV2(credentials);
}
