/**
 * paymentMethodsConfigStorage — FASE 1 Passo 3: métodos de pagamento por restaurante
 *
 * Fallback em localStorage até haver config em BD.
 * Chave: chefiapp_payment_methods_${restaurantId}
 * Default: dinheiro e cartão ativos.
 */

export interface PaymentMethodsEnabled {
  cash: boolean;
  card: boolean;
}

// TDZ-safe: function declarations are hoisted, const is not.
function defaults(): PaymentMethodsEnabled {
  return { cash: true, card: true };
}

function key(restaurantId: string): string {
  return `chefiapp_payment_methods_${restaurantId}`;
}

export function getPaymentMethodsEnabled(
  restaurantId: string | null,
): PaymentMethodsEnabled {
  const def = defaults();
  if (!restaurantId || typeof localStorage === "undefined") return def;
  try {
    const raw = localStorage.getItem(key(restaurantId));
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<PaymentMethodsEnabled>;
    return {
      cash: parsed.cash ?? def.cash,
      card: parsed.card ?? def.card,
    };
  } catch {
    return def;
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
