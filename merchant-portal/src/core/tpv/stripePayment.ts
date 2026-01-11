/**
 * Stripe Payment Helper
 * 
 * Funções para criar e processar Payment Intents via Stripe
 */

import { supabase } from '../supabase';

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
 * Criar Payment Intent no Stripe via API
 */
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    // Obter token de sessão do Supabase para autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('SESSION_REQUIRED: Faça login para processar pagamentos');
    }

    // Invocar Edge Function 'stripe-payment'
    const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
            action: 'create-payment-intent',
            order_id: input.orderId,
            restaurant_id: input.restaurantId,
            amount: input.amountCents, // Function expects 'amount' (cents)
            currency: input.currency || 'EUR',
        }
    });

    if (error) {
        console.error('[Stripe] Edge Function Error:', error);
        throw new Error(error.message || 'Erro de conexão com gateway');
    }

    if (!data.clientSecret) {
        throw new Error('GATEWAY_ERROR: Payment Intent sem client_secret');
    }

    return {
        intent_id: data.id,
        client_secret: data.clientSecret,
        status: 'created', // Assumido para intents novos
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
