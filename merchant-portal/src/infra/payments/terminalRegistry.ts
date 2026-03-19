/**
 * Terminal Provider Registry
 *
 * Regista os providers de terminal (Stripe Terminal e SumUp Reader)
 * no registry central de pagamentos.
 *
 * Chamado no bootstrap da aplicação para disponibilizar
 * os métodos de pagamento presencial.
 */

import type { PaymentMethod, PaymentRegion } from "@domain/payment";
import type { PaymentProvider } from "./interface";
import { stripeTerminalProvider } from "./providers/stripeTerminal";
import { sumupReaderProvider } from "./providers/sumupReader";

/** Terminal providers list */
const TERMINAL_PROVIDERS: PaymentProvider[] = [
  stripeTerminalProvider,
  sumupReaderProvider,
];

/** Map of terminal method to provider */
const TERMINAL_PROVIDER_MAP = new Map<string, PaymentProvider>(
  TERMINAL_PROVIDERS.map((p) => [p.id, p]),
);

/**
 * Get all available terminal providers for a region.
 *
 * @param region - Payment region
 * @returns List of available terminal providers
 */
export function getAvailableTerminalProviders(
  region: PaymentRegion,
): PaymentProvider[] {
  return TERMINAL_PROVIDERS.filter(
    (provider) =>
      provider.isAvailable() && provider.supportedRegions.includes(region),
  );
}

/**
 * Get a terminal provider by method ID.
 *
 * @param method - Payment method identifier
 * @returns Provider or undefined
 */
export function getTerminalProvider(
  method: string,
): PaymentProvider | undefined {
  return TERMINAL_PROVIDER_MAP.get(method);
}

/**
 * Get all terminal method IDs available for a region.
 *
 * @param region - Payment region
 * @returns List of method IDs
 */
export function getAvailableTerminalMethods(
  region: PaymentRegion,
): string[] {
  return getAvailableTerminalProviders(region).map((p) => p.id);
}

/**
 * Register terminal providers.
 *
 * Exports the providers so they can be added to the main registry
 * or used independently by the terminal settings UI.
 */
export function registerTerminalProviders(): {
  stripeTerminal: typeof stripeTerminalProvider;
  sumupReader: typeof sumupReaderProvider;
} {
  return {
    stripeTerminal: stripeTerminalProvider,
    sumupReader: sumupReaderProvider,
  };
}
