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

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const CORE_ANON = CONFIG.CORE_ANON_KEY;

const REST = DOCKER_CORE_URL.endsWith("/rest")
  ? DOCKER_CORE_URL
  : `${DOCKER_CORE_URL}/rest`;

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
      "[coreBillingApi] Billing requires Core (Docker). Configure backend to Docker."
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
  restaurantId: string
): Promise<BillingStatus | null> {
  requireCore();
  const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
    restaurantId
  )}&select=billing_status&limit=1`;
  const res = await fetch(url, { method: "GET", headers: coreHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const status = row?.billing_status;
  if (
    status === "trial" ||
    status === "active" ||
    status === "past_due" ||
    status === "canceled"
  ) {
    return status;
  }
  return null;
}

/** Dados de status do restaurante (onboarding + billing). Fonte = Core quando Docker. */
export interface RestaurantStatusRow {
  id?: string;
  onboarding_completed_at: string | null;
  billing_status: BillingStatus | null;
}

/**
 * Obter onboarding_completed_at e billing_status do restaurante.
 * Fonte = Core (Docker) only. cache: no-store para dados frescos.
 * Fallback quando Core falha ou dados ainda não propagaram: FlowGate consome a flag
 * onboarding_just_completed (core/storage/onboardingFlowFlag.ts) e trata como completed.
 */
export async function getRestaurantStatus(
  restaurantId: string
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
          };
        }
      } catch {
        // ignore
      }
    }
  }
  const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
    restaurantId
  )}&select=id,onboarding_completed_at,billing_status&limit=1`;
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
    const status = row.billing_status;
    const validStatus =
      status === "trial" ||
      status === "active" ||
      status === "past_due" ||
      status === "canceled";
    return {
      id: row.id,
      onboarding_completed_at: row.onboarding_completed_at ?? null,
      billing_status: validStatus ? status : null,
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
  restaurantId: string
): Promise<BillingConfigRow | null> {
  requireCore();
  const url = `${REST}/billing_configs?restaurant_id=eq.${encodeURIComponent(
    restaurantId
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
  }
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
 * Core (Docker) only.
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string; sessionId?: string; error?: string }> {
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
    return {
      url: "",
      error: text || `Core RPC create_checkout_session: ${res.status}`,
    };
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
