/**
 * Reports Domain Types
 *
 * Tipos finitos para o domínio de relatórios.
 * Sem dependências de React ou infraestrutura.
 */

/** Período de relatório */
export type ReportPeriod = "day" | "week" | "month" | "year" | "custom";

/** Tipo de relatório */
export type ReportType =
  | "sales"
  | "products"
  | "payments"
  | "orders"
  | "staff"
  | "inventory";

/** Agregação de vendas */
export interface SalesAggregation {
  period: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  tipTotal: number;
}

/** Agregação de produtos */
export interface ProductAggregation {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
}

/** Agregação de pagamentos */
export interface PaymentAggregation {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

/** Filtros de relatório */
export interface ReportFilters {
  startDate: string;
  endDate: string;
  period: ReportPeriod;
  restaurantId?: string;
  staffId?: string;
}

/** Dados de relatório de vendas */
export interface SalesReportData {
  aggregations: SalesAggregation[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: ProductAggregation[];
  paymentBreakdown: PaymentAggregation[];
}
