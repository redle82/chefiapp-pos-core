/**
 * analytics-service.ts — Advanced Analytics Service
 * 
 * Real-time analytics and reporting, inspired by Last.app Reportes y Analítica.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface AnalyticsSnapshot {
  restaurant_id: string;
  snapshot_date: string;
  total_sales: number;
  total_orders: number;
  average_ticket: number;
  top_products: Array<{
    product_id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  peak_hours: Record<string, number>;
  payment_methods: Record<string, number>;
  table_turnover?: number;
}

/**
 * Generate daily analytics snapshot
 */
export async function generateDailySnapshot(
  restaurantId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<AnalyticsSnapshot> {
  // Get orders for date
  const orders = await pool.query(
    `SELECT id, total, created_at, payment_method
     FROM gm_orders
     WHERE restaurant_id = $1
       AND DATE(created_at) = $2
       AND status NOT IN ('CANCELLED')`,
    [restaurantId, date]
  );

  const totalSales = orders.rows.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
  const totalOrders = orders.rows.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Top products
  const topProducts = await pool.query(
    `SELECT 
       oi.product_id,
       COUNT(*) as quantity,
       SUM(oi.subtotal) as revenue
     FROM gm_order_items oi
     JOIN gm_orders o ON o.id = oi.order_id
     WHERE o.restaurant_id = $1
       AND DATE(o.created_at) = $2
       AND o.status NOT IN ('CANCELLED')
     GROUP BY oi.product_id
     ORDER BY quantity DESC
     LIMIT 10`,
    [restaurantId, date]
  );

  // Peak hours
  const peakHours = await pool.query(
    `SELECT 
       EXTRACT(HOUR FROM created_at) as hour,
       COUNT(*) as count
     FROM gm_orders
     WHERE restaurant_id = $1
       AND DATE(created_at) = $2
       AND status NOT IN ('CANCELLED')
     GROUP BY EXTRACT(HOUR FROM created_at)
     ORDER BY count DESC`,
    [restaurantId, date]
  );

  const peakHoursMap: Record<string, number> = {};
  for (const row of peakHours.rows) {
    peakHoursMap[String(row.hour)] = parseInt(row.count);
  }

  // Payment methods
  const paymentMethods = await pool.query(
    `SELECT 
       COALESCE(payment_method, 'unknown') as method,
       SUM(total) as amount
     FROM gm_orders
     WHERE restaurant_id = $1
       AND DATE(created_at) = $2
       AND status NOT IN ('CANCELLED')
     GROUP BY payment_method`,
    [restaurantId, date]
  );

  const paymentMethodsMap: Record<string, number> = {};
  for (const row of paymentMethods.rows) {
    paymentMethodsMap[row.method] = parseFloat(row.amount || '0');
  }

  // Table turnover (average time per table)
  // TODO: Calculate from table reservations/orders

  const snapshot: AnalyticsSnapshot = {
    restaurant_id: restaurantId,
    snapshot_date: date,
    total_sales: totalSales,
    total_orders: totalOrders,
    average_ticket: averageTicket,
    top_products: topProducts.rows.map(row => ({
      product_id: row.product_id,
      name: `Product ${row.product_id.substring(0, 8)}`, // TODO: Get real name
      quantity: parseInt(row.quantity),
      revenue: parseFloat(row.revenue || '0'),
    })),
    peak_hours: peakHoursMap,
    payment_methods: paymentMethodsMap,
  };

  // Store snapshot
  await pool.query(
    `INSERT INTO operational_hub_analytics_snapshots
     (restaurant_id, snapshot_date, total_sales, total_orders, average_ticket, top_products, peak_hours, payment_methods)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
     ON CONFLICT (restaurant_id, snapshot_date)
     DO UPDATE SET
       total_sales = EXCLUDED.total_sales,
       total_orders = EXCLUDED.total_orders,
       average_ticket = EXCLUDED.average_ticket,
       top_products = EXCLUDED.top_products,
       peak_hours = EXCLUDED.peak_hours,
       payment_methods = EXCLUDED.payment_methods`,
    [
      restaurantId,
      date,
      snapshot.total_sales,
      snapshot.total_orders,
      snapshot.average_ticket,
      JSON.stringify(snapshot.top_products),
      JSON.stringify(snapshot.peak_hours),
      JSON.stringify(snapshot.payment_methods),
    ]
  );

  return snapshot;
}

/**
 * Get analytics for date range
 */
export async function getAnalytics(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsSnapshot[]> {
  const result = await pool.query(
    `SELECT restaurant_id, snapshot_date, total_sales, total_orders, average_ticket,
            top_products, peak_hours, payment_methods, table_turnover
     FROM operational_hub_analytics_snapshots
     WHERE restaurant_id = $1
       AND snapshot_date >= $2
       AND snapshot_date <= $3
     ORDER BY snapshot_date DESC`,
    [restaurantId, startDate, endDate]
  );

  return result.rows.map(row => ({
    restaurant_id: row.restaurant_id,
    snapshot_date: row.snapshot_date,
    total_sales: parseFloat(row.total_sales || '0'),
    total_orders: parseInt(row.total_orders || '0'),
    average_ticket: parseFloat(row.average_ticket || '0'),
    top_products: row.top_products || [],
    peak_hours: row.peak_hours || {},
    payment_methods: row.payment_methods || {},
    table_turnover: row.table_turnover ? parseFloat(row.table_turnover) : undefined,
  }));
}

