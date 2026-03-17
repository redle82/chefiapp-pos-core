/**
 * ShiftReport — Professional shift closing report for the POS.
 *
 * Shows financial summary, payment breakdown (with CSS bar chart),
 * and operational stats after a register is closed.
 */

import type React from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../core/currency/useCurrency";

/* ── Types ──────────────────────────────────────────────────────── */

export interface ShiftReportRegister {
  id: string;
  name: string;
  openedBy: string;
  closedBy?: string;
  openingBalanceCents: number;
  closingBalanceCents?: number;
  totalSalesCents: number;
  openedAt: string;
  closedAt?: string;
}

export interface ShiftReportPayments {
  cash: { count: number; totalCents: number };
  card: { count: number; totalCents: number };
  pix: { count: number; totalCents: number };
}

export interface ShiftReportOrderStats {
  totalOrders: number;
  averageOrderCents: number;
  largestOrderCents: number;
  cancelledOrders: number;
  cancelledValueCents: number;
}

export interface ShiftReportProps {
  register: ShiftReportRegister;
  payments?: ShiftReportPayments;
  orderStats?: ShiftReportOrderStats;
  onPrint?: () => void;
  onClose?: () => void;
}

/* ── Styles ─────────────────────────────────────────────────────── */

const s = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 9000,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    overflowY: "auto" as const,
    padding: "32px 16px",
  } as React.CSSProperties,

  container: {
    width: "100%",
    maxWidth: 720,
    background: "#141414",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 28,
  } as React.CSSProperties,

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap" as const,
    gap: 12,
  } as React.CSSProperties,

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fafafa",
    margin: 0,
  } as React.CSSProperties,

  meta: {
    fontSize: 13,
    color: "#9ca3af",
    lineHeight: 1.6,
  } as React.CSSProperties,

  metaValue: {
    color: "#fafafa",
    fontWeight: 600,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    marginBottom: 12,
    marginTop: 28,
  } as React.CSSProperties,

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
  } as React.CSSProperties,

  kpiCard: {
    background: "#1e1e1e",
    borderRadius: 10,
    padding: "14px 16px",
    border: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  kpiLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 500,
    marginBottom: 4,
  } as React.CSSProperties,

  kpiValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fafafa",
  } as React.CSSProperties,

  paymentRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  } as React.CSSProperties,

  paymentLabel: {
    width: 100,
    fontSize: 13,
    color: "#d1d5db",
    fontWeight: 500,
    flexShrink: 0,
  } as React.CSSProperties,

  paymentBarTrack: {
    flex: 1,
    height: 24,
    background: "#1e1e1e",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative" as const,
  } as React.CSSProperties,

  paymentBarFill: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.4s ease",
    display: "flex",
    alignItems: "center",
    paddingLeft: 8,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    minWidth: 0,
  } as React.CSSProperties,

  paymentAmount: {
    width: 100,
    textAlign: "right" as const,
    fontSize: 13,
    fontWeight: 600,
    color: "#fafafa",
    flexShrink: 0,
  } as React.CSSProperties,

  paymentCount: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right" as const,
    width: 100,
    flexShrink: 0,
  } as React.CSSProperties,

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
  } as React.CSSProperties,

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  } as React.CSSProperties,

  btnPrimary: {
    background: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,

  btnSecondary: {
    background: "transparent",
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,

  noData: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic" as const,
    padding: "12px 0",
  } as React.CSSProperties,
};

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const PAYMENT_COLORS = {
  cash: "#22c55e",
  card: "#3b82f6",
  pix: "#a855f7",
} as const;

/* ── Component ──────────────────────────────────────────────────── */

export function ShiftReport({
  register,
  payments,
  orderStats,
  onPrint,
  onClose,
}: ShiftReportProps) {
  const { t } = useTranslation("shift");
  const { formatAmount } = useCurrency();

  const expectedClosingCents =
    register.openingBalanceCents + register.totalSalesCents;
  const actualClosingCents = register.closingBalanceCents ?? 0;
  const differenceCents = actualClosingCents - expectedClosingCents;

  const diffColor =
    differenceCents === 0
      ? "#22c55e"
      : differenceCents > 0
        ? "#eab308"
        : "#ef4444";

  const diffLabel =
    differenceCents === 0
      ? t("shiftReport.match", "Correct balance")
      : differenceCents > 0
        ? t("shiftReport.over", "Over")
        : t("shiftReport.under", "Under");

  // Payment bar chart
  const paymentTotal = payments
    ? payments.cash.totalCents + payments.card.totalCents + payments.pix.totalCents
    : 0;

  const paymentEntries = payments
    ? [
        {
          key: "cash" as const,
          label: t("shiftReport.cash", "Cash"),
          data: payments.cash,
        },
        {
          key: "card" as const,
          label: t("shiftReport.card", "Card"),
          data: payments.card,
        },
        {
          key: "pix" as const,
          label: t("shiftReport.pix", "PIX / Digital"),
          data: payments.pix,
        },
      ]
    : [];

  return (
    <div style={s.overlay} data-testid="shift-report-overlay">
      <div style={s.container}>
        {/* ── Header ─────────────────────────────────────── */}
        <div style={s.headerRow}>
          <div>
            <h2 style={s.title}>{t("shiftReport.title", "Shift Report")}</h2>
            <div style={{ ...s.meta, marginTop: 8 }}>
              <span>{t("shiftReport.registerName", "Register")}: </span>
              <span style={s.metaValue} data-testid="register-name">
                {register.name}
              </span>
            </div>
          </div>
          <div style={{ ...s.meta, textAlign: "right" }}>
            <div>
              {t("shiftReport.openedBy", "Opened by")}:{" "}
              <span style={s.metaValue} data-testid="opened-by">
                {register.openedBy}
              </span>
            </div>
            {register.closedBy && (
              <div>
                {t("shiftReport.closedBy", "Closed by")}:{" "}
                <span style={s.metaValue}>{register.closedBy}</span>
              </div>
            )}
            <div>
              {t("shiftReport.period", "Period")}:{" "}
              <span style={s.metaValue}>
                {formatDateTime(register.openedAt)} →{" "}
                {formatDateTime(register.closedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Financial Summary ──────────────────────────── */}
        <div style={s.sectionTitle}>
          {t("shiftReport.financialSummary", "FINANCIAL SUMMARY")}
        </div>
        <div style={s.kpiGrid}>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>
              {t("shiftReport.openingBalance", "Opening Balance")}
            </div>
            <div style={s.kpiValue} data-testid="opening-balance">
              {formatAmount(register.openingBalanceCents)}
            </div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>
              {t("shiftReport.totalSales", "Total Sales")}
            </div>
            <div style={s.kpiValue} data-testid="total-sales">
              {formatAmount(register.totalSalesCents)}
            </div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>
              {t("shiftReport.expectedClosing", "Expected Closing")}
            </div>
            <div style={s.kpiValue} data-testid="expected-closing">
              {formatAmount(expectedClosingCents)}
            </div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>
              {t("shiftReport.actualClosing", "Actual Closing")}
            </div>
            <div style={s.kpiValue} data-testid="actual-closing">
              {formatAmount(actualClosingCents)}
            </div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>
              {t("shiftReport.difference", "Difference")}
            </div>
            <div
              style={{ ...s.kpiValue, color: diffColor }}
              data-testid="difference"
            >
              {differenceCents >= 0 ? "+" : ""}
              {formatAmount(differenceCents)}
            </div>
            <div
              style={{ fontSize: 11, color: diffColor, marginTop: 2 }}
              data-testid="difference-label"
            >
              {diffLabel}
            </div>
          </div>
        </div>

        {/* ── Payment Method Breakdown ───────────────────── */}
        <div style={s.sectionTitle}>
          {t("shiftReport.paymentBreakdown", "SALES BY METHOD")}
        </div>
        {!payments ? (
          <div style={s.noData}>
            {t("shiftReport.noPaymentData", "No payment data available")}
          </div>
        ) : (
          <div>
            {paymentEntries.map(({ key, label, data }) => {
              const pct =
                paymentTotal > 0
                  ? Math.round((data.totalCents / paymentTotal) * 100)
                  : 0;
              return (
                <div key={key} style={s.paymentRow} data-testid={`payment-${key}`}>
                  <div style={s.paymentLabel}>{label}</div>
                  <div style={s.paymentBarTrack}>
                    <div
                      style={{
                        ...s.paymentBarFill,
                        width: `${Math.max(pct, 0)}%`,
                        background: PAYMENT_COLORS[key],
                      }}
                      data-testid={`payment-bar-${key}`}
                    >
                      {pct >= 10 ? `${pct}%` : ""}
                    </div>
                  </div>
                  <div style={s.paymentAmount}>{formatAmount(data.totalCents)}</div>
                  <div style={s.paymentCount}>
                    {t("shiftReport.transactions", "{{count}} transactions", {
                      count: data.count,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Operations Summary ─────────────────────────── */}
        {orderStats && (
          <>
            <div style={s.sectionTitle}>
              {t("shiftReport.operationsSummary", "OPERATIONS SUMMARY")}
            </div>
            <div style={s.statsGrid}>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>
                  {t("shiftReport.totalOrders", "Orders processed")}
                </div>
                <div style={s.kpiValue} data-testid="total-orders">
                  {orderStats.totalOrders}
                </div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>
                  {t("shiftReport.averageOrder", "Average order")}
                </div>
                <div style={s.kpiValue}>
                  {formatAmount(orderStats.averageOrderCents)}
                </div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>
                  {t("shiftReport.largestOrder", "Largest order")}
                </div>
                <div style={s.kpiValue}>
                  {formatAmount(orderStats.largestOrderCents)}
                </div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>
                  {t("shiftReport.cancelledOrders", "Cancelled")}
                </div>
                <div style={s.kpiValue}>{orderStats.cancelledOrders}</div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>
                  {t("shiftReport.cancelledValue", "Cancelled value")}
                </div>
                <div style={s.kpiValue}>
                  {formatAmount(orderStats.cancelledValueCents)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Actions ────────────────────────────────────── */}
        <div style={s.actions}>
          {onClose && (
            <button
              type="button"
              style={s.btnSecondary}
              onClick={onClose}
              data-testid="report-close-btn"
            >
              {t("shiftReport.close", "Close")}
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              style={s.btnPrimary}
              onClick={onPrint}
              data-testid="report-print-btn"
            >
              {t("shiftReport.print", "Print Report")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
