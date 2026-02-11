/**
 * Owner Command Center — Dashboard de 10 segundos
 * Wireframe: docs/architecture/OWNER_DASHBOARD_WIREFRAME.md
 * COGNITIVE_MODES_OWNER_DASHBOARD: variant "web" = observatório (referência); variant "app" = Visão do Dono (cards grandes, estado ok/atenção/risco).
 * Rota: /owner/dashboard (web). AppStaff owner → variant="app".
 * UI (variant=app): scroll é do Shell; sem duplicar layout.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { currencyService } from "../../core/currency/CurrencyService";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { usePulseOptional } from "../../core/pulse";
import {
  DashboardService,
  type DailyMetrics,
  type LowStockItem,
} from "../../core/services/DashboardService";
import { useShift } from "../../core/shift/ShiftContext";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { radius } from "../../ui/design-system/tokens/radius";
import { spacing } from "../../ui/design-system/tokens/spacing";
import { useAppStaffOrders } from "./hooks/useAppStaffOrders";

type DayState = "excellent" | "stable" | "at_risk";

type FeedEventType = "sale" | "alert" | "shift" | "person" | "system";

interface FeedEvent {
  id: string;
  type: FeedEventType;
  message: string;
  at: Date;
  cta?: { label: string; to: string };
}

function formatCurrency(cents: number): string {
  return currencyService.formatAmount(cents);
}

function formatRelativeTime(at: Date): string {
  const sec = Math.floor((Date.now() - at.getTime()) / 1000);
  if (sec < 60) return "agora";
  if (sec < 3600) return `há ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `há ${Math.floor(sec / 3600)} h`;
  return at.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function deriveDayState(
  alertsCount: number,
  lowStockCount: number,
  _metrics: DailyMetrics | null,
): DayState {
  if (alertsCount > 0 || lowStockCount > 2) return "at_risk";
  if (lowStockCount > 0 || alertsCount === 0) return "stable";
  return "excellent";
}

export type OwnerDashboardVariant = "web" | "app";

interface OwnerDashboardProps {
  /** "web" = observatório denso (default). "app" = Visão do Dono, cards grandes, mais estado. */
  variant?: OwnerDashboardVariant;
}

/** @deprecated Use OwnerGlobalDashboard. This dashboard uses mock-only data. */
export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  variant = "web",
}) => {
  const navigate = useNavigate();
  const { identity } = useRestaurantIdentity();
  const shift = useShift();
  const pulseCtx = usePulseOptional();
  const { orders: appStaffOrders } = useAppStaffOrders(identity.id ?? null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!identity.id) {
      setLoading(false);
      return;
    }
    Promise.all([
      DashboardService.getDailyMetrics(identity.id),
      DashboardService.getLowStockItems(identity.id),
    ])
      .then(([m, ls]) => {
        setMetrics(m);
        setLowStock(ls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      DashboardService.getDailyMetrics(identity.id!)
        .then(setMetrics)
        .catch(console.error);
      DashboardService.getLowStockItems(identity.id!)
        .then(setLowStock)
        .catch(console.error);
    }, 30_000);
    return () => clearInterval(interval);
  }, [identity.id]);

  const activeOrdersCount = useMemo(
    () =>
      appStaffOrders.filter(
        (o) => o.status !== "PAID" && o.status !== "CANCELLED",
      ).length,
    [appStaffOrders],
  );

  const alertsCount = lowStock.length;
  const dayState = useMemo(
    () => deriveDayState(0, alertsCount, metrics),
    [alertsCount, metrics],
  );

  useEffect(() => {
    const tableLabel =
      appStaffOrders[0]?.table_number != null
        ? `Mesa ${appStaffOrders[0].table_number}`
        : "Takeaway";
    const mock: FeedEvent[] = [
      {
        id: "1",
        type: "sale",
        message: `Venda concluída — ${tableLabel}`,
        at: new Date(Date.now() - 2 * 60 * 1000),
        cta: { label: "Ver", to: "/admin/reports/sales" },
      },
      {
        id: "2",
        type: "alert",
        message:
          lowStock[0]?.name != null
            ? `Stock baixo: ${lowStock[0].name}`
            : "Sem alertas de stock",
        at: new Date(Date.now() - 5 * 60 * 1000),
        ...(lowStock.length > 0 && {
          cta: { label: "Resolver", to: "/inventory-stock" },
        }),
      },
      {
        id: "3",
        type: "shift",
        message: shift.isShiftOpen ? "Turno aberto" : "Turno fechado",
        at: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: "4",
        type: "sale",
        message: "Venda concluída — Takeaway",
        at: new Date(Date.now() - 22 * 60 * 1000),
      },
      {
        id: "5",
        type: "system",
        message: "TPV ativo",
        at: new Date(Date.now() - 45 * 60 * 1000),
      },
    ];
    setFeedEvents(mock);
  }, [appStaffOrders, lowStock, shift.isShiftOpen]);

  if (identity.loading || loading) {
    return (
      <div
        style={{
          ...(variant === "app"
            ? { flex: 1, minHeight: 0 }
            : { minHeight: "100vh" }),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface.base,
          color: colors.text.primary,
        }}
      >
        <Text size="sm" weight="bold" color="tertiary">
          A carregar...
        </Text>
      </div>
    );
  }

  const dayStateLabel =
    dayState === "excellent"
      ? "Excelente"
      : dayState === "stable"
      ? "Estável"
      : "Em risco";
  const dayStateBg =
    dayState === "excellent"
      ? "rgba(34, 197, 94, 0.15)"
      : dayState === "stable"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)";
  const dayStateBorder =
    dayState === "excellent"
      ? colors.success.base
      : dayState === "stable"
      ? colors.warning.base
      : colors.destructive.base;

  // ——— Variante App (Visão do Dono): scroll é do Shell; não definir altura viewport ———
  if (variant === "app") {
    const feedSlice = feedEvents.slice(0, 4);
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: colors.surface.base,
          color: colors.text.primary,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            padding: spacing.md,
            backgroundColor: colors.surface.layer1,
            borderBottom: `1px solid ${colors.border.subtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <Text size="md" weight="bold" color="primary">
            {identity.name || "Restaurante"}
          </Text>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: radius.md,
              backgroundColor: dayStateBg,
              border: `1px solid ${dayStateBorder}`,
              fontSize: "0.875rem",
              fontWeight: 600,
              color:
                dayState === "excellent"
                  ? colors.success.base
                  : dayState === "stable"
                  ? colors.warning.base
                  : colors.destructive.base,
            }}
          >
            {dayStateLabel}
          </span>
        </header>

        <main
          style={{
            padding: spacing.lg,
            display: "flex",
            flexDirection: "column",
            gap: spacing.lg,
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
            }}
          >
            <Card surface="layer2" padding="lg" style={{ padding: spacing.xl }}>
              <Text
                size="xs"
                color="tertiary"
                style={{ marginBottom: spacing.xs }}
              >
                Dinheiro agora
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: colors.success.base,
                  }}
                />
                <Text size="xl" weight="bold" color="primary">
                  OK
                </Text>
              </div>
              <Text
                size="sm"
                color="secondary"
                style={{ marginTop: spacing.xs }}
              >
                Vendas do dia em ordem
              </Text>
            </Card>

            <Card
              surface="layer2"
              padding="lg"
              style={{
                padding: spacing.xl,
                borderLeft: pulseCtx?.snapshot
                  ? `3px solid ${
                      pulseCtx.snapshot.zone === "FLOW_ALTO"
                        ? colors.destructive.base
                        : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                        ? colors.warning.base
                        : colors.success.base
                    }`
                  : undefined,
              }}
            >
              <Text
                size="xs"
                color="tertiary"
                style={{ marginBottom: spacing.xs }}
              >
                Motor da operação
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: shift.isShiftOpen
                      ? colors.success.base
                      : colors.warning.base,
                  }}
                />
                <Text size="xl" weight="bold" color="primary">
                  {shift.isShiftOpen ? "Aberto" : "Fechado"}
                </Text>
                {pulseCtx?.snapshot && (
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "2px 8px",
                      borderRadius: radius.md,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor:
                        pulseCtx.snapshot.zone === "FLOW_ALTO"
                          ? "rgba(239,68,68,0.15)"
                          : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(34,197,94,0.15)",
                      color:
                        pulseCtx.snapshot.zone === "FLOW_ALTO"
                          ? colors.destructive.base
                          : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                          ? colors.warning.base
                          : colors.success.base,
                    }}
                  >
                    {pulseCtx.snapshot.zone === "FLOW_ALTO"
                      ? "🔴 Rush"
                      : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                      ? "🟡 Parcial"
                      : "🟢 Calmo"}{" "}
                    {pulseCtx.snapshot.score}
                  </span>
                )}
              </div>
              <Text
                size="sm"
                color="secondary"
                style={{ marginTop: spacing.xs }}
              >
                Turno · Fila: {activeOrdersCount}
              </Text>
            </Card>

            <Card surface="layer2" padding="lg" style={{ padding: spacing.xl }}>
              <Text
                size="xs"
                color="tertiary"
                style={{ marginBottom: spacing.xs }}
              >
                Pessoas & disciplina
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: colors.success.base,
                  }}
                />
                <Text size="xl" weight="bold" color="primary">
                  OK
                </Text>
              </div>
              <Text
                size="sm"
                color="secondary"
                style={{ marginTop: spacing.xs }}
              >
                Tudo em ordem
              </Text>
            </Card>

            <Card surface="layer2" padding="lg" style={{ padding: spacing.xl }}>
              <Text
                size="xs"
                color="tertiary"
                style={{ marginBottom: spacing.xs }}
              >
                Risco & tendência
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      alertsCount === 0
                        ? colors.success.base
                        : colors.warning.base,
                  }}
                />
                <Text size="xl" weight="bold" color="primary">
                  {alertsCount === 0 ? "OK" : "Atenção"}
                </Text>
              </div>
              <Text
                size="sm"
                color="secondary"
                style={{ marginTop: spacing.xs }}
              >
                {alertsCount === 0 ? "Sem alertas" : `${alertsCount} aviso(s)`}
              </Text>
            </Card>
          </section>

          <section>
            <Text
              size="xs"
              weight="bold"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Últimos eventos
            </Text>
            <Card surface="layer1" padding="md">
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {feedSlice.map((ev) => (
                  <li
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing.sm,
                      padding: spacing.sm,
                      borderBottom: `1px solid ${colors.border.subtle}`,
                    }}
                  >
                    <span style={{ fontSize: "0.875rem" }}>
                      {ev.type === "sale"
                        ? "💰"
                        : ev.type === "alert"
                        ? "⚠️"
                        : ev.type === "shift"
                        ? "🕐"
                        : "🔧"}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.875rem",
                        color: colors.text.primary,
                      }}
                    >
                      {ev.message}
                    </span>
                    <Text size="xs" color="tertiary">
                      {formatRelativeTime(ev.at)}
                    </Text>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </main>
      </div>
    );
  }

  // ——— Variante Web (observatório): referência do wireframe ———
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
      }}
    >
      {/* ——— Zona 1: Header de estado (sticky) ——— */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          padding: spacing.lg,
          backgroundColor: colors.surface.layer1,
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        {identity.logoUrl ? (
          <img
            src={identity.logoUrl}
            alt="Logo"
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.full,
              objectFit: "cover",
              border: `2px solid ${colors.border.subtle}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.full,
              backgroundColor: colors.surface.layer2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 700,
              color: colors.text.secondary,
            }}
          >
            {(identity.name || "R").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="lg" weight="bold" color="primary">
            {identity.name || "Restaurante"}
          </Text>
          <Text size="sm" color="secondary">
            {identity.city || "Operação local"}
          </Text>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.md,
            flexWrap: "wrap",
          }}
        >
          <Text size="sm" color="tertiary">
            {currentTime.toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            {currentTime.toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: radius.md,
              backgroundColor: dayStateBg,
              border: `1px solid ${dayStateBorder}`,
              fontSize: "0.8125rem",
              fontWeight: 600,
              color:
                dayState === "excellent"
                  ? colors.success.base
                  : dayState === "stable"
                  ? colors.warning.base
                  : colors.destructive.base,
            }}
          >
            {dayStateLabel}
          </span>
          <div style={{ display: "flex", gap: spacing.lg }}>
            <div>
              <Text size="xs" color="tertiary">
                Vendas hoje
              </Text>
              <Text size="sm" weight="bold" color="primary">
                {formatCurrency(metrics?.totalSalesCents ?? 0)}
              </Text>
            </div>
            <div>
              <Text size="xs" color="tertiary">
                Turno
              </Text>
              <Text size="sm" weight="bold" color="primary">
                {shift.isShiftOpen ? "Aberto" : "Fechado"}
              </Text>
            </div>
            <div>
              <Text size="xs" color="tertiary">
                Alertas
              </Text>
              <Text
                size="sm"
                weight="bold"
                color={alertsCount > 0 ? "destructive" : "primary"}
              >
                {alertsCount}
              </Text>
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.xl,
        }}
      >
        {/* ——— Zona 2: Grelha 2×2 ——— */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: spacing.lg,
          }}
        >
          {/* Painel 1 — Dinheiro agora */}
          <Card
            surface="layer2"
            padding="lg"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>💰</span>
              <Text size="md" weight="bold" color="primary">
                Dinheiro agora
              </Text>
            </div>
            <Text
              size="xs"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Vendas, caixa e liquidez do dia
            </Text>
            <Text
              size="2xl"
              weight="bold"
              color="success"
              style={{ marginBottom: spacing.sm }}
            >
              {formatCurrency(metrics?.totalSalesCents ?? 0)}
            </Text>
            <ul
              style={{
                margin: 0,
                paddingLeft: spacing.md,
                color: colors.text.secondary,
                fontSize: "0.875rem",
              }}
            >
              <li>
                Faturado hoje: {formatCurrency(metrics?.totalSalesCents ?? 0)}
              </li>
              <li>Pedidos: {metrics?.totalOrders ?? 0}</li>
              <li>
                Ticket médio: {formatCurrency(metrics?.avgTicketCents ?? 0)}
              </li>
            </ul>
            <Link
              to="/admin/reports/overview"
              style={{
                marginTop: "auto",
                paddingTop: spacing.md,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: colors.action.base,
                textDecoration: "none",
              }}
            >
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 2 — Motor da operação */}
          <Card
            surface="layer2"
            padding="lg"
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: pulseCtx?.snapshot
                ? `3px solid ${
                    pulseCtx.snapshot.zone === "FLOW_ALTO"
                      ? colors.destructive.base
                      : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                      ? colors.warning.base
                      : colors.success.base
                  }`
                : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>⚙️</span>
              <Text size="md" weight="bold" color="primary">
                Motor da operação
              </Text>
              {pulseCtx?.snapshot && (
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    borderRadius: radius.md,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor:
                      pulseCtx.snapshot.zone === "FLOW_ALTO"
                        ? "rgba(239,68,68,0.15)"
                        : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(34,197,94,0.15)",
                    color:
                      pulseCtx.snapshot.zone === "FLOW_ALTO"
                        ? colors.destructive.base
                        : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                        ? colors.warning.base
                        : colors.success.base,
                  }}
                >
                  {pulseCtx.snapshot.zone === "FLOW_ALTO"
                    ? "🔴 Rush"
                    : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                    ? "🟡 Parcial"
                    : "🟢 Calmo"}{" "}
                  {pulseCtx.snapshot.score}
                </span>
              )}
            </div>
            <Text
              size="xs"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Turno, TPV, KDS e fila
            </Text>
            <Text
              size="sm"
              weight="bold"
              color="primary"
              style={{ marginBottom: spacing.sm }}
            >
              {shift.isShiftOpen ? "Turno aberto" : "Turno fechado"}
            </Text>
            <ul
              style={{
                margin: 0,
                paddingLeft: spacing.md,
                color: colors.text.secondary,
                fontSize: "0.875rem",
              }}
            >
              <li>TPV ativo</li>
              <li>KDS ativo</li>
              <li>Pedidos em fila: {activeOrdersCount}</li>
            </ul>
            <Link
              to="/admin/reports/operations"
              style={{
                marginTop: "auto",
                paddingTop: spacing.md,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: colors.action.base,
                textDecoration: "none",
              }}
            >
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 3 — Pessoas & disciplina */}
          <Card
            surface="layer2"
            padding="lg"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>👥</span>
              <Text size="md" weight="bold" color="primary">
                Pessoas & disciplina
              </Text>
            </div>
            <Text
              size="xs"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Equipa presente e tarefas em dia
            </Text>
            <Text
              size="xl"
              weight="bold"
              color="primary"
              style={{ marginBottom: spacing.sm }}
            >
              — presentes
            </Text>
            <Text
              size="sm"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Tarefas em atraso: 0 · Tudo em ordem
            </Text>
            <Link
              to="/admin/reports/staff"
              style={{
                marginTop: "auto",
                paddingTop: spacing.md,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: colors.action.base,
                textDecoration: "none",
              }}
            >
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 4 — Risco & tendência */}
          <Card
            surface="layer2"
            padding="lg"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>📈</span>
              <Text size="md" weight="bold" color="primary">
                Risco & tendência
              </Text>
            </div>
            <Text
              size="xs"
              color="tertiary"
              style={{ marginBottom: spacing.sm }}
            >
              Alertas e tendência do dia
            </Text>
            <Text
              size="lg"
              weight="bold"
              style={{
                color:
                  alertsCount === 0 ? colors.success.base : colors.warning.base,
                marginBottom: spacing.sm,
              }}
            >
              {alertsCount === 0
                ? "0 alertas críticos"
                : `${alertsCount} avisos`}
            </Text>
            {lowStock.length > 0 ? (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing.md,
                  color: colors.text.secondary,
                  fontSize: "0.875rem",
                }}
              >
                {lowStock.slice(0, 3).map((i) => (
                  <li key={i.id}>Stock baixo: {i.name}</li>
                ))}
              </ul>
            ) : (
              <Text size="sm" color="tertiary">
                Sem alertas
              </Text>
            )}
            <Link
              to="/admin/reports/overview"
              style={{
                marginTop: "auto",
                paddingTop: spacing.md,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: colors.action.base,
                textDecoration: "none",
              }}
            >
              Ver detalhe →
            </Link>
          </Card>
        </section>

        {/* ——— Zona 3: Feed de eventos ——— */}
        <section>
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            style={{ marginBottom: spacing.sm }}
          >
            O que acabou de acontecer
          </Text>
          <Card surface="layer1" padding="md">
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {feedEvents.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    borderBottom: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {ev.type === "sale"
                      ? "💰"
                      : ev.type === "alert"
                      ? "⚠️"
                      : ev.type === "shift"
                      ? "🕐"
                      : ev.type === "person"
                      ? "👤"
                      : "🔧"}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.875rem",
                      color: colors.text.primary,
                    }}
                  >
                    {ev.message}
                  </span>
                  <Text size="xs" color="tertiary">
                    {formatRelativeTime(ev.at)}
                  </Text>
                  {ev.cta && (
                    <button
                      type="button"
                      onClick={() => navigate(ev.cta!.to)}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: colors.action.base,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      {ev.cta.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
};
