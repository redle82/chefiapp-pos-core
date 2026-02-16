"use client";

import { LOCALES, useTranslation } from "@/lib/useTranslation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale } = useTranslation();
  const pathWithoutLocale = pathname
    ? pathname.replace(/^\/(en|pt|es)/, "")
    : "";

  return (
    <nav
      className="flex items-center gap-1 text-sm"
      aria-label="Switch language"
    >
      {LOCALES.map((loc) => (
        <Link
          key={loc}
          href={pathWithoutLocale ? `/${loc}${pathWithoutLocale}` : `/${loc}`}
          className={`px-2 py-1.5 rounded uppercase font-medium transition-colors ${
            locale === loc
              ? "text-amber-500 font-bold ring-1 ring-amber-500/50"
              : "text-neutral-400 hover:text-white"
          }`}
          title={
            loc === "en" ? "English" : loc === "pt" ? "Português" : "Español"
          }
        >
          {loc}
        </Link>
      ))}
    </nav>
  );
}
