// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { OSCopy } from "../../../../ui/design-system/sovereign/OSCopy";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { DashboardLayout } from "../components/DashboardLayout";
import { DonutCard } from "../components/DonutCard";
import { GeneralStatsCard } from "../components/GeneralStatsCard";
import { OperationStateCard } from "../components/OperationStateCard";
import { RevenueChartCard } from "../components/RevenueChartCard";
import { SummaryStatsCard } from "../components/SummaryStatsCard";
import { useDashboardOverview } from "../hooks/useDashboardOverview";

const theme = colors.modes.dashboard;

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const locationId = runtime.restaurant_id ?? "";
  const { data, loading, error, reload } = useDashboardOverview(locationId);

  const pageTitle = identity.name
    ? `${identity.name} — ${OSCopy.dashboard.comandoCentral}`
    : OSCopy.dashboard.pageTitle;

  return (
    <DashboardLayout>
      <section
        style={{
          background: theme.surface.base,
          borderBottom: `1px solid ${theme.border.subtle}`,
          padding: 32,
          margin: "-16px 0 0 0",
        }}
      >
        <header
          style={{
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="16" fill={theme.surface.layer2} />
            <path
              d="M11 21L16 13L21 21"
              stroke={theme.action.base}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.04em",
              color: theme.action.base,
            }}
          >
            {pageTitle}
          </h1>
        </header>
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: theme.destructive.base + "14",
              border: `1px solid ${theme.destructive.base}`,
              fontSize: 13,
              color: theme.destructive.base,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>{OSCopy.dashboard.errorLoad}</span>
            <button
              type="button"
              onClick={reload}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                backgroundColor: theme.destructive.base,
                color: theme.destructive.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {OSCopy.dashboard.retry}
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
            }}
          >
            <DonutCard
              loading={loading}
              title={OSCopy.dashboard.stateOfRoom}
              total={data?.tables.total ?? 0}
              occupied={data?.tables.occupied ?? 0}
              emptyLabel="Mesas vacías"
              occupiedLabel="Mesas ocupadas"
            />
          </div>
          <div
            style={{
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
            }}
          >
            <DonutCard
              loading={loading}
              title={OSCopy.dashboard.stateOfSeats}
              total={data?.seats.total ?? 0}
              occupied={data?.seats.occupied ?? 0}
              emptyLabel="Asientos vacíos"
              occupiedLabel="Asientos ocupados"
              detailsLabel="Ver detalles"
              onDetailsClick={() => navigate("/admin/reservations")}
            />
          </div>
        </div>

        <div
          style={{
            marginBottom: 24,
            border: `1px solid ${theme.border.subtle}`,
            borderRadius: 14,
            backgroundColor: theme.surface.layer1,
          }}
        >
          <RevenueChartCard
            loading={loading}
            data={data?.revenueByHour ?? []}
            onDetailsClick={() => navigate("/admin/reports/sales")}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
            }}
          >
            <GeneralStatsCard
              loading={loading}
              general={data?.general}
              onDeletedProductsClick={() =>
                navigate("/admin/catalog/products?filter=deleted")
              }
              onDeletedPaymentsClick={() => navigate("/admin/payments/refunds")}
              onPendingClick={() => navigate("/admin/payments/pending")}
            />
          </div>
          <div
            style={{
              border: `1px solid ${theme.border.subtle}`,
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
            }}
          >
            <SummaryStatsCard
              loading={loading}
              stats={data?.stats}
              onTotalBillsClick={() => navigate("/admin/reports/overview")}
            />
          </div>
        </div>

        <div
          style={{
            marginBottom: 24,
            border: `1px solid ${theme.border.subtle}`,
            borderRadius: 14,
            backgroundColor: theme.surface.layer1,
          }}
        >
          <OperationStateCard
            loading={loading}
            operation={data?.operation}
            onSeeAlerts={() => navigate("/alerts")}
            onSeeTasks={() => navigate("/tasks")}
          />
        </div>
      </section>
    </DashboardLayout>
  );
}
