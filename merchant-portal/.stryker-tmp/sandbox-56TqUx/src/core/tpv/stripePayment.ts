/**
 * Stripe Payment Helper
 * 
 * Funções para criar e processar Payment Intents via Stripe.
 * ANTI-SUPABASE §4: Payment orchestration ONLY via Core. No supabase.functions.invoke.
 * 
 * @deprecated Use `core/payment/PaymentBroker` instead.
 */
// @ts-nocheck


import { BackendType, getBackendType } from '../infra/backendAdapter';
import { getDockerCoreFetchClient } from '../infra/dockerCoreFetchClient';

const CORE_REQUIRED_MSG =
  'Payment requires Docker Core. Supabase domain fallback is forbidden.';

export interface CreatePaymentIntentInput {
    orderId: string;
    restaurantId: string;
    amountCents: number;
    currency?: string;
}

export interface PaymentIntentResult {
    intent_id: string;
    client_secret: string;
    status: string;
}

/**
 * Criar Payment Intent via Core (RPC stripe-payment ou API).
 * If not Docker: throw. No Supabase Edge Function.
 */
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (getBackendType() !== BackendType.docker) {
        throw new Error(CORE_REQUIRED_MSG);
    }
    const core = getDockerCoreFetchClient();
    const res = await core.rpc('stripe-payment', {
        action: 'create-payment-intent',
        order_id: input.orderId,
        restaurant_id: input.restaurantId,
        amount: input.amountCents,
        currency: input.currency || 'EUR',
    });
    if (res.error) {
        console.error('[Stripe] Core RPC Error:', res.error);
        throw new Error(res.error.message || 'Erro de conexão com gateway');
    }
    const data = res.data as { id?: string; clientSecret?: string } | null;
    if (!data?.clientSecret) {
        throw new Error('GATEWAY_ERROR: Payment Intent sem client_secret');
    }
    return {
        intent_id: data.id ?? '',
        client_secret: data.clientSecret,
        status: 'created',
    };
}

/**
 * Processar pagamento Stripe após confirmação
 * 
 * Após o Stripe confirmar o pagamento (via webhook ou confirmação direta),
 * este método registra o pagamento no sistema.
 */
export async function processStripePayment(input: {
    orderId: string;
    restaurantId: string;
    cashRegisterId: string;
    intentId: string;
    amountCents: number;
    operatorId?: string;
}): Promise<void> {
    // Usar PaymentEngine para registrar o pagamento
    const { PaymentEngine } = await import('./PaymentEngine');

    await PaymentEngine.processPayment({
        orderId: input.orderId,
        restaurantId: input.restaurantId,
        cashRegisterId: input.cashRegisterId,
        amountCents: input.amountCents,
        method: 'card',
        metadata: {
            operatorId: input.operatorId,
            stripe_intent_id: input.intentId,
        },
    });
}
