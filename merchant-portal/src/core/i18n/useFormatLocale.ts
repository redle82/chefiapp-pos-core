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

  // Defensive: in test environments or before i18n is fully initialised,
  // i18n or i18n.language can be undefined. Fallback to a sensible default
  // locale instead of throwing, so screens like AdminDevicesPage remain
  // renderable in isolation.
  const language =
    (i18n && (i18n.language as SupportedLocale | undefined)) ?? "pt-PT";

  return toIntlLocale(language as SupportedLocale);
}
