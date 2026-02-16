"use client";

import type { Locale } from "@/lib/useTranslation";
import { useEffect } from "react";

export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return null;
}
