/**
 * Webhooks OUT — CRUD config e listagem de logs via Core (PostgREST).
 * Ref: CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md. RLS: authenticated por restaurant_id.
 */

import { CONFIG } from "../../../../config";
import { getBackendType, BackendType } from "../../../../core/infra/backendAdapter";
import { getCoreSessionAsync } from "../../../../core/auth/getCoreSession";

const REST = (() => {
  const raw = CONFIG.CORE_URL || "";
  const base = raw.replace(/\/+$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  if (base.endsWith("/rest/v1")) return base;
  if (base.endsWith("/rest")) return `${base}/v1`;
  return base ? `${base}/rest/v1` : "/rest/v1";
})();

async function authHeaders(): Promise<HeadersInit> {
  const session = await getCoreSessionAsync();
  const token = session?.access_token || CONFIG.CORE_ANON_KEY;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: CONFIG.CORE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}

export interface WebhookOutConfigRow {
  id: string;
  restaurant_id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookOutDeliveryLogRow {
  id: string;
  delivery_id: string;
  webhook_config_id: string;
  restaurant_id: string;
  event: string;
  url: string;
  status_code: number | null;
  attempt: number;
  attempted_at: string;
  next_retry_at: string | null;
  error_message: string | null;
}

export async function listWebhookConfigs(restaurantId: string): Promise<WebhookOutConfigRow[]> {
  if (getBackendType() !== BackendType.docker) return [];
  const url = `${REST}/webhook_out_config?restaurant_id=eq.${encodeURIComponent(restaurantId)}&select=*&order=created_at.desc`;
  const res = await fetch(url, { method: "GET", headers: await authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createWebhookConfig(
  restaurantId: string,
  body: { url: string; secret: string; events: string[]; enabled: boolean; description?: string }
): Promise<{ id?: string; error?: string }> {
  if (getBackendType() !== BackendType.docker) {
    return { error: "Core (Docker) required" };
  }
  const res = await fetch(`${REST}/webhook_out_config`, {
    method: "POST",
    headers: await authHeaders().then(h => ({ ...h, Prefer: "return=representation" }) as HeadersInit),
    body: JSON.stringify({
      restaurant_id: restaurantId,
      url: body.url,
      secret: body.secret,
      events: body.events ?? [],
      enabled: body.enabled ?? true,
      description: body.description ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { error: t || res.statusText };
  }
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row?.id };
}

export async function updateWebhookConfig(
  id: string,
  body: Partial<{ url: string; secret: string; events: string[]; enabled: boolean; description: string }>
): Promise<{ error?: string }> {
  if (getBackendType() !== BackendType.docker) return { error: "Core (Docker) required" };
  const res = await fetch(`${REST}/webhook_out_config?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) return { error: await res.text() || res.statusText };
  return {};
}

export async function deleteWebhookConfig(id: string): Promise<{ error?: string }> {
  if (getBackendType() !== BackendType.docker) return { error: "Core (Docker) required" };
  const res = await fetch(`${REST}/webhook_out_config?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) return { error: await res.text() || res.statusText };
  return {};
}

export async function listDeliveryLogs(
  restaurantId: string,
  limit = 50
): Promise<WebhookOutDeliveryLogRow[]> {
  if (getBackendType() !== BackendType.docker) return [];
  const url = `${REST}/webhook_out_delivery_log?restaurant_id=eq.${encodeURIComponent(restaurantId)}&select=*&order=attempted_at.desc&limit=${limit}`;
  const res = await fetch(url, { method: "GET", headers: await authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Gera um secret seguro para HMAC (exibir apenas uma vez). */
export function generateWebhookSecret(): string {
  const buf = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  }
  return Array.from(buf, b => b.toString(16).padStart(2, "0")).join("");
}
