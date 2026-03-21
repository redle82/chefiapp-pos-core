/**
 * getUtmParams — Read UTM params from URL and persist in sessionStorage.
 * Used for attribution across the session.
 */

const STORAGE_KEY = "chefiapp_utm_params";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

function parseFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const out: UtmParams = {};
  const keys: (keyof UtmParams)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  for (const k of keys) {
    const v = params.get(k);
    if (v) (out as Record<string, string>)[k] = v;
  }
  return out;
}

/**
 * Get UTM params: from URL first, then from sessionStorage.
 * If URL has UTM, stores them in sessionStorage for the session.
 */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const fromUrl = parseFromSearch(window.location.search);
  const hasUrl = Object.keys(fromUrl).length > 0;
  if (hasUrl) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UtmParams;
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    }
  } catch {
    /* ignore */
  }
  return {};
}
