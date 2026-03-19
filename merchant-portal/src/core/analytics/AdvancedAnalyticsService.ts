/**
 * AdvancedAnalyticsService — Advanced business intelligence for ChefIApp POS.
 *
 * Provides menu performance, revenue heatmaps, payment breakdowns,
 * table turnover, cancellation rates, and more.
 *
 * All functions read from gm_orders + gm_order_items via dockerCoreClient.
 */

import { dockerCoreClient } from "../../infra/docker-core/connection";
import type { CoreOrder, CoreOrderItem } from "../../infra/docker-core/types";
import { Logger } from "../logger";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface AnalyticsPeriod {
  from: Date;
  to: Date;
}

export interface MenuProductPerformance {
  productId: string;
  name: string;
  category: string;
  salesCount: number;
  revenueCents: number;
  costCents: number;
  marginPercent: number;
  /** 1 = up, -1 = down, 0 = flat */
  trend: 1 | -1 | 0;
  /** Boston Matrix quadrant */
  quadrant: "star" | "cashCow" | "questionMark" | "dog";
}

export interface MenuPerformanceResult {
  products: MenuProductPerformance[];
  categories: string[];
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  hour: number; // 0-23
  revenueCents: number;
  ordersCount: number;
}

export interface RevenueHeatmapResult {
  cells: HeatmapCell[];
  maxRevenueCents: number;
  peakHours: string[];
}

export interface AvgTicketPoint {
  date: string; // YYYY-MM-DD
  avgTicketCents: number;
  ordersCount: number;
}

export interface PeakHourSlot {
  hour: number;
  ordersCount: number;
  revenueCents: number;
  suggestion: string;
}

export interface CancellationRateResult {
  totalOrders: number;
  cancelledOrders: number;
  cancellationRate: number; // 0-1
}

export interface PaymentMethodEntry {
  method: string;
  count: number;
  totalCents: number;
  percentage: number; // 0-100
}

export interface TableTurnoverResult {
  avgMinutesPerTable: number;
  turnsPerDay: number;
  totalTableOrders: number;
}

export interface LaborCostRatioResult {
  laborCostCents: number;
  revenueCents: number;
  ratio: number; // 0-1
}

export interface DashboardKPIs {
  revenueTodayCents: number;
  revenueWeekCents: number;
  revenueMonthCents: number;
  ordersTodayCount: number;
  avgTicketTodayCents: number;
  customerCountToday: number;
  revenueTrend7d: { date: string; revenueCents: number }[];
  paymentBreakdown: PaymentMethodEntry[];
  topProducts: { name: string; soldCount: number; revenueCents: number }[];
  busiestHoursToday: PeakHourSlot[];
  weekOverWeekChange: number; // percentage change, e.g. 0.12 = +12%
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfMonth(d: Date): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (86400 * 1000));
}

function getDayOfWeek(d: Date): number {
  // 0=Mon, 6=Sun
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function isPaidOrder(o: CoreOrder): boolean {
  return String(o.status).toUpperCase() === "PAID";
}

function isCancelledOrder(o: CoreOrder): boolean {
  return String(o.status).toUpperCase() === "CANCELLED";
}

function getOrderDate(o: CoreOrder): Date {
  return new Date(o.updated_at ?? o.created_at);
}

async function fetchOrders(
  restaurantId: string,
  from: Date,
  to: Date,
  limit = 5000,
): Promise<CoreOrder[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    Logger.warn("[AdvancedAnalytics] fetchOrders failed", { error: error.message });
    return [];
  }
  return (data ?? []) as CoreOrder[];
}

async function fetchOrderItems(
  orderIds: string[],
): Promise<(CoreOrderItem & { product_category?: string })[]> {
  if (orderIds.length === 0) return [];

  // Batch in groups of 200 to avoid URL-length issues
  const batchSize = 200;
  const results: (CoreOrderItem & { product_category?: string })[] = [];

  for (let i = 0; i < orderIds.length; i += batchSize) {
    const batch = orderIds.slice(i, i + batchSize);
    const { data, error } = await dockerCoreClient
      .from("gm_order_items")
      .select("*, gm_products(category, cost_cents)")
      .in("order_id", batch);
    if (error) {
      Logger.warn("[AdvancedAnalytics] fetchOrderItems batch failed", { error: error.message });
      continue;
    }
    const rows = (data ?? []) as (CoreOrderItem & {
      gm_products?: { category?: string; cost_cents?: number } | null;
    })[];
    for (const row of rows) {
      const { gm_products: prod, ...item } = row;
      results.push({
        ...item,
        product_category: prod?.category ?? "Uncategorized",
      } as CoreOrderItem & { product_category?: string });
    }
  }
  return results;
}

function extractPaymentMethod(order: CoreOrder): string {
  const meta = order.metadata as Record<string, unknown> | null;
  if (meta?.payment_method && typeof meta.payment_method === "string") {
    return meta.payment_method;
  }
  return "card";
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export async function getMenuPerformance(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<MenuPerformanceResult> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const paidOrders = orders.filter(isPaidOrder);
  const paidOrderIds = paidOrders.map((o) => o.id);
  const items = await fetchOrderItems(paidOrderIds);

  // Also fetch items from a previous period of the same length for trend
  const periodDays = daysBetween(period.from, period.to) || 1;
  const prevFrom = new Date(period.from.getTime() - periodDays * 86400 * 1000);
  const prevTo = new Date(period.from.getTime());
  const prevOrders = await fetchOrders(restaurantId, prevFrom, prevTo);
  const prevPaidIds = prevOrders.filter(isPaidOrder).map((o) => o.id);
  const prevItems = await fetchOrderItems(prevPaidIds);

  // Aggregate by product
  const productMap = new Map<string, {
    name: string;
    category: string;
    salesCount: number;
    revenueCents: number;
    costCents: number;
  }>();

  const prevProductSales = new Map<string, number>();

  for (const item of items) {
    const key = item.product_id ?? item.name_snapshot;
    const existing = productMap.get(key) ?? {
      name: item.name_snapshot,
      category: (item as CoreOrderItem & { product_category?: string }).product_category ?? "Uncategorized",
      salesCount: 0,
      revenueCents: 0,
      costCents: 0,
    };
    existing.salesCount += item.quantity;
    existing.revenueCents += item.subtotal_cents;
    // Estimate cost as 35% of revenue if not available
    const itemCost = (item as unknown as { gm_products?: { cost_cents?: number } })?.gm_products?.cost_cents;
    existing.costCents += itemCost ? itemCost * item.quantity : Math.round(item.subtotal_cents * 0.35);
    productMap.set(key, existing);
  }

  for (const item of prevItems) {
    const key = item.product_id ?? item.name_snapshot;
    prevProductSales.set(key, (prevProductSales.get(key) ?? 0) + item.quantity);
  }

  // Calculate medians for Boston Matrix classification
  const allSalesCounts = Array.from(productMap.values()).map((p) => p.salesCount);
  const allMargins = Array.from(productMap.values()).map((p) => {
    const revenue = p.revenueCents || 1;
    return ((revenue - p.costCents) / revenue) * 100;
  });
  allSalesCounts.sort((a, b) => a - b);
  allMargins.sort((a, b) => a - b);
  const medianSales = allSalesCounts[Math.floor(allSalesCounts.length / 2)] ?? 0;
  const medianMargin = allMargins[Math.floor(allMargins.length / 2)] ?? 0;

  const categories = new Set<string>();
  const products: MenuProductPerformance[] = [];

  for (const [productId, data] of productMap) {
    categories.add(data.category);
    const marginPercent = data.revenueCents > 0
      ? ((data.revenueCents - data.costCents) / data.revenueCents) * 100
      : 0;

    const prevSales = prevProductSales.get(productId) ?? 0;
    const trend: 1 | -1 | 0 = data.salesCount > prevSales ? 1 : data.salesCount < prevSales ? -1 : 0;

    const highSales = data.salesCount >= medianSales;
    const highMargin = marginPercent >= medianMargin;
    let quadrant: "star" | "cashCow" | "questionMark" | "dog";
    if (highSales && highMargin) quadrant = "star";
    else if (highSales && !highMargin) quadrant = "cashCow";
    else if (!highSales && highMargin) quadrant = "questionMark";
    else quadrant = "dog";

    products.push({
      productId,
      name: data.name,
      category: data.category,
      salesCount: data.salesCount,
      revenueCents: data.revenueCents,
      costCents: data.costCents,
      marginPercent: Math.round(marginPercent * 10) / 10,
      trend,
      quadrant,
    });
  }

  // Sort by revenue descending by default
  products.sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    products,
    categories: Array.from(categories).sort(),
  };
}

export async function getRevenueByHour(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<RevenueHeatmapResult> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const paidOrders = orders.filter(isPaidOrder);

  // Build 7x24 grid
  const cells: HeatmapCell[] = [];
  const grid = new Map<string, HeatmapCell>();

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const cell: HeatmapCell = { dayOfWeek: d, hour: h, revenueCents: 0, ordersCount: 0 };
      grid.set(`${d}-${h}`, cell);
      cells.push(cell);
    }
  }

  for (const order of paidOrders) {
    const date = getOrderDate(order);
    const dow = getDayOfWeek(date);
    const hour = date.getHours();
    const key = `${dow}-${hour}`;
    const cell = grid.get(key);
    if (cell) {
      cell.revenueCents += order.total_cents ?? 0;
      cell.ordersCount += 1;
    }
  }

  const maxRevenueCents = Math.max(...cells.map((c) => c.revenueCents), 0);

  // Identify peak hours (top 5 by revenue)
  const sortedCells = [...cells].sort((a, b) => b.revenueCents - a.revenueCents);
  const peakHours = sortedCells
    .slice(0, 5)
    .filter((c) => c.revenueCents > 0)
    .map((c) => `${String(c.hour).padStart(2, "0")}:00`);

  return { cells, maxRevenueCents, peakHours };
}

export async function getAverageTicketTrend(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<AvgTicketPoint[]> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const paidOrders = orders.filter(isPaidOrder);

  const byDay = new Map<string, { totalCents: number; count: number }>();

  for (const order of paidOrders) {
    const date = getOrderDate(order);
    const key = date.toISOString().slice(0, 10);
    const agg = byDay.get(key) ?? { totalCents: 0, count: 0 };
    agg.totalCents += order.total_cents ?? 0;
    agg.count += 1;
    byDay.set(key, agg);
  }

  return Array.from(byDay.entries())
    .map(([date, agg]) => ({
      date,
      avgTicketCents: agg.count > 0 ? Math.round(agg.totalCents / agg.count) : 0,
      ordersCount: agg.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPeakHoursAnalysis(
  restaurantId: string,
): Promise<PeakHourSlot[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400 * 1000);
  const orders = await fetchOrders(restaurantId, thirtyDaysAgo, now);
  const paidOrders = orders.filter(isPaidOrder);

  const hourBuckets = new Map<number, { count: number; revenueCents: number }>();
  for (let h = 0; h < 24; h++) {
    hourBuckets.set(h, { count: 0, revenueCents: 0 });
  }

  for (const order of paidOrders) {
    const date = getOrderDate(order);
    const hour = date.getHours();
    const bucket = hourBuckets.get(hour)!;
    bucket.count += 1;
    bucket.revenueCents += order.total_cents ?? 0;
  }

  const totalDays = daysBetween(thirtyDaysAgo, now) || 1;
  const result: PeakHourSlot[] = [];

  for (const [hour, bucket] of hourBuckets) {
    const avgOrdersPerDay = bucket.count / totalDays;
    let suggestion = "";
    if (avgOrdersPerDay > 8) suggestion = "peak";
    else if (avgOrdersPerDay > 4) suggestion = "busy";
    else if (avgOrdersPerDay > 1) suggestion = "moderate";
    else suggestion = "quiet";

    result.push({
      hour,
      ordersCount: bucket.count,
      revenueCents: bucket.revenueCents,
      suggestion,
    });
  }

  return result.sort((a, b) => b.ordersCount - a.ordersCount);
}

export async function getCancellationRate(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<CancellationRateResult> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const totalOrders = orders.length;
  const cancelledOrders = orders.filter(isCancelledOrder).length;
  const cancellationRate = totalOrders > 0 ? cancelledOrders / totalOrders : 0;

  return { totalOrders, cancelledOrders, cancellationRate };
}

export async function getPaymentMethodBreakdown(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<PaymentMethodEntry[]> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const paidOrders = orders.filter(isPaidOrder);

  const byMethod = new Map<string, { count: number; totalCents: number }>();

  for (const order of paidOrders) {
    const method = extractPaymentMethod(order);
    const agg = byMethod.get(method) ?? { count: 0, totalCents: 0 };
    agg.count += 1;
    agg.totalCents += order.total_cents ?? 0;
    byMethod.set(method, agg);
  }

  const total = paidOrders.length || 1;
  return Array.from(byMethod.entries())
    .map(([method, agg]) => ({
      method,
      count: agg.count,
      totalCents: agg.totalCents,
      percentage: Math.round((agg.count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export async function getTableTurnoverRate(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<TableTurnoverResult> {
  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const tableOrders = orders.filter((o) => isPaidOrder(o) && o.table_id);

  let totalMinutes = 0;
  let ordersWithDuration = 0;

  for (const order of tableOrders) {
    const created = new Date(order.created_at).getTime();
    const closed = order.updated_at ? new Date(order.updated_at).getTime() : 0;
    if (closed > created) {
      totalMinutes += (closed - created) / 60000;
      ordersWithDuration += 1;
    }
  }

  const avgMinutesPerTable = ordersWithDuration > 0 ? Math.round(totalMinutes / ordersWithDuration) : 0;
  const periodDays = daysBetween(period.from, period.to) || 1;
  const turnsPerDay = Math.round((tableOrders.length / periodDays) * 10) / 10;

  return {
    avgMinutesPerTable,
    turnsPerDay,
    totalTableOrders: tableOrders.length,
  };
}

export async function getLaborCostRatio(
  restaurantId: string,
  period: AnalyticsPeriod,
): Promise<LaborCostRatioResult> {
  // Labor cost from shift_logs
  const { data: shifts } = await dockerCoreClient
    .from("shift_logs")
    .select("id, started_at, ended_at")
    .eq("restaurant_id", restaurantId)
    .gte("started_at", period.from.toISOString())
    .lte("started_at", period.to.toISOString());

  let totalShiftHours = 0;
  for (const shift of (shifts ?? []) as { started_at?: string; ended_at?: string }[]) {
    if (shift.started_at && shift.ended_at) {
      const hours = (new Date(shift.ended_at).getTime() - new Date(shift.started_at).getTime()) / 3600000;
      totalShiftHours += Math.max(0, hours);
    }
  }

  // Estimate labor cost at 12 EUR/hour as default
  const laborCostCents = Math.round(totalShiftHours * 1200);

  const orders = await fetchOrders(restaurantId, period.from, period.to);
  const revenueCents = orders
    .filter(isPaidOrder)
    .reduce((s, o) => s + (o.total_cents ?? 0), 0);

  const ratio = revenueCents > 0 ? laborCostCents / revenueCents : 0;

  return { laborCostCents, revenueCents, ratio };
}

export async function getCustomerRetention(
  restaurantId: string,
): Promise<{ newCustomers: number; returningCustomers: number; retentionRate: number }> {
  // Approximate via customer_name or table patterns across orders
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400 * 1000);

  const currentPeriodOrders = await fetchOrders(restaurantId, thirtyDaysAgo, now);
  const previousPeriodOrders = await fetchOrders(restaurantId, sixtyDaysAgo, thirtyDaysAgo);

  const currentPaid = currentPeriodOrders.filter(isPaidOrder);
  const previousPaid = previousPeriodOrders.filter(isPaidOrder);

  // Unique "customer" identifiers via table_id + source combination
  const currentCustomers = new Set(currentPaid.map((o) => o.table_id ?? o.id));
  const previousCustomers = new Set(previousPaid.map((o) => o.table_id ?? o.id));

  let returningCustomers = 0;
  for (const c of currentCustomers) {
    if (previousCustomers.has(c)) returningCustomers += 1;
  }
  const newCustomers = currentCustomers.size - returningCustomers;
  const retentionRate = previousCustomers.size > 0
    ? returningCustomers / previousCustomers.size
    : 0;

  return { newCustomers, returningCustomers, retentionRate };
}

export async function getDashboardKPIs(
  restaurantId: string,
): Promise<DashboardKPIs> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 86400 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400 * 1000);

  // Fetch all orders from start of month (covers today, week, month)
  const allOrders = await fetchOrders(restaurantId, monthStart, now);
  const prevWeekOrders = await fetchOrders(restaurantId, prevWeekStart, weekStart);

  const todayOrders = allOrders.filter((o) => new Date(o.created_at) >= todayStart);
  const weekOrders = allOrders.filter((o) => new Date(o.created_at) >= weekStart);

  const todayPaid = todayOrders.filter(isPaidOrder);
  const weekPaid = weekOrders.filter(isPaidOrder);
  const monthPaid = allOrders.filter(isPaidOrder);
  const prevWeekPaid = prevWeekOrders.filter(isPaidOrder);

  const revenueTodayCents = todayPaid.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const revenueWeekCents = weekPaid.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const revenueMonthCents = monthPaid.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const ordersTodayCount = todayPaid.length;
  const avgTicketTodayCents = ordersTodayCount > 0
    ? Math.round(revenueTodayCents / ordersTodayCount)
    : 0;
  const customerCountToday = new Set(todayPaid.map((o) => o.table_id ?? o.id)).size;

  // Revenue trend (7 days)
  const trendMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400 * 1000);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  const last7dOrders = allOrders.filter((o) => new Date(o.created_at) >= sevenDaysAgo);
  for (const order of last7dOrders.filter(isPaidOrder)) {
    const key = getOrderDate(order).toISOString().slice(0, 10);
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + (order.total_cents ?? 0));
    }
  }
  const revenueTrend7d = Array.from(trendMap.entries()).map(([date, revenueCents]) => ({
    date,
    revenueCents,
  }));

  // Payment breakdown (today)
  const paymentMap = new Map<string, { count: number; totalCents: number }>();
  for (const order of todayPaid) {
    const method = extractPaymentMethod(order);
    const agg = paymentMap.get(method) ?? { count: 0, totalCents: 0 };
    agg.count += 1;
    agg.totalCents += order.total_cents ?? 0;
    paymentMap.set(method, agg);
  }
  const totalPayments = todayPaid.length || 1;
  const paymentBreakdown: PaymentMethodEntry[] = Array.from(paymentMap.entries())
    .map(([method, agg]) => ({
      method,
      count: agg.count,
      totalCents: agg.totalCents,
      percentage: Math.round((agg.count / totalPayments) * 1000) / 10,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  // Top products (today)
  const todayPaidIds = todayPaid.map((o) => o.id);
  const todayItems = await fetchOrderItems(todayPaidIds);
  const productSales = new Map<string, { name: string; soldCount: number; revenueCents: number }>();
  for (const item of todayItems) {
    const key = item.product_id ?? item.name_snapshot;
    const agg = productSales.get(key) ?? { name: item.name_snapshot, soldCount: 0, revenueCents: 0 };
    agg.soldCount += item.quantity;
    agg.revenueCents += item.subtotal_cents;
    productSales.set(key, agg);
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // Busiest hours today
  const hourBuckets = new Map<number, PeakHourSlot>();
  for (const order of todayPaid) {
    const h = getOrderDate(order).getHours();
    const slot = hourBuckets.get(h) ?? { hour: h, ordersCount: 0, revenueCents: 0, suggestion: "" };
    slot.ordersCount += 1;
    slot.revenueCents += order.total_cents ?? 0;
    hourBuckets.set(h, slot);
  }
  const busiestHoursToday = Array.from(hourBuckets.values())
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 5);

  // Week over week change
  const prevWeekRevenue = prevWeekPaid.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const weekOverWeekChange = prevWeekRevenue > 0
    ? (revenueWeekCents - prevWeekRevenue) / prevWeekRevenue
    : 0;

  return {
    revenueTodayCents,
    revenueWeekCents,
    revenueMonthCents,
    ordersTodayCount,
    avgTicketTodayCents,
    customerCountToday,
    revenueTrend7d,
    paymentBreakdown,
    topProducts,
    busiestHoursToday,
    weekOverWeekChange,
  };
}
