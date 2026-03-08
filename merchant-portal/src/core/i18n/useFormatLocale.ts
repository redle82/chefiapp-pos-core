/**
 * React hook that returns the current Intl-compatible locale string
 * for use with `toLocaleString`, `Intl.DateTimeFormat`, `Intl.NumberFormat`, etc.
 *
 * Re-renders automatically when the i18n language changes.
 *
 * Usage:
 *   const locale = useFormatLocale();
 *   date.toLocaleDateString(locale, { ... });
 */

import { useTranslation } from "react-i18next";
import { toIntlLocale, type SupportedLocale } from "./regionLocaleConfig";

export function useFormatLocale(): string {
  const { i18n } = useTranslation();
  return toIntlLocale(i18n.language as SupportedLocale);
}
