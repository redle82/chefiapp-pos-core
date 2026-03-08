/**
 * Payment Calculation Functions
 *
 * Funções puras para cálculos de pagamento.
 * Sem dependências de React ou infraestrutura.
 */

/**
 * Calcula o valor da gorjeta em centavos.
 *
 * @param orderTotal - Total do pedido em centavos
 * @param tipPercent - Percentual de gorjeta (null se usar valor customizado)
 * @param customTip - Valor customizado de gorjeta em string (ex: "5.50")
 * @returns Valor da gorjeta em centavos
 */
export function calculateTip(
  orderTotal: number,
  tipPercent: number | null,
  customTip: string,
): number {
  if (tipPercent !== null) {
    return Math.round(orderTotal * (tipPercent / 100));
  }
  const value = parseFloat(customTip || "0");
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

/**
 * Calcula o total final incluindo gorjeta.
 *
 * @param orderTotal - Total do pedido em centavos
 * @param tipCents - Valor da gorjeta em centavos
 * @returns Total final em centavos
 */
export function calculateGrandTotal(
  orderTotal: number,
  tipCents: number,
): number {
  return orderTotal + tipCents;
}

/**
 * Converte valor em string para centavos.
 *
 * @param value - Valor em string (ex: "10.50")
 * @returns Valor em centavos
 */
export function parseToCents(value: string): number {
  const parsed = parseFloat(value || "0");
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

/**
 * Calcula o troco para pagamento em dinheiro.
 *
 * @param cashCents - Valor entregue em centavos
 * @param orderTotal - Total do pedido em centavos
 * @returns Troco em centavos (pode ser negativo se insuficiente)
 */
export function calculateChange(
  cashCents: number,
  orderTotal: number,
): number {
  return cashCents - orderTotal;
}

/**
 * Verifica se o valor em dinheiro é suficiente para o pedido.
 *
 * @param cashCents - Valor entregue em centavos
 * @param orderTotal - Total do pedido em centavos
 * @returns true se o valor é suficiente
 */
export function isCashSufficient(
  cashCents: number,
  orderTotal: number,
): boolean {
  return cashCents >= orderTotal;
}

/**
 * Formata centavos para valor monetário.
 *
 * @param cents - Valor em centavos
 * @returns Valor formatado (ex: 1050 -> "10.50")
 */
export function formatCentsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Valores rápidos de dinheiro para seleção.
 */
export const QUICK_CASH_VALUES = [500, 1000, 2000, 5000] as const;

/**
 * Percentuais de gorjeta padrão.
 */
export const TIP_PERCENTAGES = [0, 5, 10, 15, 20] as const;
