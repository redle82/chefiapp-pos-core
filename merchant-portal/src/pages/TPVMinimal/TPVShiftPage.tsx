/**
 * TPVShiftPage — Cash register open/close within TPV.
 *
 * Redesigned to use the Sovereign design system (Card, Button, KpiCard, Skeleton, InlineAlert)
 * for full visual coherence with the rest of the dark TPV theme.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../core/currency/useCurrency";
import { useShift } from "../../core/shift/ShiftContext";
import {
  CashRegisterEngine,
  type CashRegister,
} from "../../core/tpv/CashRegister";
import { Button } from "../../ui/design-system/Button";
import { Card } from "../../ui/design-system/Card";
import { InlineAlert } from "../../ui/design-system/InlineAlert";
import { KpiCard } from "../../ui/design-system/KpiCard";
import { Skeleton } from "../../ui/design-system/Skeleton";
import { DenominationCounter } from "./components/DenominationCounter";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

/* ── Styles ─────────────────────────────────────────────────────── */

const styles = {
  page: {
    padding: 24,
    maxWidth: 860,
    margin: "0 auto",
  } as React.CSSProperties,

  header: {
    marginBottom: 20,
  } as React.CSSProperties,

  title: {
    color: "var(--text-primary, #fafafa)",
    margin: "4px 0 4px",
    fontSize: 24,
    fontWeight: 700,
  } as React.CSSProperties,

  subtitle: {
    color: "var(--text-secondary, #9ca3af)",
    fontSize: 14,
    margin: 0,
  } as React.CSSProperties,

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 20,
  } as React.CSSProperties,

  formRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
    marginBottom: 16,
  } as React.CSSProperties,

  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    flex: 1,
    minWidth: 200,
  } as React.CSSProperties,

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary, #9ca3af)",
  } as React.CSSProperties,

  input: {
    background: "var(--surface-base, #0f0f0f)",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
    borderRadius: 8,
    padding: "10px 14px",
    color: "var(--text-primary, #fafafa)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s ease",
  } as React.CSSProperties,

  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
  } as React.CSSProperties,

  registerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  } as React.CSSProperties,

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 8,
  } as React.CSSProperties,

  skeletonContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    padding: 8,
  } as React.CSSProperties,

  modeToggle: {
    display: "inline-flex",
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
    marginBottom: 12,
  } as React.CSSProperties,

  modeButton: {
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
    outline: "none",
  } as React.CSSProperties,

  modeButtonActive: {
    background: "var(--brand-accent, #f97316)",
    color: "#fff",
  } as React.CSSProperties,

  modeButtonInactive: {
    background: "var(--surface-base, #0f0f0f)",
    color: "var(--text-secondary, #9ca3af)",
  } as React.CSSProperties,
} as const;

/* ── Component ──────────────────────────────────────────────────── */

export function TPVShiftPage() {
  const { t } = useTranslation("shift");
  const restaurantId = useTPVRestaurantId();
  const shift = useShift();
  const { formatAmount, currency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [operatorName, setOperatorName] = useState(t("page.defaultOperator", "Caixa TPV"));
  const [closingName, setClosingName] = useState(t("page.defaultOperator", "Caixa TPV"));
  const [acting, setActing] = useState(false);
  const [countMode, setCountMode] = useState<"detailed" | "quick">("detailed");

  const expectedBalanceCents = useMemo(() => {
    if (!register) return 0;
    return register.openingBalanceCents + register.totalSalesCents;
  }, [register]);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const openRegister = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      setRegister(openRegister);
      if (openRegister) {
        const expected =
          openRegister.openingBalanceCents + openRegister.totalSalesCents;
        setClosingCash((expected / 100).toFixed(2));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("error.loadCash");
      setError(msg);
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError(t("error.noRestaurant"));
      return;
    }
    loadRegister();
  }, [restaurantId, loadRegister]);

  const handleOpen = async () => {
    const value = Number.parseFloat(openingCash.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError(t("error.invalidOpening"));
      return;
    }
    setActing(true);
    setError(null);
    try {
      await CashRegisterEngine.openCashRegister({
        restaurantId,
        name: t("page.defaultRegisterName", "Caixa Principal"),
        openingBalanceCents: Math.round(value * 100),
        openedBy: operatorName || t("page.defaultOperator", "Caixa TPV"),
      });
      await shift.refreshShiftStatus();
      await loadRegister();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error.openGeneric");
      setError(msg);
    } finally {
      setActing(false);
    }
  };

  const handleClose = async () => {
    if (!register) return;
    const value = Number.parseFloat(closingCash.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError(t("error.invalidClosing"));
      return;
    }
    setActing(true);
    setError(null);
    try {
      await CashRegisterEngine.closeCashRegister({
        cashRegisterId: register.id,
        restaurantId,
        closingBalanceCents: Math.round(value * 100),
        closedBy: closingName || t("page.defaultOperator", "Caixa TPV"),
      });
      await shift.refreshShiftStatus();
      setRegister(null);
      setClosingCash("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error.closeFailed");
      setError(msg);
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={styles.header}>
        <h1 style={styles.title}>{t("page.title")}</h1>
        <p style={styles.subtitle}>{t("page.subtitle", "Abertura e fecho de caixa do turno actual.")}</p>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div style={{ marginBottom: 16 }}>
          <InlineAlert
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* ── Loading Skeleton ───────────────────────────────────── */}
      {loading && (
        <Card surface="layer1" padding="lg">
          <div style={styles.skeletonContainer}>
            <Skeleton variant="text" width="40%" height={20} />
            <div style={styles.kpiGrid}>
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="rectangular" height={80} />
            </div>
            <Skeleton variant="rectangular" height={44} width="30%" />
          </div>
        </Card>
      )}

      {/* ── Register OPEN — show KPIs + close form ─────────────── */}
      {!loading && register && (
        <Card surface="layer1" padding="lg">
          {/* Status row */}
          <div style={styles.registerHeader}>
            <div>
              <span
                style={{
                  ...styles.statusChip,
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "#4ade80",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block" }} />
                {t("page.registerOpen")}
              </span>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #fafafa)", marginTop: 8 }}>
                {register.name}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary, #9ca3af)", textAlign: "right" }}>
              {t("page.operatorLabel")}<br />
              <span style={{ fontWeight: 600, color: "var(--text-primary, #fafafa)" }}>
                {register.openedBy || t("page.defaultOperator", "Caixa TPV")}
              </span>
            </div>
          </div>

          {/* KPI cards */}
          <div style={styles.kpiGrid}>
            <KpiCard
              label={t("page.initialBalance")}
              value={formatAmount(register.openingBalanceCents)}
              icon="💰"
              state="healthy"
            />
            <KpiCard
              label={t("page.sales")}
              value={formatAmount(register.totalSalesCents)}
              icon="📊"
              state={register.totalSalesCents > 0 ? "healthy" : "warning"}
            />
            <KpiCard
              label={t("page.expectedBalance")}
              value={formatAmount(expectedBalanceCents)}
              icon="🎯"
              state="healthy"
            />
          </div>

          {/* Count mode toggle */}
          <div style={styles.modeToggle}>
            <button
              type="button"
              style={{
                ...styles.modeButton,
                ...(countMode === "detailed"
                  ? styles.modeButtonActive
                  : styles.modeButtonInactive),
              }}
              onClick={() => setCountMode("detailed")}
            >
              {t("denomination.modeDetailed", "Detalhado")}
            </button>
            <button
              type="button"
              style={{
                ...styles.modeButton,
                ...(countMode === "quick"
                  ? styles.modeButtonActive
                  : styles.modeButtonInactive),
              }}
              onClick={() => setCountMode("quick")}
            >
              {t("denomination.modeQuick", "Rapido")}
            </button>
          </div>

          {/* Close form */}
          {countMode === "detailed" ? (
            <div style={{ marginBottom: 16 }}>
              <DenominationCounter
                currency={currency}
                onChange={(totalCents) => {
                  setClosingCash((totalCents / 100).toFixed(2));
                }}
                expectedCents={expectedBalanceCents}
              />
            </div>
          ) : (
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t("page.closingBalanceLabel")}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.12))"; }}
                />
              </div>
            </div>
          )}

          {/* Closing operator name */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t("page.closingNameLabel")}</label>
              <input
                type="text"
                value={closingName}
                onChange={(e) => setClosingName(e.target.value)}
                style={styles.input}
                onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.12))"; }}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <Button
              variant="critical"
              size="md"
              onClick={handleClose}
              disabled={acting}
              loading={acting}
            >
              {t("page.closeButton")}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Register CLOSED — show open form ────────────────────── */}
      {!loading && !register && !error && (
        <Card surface="layer1" padding="lg">
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                ...styles.statusChip,
                backgroundColor: "rgba(156,163,175,0.12)",
                color: "#9ca3af",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#6b7280", display: "inline-block" }} />
              {t("page.registerClosed")}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #fafafa)", marginTop: 12, marginBottom: 0 }}>
              {t("page.openTitle", "Abrir Caixa")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary, #9ca3af)", marginTop: 4 }}>
              {t("page.openDescription", "Preencha o valor inicial e o nome do operador para abrir o turno.")}
            </p>
          </div>

          <div style={styles.formRow}>
            <div style={{ ...styles.formGroup, maxWidth: 260 }}>
              <label style={styles.label}>{t("page.initialBalance")}</label>
              <input
                type="text"
                inputMode="decimal"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                style={styles.input}
                onFocus={(e) => { e.target.style.borderColor = "#22c55e"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.12))"; }}
              />
            </div>
            <div style={{ ...styles.formGroup, maxWidth: 340 }}>
              <label style={styles.label}>{t("page.operatorLabel")}</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                style={styles.input}
                onFocus={(e) => { e.target.style.borderColor = "#22c55e"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle, rgba(255,255,255,0.12))"; }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 8 }}>
            <Button
              variant="constructive"
              size="md"
              onClick={handleOpen}
              disabled={acting}
              loading={acting}
            >
              {t("page.openButton")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
