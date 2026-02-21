/**
 * Stripe Payment Adapter — Integração de pagamentos (assinatura SaaS) via Hub.
 * Ref: CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md
 *
 * Delega checkout e customer portal ao BillingBroker (Core RPCs).
 * Capability: payments.process. Registado no IntegrationRegistry para o facade usar.
 */
// @ts-nocheck


import type { IntegrationAdapter } from "../../core/IntegrationContract";
import type { IntegrationEvent } from "../../types/IntegrationEvent";
import type { IntegrationStatus } from "../../types/IntegrationStatus";

export const STRIPE_PAYMENT_ADAPTER_ID = "stripe";

export const StripePaymentAdapter: IntegrationAdapter = {
  id: STRIPE_PAYMENT_ADAPTER_ID,
  name: "Stripe",
  description: "Pagamentos e assinatura SaaS (checkout, customer portal)",
  capabilities: ["payments.process"],

  onEvent(_event: IntegrationEvent): void {
    // Stripe como adapter não reage a eventos; o webhook do servidor emite payment.confirmed
    // para outros adapters e Webhooks OUT.
  },

  async healthCheck(): Promise<IntegrationStatus> {
    // Opcional: chamar Core ou Stripe para verificar conectividade
    return { status: "ok", lastCheckedAt: Date.now() };
  },
};
