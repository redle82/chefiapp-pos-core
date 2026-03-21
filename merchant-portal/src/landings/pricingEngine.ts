/**
 * Pricing Engine — Base EUR, conversion to USD, GBP, BRL.
 * Configurable rates (prepare for future API).
 */

import type { SupportedCurrency } from "./countries";

export const EXCHANGE_RATES_EUR: Record<SupportedCurrency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  BRL: 5.4,
};

export const BASE_PRICES_EUR = {
  starter: 29,
  pro: 59,
  enterprise: 99,
} as const;

export const ANNUAL_DISCOUNT = 0.2;

export function convertPrice(
  eurAmount: number,
  toCurrency: SupportedCurrency
): number {
  const rate = EXCHANGE_RATES_EUR[toCurrency] ?? 1;
  return Math.round(eurAmount * rate);
}

export function getMonthlyPrice(
  plan: keyof typeof BASE_PRICES_EUR,
  currency: SupportedCurrency,
  annual: boolean
): number {
  const eur = BASE_PRICES_EUR[plan];
  const converted = convertPrice(eur, currency);
  return annual ? Math.round(converted * (1 - ANNUAL_DISCOUNT)) : converted;
}

export function getAnnualSavings(
  plan: keyof typeof BASE_PRICES_EUR,
  currency: SupportedCurrency
): number {
  const monthly = getMonthlyPrice(plan, currency, false);
  const annualMonthly = getMonthlyPrice(plan, currency, true);
  return (monthly - annualMonthly) * 12;
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  BRL: "R$",
};
