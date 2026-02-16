/**
 * API Keys — CRUD para API pública v1 (Integrações → APIs & Webhooks).
 * Ref: CHEFIAPP_API_PUBLICA_V1_SPEC.md §3. Key gerada no frontend; apenas hash guardado no Core.
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

export interface ApiKeyRow {
  id: string;
  restaurant_id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

/** SHA-256 do key em hex (para guardar só o hash no Core). */
export async function sha256Hex(key: string): Promise<string> {
  const enc = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(len: number): string {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listApiKeys(restaurantId: string): Promise<ApiKeyRow[]> {
  if (getBackendType() !== BackendType.docker) return [];
  const url = `${REST}/api_keys?restaurant_id=eq.${encodeURIComponent(restaurantId)}&select=id,restaurant_id,name,last_used_at,created_at&order=created_at.desc`;
  const res = await fetch(url, { method: "GET", headers: await authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Cria uma nova API key. Gera key no cliente, guarda apenas hash no Core. Retorna a key em claro uma única vez. */
export async function createApiKey(
  restaurantId: string,
  name: string
): Promise<{ id?: string; key?: string; error?: string }> {
  if (getBackendType() !== BackendType.docker) return { error: "Core (Docker) required" };
  const key = `ck_${randomHex(24)}`;
  const keyHash = await sha256Hex(key);
  const headers = await authHeaders();
  const res = await fetch(`${REST}/api_keys`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" } as HeadersInit,
    body: JSON.stringify({
      restaurant_id: restaurantId,
      key_hash: keyHash,
      name: name || "Default",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { error: t || res.statusText };
  }
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row?.id, key };
}

export async function deleteApiKey(id: string): Promise<{ error?: string }> {
  if (getBackendType() !== BackendType.docker) return { error: "Core (Docker) required" };
  const res = await fetch(`${REST}/api_keys?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) return { error: (await res.text()) || res.statusText };
  return {};
}
