/**
 * Country Detection — Automatic detection + localStorage persistence.
 * navigator.language → fallback → localStorage override.
 */

export type DetectedCountry = "es" | "pt" | "gb" | "us" | "br";

const STORAGE_KEY = "chefiapp_country";

const LOCALE_TO_COUNTRY: Record<string, DetectedCountry> = {
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  pt: "pt",
  "pt-pt": "pt",
  "pt-br": "br",
  en: "gb",
  "en-gb": "gb",
  "en-us": "us",
  "en-au": "gb",
  br: "br",
  gb: "gb",
  us: "us",
};

function parseStored(s: string | null): DetectedCountry | null {
  if (!s || typeof s !== "string") return null;
  const v = s.toLowerCase().trim();
  if (["es", "pt", "gb", "us", "br"].includes(v)) return v as DetectedCountry;
  return null;
}

export function getDetectedCountry(): DetectedCountry {
  if (typeof window === "undefined") return "gb";
  const stored = parseStored(localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  const lang = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
  const normalized = lang.replace("-", "-").split("-")[0];
  const match = LOCALE_TO_COUNTRY[lang] ?? LOCALE_TO_COUNTRY[normalized];
  return match ?? "gb";
}

export function setCountryOverride(country: DetectedCountry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, country);
  } catch {
    // quota / private mode
  }
}
