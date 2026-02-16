"use client";

import { useTranslation } from "@/lib/useTranslation";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="py-8 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-neutral-500">{t("footer_tagline")}</span>
        <span className="text-sm text-neutral-600">
          {t("footer_copyright")}
        </span>
      </div>
    </footer>
  );
}
