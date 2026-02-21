// @ts-nocheck
import { useOperationalStore } from "../useOperationalStore";

/**
 * Hook fino para ler KPIs operacionais globais (receita, pedidos ativos, etc.).
 * Feito para ser usado em cabeçalhos / painéis sem causar re-render geral.
 */
export function useOperationalKpis() {
  return useOperationalStore((state) => state.kpis);
}

