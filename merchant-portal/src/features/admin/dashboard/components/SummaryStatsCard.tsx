import type { DashboardOverview } from "../types";
import { KpiCard } from "./KpiCard";

interface SummaryStatsCardProps {
  loading: boolean;
  stats: DashboardOverview["stats"] | undefined;
  onTotalBillsClick?: () => void;
}

export function SummaryStatsCard({ loading, stats, onTotalBillsClick }: SummaryStatsCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: "18px 20px",
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: "#111827",
        }}
      >
        Estadísticas
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <KpiCard
          loading={loading}
          label="Total de cuentas"
          value={stats?.totalBills ?? 0}
          onClick={onTotalBillsClick}
        />
        <KpiCard
          loading={loading}
          label="Total de asientos"
          value={stats?.totalSeats ?? 0}
        />
        <KpiCard
          loading={loading}
          label="Media de asientos"
          value={stats?.avgSeatsPerBill ?? 0}
        />
        <KpiCard
          loading={loading}
          label="Media por cuenta"
          value={stats?.avgAmountPerBill ?? 0}
          variant="currency"
        />
        <KpiCard
          loading={loading}
          label="Promedio por asiento"
          value={stats?.avgAmountPerSeat ?? 0}
          variant="currency"
        />
      </div>
    </div>
  );
}

