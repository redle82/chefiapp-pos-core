/**
 * paymentMethodsConfigStorage — FASE 1 Passo 3: métodos de pagamento por restaurante
 *
 * Fallback em localStorage até haver config em BD.
 * Chave: chefiapp_payment_methods_${restaurantId}
 * Default: dinheiro e cartão ativos.
 */
// @ts-nocheck


export interface PaymentMethodsEnabled {
  cash: boolean;
  card: boolean;
}

const DEFAULT: PaymentMethodsEnabled = { cash: true, card: true };
const PREFIX = "chefiapp_payment_methods_";

function key(restaurantId: string): string {
  return `${PREFIX}${restaurantId}`;
}

export function getPaymentMethodsEnabled(
  restaurantId: string | null,
): PaymentMethodsEnabled {
  if (!restaurantId || typeof localStorage === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<PaymentMethodsEnabled>;
    return {
      cash: parsed.cash ?? DEFAULT.cash,
      card: parsed.card ?? DEFAULT.card,
    };
  } catch {
    return DEFAULT;
  }
}

export function setPaymentMethodsEnabled(
  restaurantId: string | null,
  config: Partial<PaymentMethodsEnabled>,
): void {
  if (!restaurantId || typeof localStorage === "undefined") return;
  try {
    const current = getPaymentMethodsEnabled(restaurantId);
    const next: PaymentMethodsEnabled = {
      cash: config.cash ?? current.cash,
      card: config.card ?? current.card,
    };
    localStorage.setItem(key(restaurantId), JSON.stringify(next));
  } catch {
    // ignore
  }
}
