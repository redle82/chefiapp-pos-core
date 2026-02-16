"use client";

import { useTranslation } from "@/lib/useTranslation";

const APP_AUTH_URL = "https://app.chefiapp.com/auth/phone";

export function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-24 px-6 border-t border-white/5 bg-neutral-950/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
          {t("final_cta_title")}{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {t("final_cta_title_accent")}
          </span>
        </h2>
        <p className="text-neutral-400 mb-8">{t("final_cta_sub")}</p>
        <a
          href={`${APP_AUTH_URL}?mode=signup`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25"
        >
          {t("final_cta_button")}
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
