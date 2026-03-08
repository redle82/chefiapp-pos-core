/**
 * Sales Aggregation Functions
 *
 * Funções puras para agregação de dados de vendas.
 * Sem dependências de React ou infraestrutura.
 */

import type {
  PaymentAggregation,
  ProductAggregation,
  ReportPeriod,
  SalesAggregation,
} from "./types";

/**
 * Formata uma data para o período especificado.
 *
 * @param date - Data a formatar
 * @param period - Período de agregação
 * @returns String formatada para o período
 */
export function formatPeriod(date: Date, period: ReportPeriod): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (period) {
    case "day":
      return `${year}-${month}-${day}`;
    case "week": {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const ws = weekStart;
      return `${ws.getFullYear()}-W${String(Math.ceil((ws.getDate() + 1) / 7)).padStart(2, "0")}`;
    }
    case "month":
      return `${year}-${month}`;
    case "year":
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Agrupa vendas por período.
 *
 * @param sales - Lista de vendas com data e valor
 * @param period - Período de agregação
 * @returns Lista de agregações por período
 */
export function aggregateSalesByPeriod(
  sales: Array<{ date: string; amount: number; tip?: number }>,
  period: ReportPeriod,
): SalesAggregation[] {
  const groups = new Map<
    string,
    { revenue: number; count: number; tips: number }
  >();

  for (const sale of sales) {
    const date = new Date(sale.date);
    const key = formatPeriod(date, period);

    const existing = groups.get(key) || { revenue: 0, count: 0, tips: 0 };
    groups.set(key, {
      revenue: existing.revenue + sale.amount,
      count: existing.count + 1,
      tips: existing.tips + (sale.tip || 0),
    });
  }

  return Array.from(groups.entries())
    .map(([periodKey, data]) => ({
      period: periodKey,
      totalRevenue: data.revenue,
      orderCount: data.count,
      averageOrderValue:
        data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      tipTotal: data.tips,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Agrupa vendas por produto.
 *
 * @param items - Lista de itens vendidos
 * @returns Lista de agregações por produto
 */
export function aggregateSalesByProduct(
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>,
): ProductAggregation[] {
  const groups = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const item of items) {
    const existing = groups.get(item.productId) || {
      name: item.productName,
      quantity: 0,
      revenue: 0,
    };
    groups.set(item.productId, {
      name: item.productName,
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.price * item.quantity,
    });
  }

  return Array.from(groups.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: data.revenue,
      averagePrice:
        data.quantity > 0 ? Math.round(data.revenue / data.quantity) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Agrupa pagamentos por método.
 *
 * @param payments - Lista de pagamentos
 * @returns Lista de agregações por método
 */
export function aggregatePaymentsByMethod(
  payments: Array<{ method: string; amount: number }>,
): PaymentAggregation[] {
  const groups = new Map<string, { count: number; total: number }>();
  let grandTotal = 0;

  for (const payment of payments) {
    const existing = groups.get(payment.method) || { count: 0, total: 0 };
    groups.set(payment.method, {
      count: existing.count + 1,
      total: existing.total + payment.amount,
    });
    grandTotal += payment.amount;
  }

  return Array.from(groups.entries())
    .map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calcula totais gerais de vendas.
 *
 * @param aggregations - Lista de agregações
 * @returns Objeto com totais
 */
export function calculateSalesTotals(
  aggregations: SalesAggregation[],
): { totalRevenue: number; totalOrders: number; averageOrderValue: number } {
  const totalRevenue = aggregations.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalOrders = aggregations.reduce((sum, a) => sum + a.orderCount, 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return { totalRevenue, totalOrders, averageOrderValue };
}
