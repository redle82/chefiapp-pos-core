"use client";

import { useTranslation } from "@/lib/useTranslation";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

const APP_AUTH_URL = "https://app.chefiapp.com/auth/phone";

export function Header() {
  const { locale, t } = useTranslation();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-white tracking-tight"
        >
          ChefIApp™
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">
            {t("nav_system")}
          </a>
          <a href="#how" className="hover:text-white transition-colors">
            {t("how_title")}
          </a>
          <a href="#proof" className="hover:text-white transition-colors">
            {t("proof_title")}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <a
            href={`${APP_AUTH_URL}?mode=signup`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            {t("cta_primary")}
          </a>
        </div>
      </div>
    </header>
  );
}
