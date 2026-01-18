/**
 * PaymentBroker - Intermediario de Pagamentos
 * 
 * Abstrai a comunicacao com o Supabase Edge Function 'stripe-payment'.
 * Garante que o Frontend nao precise saber detalhes de HTTP/Headers do Stripe.
 */

import { supabase } from '../supabase';

export interface PaymentIntentResult {
    id: string;
    clientSecret: string;
}

export interface CreatePaymentParams {
    orderId: string;
    amount: number;
    currency: string;
    restaurantId: string;
    operatorId?: string;
    cashRegisterId?: string;
}

export class PaymentBroker {

    /**
     * Cria um PaymentIntent no Stripe via Edge Function
     */
    static async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntentResult> {
        console.log('[PaymentBroker] Requesting PaymentIntent:', params);

        const { data, error } = await supabase.functions.invoke('stripe-payment', {
            body: {
                action: 'create-payment-intent',
                amount: params.amount, // Valor em centavos (ou unidade principal dependendo do Edge Function, mas o nosso index.ts espera major units e converte, vamos verificar)
                // VERIFICACAO: O index.ts faz `Math.round(amount)`. Se passarmos centavos (1000), vira 1000.
                // O index.ts atual parece esperar centavos ja. Vamos confirmar no codigo do index.ts.
                currency: params.currency,
                restaurant_id: params.restaurantId,
                order_id: params.orderId,
                operator_id: params.operatorId,
                cash_register_id: params.cashRegisterId
            }
        });

        if (error) {
            console.error('[PaymentBroker] Edge Function Error:', error);
            throw new Error(`Erro ao criar pagamento: ${error.message}`);
        }

        if (data?.error) {
            console.error('[PaymentBroker] Stripe Error:', data.error);
            throw new Error(data.error);
        }

        return {
            id: data.id,
            clientSecret: data.clientSecret
        };
    }
}
