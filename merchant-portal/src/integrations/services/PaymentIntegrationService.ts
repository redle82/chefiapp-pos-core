/**
 * PaymentIntegrationService — Facade para pagamentos via adapter com capacidade payments.process.
 * Ref: CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md
 *
 * Obtém o adapter ativo (ex.: Stripe) e delega startCheckout / openCustomerPortal
 * ao BillingBroker, sem importar Stripe diretamente nas páginas.
 */

import { IntegrationRegistry } from "../core/IntegrationRegistry";
import { hasCapability } from "../core/IntegrationContract";
import { BillingBroker } from "../../core/billing/BillingBroker";
import type { BillingSessionResult } from "../../core/billing/BillingBroker";

export async function getActivePaymentAdapter() {
  const adapters = IntegrationRegistry.listByCapability("payments.process");
  return adapters.find((a) => IntegrationRegistry.isEnabled(a.id)) ?? adapters[0] ?? null;
}

/**
 * Inicia sessão de checkout (assinatura). Usa Stripe via BillingBroker quando o adapter ativo é stripe.
 * restaurant_id é obrigatório para metadata na sessão Stripe (webhook sync).
 */
export async function startCheckout(
  priceId: string,
  restaurantId: string,
): Promise<BillingSessionResult> {
  const adapter = await getActivePaymentAdapter();
  if (!adapter || !hasCapability(adapter, "payments.process")) {
    throw new Error("Nenhuma integração de pagamentos ativa (ex.: Stripe).");
  }
  if (adapter.id === "stripe") {
    return BillingBroker.startSubscription(priceId, restaurantId);
  }
  throw new Error(`Adapter ${adapter.id} não suporta checkout nesta versão.`);
}

/**
 * Abre o portal do cliente (Stripe Customer Portal). Usa BillingBroker quando o adapter ativo é stripe.
 */
export async function openCustomerPortal(): Promise<BillingSessionResult> {
  const adapter = await getActivePaymentAdapter();
  if (!adapter || !hasCapability(adapter, "payments.process")) {
    throw new Error("Nenhuma integração de pagamentos ativa (ex.: Stripe).");
  }
  if (adapter.id === "stripe") {
    return BillingBroker.openCustomerPortal();
  }
  throw new Error(`Adapter ${adapter.id} não suporta customer portal nesta versão.`);
}
