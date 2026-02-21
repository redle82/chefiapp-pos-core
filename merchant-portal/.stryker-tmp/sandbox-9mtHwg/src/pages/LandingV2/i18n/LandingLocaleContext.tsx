/**
 * Contexto de locale da LandingV2 — pt, en, es.
 * Locale vem de ?lang=pt|en|es; default pt. Ver LANDING_CANON.md.
 */
import {
  createContext,
  useCallback,
  useContext,
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
  null
);

const VALID_LANGS = new Set<string>(LANDING_LOCALES);

function parseLocale(searchParams: URLSearchParams): LandingLocale {
  const lang = searchParams.get("lang")?.toLowerCase();
  if (lang && VALID_LANGS.has(lang)) return lang as LandingLocale;
  return "pt";
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const locale = useMemo(
    () => parseLocale(searchParams),
    [searchParams]
  );

  const setLocale = useCallback(
    (lang: LandingLocale) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("lang", lang);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
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
