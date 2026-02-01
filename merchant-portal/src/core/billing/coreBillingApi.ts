/**
 * Core Billing API — Chamadas ao Core (Docker). NO SUPABASE.
 *
 * Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT.md
 * Billing é soberania do Core. UI só consome esta API.
 */

import { CONFIG } from "../../config";
import { BackendType, getBackendType } from "../infra/backendAdapter";

const DOCKER_CORE_URL = CONFIG.SUPABASE_URL;
const CORE_ANON = CONFIG.SUPABASE_ANON_KEY;

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
      "[coreBillingApi] Billing requires Core (Docker). No Supabase. Configure backend to Docker or implement Core RPCs.",
    );
  }
}

// --- SaaS billing status (trial | active | past_due | canceled) ---

export type BillingStatus = "trial" | "active" | "past_due" | "canceled";

/**
 * Obter billing_status do restaurante (SaaS). Fonte = Core quando backend Docker.
 * FINANCIAL_CORE_VIOLATION_AUDIT: quando não Docker, fallback Supabase (technical debt).
 */
export async function getBillingStatus(
  restaurantId: string,
): Promise<BillingStatus | null> {
  if (getBackendType() === BackendType.docker) {
    const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
      restaurantId,
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
  // Technical debt: backend não Docker — ler de Supabase (não autoritativo; ver FINANCIAL_CORE_VIOLATION_AUDIT).
  try {
    const { supabase } = await import("../supabase");
    const { data, error } = await supabase
      .from("gm_restaurants")
      .select("billing_status")
      .eq("id", restaurantId)
      .single();
    if (error || !data?.billing_status) return null;
    const s = data.billing_status as string;
    if (s === "trial" || s === "active" || s === "past_due" || s === "canceled")
      return s;
    return null;
  } catch {
    return null;
  }
}

/** Dados de status do restaurante (onboarding + billing). Fonte = Core quando Docker. */
export interface RestaurantStatusRow {
  id?: string;
  onboarding_completed_at: string | null;
  billing_status: BillingStatus | null;
}

/**
 * Obter onboarding_completed_at e billing_status do restaurante.
 * Fonte = Core quando backend Docker; fallback Supabase (technical debt).
 * FINANCIAL_CORE_VIOLATION_AUDIT: usado por FlowGate.
 */
export async function getRestaurantStatus(
  restaurantId: string,
): Promise<RestaurantStatusRow | null> {
  if (getBackendType() === BackendType.docker) {
    const url = `${REST}/gm_restaurants?id=eq.${encodeURIComponent(
      restaurantId,
    )}&select=id,onboarding_completed_at,billing_status&limit=1`;
    const res = await fetch(url, { method: "GET", headers: coreHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
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
  }
  try {
    const { supabase } = await import("../supabase");
    const { data, error } = await supabase
      .from("gm_restaurants")
      .select("id, onboarding_completed_at, billing_status")
      .eq("id", restaurantId)
      .single();
    if (error || !data) return null;
    const s = data.billing_status as string | null;
    const validStatus =
      s === "trial" || s === "active" || s === "past_due" || s === "canceled";
    return {
      id: data.id,
      onboarding_completed_at: data.onboarding_completed_at ?? null,
      billing_status: validStatus ? s : null,
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

/**
 * POST /core/billing/saas/portal — Criar sessão Stripe Customer Portal.
 * Implementação Core: RPC create_saas_portal_session(return_url) ou serviço que chama Stripe e devolve { url }.
 */
export async function createSaasPortalSession(returnUrl: string): Promise<{
  url: string;
  error?: string;
}> {
  requireCore();
  // PostgREST: POST /rest/v1/rpc/create_saas_portal_session
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
 * Implementação Core: RPC create_checkout_session(price_id, success_url, cancel_url).
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
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
