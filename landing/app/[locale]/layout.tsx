import type { Metadata } from "next";
import React from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import type { Locale } from "@/lib/useTranslation";

const LOCALES = ["en", "pt", "es"] as const;
const BASE_URL = "https://chefiapp.com";

const METADATA_BY_LOCALE: Record<
  string,
  { title: string; description: string }
> = {
  en: {
    title: "ChefIApp™ — The Operating System for Restaurants",
    description:
      "One source of truth. Dining room, kitchen, bar and team in the same system — in real time. No duct tape, no syncs.",
  },
  pt: {
    title: "ChefIApp™ — O Sistema Operacional para Restaurantes",
    description:
      "Uma verdade operacional. Sala, cozinha, bar e equipa no mesmo sistema — em tempo real. Sem duct tape, sem sincronizações.",
  },
  es: {
    title: "ChefIApp™ — El Sistema Operativo para Restaurantes",
    description:
      "Una verdad operativa. Sala, cocina, barra y equipo en el mismo sistema — en tiempo real. Sin cinta aislante, sin sincronizaciones.",
  },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = LOCALES.includes(params.locale as Locale)
    ? params.locale
    : "en";
  const meta = METADATA_BY_LOCALE[locale] ?? METADATA_BY_LOCALE.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      languages: {
        en: `${BASE_URL}/en`,
        pt: `${BASE_URL}/pt`,
        es: `${BASE_URL}/es`,
      },
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = (
    LOCALES.includes(params.locale as Locale) ? params.locale : "en"
  ) as Locale;

  return (
    <>
      <SetHtmlLang locale={locale} />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
