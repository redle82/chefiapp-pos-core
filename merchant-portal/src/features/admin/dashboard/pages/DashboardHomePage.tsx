import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { DashboardLayout } from "../components/DashboardLayout";
import { DonutCard } from "../components/DonutCard";
import { GeneralStatsCard } from "../components/GeneralStatsCard";
import { OperationStateCard } from "../components/OperationStateCard";
import { RevenueChartCard } from "../components/RevenueChartCard";
import { SummaryStatsCard } from "../components/SummaryStatsCard";
import { useDashboardOverview } from "../hooks/useDashboardOverview";

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const locationId = runtime.restaurant_id ?? "";
  const { data, loading, error, reload } = useDashboardOverview(locationId);

  return (
    <DashboardLayout>
      <section>
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 4px 0",
            }}
          >
            Página principal
          </h1>
        </header>
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 13,
              color: "#b91c1c",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>Não foi possível carregar os dados do dashboard.</span>
            <button
              type="button"
              onClick={reload}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                backgroundColor: "#b91c1c",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <DonutCard
            loading={loading}
            title="Total de mesas"
            total={data?.tables.total ?? 0}
            occupied={data?.tables.occupied ?? 0}
            emptyLabel="Mesas vacías"
            occupiedLabel="Mesas ocupadas"
          />
          <DonutCard
            loading={loading}
            title="Total de asientos"
            total={data?.seats.total ?? 0}
            occupied={data?.seats.occupied ?? 0}
            emptyLabel="Asientos vacíos"
            occupiedLabel="Asientos ocupados"
            detailsLabel="Ver detalles"
            onDetailsClick={() => navigate("/admin/reservations")}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
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
            gap: 16,
            marginBottom: 16,
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
          <SummaryStatsCard
            loading={loading}
            stats={data?.stats}
            onTotalBillsClick={() => navigate("/admin/reports/overview")}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
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
