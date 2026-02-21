/**
 * BillingBroker — Gestão de assinatura SaaS (ChefIApp → Stripe)
 *
 * NO SUPABASE. Chama apenas a API do Core (Docker).
 * Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT.md
 *
 * Portal e checkout: Core expõe RPCs create_saas_portal_session e create_checkout_session
 * que chamam Stripe e devolvem a URL. A UI só redirecciona.
 */
// @ts-nocheck


import {
  createSaasPortalSession,
  createCheckoutSession,
} from "./coreBillingApi";

export interface BillingSessionResult {
  url: string;
  sessionId?: string;
}

export class BillingBroker {
  /**
   * Inicia sessão Stripe Checkout para assinatura.
   * Chama Core RPC create_checkout_session; Core retorna URL.
   */
  static async startSubscription(
    priceId: string,
  ): Promise<BillingSessionResult> {
    const successUrl = `${window.location.origin}/billing/success`;
    const cancelUrl = `${window.location.origin}/app/billing?billing=cancel`;

    const { url, sessionId, error } = await createCheckoutSession(
      priceId,
      successUrl,
      cancelUrl,
    );

    if (error) {
      console.warn("[BillingBroker] Core checkout error:", error);
      throw new Error(
        typeof error === "string" ? error : "Não foi possível iniciar o checkout. Tente mais tarde.",
      );
    }

    return { url, sessionId };
  }

  /**
   * Abre Stripe Customer Portal (self-serve).
   * Chama Core RPC create_saas_portal_session; Core retorna URL.
   */
  static async openCustomerPortal(): Promise<BillingSessionResult> {
    const returnUrl = `${window.location.origin}/app/billing`;

    const { url, error } = await createSaasPortalSession(returnUrl);

    if (error) {
      console.error("[BillingBroker] Core portal error:", error);
      throw new Error(error);
    }

    return { url };
  }
}
