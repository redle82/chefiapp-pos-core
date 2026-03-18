/**
 * DashboardPage — Real-time sales dashboard embedded in TPV (rota /op/tpv/dashboard).
 *
 * Layout:
 * 1. KPI cards row (revenue, orders, avg ticket, items)
 * 2. Charts row (revenue by hour, product mix, payment methods)
 * 3. Staff row (sales by operator)
 *
 * Auto-refreshes every 30 seconds via useDashboardData.
 */

import { useTranslation } from "react-i18next";
import { useCurrency } from "../../core/currency/useCurrency";

/** Format a decimal amount (e.g. 12.50) using the currency hook (which expects cents). */
function useFormatAmount() {
  const { formatAmount } = useCurrency();
  return (amount: number) => formatAmount(Math.round(amount * 100));
}
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";
import { useDashboardData } from "./hooks/useDashboardData";
import { KpiCard } from "./components/charts/KpiCard";
import { RevenueByHourChart } from "./components/charts/RevenueByHourChart";
import { ProductMixChart } from "./components/charts/ProductMixChart";
import { PaymentMethodsChart } from "./components/charts/PaymentMethodsChart";
import { StaffSalesChart } from "./components/charts/StaffSalesChart";

/* ── Skeleton loader ── */

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: 16,
        padding: "20px 24px",
        border: "1px solid #27272a",
        flex: 1,
        minWidth: 180,
        minHeight: 100,
      }}
    >
      <div
        style={{
          background: "#27272a",
          borderRadius: 4,
          width: "60%",
          height: 14,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          background: "#27272a",
          borderRadius: 4,
          width: "80%",
          height: 28,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          background: "#27272a",
          borderRadius: 4,
          width: "40%",
          height: 12,
        }}
      />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div
      style={{
        background: "#18181b",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #27272a",
        minHeight: 300,
      }}
    >
      <div
        style={{
          background: "#27272a",
          borderRadius: 4,
          width: "30%",
          height: 16,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          background: "#27272a",
          borderRadius: 8,
          width: "100%",
          height: 240,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/* ── Component ── */

export function DashboardPage() {
  const { t } = useTranslation("tpv");
  const formatValue = useFormatAmount();
  const restaurantId = useTPVRestaurantId();
  const {
    revenue,
    orders,
    productMix,
    paymentMethods,
    staffSales,
    loading,
    lastRefresh,
    refresh,
  } = useDashboardData(restaurantId);

  const revenueDelta =
    revenue.yesterday > 0
      ? ((revenue.today - revenue.yesterday) / revenue.yesterday) * 100
      : null;

  return (
    <div style={{ padding: 16, maxWidth: 1200 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            color: "var(--text-primary, #fafafa)",
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {t("dashboard.title")}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && (
            <span
              style={{
                color: "var(--text-tertiary, #71717a)",
                fontSize: 12,
              }}
            >
              {t("dashboard.lastRefresh")}{" "}
              {lastRefresh.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={refresh}
            style={{
              background: "transparent",
              color: "#f97316",
              border: "1px solid #f97316",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("dashboard.refresh")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              label={t("dashboard.revenueToday")}
              value={formatValue(revenue.today)}
              delta={revenueDelta}
            />
            <KpiCard
              label={t("dashboard.orders")}
              value={String(orders.count)}
            />
            <KpiCard
              label={t("dashboard.avgTicket")}
              value={formatValue(orders.average)}
            />
            <KpiCard
              label={t("dashboard.itemsSold")}
              value={String(orders.items)}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <RevenueByHourChart
              todayData={revenue.byHour}
              yesterdayData={revenue.yesterdayByHour}
            />
            <ProductMixChart data={productMix} />
            <PaymentMethodsChart data={paymentMethods} />
          </>
        )}
      </div>

      {/* Staff Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
        }}
      >
        {loading ? (
          <SkeletonChart />
        ) : (
          <StaffSalesChart data={staffSales} />
        )}
      </div>
    </div>
  );
}
