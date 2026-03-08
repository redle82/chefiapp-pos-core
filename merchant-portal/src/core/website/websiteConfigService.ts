import { CONFIG } from "../../config";
import type { RestaurantRuntime } from "../runtime/RuntimeContext";

/**
 * Website Quick Editor schema — campos seguros e controlados.
 *
 * Este serviço não conhece detalhes de layout; apenas o contrato de dados
 * que o TPV Web Editor usa para ler/escrever estado da página pública.
 */

export type WebsiteStatusMode = "open" | "closed" | "paused";

export interface WebsiteHeroConfig {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface WebsiteScheduleEntry {
  /** ex.: "monday", "tuesday" (sem tradução aqui; UI trata labels) */
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface WebsiteContactsConfig {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
}

export interface WebsiteHighlightCard {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface WebsiteStatusConfig {
  mode: WebsiteStatusMode;
  message?: string;
}

export interface WebsiteQuickConfig {
  hero: WebsiteHeroConfig;
  schedule: WebsiteScheduleEntry[];
  contacts: WebsiteContactsConfig;
  highlights: WebsiteHighlightCard[];
  status: WebsiteStatusConfig;
}

export interface WebsiteConfigDocument {
  restaurantId: string;
  draft: WebsiteQuickConfig | null;
  published: WebsiteQuickConfig | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

const LOCAL_STORAGE_KEY_PREFIX = "chefiapp_web_editor_draft_v1_";

export function getLocalDraftKey(restaurantId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${restaurantId}`;
}

export function loadLocalDraft(
  restaurantId: string,
): WebsiteQuickConfig | null {
  try {
    const raw = localStorage.getItem(getLocalDraftKey(restaurantId));
    if (!raw) return null;
    return JSON.parse(raw) as WebsiteQuickConfig;
  } catch {
    return null;
  }
}

export function saveLocalDraft(restaurantId: string, draft: WebsiteQuickConfig) {
  try {
    localStorage.setItem(
      getLocalDraftKey(restaurantId),
      JSON.stringify(draft),
    );
  } catch {
    // Storage best-effort; falhas não bloqueiam fluxo.
  }
}

export function clearLocalDraft(restaurantId: string) {
  try {
    localStorage.removeItem(getLocalDraftKey(restaurantId));
  } catch {
    // noop
  }
}

function isOffline(runtime?: RestaurantRuntime): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (!runtime) return false;
  return !runtime.coreReachable || runtime.coreMode === "offline-erro";
}

function resolveCoreRestBaseUrl(): string | null {
  const coreUrl = CONFIG.CORE_URL;
  if (!coreUrl) return null;
  return coreUrl.endsWith("/rest") ? `${coreUrl}/v1` : `${coreUrl}/rest/v1`;
}

async function fetchJson(
  input: RequestInfo,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Website config request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function fetchWebsiteConfig(
  restaurantId: string,
  runtime?: RestaurantRuntime,
): Promise<WebsiteConfigDocument | null> {
  if (isOffline(runtime)) {
    const local = loadLocalDraft(restaurantId);
    if (!local) return null;
    return {
      restaurantId,
      draft: local,
      published: null,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const baseUrl = resolveCoreRestBaseUrl();
  const anonKey = CONFIG.CORE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return null;
  }

  const url = `${baseUrl}/website_config?restaurant_id=eq.${encodeURIComponent(
    restaurantId,
  )}&select=*`;

  const data = (await fetchJson(url, {
    method: "GET",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  })) as Array<{
    restaurant_id: string;
    draft: WebsiteQuickConfig | null;
    published: WebsiteQuickConfig | null;
    updated_at?: string | null;
    updated_by?: string | null;
  }> | null;

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    restaurantId: row.restaurant_id,
    draft: row.draft,
    published: row.published,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function saveWebsiteDraft(params: {
  restaurantId: string;
  draft: WebsiteQuickConfig;
  actorEmail?: string | null;
  runtime?: RestaurantRuntime;
}): Promise<void> {
  const { restaurantId, draft, actorEmail, runtime } = params;

  saveLocalDraft(restaurantId, draft);

  if (isOffline(runtime)) {
    return;
  }

  const baseUrl = resolveCoreRestBaseUrl();
  const anonKey = CONFIG.CORE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return;
  }

  const url = `${baseUrl}/website_config`;
  await fetchJson(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      draft,
      updated_by: actorEmail ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function publishWebsiteConfig(params: {
  restaurantId: string;
  draft: WebsiteQuickConfig;
  actorEmail?: string | null;
  runtime?: RestaurantRuntime;
}): Promise<void> {
  const { restaurantId, draft, actorEmail, runtime } = params;

  saveLocalDraft(restaurantId, draft);

  if (isOffline(runtime)) {
    throw new Error(
      "Offline — não é possível publicar. Guarde como rascunho e tente novamente online.",
    );
  }

  const baseUrl = resolveCoreRestBaseUrl();
  const anonKey = CONFIG.CORE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error("Core não configurado para website_config.");
  }

  const url = `${baseUrl}/website_config`;
  await fetchJson(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      draft,
      published: draft,
      updated_by: actorEmail ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

