/**
 * Tipos para a página Assinatura / Billing Center (Last.app style).
 * Ref: Tu suscripción — plano, uso, cobrança, pagamento, faturas.
 *
 * Plan tiers aligned with billing-core/types.ts and DB:
 *   free | trial | starter | pro | enterprise
 */

import type { PlanTier } from "../../../../../../billing-core/types";

/** @deprecated Use PlanTier from billing-core/types instead */
export type PlanId = "basic" | "pro" | "growth" | "starter" | "enterprise";

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  priceCents: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  maxDevices: number;
  maxIntegrations: number;
  maxDeliveryOrders: number;
  /** Plano atual do restaurante */
  isCurrent?: boolean;
  /** Trial: termina nesta data */
  trialEndsAt?: string | null;
}

export type UsageMeterStatus = "ok" | "warning" | "over";

/** Uma quota de uso (dispositivos POS, integrações, pedidos delivery, SMS, etc.) */
export interface UsageMeter {
  id: string;
  label: string;
  /** Microtexto: o que conta (ex.: "Dispositivos = caixas logados") */
  hint?: string;
  used: number;
  limit: number;
  unit?: string; // "dispositivos", "integrações", "pedidos", "SMS"
  /** CTA: rota ou ação (ex.: /admin/config/dispositivos) */
  manageHref?: string;
  manageLabel?: string;
  /** Custo por unidade extra (ex.: 0.04 €/SMS) */
  extraCostPerUnit?: number;
}

export interface BillingSummary {
  cycle: "monthly" | "yearly";
  nextChargeAt: string;
  subtotalEur: number;
  taxEur: number;
  totalEur: number;
  planLabel: string;
  /** Mudar para anual disponível */
  canSwitchToYearly?: boolean;
}

export interface PaymentMethod {
  brand: string; // "Visa", "Mastercard"
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  /** Pagamento falhou — atualizar até esta data */
  failureDeadline?: string | null;
}

export interface Invoice {
  id: string;
  date: string;
  amountEur: number;
  status: "paid" | "pending" | "failed";
  downloadUrl?: string | null;
}
