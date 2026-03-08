/**
 * OperationalMetricsWidget - Métricas em tempo real para Dashboard
 *
 * Mostra KPIs operacionais do dia com atualização automática.
 */

import { useTranslation } from "react-i18next";
import { useCurrency } from "../../core/currency/useCurrency";
import { useRealtimeMetrics } from "../../hooks/useRealtimeMetrics";
import { Card } from "../../ui/design-system/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";

// Mini sparkline chart (CSS only)
const MiniSparkline = ({
  data,
  color = colors.action.base,
}: {
  data: Record<number, number>;
  color?: string;
}) => {
  const hours = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);
  if (hours.length === 0)
    return (
      <div style={{ height: 40, opacity: 0.3 }}>
        {/* no data placeholder */}
      </div>
    );

  const values = hours.map((h) => data[h] || 0);
  const max = Math.max(...values, 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height: 40,
        padding: "4px 0",
      }}
    >
      {hours.slice(-12).map((hour, i) => {
        const value = data[hour] || 0;
        const height = (value / max) * 100;
        return (
          <div
            key={hour}
            style={{
              flex: 1,
              height: `${Math.max(height, 5)}%`,
              background: color,
              borderRadius: 2,
              opacity: i === hours.length - 1 ? 1 : 0.6,
              transition: "height 0.3s ease",
            }}
            title={`${hour}h: ${value}`}
          />
        );
      })}
    </div>
  );
};

// Trend indicator
const TrendBadge = ({
  value,
  suffix = "%",
}: {
  value: number;
  suffix?: string;
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: isNeutral
          ? colors.surface.layer2
          : isPositive
          ? "#10B98120"
          : "#EF444420",
        color: isNeutral
          ? colors.text.secondary
          : isPositive
          ? "#10B981"
          : "#EF4444",
      }}
    >
      {isPositive ? "↑" : isNeutral ? "–" : "↓"} {Math.abs(value)}
      {suffix}
    </span>
  );
};

// Metric card
const MetricCard = ({
  label,
  value,
  trend,
  icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  trend?: number;
  icon?: string;
  subtitle?: string;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: 12,
      background: colors.surface.layer2,
      borderRadius: 8,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text size="xs" color="secondary">
        {icon} {label}
      </Text>
      {trend !== undefined && <TrendBadge value={trend} />}
    </div>
    <Text size="xl" weight="bold" color="primary">
      {value}
    </Text>
    {subtitle && (
      <Text size="xs" color="secondary">
        {subtitle}
      </Text>
    )}
  </div>
);

export const OperationalMetricsWidget = () => {
  const { t } = useTranslation();
  const { metrics, loading, error, refresh } = useRealtimeMetrics();
  const { formatAmount } = useCurrency();

  if (error) {
    return (
      <Card surface="layer1" padding="md">
        <Text color="secondary">
          {t("dashboard:metricsWidget.errorLoading", { error })}
        </Text>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    formatAmount(Math.round(value * 100));

  return (
    <Card surface="layer1" padding="md">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Text size="base" weight="bold" color="primary">
            {t("dashboard:metricsWidget.title")}
          </Text>
          <Text size="xs" color="secondary">
            {t("dashboard:metricsWidget.subtitle")}
          </Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {metrics.isLive && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "#10B981",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10B981",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              opacity: loading ? 0.5 : 1,
            }}
            title={t("common:refresh")}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main KPIs Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <MetricCard
          label={t("operational:metrics.revenue")}
          value={formatCurrency(metrics.totalRevenue)}
          trend={metrics.vsYesterdayRevenue}
          icon="💰"
          subtitle={t("operational:metrics.vsYesterday")}
        />
        <MetricCard
          label={t("operational:metrics.orders")}
          value={metrics.totalOrders}
          trend={metrics.vsYesterdayOrders}
          icon="📦"
          subtitle={t("operational:metrics.vsYesterday")}
        />
        <MetricCard
          label={t("operational:metrics.averageTicket")}
          value={formatCurrency(metrics.averageTicket)}
          icon="🎯"
        />
        <MetricCard
          label={t("operational:metrics.ordersPerHour")}
          value={metrics.ordersPerHour.toFixed(1)}
          icon="⚡"
          subtitle={t("operational:metrics.openNow", {
            count: metrics.openOrders,
          })}
        />
      </div>

      {/* Hourly Chart */}
      <div style={{ marginTop: 16 }}>
        <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>
          {t("operational:metrics.ordersByHour")}
        </Text>
        <MiniSparkline data={metrics.hourlyOrders} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Text size="xs" color="secondary">
            {Object.keys(metrics.hourlyOrders).length > 0
              ? `${Math.min(...Object.keys(metrics.hourlyOrders).map(Number))}h`
              : "—"}
          </Text>
          <Text size="xs" color="secondary">
            {Object.keys(metrics.hourlyOrders).length > 0
              ? `${Math.max(...Object.keys(metrics.hourlyOrders).map(Number))}h`
              : "—"}
          </Text>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${colors.surface.layer2}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text size="xs" color="secondary">
          {t("dashboard:metricsWidget.lastUpdated", {
            time: metrics.lastUpdated.toLocaleTimeString(),
          })}
        </Text>
        <a
          href="/analytics"
          style={{
            fontSize: 11,
            color: colors.action.base,
            textDecoration: "none",
          }}
        >
          {t("dashboard:metricsWidget.viewAnalytics")}
        </a>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Card>
  );
};
