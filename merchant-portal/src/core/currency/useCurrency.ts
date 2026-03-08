/**
 * P5-5: Currency Hook
 *
 * Hook para usar o serviço de moedas.
 * Sincroniza idioma por região: país + moeda → locale (pt-BR, pt-PT, es, en).
 */

import { useEffect, useState } from "react";
import { resolveLocale } from "../i18n/regionLocaleConfig";
import { getTabIsolated, setTabIsolated } from "../storage/TabIsolatedStorage";
import { currencyService, type CurrencyCode } from "./CurrencyService";

const CURRENCY_KEY = "chefiapp_currency";
const LOCALE_KEY = "chefiapp_locale";

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = getTabIsolated(CURRENCY_KEY);
    if (saved && saved in currencyService.getCurrency("EUR")) {
      return saved as CurrencyCode;
    }
    return "EUR";
  });

  useEffect(() => {
    currencyService.setDefaultCurrency(currency);
    setTabIsolated(CURRENCY_KEY, currency);
    // Sincronizar idioma por região (país + moeda)
    if (typeof window !== "undefined") {
      const country = getTabIsolated("chefiapp_country");
      const locale = resolveLocale(country, currency);
      const currentLocale = localStorage.getItem(LOCALE_KEY);
      if (currentLocale !== locale) {
        localStorage.setItem(LOCALE_KEY, locale);
        import("../../i18n").then((m) => m.default.changeLanguage(locale));
      }
    }
  }, [currency]);

  const formatAmount = (cents: number) => {
    return currencyService.formatAmount(cents, currency);
  };

  const convertAmount = (amountCents: number, toCurrency: CurrencyCode) => {
    return currencyService.convertAmount(amountCents, currency, toCurrency);
  };

  /** Current currency symbol (e.g. "€", "$", "R$"). */
  const symbol = currencyService.getCurrency(currency).symbol;

  return {
    currency,
    setCurrency,
    symbol,
    formatAmount,
    convertAmount,
    getCurrency: (code: CurrencyCode) => currencyService.getCurrency(code),
    supportedCurrencies: Object.values(currencyService.getCurrency("EUR")),
  };
}
