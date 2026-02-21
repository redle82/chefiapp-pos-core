/**
 * PaymentBroker - Intermediário de Pagamentos
 *
 * Abstrai a comunicação com o Core (RPC stripe-payment).
 * ANTI-SUPABASE §4: Payment ONLY via Docker Core. No supabase.functions.invoke.
 */

import { BackendType, getBackendType } from '../infra/backendAdapter';
import { getDockerCoreFetchClient } from '../infra/dockerCoreFetchClient';

const CORE_REQUIRED_MSG =
  'Payment requires Docker Core. Supabase domain fallback is forbidden.';

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
     * Cria um PaymentIntent no Stripe via Core RPC.
     * If not Docker: throw.
     */
    static async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntentResult> {
        console.log('[PaymentBroker] Requesting PaymentIntent:', params);

        if (getBackendType() !== BackendType.docker) {
            throw new Error(CORE_REQUIRED_MSG);
        }

        const core = getDockerCoreFetchClient();
        const res = await core.rpc('stripe-payment', {
            action: 'create-payment-intent',
            amount: params.amount,
            currency: params.currency,
            restaurant_id: params.restaurantId,
            order_id: params.orderId,
            operator_id: params.operatorId,
            cash_register_id: params.cashRegisterId,
        });

        if (res.error) {
            console.error('[PaymentBroker] Core RPC Error:', res.error);
            throw new Error(`Erro ao criar pagamento: ${res.error.message}`);
        }

        const data = res.data as { id?: string; clientSecret?: string; error?: string } | null;
        if (data?.error) {
            console.error('[PaymentBroker] Stripe Error:', data.error);
            throw new Error(data.error);
        }

        if (!data?.id || !data?.clientSecret) {
            throw new Error('Core não retornou id ou clientSecret');
        }

        return {
            id: data.id,
            clientSecret: data.clientSecret,
        };
    }
}
