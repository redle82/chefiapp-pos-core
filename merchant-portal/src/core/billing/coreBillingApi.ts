/**
 * Core Billing API — Chamadas ao Core (Docker).
 *
 * Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT.md
 * Billing é soberania do Core. UI só consome esta API.
 * Sem fallback Supabase: quando Core não está disponível, FlowGate usa a flag
 * onboarding_just_completed (sessionStorage) para permitir TPV após skip no primeiro produto.
 */

import { CONFIG } from "../../config";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const CORE_ANON = CONFIG.CORE_ANON_KEY;

const REST = (() => {
  const base = DOCKER_CORE_URL.replace(/\/+$/, "");
  if (base.endsWith("/rest/v1")) return base;
  if (base.endsWith("/rest")) return `${base}/v1`;
  return `${base}/rest/v1`;
})();

function coreHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: CORE_ANON,
    Authorization: `Bearer ${CORE_ANON}`,
  };
}

function requireCore(): void {
  if (getBackendType() !== BackendType.docker) {
    throw new Error(
      "[coreBillingApi] Billing requires Core (Docker). Configure backend to Docker.",
    );
  }
}

// --- SaaS billing status (trial | active | past_due | canceled) ---

export type BillingStatus = "trial" | "active" | "past_due" | "canceled";

/**
 * Obter billing_status do restaurante (SaaS). Fonte = Core (Docker) only.
 * CORE_FINANCIAL_SOVEREIGNTY_CONTRACT §4: Domain = Core (Docker) only.
 */
export async function getBillingStatus(
  restaurantId: string,
): Promise<BillingStatus | null> {
  const withTrial = await getBillingStatusWithTrial(restaurantId);
  if (!withTrial) return null;
  if (withTrial.trial_expired) return "past_due";
  return withTrial.status;
}

/**
 * Obter billing_status + trial_ends_at para paywall e countdown.
 * trial_expired = true quando billing_status === 'trial' e now > trial_ends_at.
 */
export async function getBillingStatusWithTrial(
  restaurantId: string,
): Promise<BillingStatusWithTrial | null> {
  requireCore();
  const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
    restaurantId,
  )}&select=billing_status,trial_ends_at&limit=1`;
  const res = await fetch(url, { method: "GET", headers: coreHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const status = row?.billing_status;
  const trial_ends_at = row?.trial_ends_at ?? null;
  if (
    status !== "trial" &&
    status !== "active" &&
    status !== "past_due" &&
    status !== "canceled"
  ) {
    return null;
  }
  const now = new Date();
  const trial_expired =
    status === "trial" &&
    trial_ends_at != null &&
    now > new Date(trial_ends_at);
  return {
    status,
    trial_ends_at,
    trial_expired,
  };
}

/** Dados de status do restaurante (onboarding + billing). Fonte = Core quando Docker. */
export interface RestaurantStatusRow {
  id?: string;
  status?: string;
  onboarding_completed_at: string | null;
  billing_status: BillingStatus | null;
  trial_ends_at: string | null;
}

/** Resultado de getBillingStatus com trial_ends_at para paywall/countdown. */
export interface BillingStatusWithTrial {
  status: BillingStatus;
  trial_ends_at: string | null;
  /** true quando billing_status === 'trial' e now > trial_ends_at */
  trial_expired: boolean;
}

/**
 * Obter onboarding_completed_at e billing_status do restaurante.
 * Fonte = Core (Docker) only. cache: no-store para dados frescos.
 * Fallback quando Core falha ou dados ainda não propagaram: FlowGate consome a flag
 * onboarding_just_completed (core/storage/onboardingFlowFlag.ts) e trata como completed.
 */
export async function getRestaurantStatus(
  restaurantId: string,
): Promise<RestaurantStatusRow | null> {
  requireCore();
  // Pilot: restaurante criado por mock no bootstrap — devolver mock para não 404
  if (typeof window !== "undefined") {
    const pilotMock = localStorage.getItem("chefiapp_pilot_mock_restaurant");
    if (pilotMock) {
      try {
        const row = JSON.parse(pilotMock) as {
          id: string;
          onboarding_completed_at: string | null;
          billing_status: string;
          trial_ends_at?: string | null;
        };
        if (row.id === restaurantId) {
          const completedAt =
            row.onboarding_completed_at ?? new Date().toISOString();
          return {
            id: row.id,
            onboarding_completed_at: completedAt,
            billing_status:
              row.billing_status === "trial" ||
              row.billing_status === "active" ||
              row.billing_status === "past_due" ||
              row.billing_status === "canceled"
                ? row.billing_status
                : "trial",
            trial_ends_at: row.trial_ends_at ?? null,
          };
        }
      } catch {
        // ignore
      }
    }
  }
  const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
    restaurantId,
  )}&select=id,status,onboarding_completed_at,billing_status,trial_ends_at&limit=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: coreHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const text = await res.text();
  const ct = res.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (text.trim() && !ct.includes("application/json")) {
    return null;
  }
  try {
    const data = text ? JSON.parse(text) : [];
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!row) return null;
    const billingStatus = row.billing_status;
    const validStatus =
      billingStatus === "trial" ||
      billingStatus === "active" ||
      billingStatus === "past_due" ||
      billingStatus === "canceled";
    return {
      id: row.id,
      status: row.status ?? undefined,
      onboarding_completed_at: row.onboarding_completed_at ?? null,
      billing_status: validStatus ? billingStatus : null,
      trial_ends_at: row.trial_ends_at ?? null,
    };
  } catch {
    return null;
  }
}

// --- Billing config (restaurante: gateways) ---

export interface BillingConfigRow {
  id?: string;
  restaurant_id: string;
  provider: "stripe" | "sumup" | "pix" | "custom";
  currency: "EUR" | "USD" | "BRL";
  enabled: boolean;
  credentials_ref?: string | null;
  updated_at?: string;
}

/**
 * GET /core/billing/config — Obter configuração de billing do restaurante.
 * Implementação: GET rest/v1/billing_configs?restaurant_id=eq.{id}
 */
export async function getBillingConfig(
  restaurantId: string,
): Promise<BillingConfigRow | null> {
  requireCore();
  const url = `${REST}/billing_configs?restaurant_id=eq.${encodeURIComponent(
    restaurantId,
  )}&select=*&limit=1`;
  const res = await fetch(url, { method: "GET", headers: coreHeaders() });
  if (!res.ok) {
    if (res.status === 404 || res.status === 406) return null;
    throw new Error(`Core billing config: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/**
 * POST /core/billing/config — Criar/actualizar configuração.
 * Implementação: POST rest/v1/billing_configs com Prefer resolution=merge-duplicates, on_conflict=restaurant_id,provider
 */
export async function setBillingConfig(
  restaurantId: string,
  config: Omit<BillingConfigRow, "restaurant_id" | "updated_at"> & {
    updated_at?: string;
  },
): Promise<{ error: string | null }> {
  requireCore();
  const body = {
    restaurant_id: restaurantId,
    ...config,
    updated_at: new Date().toISOString(),
  };
  const url = `${REST}/billing_configs?on_conflict=restaurant_id,provider`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...coreHeaders(),
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    return { error: `${res.status} ${text}` };
  }
  return { error: null };
}

// --- SaaS (ChefIApp → Stripe: portal e checkout) ---

// --- Merchant Subscription (real data from merchant_subscriptions table) ---

export interface MerchantSubscriptionRow {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  addons: unknown[];
  created_at: string;
  updated_at: string;
}

/**
 * GET /rest/v1/merchant_subscriptions — Fetch subscription for a restaurant.
 * Returns null if no subscription exists or table is optional/unavailable (pre-migration).
 */
export async function getSubscription(
  restaurantId: string,
): Promise<MerchantSubscriptionRow | null> {
  requireCore();
  const client = getDockerCoreFetchClient();
  const { data, error } = await client
    .from("merchant_subscriptions")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .limit(1);
  if (error) return null;
  return Array.isArray(data) && data.length > 0
    ? (data[0] as MerchantSubscriptionRow)
    : null;
}

export interface BillingPlanRow {
  id: string;
  name: string;
  tier: string;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[];
  max_devices: number;
  max_integrations: number;
  max_delivery_orders: number;
  sort_order: number;
  active: boolean;
  /** Stripe Price ID (price_xxx). When present, used for Checkout instead of plan slug. */
  stripe_price_id?: string | null;
}

/**
 * GET /rest/v1/billing_plans — Fetch available billing plans.
 * Returns empty array if table doesn't exist yet.
 */
export async function getBillingPlans(): Promise<BillingPlanRow[]> {
  requireCore();
  const url = `${REST}/billing_plans?active=eq.true&order=sort_order.asc&select=*`;
  const res = await fetch(url, {
    method: "GET",
    headers: coreHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface BillingInvoiceRow {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_date: string;
  pdf_url: string | null;
  created_at: string;
}

/**
 * GET /rest/v1/billing_invoices — Fetch invoice history for a restaurant.
 */
export async function getBillingInvoices(
  restaurantId: string,
): Promise<BillingInvoiceRow[]> {
  requireCore();
  const url = `${REST}/billing_invoices?restaurant_id=eq.${encodeURIComponent(
    restaurantId,
  )}&order=invoice_date.desc&select=*&limit=50`;
  const res = await fetch(url, {
    method: "GET",
    headers: coreHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * POST /core/billing/saas/portal — Criar sessão Stripe Customer Portal.
 * Core (Docker) only.
 */
export async function createSaasPortalSession(returnUrl: string): Promise<{
  url: string;
  error?: string;
}> {
  requireCore();
  const rpcUrl = `${REST}/rpc/create_saas_portal_session`;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: coreHeaders(),
    body: JSON.stringify({ return_url: returnUrl }),
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      url: "",
      error: text || `Core RPC create_saas_portal_session: ${res.status}`,
    };
  }
  let data: { url?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { url: "", error: "Invalid JSON from Core" };
  }
  if (!data?.url) {
    return { url: "", error: "Core did not return portal URL" };
  }
  return { url: data.url };
}

/**
 * Criar sessão Stripe Checkout (assinatura).
 * Preferência: Integration Gateway (API_BASE) se configurado; senão Core RPC (Docker).
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string; sessionId?: string; error?: string }> {
  const apiBase = CONFIG.API_BASE?.replace(/\/+$/, "");
  if (apiBase && CONFIG.INTERNAL_API_TOKEN) {
    // Em dev com gateway em localhost:4320, usar URL relativa para o proxy do Vite (evita CORS).
    const isLocalGateway =
      apiBase === "http://localhost:4320" ||
      apiBase === "http://127.0.0.1:4320";
    const gatewayUrl = isLocalGateway
      ? "/internal/billing/create-checkout-session"
      : `${apiBase}/internal/billing/create-checkout-session`;
    let res: Response;
    try {
      res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": CONFIG.INTERNAL_API_TOKEN,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError &&
        (e.message === "Failed to fetch" || e.message.includes("fetch"));
      return {
        url: "",
        error: isNetworkError
          ? "El servidor de checkout no está en ejecución. En otra terminal ejecuta: pnpm run server:integration-gateway (puerto 4320)."
          : e instanceof Error
          ? e.message
          : "Error de conexión con el servidor de checkout.",
      };
    }
    const text = await res.text();
    if (!res.ok) {
      let errorMessage = text || `Checkout: ${res.status}`;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j?.message) errorMessage = j.message;
      } catch {
        // keep errorMessage
      }
      return { url: "", error: errorMessage };
    }
    let data: { url?: string; session_id?: string } = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { url: "", error: "Invalid JSON from gateway" };
    }
    if (!data?.url) {
      return { url: "", error: "Gateway did not return checkout URL" };
    }
    return { url: data.url, sessionId: data.session_id };
  }

  requireCore();
  const rpcUrl = `${REST}/rpc/create_checkout_session`;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: coreHeaders(),
    body: JSON.stringify({
      price_id: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let errorMessage =
      text || `Core RPC create_checkout_session: ${res.status}`;
    if (res.status === 404) {
      try {
        const j = JSON.parse(text) as { code?: string; message?: string };
        if (
          j?.code === "PGRST202" ||
          (j?.message && j.message.includes("create_checkout_session"))
        ) {
          errorMessage =
            "Checkout em breve. A migração de faturação ainda não foi aplicada no Core. Ver docker-core/MIGRATIONS.md.";
        }
      } catch {
        // keep errorMessage as text
      }
    }
    return { url: "", error: errorMessage };
  }
  let data: { url?: string; session_id?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { url: "", error: "Invalid JSON from Core" };
  }
  if (!data?.url) {
    return { url: "", error: "Core did not return checkout URL" };
  }
  return { url: data.url, sessionId: data.session_id };
}
