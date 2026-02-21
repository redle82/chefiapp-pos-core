// @ts-nocheck
import type { DashboardOverview } from "../types";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { KpiCard } from "./KpiCard";

const theme = colors.modes.dashboard;

interface SummaryStatsCardProps {
  loading: boolean;
  stats: DashboardOverview["stats"] | undefined;
  onTotalBillsClick?: () => void;
}

export function SummaryStatsCard({ loading, stats, onTotalBillsClick }: SummaryStatsCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface.layer1,
        borderRadius: 12,
        border: `1px solid ${theme.border.subtle}`,
        padding: "18px 20px",
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: theme.text.primary,
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

