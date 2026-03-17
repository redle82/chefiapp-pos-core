/**
 * OperationalHeader — Cabeçalho operacional do Centro de Comando.
 *
 * Exibe KPIs em tempo real: receita do dia, pedidos ativos, ticket médio,
 * semáforo da cozinha, e modo do operador (Operador / Gerente / Dono).
 *
 * Consome dados do OperationalStore via hooks granulares.
 * Não define fundo de página — segue o contrato OUC (Shell impõe layout).
 */

import { useTranslation } from "react-i18next";
import { useAuth } from "../../core/auth/useAuth";
import { useCurrency } from "../../core/currency/useCurrency";
import { useHardwareStatus } from "../../core/operational/hooks/useHardwareStatus";
import { useOperationalKpis } from "../../core/operational/hooks/useOperationalKpis";
import { useOperationalContext } from "../../core/operational/OperationalContext";

const KITCHEN_STATUS_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  RED: "#ef4444",
};

const KITCHEN_STATUS_LABELS: Record<string, string> = {};

export function OperationalHeader() {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const kpis = useOperationalKpis();
  const { hasAnyPrinterOffline } = useHardwareStatus();
  const ctx = useOperationalContext();
  const { user } = useAuth();

  const kitchenColor = KITCHEN_STATUS_COLORS[kpis.kitchenStatus] ?? "#a3a3a3";
  const kitchenLabelMap: Record<string, string> = {
    GREEN: t("operational:kitchen.statusOk"),
    YELLOW: t("operational:kitchen.statusSlow"),
    RED: t("operational:kitchen.statusCritical"),
  };
  const kitchenLabel = kitchenLabelMap[kpis.kitchenStatus] ?? "—";

  // Derive role: explicit context > single-owner default
  // In single-owner scenario (P0), the person operating IS the owner — always show "DONO"
  const effectiveRole = ctx.role ?? "owner";
  const roleLabel =
    effectiveRole === "owner"
      ? t("operational:roles.owner")
      : effectiveRole === "manager"
      ? t("operational:roles.manager")
      : effectiveRole === "cashier"
      ? t("operational:roles.cashier")
      : effectiveRole === "waiter"
      ? t("operational:roles.waiter")
      : t("operational:roles.owner");

  return (
    <div
      data-testid="operational-header"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "10px 20px",
        backgroundColor: "var(--surface-elevated, #1a1a1a)",
        borderBottom: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
        minHeight: 48,
        flexWrap: "wrap",
      }}
    >
      {/* Receita do dia */}
      <KpiPill
        label={t("operational:metrics.revenueToday")}
        value={formatAmount(kpis.dailyRevenueCents)}
      />

      {/* Pedidos ativos */}
      <KpiPill
        label={t("operational:metrics.orders")}
        value={String(kpis.activeOrdersCount)}
      />

      {/* Ticket médio */}
      <KpiPill
        label={t("operational:metrics.averageTicket")}
        value={formatAmount(kpis.averageTicketCents)}
      />

      {/* Semáforo cozinha */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: kitchenColor,
            display: "inline-block",
            boxShadow: `0 0 6px ${kitchenColor}`,
          }}
        />
        <span style={{ color: kitchenColor, fontSize: 12, fontWeight: 600 }}>
          {kitchenLabel}
        </span>
      </div>

      {/* Printer status */}
      {hasAnyPrinterOffline && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14 }}>🖨️</span>
          {t("tpv:orderPanel.printerOffline")}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Modo / Role */}
      <div
        style={{
          padding: "4px 12px",
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.06)",
          color: "var(--text-secondary, #a3a3a3)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {roleLabel}
      </div>
    </div>
  );
}

/** Pill para exibir um KPI individual. */
function KpiPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span
        style={{
          color: "var(--text-tertiary, #737373)",
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--text-primary, #fafafa)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}
