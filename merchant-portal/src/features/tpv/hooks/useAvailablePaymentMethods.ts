/**
 * Hook: useAvailablePaymentMethods
 *
 * Retorna os métodos de pagamento disponíveis para a região atual.
 */

import { useMemo } from "react";
import type { PaymentMethod, PaymentRegion } from "@domain/payment";
import { getAvailableMethods, getRegionFromCurrency } from "../../../infra/payments";

/** Opção de método de pagamento para UI */
export interface PaymentMethodOption {
  id: PaymentMethod;
  labelKey: string;
  descKey: string;
  icon: string;
}

/** Configuração de métodos com i18n keys */
const METHOD_CONFIG: Record<PaymentMethod, Omit<PaymentMethodOption, "id">> = {
  cash: {
    labelKey: "payment.method.cashLabel",
    descKey: "payment.method.cashDesc",
    icon: "💶",
  },
  card: {
    labelKey: "payment.method.cardLabel",
    descKey: "payment.method.cardDesc",
    icon: "💳",
  },
  mbway: {
    labelKey: "payment.method.mbwayLabel",
    descKey: "payment.method.mbwayDesc",
    icon: "📱",
  },
  pix: {
    labelKey: "payment.method.pixLabel",
    descKey: "payment.method.pixDesc",
    icon: "⚡",
  },
  sumup_eur: {
    labelKey: "payment.method.sumup_eurLabel",
    descKey: "payment.method.sumup_eurDesc",
    icon: "🇪🇺",
  },
};

/**
 * Hook para obter métodos de pagamento disponíveis.
 *
 * @param currency - Moeda atual (BRL, EUR, USD)
 * @returns Lista de opções de métodos de pagamento
 */
export function useAvailablePaymentMethods(
  currency: string,
): PaymentMethodOption[] {
  return useMemo(() => {
    const region = getRegionFromCurrency(currency);
    const methods = getAvailableMethods(region);

    return methods.map((method) => ({
      id: method,
      ...METHOD_CONFIG[method],
    }));
  }, [currency]);
}

/**
 * Hook para obter métodos de pagamento por região.
 *
 * @param region - Região de pagamento
 * @returns Lista de opções de métodos de pagamento
 */
export function usePaymentMethodsByRegion(
  region: PaymentRegion,
): PaymentMethodOption[] {
  return useMemo(() => {
    const methods = getAvailableMethods(region);

    return methods.map((method) => ({
      id: method,
      ...METHOD_CONFIG[method],
    }));
  }, [region]);
}
