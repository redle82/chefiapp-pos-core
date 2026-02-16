"use client";

import enJson from "@/locales/en.json";
import esJson from "@/locales/es.json";
import ptJson from "@/locales/pt.json";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export type Locale = "en" | "pt" | "es";

const LOCALES: Locale[] = ["en", "pt", "es"];
const DEFAULT_LOCALE: Locale = "en";

const bundles: Record<Locale, Record<string, string>> = {
  en: enJson as Record<string, string>,
  pt: ptJson as Record<string, string>,
  es: esJson as Record<string, string>,
};

function getBundle(locale: string): Record<string, string> {
  const l = locale as Locale;
  if (LOCALES.includes(l)) return bundles[l];
  return bundles[DEFAULT_LOCALE];
}

export function useTranslation(): {
  t: (key: string) => string;
  locale: Locale;
} {
  const params = useParams();
  const locale = (params?.locale as Locale) ?? DEFAULT_LOCALE;
  const t = useMemo(() => {
    const bundle = getBundle(locale);
    return (key: string) => bundle[key] ?? key;
  }, [locale]);
  return {
    t,
    locale: LOCALES.includes(locale as Locale)
      ? (locale as Locale)
      : DEFAULT_LOCALE,
  };
}

export { DEFAULT_LOCALE, LOCALES };
