/**
 * Contexto de locale da LandingV2 — pt, en, es.
 * Locale vem de ?lang=pt|en|es; default pt. Ver LANDING_CANON.md.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  getLandingCopy,
  LANDING_LOCALES,
  type LandingLocale,
} from "./landingV2Copy";

type LandingLocaleContextValue = {
  locale: LandingLocale;
  setLocale: (lang: LandingLocale) => void;
  t: (key: string) => string;
};

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(
  null,
);

const VALID_LANGS = new Set<string>(LANDING_LOCALES);
const STORAGE_KEY = "chefiapp_landing_locale";
/** App locale key (i18n) — synced so landing language carries into app. Never derive currency from this. */
const APP_LOCALE_KEY = "chefiapp_locale";
const GEO_COUNTRY_KEY = "__CHEFIAPP_GEO_COUNTRY__";

/** Map landing locale (pt|en|es) to app SupportedLocale (pt-BR|en|es). */
function landingLocaleToAppLocale(landing: LandingLocale): "pt-BR" | "en" | "es" {
  if (landing === "pt") return "pt-BR";
  if (landing === "en") return "en";
  return "es";
}

function resolveFromQuery(searchParams: URLSearchParams): LandingLocale | null {
  const lang = searchParams.get("lang")?.toLowerCase();
  if (lang && VALID_LANGS.has(lang)) return lang as LandingLocale;
  return null;
}

function resolveFromStorage(): LandingLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const normalized = stored.toLowerCase();
    if (VALID_LANGS.has(normalized)) return normalized as LandingLocale;
  } catch {
    // ignore storage issues (private mode, disabled, etc.)
  }
  return null;
}

function resolveFromGeoHint(): LandingLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const country = (window as any)[GEO_COUNTRY_KEY] as
      | string
      | undefined
      | null;
    if (!country) return null;
    const code = country.toUpperCase();
    if (code === "BR" || code === "PT") return "pt";
    if (code === "ES") return "es";
    if (code === "US" || code === "GB" || code === "IE") return "en";
  } catch {
    // ignore malformed hints
  }
  return null;
}

function resolveFromNavigator(): LandingLocale | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { languages?: string[] };
  const primary =
    (Array.isArray(nav.languages) && nav.languages[0]) || nav.language;
  if (!primary) return null;
  const lang = primary.toLowerCase();
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("en")) return "en";
  return null;
}

function resolveInitialLocale(searchParams: URLSearchParams): LandingLocale {
  return (
    resolveFromQuery(searchParams) ??
    resolveFromStorage() ??
    resolveFromGeoHint() ??
    resolveFromNavigator() ??
    "pt"
  );
}

/** Persist landing locale to app locale key and optionally switch i18n language. */
function syncLandingLocaleToApp(landing: LandingLocale): void {
  const appLocale = landingLocaleToAppLocale(landing);
  try {
    window.localStorage.setItem(APP_LOCALE_KEY, appLocale);
  } catch {
    // ignore storage issues (private mode, etc.)
  }
  // So that if the user navigates into the app without reload, i18n is already in sync
  import("../../../i18n")
    .then((m) => m.default.changeLanguage(appLocale))
    .catch(() => {});
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const locale = useMemo(
    () => resolveInitialLocale(searchParams),
    [searchParams],
  );

  // Sync resolved locale (e.g. from ?lang or storage) to app locale so app inherits language
  useEffect(() => {
    syncLandingLocaleToApp(locale);
  }, [locale]);

  const setLocale = useCallback(
    (lang: LandingLocale) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("lang", lang);
          return next;
        },
        { replace: true },
      );
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore storage issues
      }
      syncLandingLocaleToApp(lang);
    },
    [setSearchParams],
  );

  const t = useCallback(
    (key: string) => getLandingCopy(locale, key),
    [locale]
  );

  const value = useMemo<LandingLocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LandingLocaleContext.Provider value={value}>
      {children}
    </LandingLocaleContext.Provider>
  );
}

export function useLandingLocale(): LandingLocaleContextValue {
  const ctx = useContext(LandingLocaleContext);
  if (!ctx) {
    throw new Error(
      "useLandingLocale must be used inside LandingLocaleProvider"
    );
  }
  return ctx;
}
