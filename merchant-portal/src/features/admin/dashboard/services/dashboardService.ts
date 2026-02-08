import { dockerCoreClient } from "../../../../core-boundary/docker-core/connection";
import type { CoreOrder, CoreTable } from "../../../../core-boundary/docker-core/types";
import { alertEngine } from "../../../../core/alerts/AlertEngine";
import type { DashboardOverview } from "../types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REVENUE_HOUR_LABELS = [
  "03h", "04h", "05h", "06h", "07h", "08h", "09h", "10h", "11h", "12h",
  "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h",
  "23h", "00h", "01h", "02h",
];

function buildEmptyRevenueSeries(): { hour: string; amount: number }[] {
  return REVENUE_HOUR_LABELS.map((hour) => ({ hour, amount: 0 }));
}

function getTodayStartEnd(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Hour index 0 = 03h, 1 = 04h, ... 23 = 02h (shifted by 3). */
function hourToSeriesIndex(utcHour: number): number {
  const shifted = (utcHour - 3 + 24) % 24;
  return shifted;
}

function buildMockOverview(locationId: string, seatsTotal: number): DashboardOverview {
  return {
    locationId,
    tables: { total: 0, occupied: 0 },
    seats: { total: seatsTotal, occupied: 0 },
    revenueByHour: buildEmptyRevenueSeries(),
    general: {
      deletedProducts: 0,
      deletedPayments: 0,
      discounts: 0,
      pendingAmount: 0,
    },
    stats: {
      totalBills: 0,
      totalSeats: seatsTotal,
      avgSeatsPerBill: 0,
      avgAmountPerBill: 0,
      avgAmountPerSeat: 0,
    },
    operation: {
      activeStaffCount: 0,
      criticalTasksCount: 0,
      alertsCount: 0,
    },
  };
}

export async function getOverview(
  locationId: string
): Promise<DashboardOverview> {
  const restaurantId = locationId.trim();

  // Avoid invalid PostgREST calls such as restaurant_id=eq. during bootstrap races.
  if (!UUID_REGEX.test(restaurantId)) {
    return buildMockOverview(restaurantId, 0);
  }

  try {
    const [tablesRes, ordersRes, alerts, tasksRes] = await Promise.all([
      dockerCoreClient
        .from("gm_tables")
        .select("*")
        .eq("restaurant_id", restaurantId),
      dockerCoreClient
        .from("gm_orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(2000),
      alertEngine.getActive(restaurantId),
      dockerCoreClient
        .from("gm_tasks")
        .select("id,priority,status")
        .eq("restaurant_id", restaurantId)
        .eq("status", "OPEN")
        .in("priority", ["CRITICA", "ALTA"]),
    ]);

    if (tablesRes.error) throw new Error(tablesRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);

    const tables = (tablesRes.data || []) as (CoreTable & { seats?: number })[];
    const orders = (ordersRes.data || []) as CoreOrder[];
    const criticalTasks = (tasksRes.data || []) as { id: string }[];
    const alertsCount = alerts.length;

    const totalTables = tables.length;
    const seatsTotal = tables.reduce((s, t) => s + (t.seats ?? 0), 0);

    const openOrders = orders.filter((o) => String(o?.status).toUpperCase() === "OPEN");
    const openTableIds = new Set(openOrders.map((o) => o.table_id).filter(Boolean));
    const occupiedTables = tables.filter((t) => openTableIds.has(t.id));
    const tablesOccupied = occupiedTables.length;
    const seatsOccupied = occupiedTables.reduce((s, t) => s + (t.seats ?? 0), 0);

    const { start: todayStart, end: todayEnd } = getTodayStartEnd();
    const todayStartMs = todayStart.getTime();
    const todayEndMs = todayEnd.getTime();

    const paidOrdersToday = orders.filter((o) => {
      const status = String(o?.status).toUpperCase();
      if (status !== "PAID") return false;
      const updatedAt = o?.updated_at ? new Date(o.updated_at).getTime() : 0;
      return updatedAt >= todayStartMs && updatedAt < todayEndMs;
    });

    const revenueByHour = buildEmptyRevenueSeries();
    let totalRevenueCents = 0;
    for (const o of paidOrdersToday) {
      const updatedAt = o?.updated_at ? new Date(o.updated_at) : new Date();
      const hour = updatedAt.getHours();
      const idx = hourToSeriesIndex(hour);
      const cents = o?.total_cents ?? 0;
      revenueByHour[idx].amount += cents / 100;
      totalRevenueCents += cents;
    }

    const pendingAmountCents = openOrders.reduce((s, o) => s + (o?.total_cents ?? 0), 0);
    const pendingAmount = pendingAmountCents / 100;

    const totalBills = paidOrdersToday.length;
    const avgSeatsPerBill = totalBills > 0 ? seatsTotal / totalBills : 0;
    const totalRevenueEuros = totalRevenueCents / 100;
    const avgAmountPerBill = totalBills > 0 ? totalRevenueEuros / totalBills : 0;
    const avgAmountPerSeat = seatsTotal > 0 ? totalRevenueEuros / seatsTotal : 0;

    return {
      locationId,
      tables: { total: totalTables, occupied: tablesOccupied },
      seats: { total: seatsTotal, occupied: seatsOccupied },
      revenueByHour,
      general: {
        deletedProducts: 0,
        deletedPayments: 0,
        discounts: 0,
        pendingAmount, // euros (UI KpiCard currency)
      },
      stats: {
        totalBills,
        totalSeats: seatsTotal,
        avgSeatsPerBill,
        avgAmountPerBill,
        avgAmountPerSeat,
      },
      operation: {
        activeStaffCount: 0,
        criticalTasksCount: criticalTasks.length,
        alertsCount,
      },
    };
  } catch (err) {
    console.warn("[dashboardService] getOverview real data failed, using mock", err);
    const mock = buildMockOverview(restaurantId, 0);
    await new Promise((r) => setTimeout(r, 400));
    return mock;
  }
}
