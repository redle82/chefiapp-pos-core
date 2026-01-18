/**
 * BillingBroker - Gestor de Assinaturas SaaS
 * 
 * Abstrai a comunicação com o Supabase Edge Function 'stripe-billing'.
 * Permite iniciar checkout de assinatura e abrir portal do cliente.
 */

import { supabase } from '../supabase';

export interface BillingSessionResult {
    url: string;
    sessionId?: string;
}

export class BillingBroker {

    /**
     * Inicia uma sessão de Checkout para Assinatura
     * @param priceId ID do preço no Stripe (ex: price_123...)
     */
    static async startSubscription(priceId: string): Promise<BillingSessionResult> {
        console.log('[BillingBroker] Starting Subscription Checkout:', priceId);

        const { data, error } = await supabase.functions.invoke('stripe-billing', {
            body: {
                action: 'create-checkout-session',
                priceId: priceId,
                successUrl: `${window.location.origin}/app/dashboard?billing=success`,
                cancelUrl: `${window.location.origin}/app/billing?billing=cancel`,
            }
        });

        if (error) {
            console.error('[BillingBroker] Edge Function Error:', error);
            throw new Error(`Erro ao iniciar checkout: ${error.message}`);
        }

        if (data?.error) {
            console.error('[BillingBroker] Stripe Error:', data.error);
            throw new Error(data.error);
        }

        return {
            url: data.url,
            sessionId: data.sessionId
        };
    }

    /**
     * Abre o Portal do Cliente (Self-Serve)
     */
    static async openCustomerPortal(): Promise<BillingSessionResult> {
        console.log('[BillingBroker] Opening Customer Portal');

        const { data, error } = await supabase.functions.invoke('stripe-billing', {
            body: {
                action: 'create-portal-session',
                returnUrl: `${window.location.origin}/app/billing`,
            }
        });

        if (error) {
            console.error('[BillingBroker] Edge Function Error:', error);
            throw new Error(`Erro ao abrir portal: ${error.message}`);
        }

        if (data?.error) {
            console.error('[BillingBroker] Stripe Error:', data.error);
            throw new Error(data.error);
        }

        return {
            url: data.url
        };
    }
}
