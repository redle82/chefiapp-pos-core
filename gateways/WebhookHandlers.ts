/**
 * Webhook Handlers
 * 
 * DOIS WEBHOOKS SEPARADOS:
 * 
 * 1. /webhooks/billing - SEU Stripe (assinaturas)
 *    → Atualiza status de subscription
 *    → Emite billing_events
 * 
 * 2. /webhooks/payments/:restaurantId - Stripe DO RESTAURANTE
 *    → Confirma pagamentos de pedidos
 *    → Emite core_events
 * 
 * NUNCA misture os dois.
 */

import { IncomingMessage, ServerResponse } from 'http';
import {
    StripeBillingService,
    BillingWebhookResult,
} from '../billing-core/StripeBillingService';
import {
    StripeGatewayAdapterV2,
} from './StripeGatewayAdapterV2';
import {
    VerifiedWebhookEvent,
    GatewayCredentials,
} from './PaymentGatewayInterface';
import { BillingEvent, BillingEventType } from '../billing-core/types';
import { CoreEvent } from '../event-log/types';
import { v4 as uuid } from 'uuid';

// ============================================================================
// BILLING WEBHOOK HANDLER (SEU STRIPE)
// ============================================================================

export interface BillingWebhookDeps {
    billingService: StripeBillingService;
    onSubscriptionUpdate: (update: BillingSubscriptionUpdate) => Promise<void>;
    onPaymentEvent: (event: BillingPaymentEvent) => Promise<void>;
    onTrialEnding: (event: BillingTrialEndingEvent) => Promise<void>;
}

export interface BillingSubscriptionUpdate {
    stripe_subscription_id: string;
    restaurant_id?: string;
    status: string;
    current_period_start?: Date;
    current_period_end?: Date;
    trial_end?: Date;
}

export interface BillingPaymentEvent {
    type: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED';
    invoice_id: string;
    amount_cents: number;
    restaurant_id?: string;
}

export interface BillingTrialEndingEvent {
    stripe_subscription_id: string;
    trial_end: Date;
    restaurant_id?: string;
}

/**
 * Handler para webhooks de BILLING (seu Stripe)
 * 
 * Endpoint: POST /webhooks/billing
 */
export async function handleBillingWebhook(
    rawBody: string | Buffer,
    signature: string,
    deps: BillingWebhookDeps
): Promise<WebhookHandlerResult> {
    const result = await deps.billingService.handleWebhook(rawBody, signature);
    
    if (!result.success) {
        return {
            success: false,
            statusCode: 400,
            error: result.error,
        };
    }
    
    try {
        // Processar subscription update
        if (result.subscription_update) {
            await deps.onSubscriptionUpdate({
                stripe_subscription_id: result.subscription_update.stripe_subscription_id,
                status: result.subscription_update.status,
                current_period_start: result.subscription_update.current_period_start,
                current_period_end: result.subscription_update.current_period_end,
                trial_end: result.subscription_update.trial_end,
            });
        }
        
        // Processar payment event
        if (result.payment_event) {
            await deps.onPaymentEvent({
                type: result.payment_event.type,
                invoice_id: result.payment_event.invoice_id,
                amount_cents: result.payment_event.amount_cents,
            });
        }
        
        // Processar trial ending
        if (result.trial_ending) {
            await deps.onTrialEnding({
                stripe_subscription_id: result.trial_ending.stripe_subscription_id,
                trial_end: result.trial_ending.trial_end,
            });
        }
        
        return {
            success: true,
            statusCode: 200,
            event_type: result.event_type,
            event_id: result.event_id,
        };
    } catch (error) {
        console.error('Error processing billing webhook:', error);
        return {
            success: false,
            statusCode: 500,
            error: error instanceof Error ? error.message : 'Internal error',
        };
    }
}

// ============================================================================
// PAYMENT WEBHOOK HANDLER (STRIPE DO RESTAURANTE)
// ============================================================================

export interface PaymentWebhookDeps {
    getGatewayCredentials: (restaurantId: string) => Promise<GatewayCredentials | null>;
    onPaymentConfirmed: (event: PaymentConfirmedEvent) => Promise<void>;
    onPaymentFailed: (event: PaymentFailedEvent) => Promise<void>;
    isDuplicateEvent: (eventId: string) => Promise<boolean>;
    markEventProcessed: (eventId: string) => Promise<void>;
}

export interface PaymentConfirmedEvent {
    restaurant_id: string;
    order_id: string;
    payment_intent_id: string;
    amount_cents: number;
    currency: string;
    gateway_event_id: string;
    occurred_at: Date;
}

export interface PaymentFailedEvent {
    restaurant_id: string;
    order_id?: string;
    payment_intent_id: string;
    amount_cents?: number;
    failure_code?: string;
    failure_message?: string;
    gateway_event_id: string;
    occurred_at: Date;
}

/**
 * Handler para webhooks de PAGAMENTO (Stripe do restaurante)
 * 
 * Endpoint: POST /webhooks/payments/:restaurantId
 */
export async function handlePaymentWebhook(
    restaurantId: string,
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    deps: PaymentWebhookDeps
): Promise<WebhookHandlerResult> {
    // 1. Buscar credenciais do restaurante
    const credentials = await deps.getGatewayCredentials(restaurantId);
    if (!credentials) {
        return {
            success: false,
            statusCode: 404,
            error: `Restaurant ${restaurantId} not found or gateway not configured`,
        };
    }
    
    // 2. Criar adapter e verificar webhook
    const gateway = new StripeGatewayAdapterV2(credentials);
    const verifiedEvent = await gateway.verifyWebhook(rawBody, headers);
    
    if (!verifiedEvent) {
        return {
            success: false,
            statusCode: 400,
            error: 'Webhook verification failed',
        };
    }
    
    // 3. Idempotency check
    if (await deps.isDuplicateEvent(verifiedEvent.event_id)) {
        return {
            success: true,
            statusCode: 200,
            event_type: verifiedEvent.type,
            event_id: verifiedEvent.event_id,
            duplicate: true,
        };
    }
    
    try {
        // 4. Processar evento
        switch (verifiedEvent.type) {
            case 'payment_intent.succeeded':
            case 'charge.succeeded':
                await deps.onPaymentConfirmed({
                    restaurant_id: restaurantId,
                    order_id: extractOrderId(verifiedEvent),
                    payment_intent_id: verifiedEvent.intent_id || '',
                    amount_cents: verifiedEvent.amount_cents || 0,
                    currency: verifiedEvent.currency || 'EUR',
                    gateway_event_id: verifiedEvent.event_id,
                    occurred_at: verifiedEvent.occurred_at,
                });
                break;
                
            case 'payment_intent.payment_failed':
            case 'charge.failed':
                await deps.onPaymentFailed({
                    restaurant_id: restaurantId,
                    order_id: extractOrderId(verifiedEvent),
                    payment_intent_id: verifiedEvent.intent_id || '',
                    amount_cents: verifiedEvent.amount_cents,
                    gateway_event_id: verifiedEvent.event_id,
                    occurred_at: verifiedEvent.occurred_at,
                });
                break;
        }
        
        // 5. Marcar como processado
        await deps.markEventProcessed(verifiedEvent.event_id);
        
        return {
            success: true,
            statusCode: 200,
            event_type: verifiedEvent.type,
            event_id: verifiedEvent.event_id,
        };
    } catch (error) {
        console.error('Error processing payment webhook:', error);
        return {
            success: false,
            statusCode: 500,
            error: error instanceof Error ? error.message : 'Internal error',
        };
    }
}

// ============================================================================
// HTTP SERVER HELPERS
// ============================================================================

export interface WebhookHandlerResult {
    success: boolean;
    statusCode: number;
    error?: string;
    event_type?: string;
    event_id?: string;
    duplicate?: boolean;
}

/**
 * Lê raw body de request HTTP
 */
export function readRawBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

/**
 * Responde com JSON
 */
export function jsonResponse(
    res: ServerResponse,
    statusCode: number,
    body: Record<string, unknown>
): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

// ============================================================================
// HELPERS
// ============================================================================

function extractOrderId(event: VerifiedWebhookEvent): string {
    // Tentar extrair order_id do raw_payload (metadata)
    try {
        const payload = JSON.parse(event.raw_payload);
        const data = payload.data?.object;
        return data?.metadata?.order_id || '';
    } catch {
        return '';
    }
}

// ============================================================================
// EXPRESS/FASTIFY MIDDLEWARE EXAMPLE
// ============================================================================

/**
 * Exemplo de como usar com Express:
 * 
 * ```typescript
 * import express from 'express';
 * 
 * const app = express();
 * 
 * // CRITICAL: Raw body parser para webhooks
 * app.post('/webhooks/billing',
 *     express.raw({ type: 'application/json' }),
 *     async (req, res) => {
 *         const signature = req.headers['stripe-signature'] as string;
 *         const result = await handleBillingWebhook(
 *             req.body,
 *             signature,
 *             billingWebhookDeps
 *         );
 *         res.status(result.statusCode).json(result);
 *     }
 * );
 * 
 * app.post('/webhooks/payments/:restaurantId',
 *     express.raw({ type: 'application/json' }),
 *     async (req, res) => {
 *         const result = await handlePaymentWebhook(
 *             req.params.restaurantId,
 *             req.body,
 *             req.headers,
 *             paymentWebhookDeps
 *         );
 *         res.status(result.statusCode).json(result);
 *     }
 * );
 * ```
 */
