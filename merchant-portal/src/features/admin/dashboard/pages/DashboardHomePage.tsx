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
      <section className="page-enter command-centre-page">
        <header className="command-centre-header">
          <h1 className="admin-page-title">{pageTitle}</h1>
          <p className="admin-page-desc">
            {OSCopy.dashboard.comandoCentralDesc}
          </p>
        </header>
        {error && (
          <div className="command-centre-error">
            <span>{OSCopy.dashboard.errorLoad}</span>
            <button type="button" onClick={reload} className="command-centre-retry">
              {OSCopy.dashboard.retry}
            </button>
          </div>
        )}

        <div className="command-centre-grid command-centre-grid-2">
          <div className="command-centre-card">
            <DonutCard
              loading={loading}
              title={OSCopy.dashboard.stateOfRoom}
              total={data?.tables.total ?? 0}
              occupied={data?.tables.occupied ?? 0}
              emptyLabel="Mesas vacías"
              occupiedLabel="Mesas ocupadas"
            />
          </div>
          <div className="command-centre-card">
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

        <div className="command-centre-card command-centre-card-full">
          <RevenueChartCard
            loading={loading}
            data={data?.revenueByHour ?? []}
            onDetailsClick={() => navigate("/admin/reports/sales")}
          />
        </div>

        <div className="command-centre-grid command-centre-grid-ratio">
          <div className="command-centre-card">
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
          <div className="command-centre-card">
            <SummaryStatsCard
              loading={loading}
              stats={data?.stats}
              onTotalBillsClick={() => navigate("/admin/reports/overview")}
            />
          </div>
        </div>

        <div className="command-centre-card command-centre-card-full">
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
