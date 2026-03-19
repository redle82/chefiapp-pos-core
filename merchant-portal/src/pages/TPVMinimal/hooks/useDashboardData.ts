/**
 * useDashboardData — Fetches real-time sales data for the TPV Dashboard.
 *
 * Queries Docker Core (PostgREST) for today's orders, items, payments, and staff.
 * Auto-refreshes every 30 seconds. Falls back to empty state on error.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

/* ── Types ── */

export interface HourlyRevenue {
  hour: number;
  amount: number;
}

export interface RevenueData {
  today: number;
  yesterday: number;
  byHour: HourlyRevenue[];
  yesterdayByHour: HourlyRevenue[];
}

export interface OrdersData {
  count: number;
  average: number;
  items: number;
}

export interface ProductMixItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

export interface StaffSalesData {
  name: string;
  revenue: number;
  orders: number;
}

export interface DashboardData {
  revenue: RevenueData;
  orders: OrdersData;
  productMix: ProductMixItem[];
  paymentMethods: PaymentMethodData[];
  staffSales: StaffSalesData[];
  loading: boolean;
  lastRefresh: Date | null;
  refresh: () => void;
}

/* ── Helpers ── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getHour(dateStr: string): number {
  return new Date(dateStr).getHours();
}

const REFRESH_INTERVAL_MS = 30_000;

/* ── Hook ── */

export function useDashboardData(restaurantId: string): DashboardData {
  const [revenue, setRevenue] = useState<RevenueData>({
    today: 0,
    yesterday: 0,
    byHour: [],
    yesterdayByHour: [],
  });
  const [orders, setOrders] = useState<OrdersData>({
    count: 0,
    average: 0,
    items: 0,
  });
  const [productMix, setProductMix] = useState<ProductMixItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [staffSales, setStaffSales] = useState<StaffSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    const today = todayISO();
    const yesterday = yesterdayISO();

    try {
      // Fetch today's orders (non-cancelled)
      const { data: todayOrders } = await dockerCoreClient
        .from("gm_orders")
        .select("id,total_amount,created_at,staff_id,status")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", `${today}T00:00:00`)
        .not("status", "eq", "CANCELLED");

      // Fetch yesterday's orders for comparison
      const { data: yesterdayOrders } = await dockerCoreClient
        .from("gm_orders")
        .select("id,total_amount,created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", `${yesterday}T00:00:00`)
        .not("status", "eq", "CANCELLED");

      const ordersToday = Array.isArray(todayOrders) ? todayOrders : [];
      const ordersYesterday = Array.isArray(yesterdayOrders)
        ? yesterdayOrders.filter(
            (o: any) => o.created_at && o.created_at < `${today}T00:00:00`,
          )
        : [];

      // Revenue calculations
      const todayTotal = ordersToday.reduce(
        (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
        0,
      );
      const yesterdayTotal = ordersYesterday.reduce(
        (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
        0,
      );

      // Revenue by hour
      const todayByHourMap = new Map<number, number>();
      const yesterdayByHourMap = new Map<number, number>();
      for (let h = 0; h < 24; h++) {
        todayByHourMap.set(h, 0);
        yesterdayByHourMap.set(h, 0);
      }

      ordersToday.forEach((o: any) => {
        if (o.created_at) {
          const h = getHour(o.created_at);
          todayByHourMap.set(h, (todayByHourMap.get(h) || 0) + (Number(o.total_amount) || 0));
        }
      });

      ordersYesterday.forEach((o: any) => {
        if (o.created_at) {
          const h = getHour(o.created_at);
          yesterdayByHourMap.set(
            h,
            (yesterdayByHourMap.get(h) || 0) + (Number(o.total_amount) || 0),
          );
        }
      });

      setRevenue({
        today: todayTotal,
        yesterday: yesterdayTotal,
        byHour: Array.from(todayByHourMap, ([hour, amount]) => ({ hour, amount })),
        yesterdayByHour: Array.from(yesterdayByHourMap, ([hour, amount]) => ({
          hour,
          amount,
        })),
      });

      // Orders data
      const orderCount = ordersToday.length;
      setOrders({
        count: orderCount,
        average: orderCount > 0 ? todayTotal / orderCount : 0,
        items: 0, // updated below from order_items
      });

      // Fetch order items for today's orders
      if (ordersToday.length > 0) {
        const orderIds = ordersToday.map((o: any) => o.id);
        const { data: items } = await dockerCoreClient
          .from("gm_order_items")
          .select("id,product_name,quantity,unit_price,order_id")
          .in("order_id", orderIds);

        const itemsList = Array.isArray(items) ? items : [];
        const totalItems = itemsList.reduce(
          (sum: number, i: any) => sum + (Number(i.quantity) || 0),
          0,
        );

        setOrders((prev) => ({ ...prev, items: totalItems }));

        // Product mix: aggregate by product_name
        const mixMap = new Map<string, { quantity: number; revenue: number }>();
        itemsList.forEach((item: any) => {
          const name = item.product_name || "Unknown";
          const qty = Number(item.quantity) || 0;
          const rev = qty * (Number(item.unit_price) || 0);
          const existing = mixMap.get(name) || { quantity: 0, revenue: 0 };
          mixMap.set(name, {
            quantity: existing.quantity + qty,
            revenue: existing.revenue + rev,
          });
        });

        const mixArr = Array.from(mixMap, ([name, data]) => ({
          name,
          ...data,
        }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        setProductMix(mixArr);
      } else {
        setProductMix([]);
      }

      // Fetch payments
      const { data: payments } = await dockerCoreClient
        .from("gm_payments")
        .select("id,method,amount,order_id")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", `${today}T00:00:00`);

      const paymentsList = Array.isArray(payments) ? payments : [];
      const methodMap = new Map<string, { amount: number; count: number }>();
      paymentsList.forEach((p: any) => {
        const method = p.method || "other";
        const existing = methodMap.get(method) || { amount: 0, count: 0 };
        methodMap.set(method, {
          amount: existing.amount + (Number(p.amount) || 0),
          count: existing.count + 1,
        });
      });

      setPaymentMethods(
        Array.from(methodMap, ([method, data]) => ({ method, ...data })).sort(
          (a, b) => b.amount - a.amount,
        ),
      );

      // Fetch staff sales
      const staffMap = new Map<
        string,
        { revenue: number; orders: number; staffId: string }
      >();
      ordersToday.forEach((o: any) => {
        const staffId = o.staff_id || "unknown";
        const existing = staffMap.get(staffId) || {
          revenue: 0,
          orders: 0,
          staffId,
        };
        staffMap.set(staffId, {
          revenue: existing.revenue + (Number(o.total_amount) || 0),
          orders: existing.orders + 1,
          staffId,
        });
      });

      // Fetch staff names
      const staffIds = Array.from(staffMap.keys()).filter(
        (id) => id !== "unknown",
      );
      let staffNameMap = new Map<string, string>();
      if (staffIds.length > 0) {
        const { data: staffData } = await dockerCoreClient
          .from("gm_staff")
          .select("id,name")
          .in("id", staffIds);

        if (Array.isArray(staffData)) {
          staffData.forEach((s: any) => {
            staffNameMap.set(s.id, s.name || `Staff ${s.id.slice(0, 6)}`);
          });
        }
      }

      setStaffSales(
        Array.from(staffMap.values())
          .map((s) => ({
            name: staffNameMap.get(s.staffId) || `Staff ${s.staffId.slice(0, 6)}`,
            revenue: s.revenue,
            orders: s.orders,
          }))
          .sort((a, b) => b.revenue - a.revenue),
      );

      setLastRefresh(new Date());
    } catch {
      // On error, keep previous state
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return {
    revenue,
    orders,
    productMix,
    paymentMethods,
    staffSales,
    loading,
    lastRefresh,
    refresh: fetchData,
  };
}
