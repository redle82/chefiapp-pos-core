"use client";

import { useTranslation } from "@/lib/useTranslation";

export function Proof() {
  const { t } = useTranslation();
  return (
    <section id="proof" className="py-20 md:py-24 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
          {t("proof_title")}{" "}
          <span className="text-amber-500">{t("proof_subtitle")}</span>
        </h2>
        <blockquote className="text-lg md:text-xl text-neutral-300 leading-relaxed mb-6 italic">
          &ldquo;{t("proof_quote")}&rdquo;
        </blockquote>
        <footer className="text-neutral-500">
          <strong className="text-white">{t("proof_author")}</strong>
          <span className="block text-sm mt-1">{t("proof_location")}</span>
        </footer>
      </div>
    </section>
  );
}
