// @ts-nocheck
import type { DashboardOverview } from "../types";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { KpiCard } from "./KpiCard";

const theme = colors.modes.dashboard;

interface GeneralStatsCardProps {
  loading: boolean;
  general: DashboardOverview["general"] | undefined;
  onDeletedProductsClick?: () => void;
  onDeletedPaymentsClick?: () => void;
  onPendingClick?: () => void;
}

export function GeneralStatsCard({
  loading,
  general,
  onDeletedProductsClick,
  onDeletedPaymentsClick,
  onPendingClick,
}: GeneralStatsCardProps) {
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
        General
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <KpiCard
          loading={loading}
          label="Productos eliminados"
          value={general?.deletedProducts ?? 0}
          onClick={onDeletedProductsClick}
        />
        <KpiCard
          loading={loading}
          label="Pagos eliminados"
          value={general?.deletedPayments ?? 0}
          onClick={onDeletedPaymentsClick}
        />
        <KpiCard
          loading={loading}
          label="Descuentos"
          value={general?.discounts ?? 0}
        />
        <KpiCard
          loading={loading}
          label="Pendiente"
          value={general?.pendingAmount ?? 0}
          variant="currency"
          onClick={onPendingClick}
        />
      </div>
    </div>
  );
}

