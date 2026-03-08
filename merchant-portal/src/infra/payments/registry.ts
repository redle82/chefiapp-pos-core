/**
 * Payment Provider Registry
 *
 * Registro central de providers de pagamento.
 * Permite obter providers disponíveis por região/método.
 */

import type { PaymentMethod, PaymentRegion } from "@domain/payment";
import type { PaymentProvider } from "./interface";
import { manualProvider } from "./providers/manual";
import { mbwayProvider } from "./providers/mbway";
import { pixProvider } from "./providers/pix";
import { stripeProvider } from "./providers/stripe";
import { sumupProvider } from "./providers/sumup";

/** Todos os providers registrados */
const ALL_PROVIDERS: PaymentProvider[] = [
  manualProvider,
  stripeProvider,
  pixProvider,
  sumupProvider,
  mbwayProvider,
];

/** Mapa de método para provider */
const PROVIDER_MAP = new Map<PaymentMethod, PaymentProvider>(
  ALL_PROVIDERS.map((p) => [p.id, p]),
);

/**
 * Obtém todos os providers disponíveis para uma região.
 *
 * @param region - Região de pagamento
 * @returns Lista de providers disponíveis
 */
export function getAvailableProviders(
  region: PaymentRegion,
): PaymentProvider[] {
  return ALL_PROVIDERS.filter(
    (provider) =>
      provider.isAvailable() && provider.supportedRegions.includes(region),
  );
}

/**
 * Obtém os métodos de pagamento disponíveis para uma região.
 *
 * @param region - Região de pagamento
 * @returns Lista de métodos disponíveis
 */
export function getAvailableMethods(region: PaymentRegion): PaymentMethod[] {
  return getAvailableProviders(region).map((p) => p.id);
}

/**
 * Obtém um provider específico por método.
 *
 * @param method - Método de pagamento
 * @returns Provider ou undefined se não encontrado
 */
export function getProvider(
  method: PaymentMethod,
): PaymentProvider | undefined {
  return PROVIDER_MAP.get(method);
}

/**
 * Verifica se um método está disponível para uma região.
 *
 * @param method - Método de pagamento
 * @param region - Região de pagamento
 * @returns true se disponível
 */
export function isMethodAvailable(
  method: PaymentMethod,
  region: PaymentRegion,
): boolean {
  const provider = getProvider(method);
  return (
    !!provider &&
    provider.isAvailable() &&
    provider.supportedRegions.includes(region)
  );
}

/**
 * Determina a região de pagamento baseado na moeda.
 *
 * @param currency - Moeda (BRL, EUR, USD, GBP, MXN, CAD, AUD)
 * @returns Região de pagamento
 */
export function getRegionFromCurrency(currency: string): PaymentRegion {
  const currencyMap: Record<string, PaymentRegion> = {
    BRL: "BR",
    EUR: "EU",
    USD: "US",
    GBP: "GB",
    MXN: "MX",
    CAD: "CA",
    AUD: "AU",
  };
  return currencyMap[currency] || "DEFAULT";
}
