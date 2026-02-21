/**
 * Owner Command Center — Dashboard de 10 segundos
 * Wireframe: docs/architecture/OWNER_DASHBOARD_WIREFRAME.md
 * COGNITIVE_MODES_OWNER_DASHBOARD: variant "web" = observatório (referência); variant "app" = Visão do Dono (cards grandes, estado ok/atenção/risco).
 * Rota: /owner/dashboard (web). AppStaff owner → variant="app".
 * UI (variant=app): scroll é do Shell; sem duplicar layout.
 */
// @ts-nocheck


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
import { Card } from "../../ui/design-system/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { useAppStaffOrders } from "./hooks/useAppStaffOrders";
import styles from "./OwnerDashboard.module.css";

type DayState = "excellent" | "stable" | "at_risk";

type FeedEventType = "sale" | "alert" | "shift" | "person" | "system";

interface FeedEvent {
  id: string;
  type: FeedEventType;
  message: string;
  at: Date;
  cta?: { label: string; to: string };
}

interface OwnerDashboardProps {
  variant?: "app" | "web";
}

const formatCurrency = (cents: number) => currencyService.formatAmount(cents);

const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} d`;
};

const deriveDayState = (
  riskScore: number,
  alertsCount: number,
  metrics: DailyMetrics | null,
): DayState => {
  if (alertsCount > 0 || riskScore > 0) return "at_risk";
  if (!metrics) return "stable";
  if (metrics.totalSalesCents <= 0 || metrics.totalOrders <= 0) return "stable";
  return "excellent";
};

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  variant = "web",
}) => {
  const navigate = useNavigate();
  const { identity } = useRestaurantIdentity();
  const shift = useShift();
  const pulseCtx = usePulseOptional();
  const { orders: appStaffOrders } = useAppStaffOrders(identity.id);

  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identity.id) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadMetrics = async () => {
      try {
        const data = await DashboardService.getDailyMetrics(identity.id!);
        if (active) setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadLowStock = async () => {
      try {
        const items = await DashboardService.getLowStockItems(identity.id!);
        if (active) setLowStock(items);
      } catch (err) {
        console.error(err);
      }
    };

    setLoading(true);
    loadMetrics();
    loadLowStock();

    const interval = setInterval(() => {
      loadMetrics();
      loadLowStock();
    }, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [identity.id]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const activeOrdersCount = useMemo(
    () =>
      appStaffOrders.filter(
        (order) => order.status !== "PAID" && order.status !== "CANCELLED",
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
        : "Balcão";
    const includeCta = variant === "web";

    const mock: FeedEvent[] = [
      {
        id: "1",
        type: "sale",
        message: `Pedido em aberto — ${tableLabel}`,
        at: new Date(Date.now() - 5 * 60 * 1000),
      },
    ];

    if (lowStock.length > 0) {
      mock.push({
        id: "2",
        type: "alert",
        message: `Stock baixo: ${lowStock[0].name}`,
        at: new Date(Date.now() - 9 * 60 * 1000),
        ...(includeCta
          ? {
              cta: {
                label: "Ver detalhe",
                to: "/admin/reports/overview",
              },
            }
          : {}),
      });
    }

    mock.push(
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
    );
    setFeedEvents(mock);
  }, [appStaffOrders, lowStock, shift.isShiftOpen, variant]);

  if (identity.loading || loading) {
    return (
      <div
        className={`${styles.loadingShell} ${
          variant === "app" ? styles.loadingApp : styles.loadingWeb
        }`}
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
  const dayStateClass =
    dayState === "excellent"
      ? styles.dayStateExcellent
      : dayState === "stable"
      ? styles.dayStateStable
      : styles.dayStateRisk;
  const pulseZone = pulseCtx?.snapshot?.zone;
  const pulseBorderClass = pulseZone
    ? pulseZone === "FLOW_ALTO"
      ? styles.pulseBorderHigh
      : pulseZone === "FLOW_PARCIAL"
      ? styles.pulseBorderMedium
      : styles.pulseBorderLow
    : "";
  const pulseBadgeClass = pulseZone
    ? pulseZone === "FLOW_ALTO"
      ? styles.pulseHigh
      : pulseZone === "FLOW_PARCIAL"
      ? styles.pulseMedium
      : styles.pulseLow
    : "";

  // ——— Variante App (Visão do Dono): scroll é do Shell; não definir altura viewport ———
  if (variant === "app") {
    const feedSlice = feedEvents.slice(0, 4);
    return (
      <div className={styles.appRoot}>
        <header className={styles.appHeader}>
          <Text size="md" weight="bold" color="primary">
            {identity.name || "Restaurante"}
          </Text>
          <span className={`${styles.dayStatePill} ${dayStateClass}`}>
            {dayStateLabel}
          </span>
        </header>

        <main className={styles.appMain}>
          <section className={styles.appSection}>
            <Card surface="layer2" padding="xl" className={styles.cardColumn}>
              <Text size="xs" color="tertiary" className={styles.cardHeaderTop}>
                Dinheiro agora
              </Text>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.cardDot} ${styles.cardDotSuccess}`}
                />
                <Text size="xl" weight="bold" color="primary">
                  OK
                </Text>
              </div>
              <Text size="sm" color="secondary" className={styles.cardNote}>
                Vendas do dia em ordem
              </Text>
            </Card>

            <Card
              surface="layer2"
              padding="xl"
              className={`${styles.cardColumn} ${pulseBorderClass}`}
            >
              <Text size="xs" color="tertiary" className={styles.cardHeaderTop}>
                Motor da operação
              </Text>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.cardDot} ${
                    shift.isShiftOpen
                      ? styles.cardDotSuccess
                      : styles.cardDotWarning
                  }`}
                />
                <Text size="xl" weight="bold" color="primary">
                  {shift.isShiftOpen ? "Aberto" : "Fechado"}
                </Text>
                {pulseCtx?.snapshot && (
                  <span className={`${styles.pulseBadge} ${pulseBadgeClass}`}>
                    {pulseCtx.snapshot.zone === "FLOW_ALTO"
                      ? "🔴 Rush"
                      : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                      ? "🟡 Parcial"
                      : "🟢 Calmo"}{" "}
                    {pulseCtx.snapshot.score}
                  </span>
                )}
              </div>
              <Text size="sm" color="secondary" className={styles.cardNote}>
                Turno · Fila: {activeOrdersCount}
              </Text>
            </Card>

            <Card surface="layer2" padding="xl" className={styles.cardColumn}>
              <Text size="xs" color="tertiary" className={styles.cardHeaderTop}>
                Pessoas & disciplina
              </Text>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.cardDot} ${styles.cardDotSuccess}`}
                />
                <Text size="xl" weight="bold" color="primary">
                  OK
                </Text>
              </div>
              <Text size="sm" color="secondary" className={styles.cardNote}>
                Tudo em ordem
              </Text>
            </Card>

            <Card surface="layer2" padding="xl" className={styles.cardColumn}>
              <Text size="xs" color="tertiary" className={styles.cardHeaderTop}>
                Risco & tendência
              </Text>
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.cardDot} ${
                    alertsCount === 0
                      ? styles.cardDotSuccess
                      : styles.cardDotWarning
                  }`}
                />
                <Text size="xl" weight="bold" color="primary">
                  {alertsCount === 0 ? "OK" : "Atenção"}
                </Text>
              </div>
              <Text size="sm" color="secondary" className={styles.cardNote}>
                {alertsCount === 0 ? "Sem alertas" : `${alertsCount} aviso(s)`}
              </Text>
            </Card>
          </section>

          <section>
            <Text
              size="xs"
              weight="bold"
              color="tertiary"
              className={styles.feedTitle}
            >
              Últimos eventos
            </Text>
            <Card surface="layer1" padding="md">
              <ul className={styles.feedList}>
                {feedSlice.map((ev) => (
                  <li key={ev.id} className={styles.feedItem}>
                    <span className={styles.feedIcon}>
                      {ev.type === "sale"
                        ? "💰"
                        : ev.type === "alert"
                        ? "⚠️"
                        : ev.type === "shift"
                        ? "🕐"
                        : "🔧"}
                    </span>
                    <span className={styles.feedMessage}>{ev.message}</span>
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
    <div className={styles.webRoot}>
      {/* ——— Zona 1: Header de estado (sticky) ——— */}
      <header className={styles.webHeader}>
        {identity.logoUrl ? (
          <img src={identity.logoUrl} alt="Logo" className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback}>
            {(identity.name || "R").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className={styles.headerInfo}>
          <Text size="lg" weight="bold" color="primary">
            {identity.name || "Restaurante"}
          </Text>
          <Text size="sm" color="secondary">
            {identity.city || "Operação local"}
          </Text>
        </div>
        <div className={styles.headerMeta}>
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
          <span className={`${styles.dayStatePill} ${dayStateClass}`}>
            {dayStateLabel}
          </span>
          <div className={styles.headerStats}>
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

      <main className={styles.webMain}>
        {/* ——— Zona 2: Grelha 2×2 ——— */}
        <section className={styles.webGrid}>
          {/* Painel 1 — Dinheiro agora */}
          <Card surface="layer2" padding="lg" className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>💰</span>
              <Text size="md" weight="bold" color="primary">
                Dinheiro agora
              </Text>
            </div>
            <Text size="xs" color="tertiary" className={styles.panelSubtext}>
              Vendas, caixa e liquidez do dia
            </Text>
            <Text
              size="2xl"
              weight="bold"
              color="success"
              className={styles.panelValue}
            >
              {formatCurrency(metrics?.totalSalesCents ?? 0)}
            </Text>
            <ul className={styles.panelList}>
              <li>
                Faturado hoje: {formatCurrency(metrics?.totalSalesCents ?? 0)}
              </li>
              <li>Pedidos: {metrics?.totalOrders ?? 0}</li>
              <li>
                Ticket médio: {formatCurrency(metrics?.avgTicketCents ?? 0)}
              </li>
            </ul>
            <Link to="/admin/reports/overview" className={styles.panelLink}>
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 2 — Motor da operação */}
          <Card
            surface="layer2"
            padding="lg"
            className={`${styles.panelCard} ${pulseBorderClass}`}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>⚙️</span>
              <Text size="md" weight="bold" color="primary">
                Motor da operação
              </Text>
              {pulseCtx?.snapshot && (
                <span className={`${styles.pulseBadge} ${pulseBadgeClass}`}>
                  {pulseCtx.snapshot.zone === "FLOW_ALTO"
                    ? "🔴 Rush"
                    : pulseCtx.snapshot.zone === "FLOW_PARCIAL"
                    ? "🟡 Parcial"
                    : "🟢 Calmo"}{" "}
                  {pulseCtx.snapshot.score}
                </span>
              )}
            </div>
            <Text size="xs" color="tertiary" className={styles.panelSubtext}>
              Turno, TPV, KDS e fila
            </Text>
            <Text
              size="sm"
              weight="bold"
              color="primary"
              className={styles.panelValue}
            >
              {shift.isShiftOpen ? "Turno aberto" : "Turno fechado"}
            </Text>
            <ul className={styles.panelList}>
              <li>TPV ativo</li>
              <li>KDS ativo</li>
              <li>Pedidos em fila: {activeOrdersCount}</li>
            </ul>
            <Link to="/admin/reports/operations" className={styles.panelLink}>
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 3 — Pessoas & disciplina */}
          <Card surface="layer2" padding="lg" className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>👥</span>
              <Text size="md" weight="bold" color="primary">
                Pessoas & disciplina
              </Text>
            </div>
            <Text size="xs" color="tertiary" className={styles.panelSubtext}>
              Equipa presente e tarefas em dia
            </Text>
            <Text
              size="xl"
              weight="bold"
              color="primary"
              className={styles.panelValue}
            >
              — presentes
            </Text>
            <Text size="sm" color="tertiary" className={styles.panelSubtext}>
              Tarefas em atraso: 0 · Tudo em ordem
            </Text>
            <Link to="/admin/reports/staff" className={styles.panelLink}>
              Ver detalhe →
            </Link>
          </Card>

          {/* Painel 4 — Risco & tendência */}
          <Card surface="layer2" padding="lg" className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>📈</span>
              <Text size="md" weight="bold" color="primary">
                Risco & tendência
              </Text>
            </div>
            <Text size="xs" color="tertiary" className={styles.panelSubtext}>
              Alertas e tendência do dia
            </Text>
            <Text
              size="lg"
              weight="bold"
              color="primary"
              className={`${styles.panelValue} ${
                alertsCount === 0 ? styles.alertOk : styles.alertWarn
              }`}
            >
              {alertsCount === 0
                ? "0 alertas críticos"
                : `${alertsCount} avisos`}
            </Text>
            {lowStock.length > 0 ? (
              <ul className={styles.panelList}>
                {lowStock.slice(0, 3).map((i) => (
                  <li key={i.id}>Stock baixo: {i.name}</li>
                ))}
              </ul>
            ) : (
              <Text size="sm" color="tertiary">
                Sem alertas
              </Text>
            )}
            <Link to="/admin/reports/overview" className={styles.panelLink}>
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
            className={styles.feedTitle}
          >
            O que acabou de acontecer
          </Text>
          <Card surface="layer1" padding="md">
            <ul className={styles.feedListScrollable}>
              {feedEvents.map((ev) => (
                <li key={ev.id} className={styles.feedItem}>
                  <span className={styles.panelIcon}>
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
                  <span className={styles.feedMessage}>{ev.message}</span>
                  <Text size="xs" color="tertiary">
                    {formatRelativeTime(ev.at)}
                  </Text>
                  {ev.cta && (
                    <button
                      type="button"
                      onClick={() => navigate(ev.cta!.to)}
                      className={styles.ctaButton}
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
