/**
 * P5-5: Currency Service
 *
 * Serviço para gerenciar múltiplas moedas e conversões
 */

import { Logger } from "../logger";

export type CurrencyCode =
  | "EUR"
  | "USD"
  | "GBP"
  | "BRL"
  | "MXN"
  | "CAD"
  | "AUD";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, Currency> = {
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "en" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  MXN: { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX" },
  CAD: { code: "CAD", symbol: "$", name: "Canadian Dollar", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "$", name: "Australian Dollar", locale: "en-AU" },
};

class CurrencyService {
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private defaultCurrency: CurrencyCode = "EUR";

  /**
   * Get currency configuration
   */
  getCurrency(code: CurrencyCode): Currency {
    return (
      SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES[this.defaultCurrency]
    );
  }

  /**
   * Format amount in currency.
   * @param locale – Optional BCP 47 locale override (e.g. the user's
   *   current i18n locale). Falls back to the currency's default locale.
   */
  formatAmount(
    cents: number,
    currency: CurrencyCode = this.defaultCurrency,
    locale?: string,
  ): string {
    const currencyConfig = this.getCurrency(currency);
    const amount = cents / 100;
    return new Intl.NumberFormat(locale ?? currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.code,
    }).format(amount);
  }

  /**
   * Convert amount from one currency to another
   */
  convertAmount(
    amountCents: number,
    from: CurrencyCode,
    to: CurrencyCode,
  ): number {
    if (from === to) return amountCents;

    const rate = this.getExchangeRate(from, to);
    return Math.round(amountCents * rate);
  }

  /**
   * Get exchange rate (with caching)
   */
  getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return 1;

    const key = `${from}-${to}`;
    const cached = this.exchangeRates.get(key);

    // Use cached rate if less than 1 hour old
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.rate;
    }

    // Default rates (should be fetched from API in production)
    const defaultRates: Record<string, number> = {
      "EUR-USD": 1.1,
      "EUR-GBP": 0.85,
      "EUR-BRL": 5.5,
      "EUR-MXN": 20.0,
      "EUR-CAD": 1.5,
      "EUR-AUD": 1.65,
      "USD-EUR": 0.91,
      "USD-GBP": 0.77,
      "USD-BRL": 5.0,
      "GBP-EUR": 1.18,
      "GBP-USD": 1.3,
      "BRL-EUR": 0.18,
      "BRL-USD": 0.2,
      "MXN-EUR": 0.05,
      "MXN-USD": 0.055,
      "CAD-EUR": 0.67,
      "CAD-USD": 0.73,
      "AUD-EUR": 0.61,
      "AUD-USD": 0.67,
    };

    const rate = defaultRates[key] || 1;

    // Cache the rate
    this.exchangeRates.set(key, {
      from,
      to,
      rate,
      timestamp: Date.now(),
    });

    return rate;
  }

  /**
   * Fetch exchange rates from API (placeholder for future implementation)
   */
  async fetchExchangeRates(baseCurrency: CurrencyCode = "EUR"): Promise<void> {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result === "success" && data.rates) {
        const currencies: CurrencyCode[] = ["EUR", "USD", "GBP", "BRL"];
        for (const to of currencies) {
          if (to !== baseCurrency && data.rates[to]) {
            this.exchangeRates.set(`${baseCurrency}-${to}`, {
              from: baseCurrency,
              to,
              rate: data.rates[to],
              timestamp: Date.now(),
            });
          }
        }
        Logger.debug(`[CurrencyService] Updated rates from API for ${baseCurrency}`);
      }
    } catch {
      Logger.debug(`[CurrencyService] API unavailable, using default rates for ${baseCurrency}`);
    }
  }

  /**
   * Set default currency
   */
  setDefaultCurrency(currency: CurrencyCode): void {
    this.defaultCurrency = currency;
  }

  /**
   * Get default currency
   */
  getDefaultCurrency(): CurrencyCode {
    return this.defaultCurrency;
  }
}

export const currencyService = new CurrencyService();

/**
 * Convenience: format cents using the current default currency.
 * Useful in non-React code where the useCurrency hook is unavailable.
 */
export function formatCents(cents: number): string {
  return currencyService.formatAmount(cents);
}

/**
 * Return the symbol for the current default currency (e.g. "€", "$", "R$").
 */
export function getCurrencySymbol(): string {
  return currencyService.getCurrency(currencyService.getDefaultCurrency())
    .symbol;
}
