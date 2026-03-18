import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { getFormatLocale } from "../../../core/i18n/regionLocaleConfig";
import { useFormatLocale } from "../../../core/i18n/useFormatLocale";
import { usePulseOptional } from "../../../core/pulse";
import { useDailyMetrics } from "../../../hooks/useDailyMetrics";
import { useShiftHistory } from "../../../hooks/useShiftHistory";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";
import { useStockAlerts } from "../hooks/useStockAlerts";
import {
  buildFinancialAlerts,
  deriveFinancialSnapshot,
  getLatestShift,
} from "./ownerGlobalDashboardUtils";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

const theme = colors.modes.dashboard;

type SystemStatusTone = "up" | "degraded" | "down" | "unknown";

const STATUS_TONE_MAP: Record<
  SystemStatusTone,
  { label: string; color: string; bg: string }
> = {
  up: {
    label: "UP",
    color: theme.success.base,
    bg: "rgba(34, 197, 94, 0.12)",
  },
  degraded: {
    label: "DEGRADED",
    color: theme.warning.base,
    bg: "rgba(245, 158, 11, 0.12)",
  },
  down: {
    label: "DOWN",
    color: theme.destructive.base,
    bg: "rgba(239, 68, 68, 0.12)",
  },
  unknown: {
    label: "UNKNOWN",
    color: theme.text.tertiary,
    bg: "rgba(148, 163, 184, 0.12)",
  },
};

export function OwnerGlobalDashboard() {
  const {
    coreRestaurantId,
    operationalContract,
    shiftState,
    activeStaffCount,
    tasks,
    employees,
    specDrifts,
    currentRiskLevel,
    shiftStart,
    activeRole,
    shiftMetrics,
  } = useStaff();
  const { status: coreStatus } = useCoreHealth();
  const pulse = usePulseOptional();
  const { data: dailyMetrics, loading: dailyLoading } = useDailyMetrics(
    coreRestaurantId,
    "ACTIVE",
  );
  const { data: shiftHistory, loading: historyLoading } = useShiftHistory(
    coreRestaurantId,
    { daysBack: 7 },
  );
  const {
    alerts: stockAlerts,
    loading: stockLoading,
    error: stockError,
  } = useStockAlerts(coreRestaurantId);
  const navigate = useNavigate();
  const locale = useFormatLocale();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Hooks must be called before any early returns
  const hourlySeries = useMemo(
    () => buildHourlySeries(dailyMetrics?.sales_by_hour ?? []),
    [dailyMetrics?.sales_by_hour],
  );

  if (activeRole !== "owner") {
    return <Navigate to={`/app/staff/home/${activeRole}`} replace />;
  }

  const restaurantName =
    operationalContract?.name ??
    operationalContract?.storeName ??
    "Restaurante";

  const systemTone: SystemStatusTone =
    coreStatus === "UP"
      ? "up"
      : coreStatus === "DEGRADED"
      ? "degraded"
      : coreStatus === "DOWN"
      ? "down"
      : "unknown";
  const systemStatus = STATUS_TONE_MAP[systemTone];

  const shiftLabel =
    shiftState === "active"
      ? "Ativo"
      : shiftState === "closing"
      ? "Fechando"
      : "Fechado";

  const nowDate = now.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const nowTime = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const financialSnapshot = deriveFinancialSnapshot(shiftHistory, now);
  const hasShiftHistory = shiftHistory.length > 0;
  const latestShift = getLatestShift(shiftHistory);
  const hasDailyMetrics = !!dailyMetrics;
  const cashStatus = shiftState === "active" ? "Caixa aberto" : "Caixa fechado";
  const cashBalanceCents =
    latestShift?.closing_balance_cents ??
    latestShift?.opening_balance_cents ??
    null;
  const financialAlerts = buildFinancialAlerts(financialSnapshot);
  const hasHourlyData = hourlySeries.some((item) => item.total_cents > 0);

  const todayCents = hasDailyMetrics
    ? dailyMetrics.total_sales_cents
    : financialSnapshot.todayCents;
  const totalOrders = dailyMetrics?.total_orders ?? 0;
  const avgTicketCents = dailyMetrics?.avg_ticket_cents ?? 0;

  const orderTasks = tasks.filter(
    (t) => t.type === "order" && t.status !== "done",
  );
  const prepAvgMinutes = orderTasks.length
    ? Math.round(
        orderTasks.reduce((acc, t) => acc + (Date.now() - t.createdAt), 0) /
          orderTasks.length /
          60000,
      )
    : null;

  const operationStatus =
    currentRiskLevel >= 70
      ? "Crítico"
      : currentRiskLevel >= 40
      ? "Atenção"
      : "Normal";

  const operationGaps = getOperationGaps({
    specDriftsCount: specDrifts.length,
    shiftLoad: shiftMetrics.status,
    coreStatus,
    ordersCount: orderTasks.length,
  });

  const activeEmployees = employees.filter((e) => e.active).length;
  const tasksTodayDone = tasks.filter(
    (t) => t.status === "done" && isToday(t.completedAt),
  ).length;
  const tasksPending = tasks.filter((t) => t.status !== "done").length;
  const tasksCritical = tasks.filter(
    (t) => t.status !== "done" && t.priority === "critical",
  ).length;
  const hoursSinceShiftStart = shiftStart
    ? Math.max((Date.now() - shiftStart) / 3600000, 1)
    : 1;
  const tasksPerHour = Math.round(tasksTodayDone / hoursSinceShiftStart);

  const rolesInAction = Array.from(
    new Set(
      tasks
        .filter((t) => t.status !== "done" && t.assigneeRole)
        .map((t) => t.assigneeRole),
    ),
  ) as Array<(typeof tasks)[number]["assigneeRole"]>;

  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const cleaningDone = cleaningTasks.filter((t) => t.status === "done").length;
  const cleaningPending = cleaningTasks.filter((t) => t.status !== "done");

  const financialSubtitle = dailyLoading
    ? "Atualizando..."
    : hasDailyMetrics
    ? "Dados em tempo real · Core"
    : hasShiftHistory
    ? "Baseado em turnos · Core"
    : "Conecte ao Core para dados em tempo real";
  const financialAlertItems = hasShiftHistory
    ? financialAlerts.length
      ? financialAlerts
      : ["Sem alertas financeiros"]
    : historyLoading
    ? ["Carregando alertas financeiros"]
    : ["Sem dados financeiros do Core"];

  const pulseSnapshot = pulse?.snapshot ?? null;
  const pulseZone = pulseSnapshot?.zone ?? "idle";
  const pulseScore = pulseSnapshot?.score ?? null;
  const pulseTone = getPulseTone(pulseZone);
  const pulseLabel = pulseSnapshot ? pulseTone.label : "Sem pulso";
  const pulseHint = pulseScore !== null ? `${pulseScore}/100` : "";

  // Operational status badge
  const operationalStatusValue = deriveOperationalStatus({
    coreStatus,
    pulseZone,
    activeOrders: orderTasks.length,
    criticalAlerts: tasksCritical,
    shiftState,
  });
  const operationalStatusTone = OPERATIONAL_STATUS_MAP[operationalStatusValue];

  // Financial narrative
  const financialNarrative = deriveFinancialNarrative({
    todayCents,
    avg7dCents: financialSnapshot.avg7dCents,
    yesterdayCents: financialSnapshot.yesterdayCents,
    hasHistory: hasShiftHistory,
  });

  // Executive alerts
  const historicalAvgTicketCents = hasShiftHistory
    ? Math.round(financialSnapshot.avg7dCents / (totalOrders || 1))
    : 0;
  const shiftDurationHours = shiftStart
    ? (Date.now() - shiftStart) / 3600000
    : 0;
  const executiveAlerts = deriveExecutiveAlerts({
    avgTicketCents,
    historicalAvgTicketCents,
    hourlySeries,
    shiftDurationHours,
  });

  // Current hour for chart reference line
  const currentHour = now.getHours();

  // Improved cash hint
  const cashHint =
    shiftState === "active"
      ? cashBalanceCents !== null
        ? `${formatCurrency(cashBalanceCents / 100)} (parcial)`
        : "Saldo ao fechar turno"
      : "Fechado";

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: 20,
        width: "100%",
        paddingBottom: 100,
      }}
    >
      {/* ── Status strip — compact operational overview ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 0 0",
        }}
      >
        {/* Date + status badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
          }}
        >
          <span style={{ color: theme.text.secondary, fontWeight: 500 }}>
            {nowDate} • {nowTime}
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              background: systemStatus.bg,
              color: systemStatus.color,
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.04em",
            }}
          >
            {systemStatus.label}
          </span>
          {pulseSnapshot && (
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                background: pulseTone.bg,
                color: pulseTone.color,
                fontWeight: 600,
                fontSize: 10,
              }}
            >
              {pulseLabel}
              {pulseHint ? ` · ${pulseHint}` : ""}
            </span>
          )}
        </div>

        {/* Operational status — prominent */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            backgroundColor: `${operationalStatusTone.color}08`,
            border: `1px solid ${operationalStatusTone.color}18`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>{operationalStatusTone.icon}</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: operationalStatusTone.color,
            }}
          >
            {operationalStatusTone.label}
          </span>
        </div>
      </div>

      <Section title="Financeiro" subtitle={financialSubtitle}>
        {/* Financial Hero Block */}
        <div
          style={{
            padding: "20px",
            borderRadius: 14,
            backgroundColor: theme.surface.layer1,
            border: `1px solid ${theme.action.base}15`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.text.tertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Vendas hoje
            </span>
            <span
              style={{
                fontSize: 11,
                color: theme.text.tertiary,
              }}
            >
              {cashStatus}
            </span>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.text.primary,
              marginBottom: 8,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {dailyLoading
              ? "…"
              : hasDailyMetrics
              ? formatCurrency(todayCents / 100)
              : coreRestaurantId
              ? "R$ —"
              : "R$ 0"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {!dailyLoading && !hasDailyMetrics && coreRestaurantId && (
              <span style={{ fontSize: 13, color: theme.text.secondary }}>
                Aguardando dados do Core
              </span>
            )}
            {!dailyLoading && hasDailyMetrics && todayCents === 0 && (
              <span style={{ fontSize: 13, color: theme.text.secondary }}>
                Nenhuma venda registada
              </span>
            )}
            {hasDailyMetrics && todayCents > 0 && (
              <>
                <span style={{ fontSize: 13, color: theme.text.secondary }}>
                  {financialNarrative.vs7dPhrase}
                </span>
                <span style={{ fontSize: 13, color: theme.text.secondary }}>
                  {financialNarrative.vsYesterdayPhrase}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Secondary Financial Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <MetricCard
            label="Pedidos"
            value={
              dailyLoading
                ? "…"
                : hasDailyMetrics
                ? totalOrders.toString()
                : coreRestaurantId
                ? "—"
                : "0"
            }
            hint="pagos"
          />
          <MetricCard
            label="Ticket médio"
            value={
              dailyLoading
                ? "…"
                : hasDailyMetrics
                ? avgTicketCents > 0
                  ? formatCurrency(avgTicketCents / 100)
                  : "0"
                : coreRestaurantId
                ? "—"
                : "0"
            }
            hint="dia"
          />
          <MetricCard
            label="Média 7 dias"
            value={
              hasShiftHistory
                ? formatCurrency(financialSnapshot.avg7dCents / 100)
                : "—"
            }
            hint="referência"
          />
          <MetricCard
            label="Caixa"
            value={shiftState === "active" ? "Aberto" : "Fechado"}
            hint={cashHint}
          />
        </div>
        <ChartBlock title="Faturamento por hora">
          {hasHourlyData ? (
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlySeries}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHour}
                    stroke={theme.text.tertiary}
                    fontSize={11}
                  />
                  <YAxis
                    tickFormatter={formatCompactCurrency}
                    stroke={theme.text.tertiary}
                    fontSize={11}
                    label={{
                      value: "R$ / hora",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fontSize: 11,
                        fill: theme.text.tertiary,
                      },
                    }}
                  />
                  <ReferenceLine
                    x={currentHour}
                    stroke={theme.action.base}
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{
                      value: "Agora",
                      position: "top",
                      fill: theme.text.secondary,
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload as {
                        hour: number;
                        total_cents: number;
                      };
                      const totalCents = data.total_cents;
                      return (
                        <div
                          style={{
                            background: theme.surface.layer2,
                            border: `1px solid ${theme.border.subtle}`,
                            borderRadius: 10,
                            padding: "8px 12px",
                            fontSize: 13,
                            color: theme.text.primary,
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {formatHour(data.hour)}
                          </div>
                          <div>{formatCurrency(totalCents / 100)}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="total_cents" fill={theme.action.base} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <TextMuted>Sem vendas registradas hoje.</TextMuted>
          )}
        </ChartBlock>
        <AlertList title="Alertas financeiros" items={financialAlertItems} />
      </Section>

      {/* Executive Alerts Section */}
      <Section title="Atenção" subtitle="Leitura rápida do turno">
        <AlertList title="Alertas" items={executiveAlerts} />
      </Section>

      <Section
        title="Operação em tempo real"
        subtitle="Estado actual da cozinha e salão"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <ClickableCard
            label="Pedidos ativos"
            value={orderTasks.length.toString()}
            hint="KDS"
            onClick={() => navigate("/app/staff/home/sector/kitchen")}
          />
          <ClickableCard
            label="Tempo médio de preparo"
            value={prepAvgMinutes ? `${prepAvgMinutes} min` : "-"}
            hint="estimado"
            onClick={() => navigate("/app/staff/home/sector/kitchen")}
          />
          <ClickableCard
            label="Fila atual"
            value={`${orderTasks.length} pedidos`}
            hint="cozinha"
            onClick={() => navigate("/app/staff/home/sector/kitchen")}
          />
          <ClickableCard
            label="Estado da operação"
            value={operationStatus}
            hint={`Risco ${currentRiskLevel}`}
            onClick={() => navigate("/app/staff/home/sector/operation")}
          />
        </div>
        <AlertList
          title="Gargalos detectados"
          items={
            operationGaps.length ? operationGaps : ["Sem gargalos no momento"]
          }
        />
      </Section>

      {/* ── Owner verification checklist ── */}
      <ShiftTaskSummary compact maxVisible={3} title="Verificações do Dia" />

      <Section title="Equipa e tarefas" subtitle="Produtividade do turno">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <ClickableCard
            label="Funcionários ativos"
            value={activeStaffCount.toString()}
            hint={`${activeEmployees} cadastrados`}
            onClick={() => navigate("/app/staff/home/sector/team")}
          />
          <MetricCard
            label="Tarefas concluídas"
            value={tasksTodayDone.toString()}
            hint="hoje"
          />
          <ClickableCard
            label="Pendentes"
            value={tasksPending.toString()}
            hint={`${tasksCritical} críticas`}
            onClick={() => navigate("/app/staff/home/sector/tasks")}
          />
          <MetricCard
            label="Produtividade"
            value={`${tasksPerHour} tarefas/h`}
            hint="estimado"
          />
        </div>
        <CardBlock title="Funções em operação">
          {rolesInAction.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {rolesInAction.map((role) => (
                <span
                  key={role}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: `1px solid ${theme.border.subtle}`,
                    fontSize: 12,
                    color: theme.text.secondary,
                  }}
                >
                  {roleLabel(role)}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: theme.text.secondary }}>
              Nenhuma função ativa identificada
            </span>
          )}
        </CardBlock>
      </Section>

      <Section title="Limpeza e manutenção" subtitle="Estado do ambiente">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <MetricCard
            label="Previstas hoje"
            value={cleaningTasks.length.toString()}
          />
          <MetricCard label="Concluídas" value={cleaningDone.toString()} />
          <MetricCard
            label="Pendências"
            value={cleaningPending.length.toString()}
            hint={cleaningPending.length > 0 ? "acompanhar" : "em dia"}
          />
          <MetricCard
            label="Última limpeza"
            value={cleaningDone > 0 ? formatLastCleaning(cleaningTasks) : "—"}
            hint="Salão"
          />
        </div>
        <TextMuted>
          Monitoramento baseado nas tarefas de manutenção/limpeza.
        </TextMuted>
      </Section>

      <Section title="Estoque e insumos" subtitle="Visão gerencial">
        <CardBlock title="Itens críticos">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stockLoading ? (
              <TextMuted>Carregando alertas de estoque...</TextMuted>
            ) : stockError ? (
              <TextMuted>Erro ao carregar estoque.</TextMuted>
            ) : stockAlerts.length ? (
              stockAlerts.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: theme.text.secondary,
                  }}
                >
                  <span>{item.ingredient.name}</span>
                  <span>
                    {item.qty}/{item.min_qty} {item.ingredient.unit} •{" "}
                    {item.location.name}
                  </span>
                </div>
              ))
            ) : (
              <TextMuted>Sem alertas de estoque.</TextMuted>
            )}
          </div>
        </CardBlock>
        <TextMuted>Fonte: Inventory Lite (Core).</TextMuted>
      </Section>

      <Section title="Pulso e riscos" subtitle="Indicadores de gestão">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <MetricCard
            label="Pulso operacional"
            value={pulseLabel}
            hint={pulseHint || "sem dados"}
          />
          <MetricCard
            label="Risco operacional"
            value={operationStatus}
            hint={`Nível ${currentRiskLevel}`}
          />
          <MetricCard
            label="Exceções ativas"
            value={specDrifts.length.toString()}
            hint="sinais de desvio"
          />
          <MetricCard
            label="Eventos do turno"
            value={tasksTodayDone.toString()}
            hint="tarefas concluídas"
          />
        </div>
      </Section>

      <Section title="Ferramentas" subtitle="Acesso rápido">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          <ClickableCard
            label="📋 Escalas"
            value="Semana"
            hint="Gerir turnos"
            onClick={() => navigate("/app/staff/home/schedule")}
          />
          <ClickableCard
            label="💬 Comunicação"
            value="Chat"
            hint="Anúncios e equipa"
            onClick={() => navigate("/app/staff/home/comms")}
          />
          <ClickableCard
            label="🔔 Notificações"
            value="Alertas"
            hint="Centro de avisos"
            onClick={() => navigate("/app/staff/home/notifications")}
          />
          <ClickableCard
            label="💰 Gorjetas"
            value="Analytics"
            hint="Performance"
            onClick={() => navigate("/app/staff/home/tips")}
          />
        </div>
      </Section>

      {/* Spacer para clearance do bottom nav */}
      <div style={{ height: 80, flexShrink: 0 }} aria-hidden="true" />
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 style={{ fontSize: 18, margin: 0, color: theme.text.primary }}>
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: 12, color: theme.text.secondary }}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: theme.surface.layer1,
        border: accent ? `1px solid ${theme.action.base}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 12, color: theme.text.tertiary }}>{label}</span>
      <span
        style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary }}
      >
        {value}
      </span>
      {hint && (
        <span style={{ fontSize: 12, color: theme.text.secondary }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function ClickableCard({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: theme.surface.layer1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, color: theme.text.tertiary }}>{label}</span>
      <span
        style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary }}
      >
        {value}
      </span>
      {hint && (
        <span style={{ fontSize: 12, color: theme.text.secondary }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function ChartBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 12,
        background: theme.surface.layer1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12, color: theme.text.tertiary }}>{title}</span>
      {children}
    </div>
  );
}

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 12,
        background: theme.surface.layer1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12, color: theme.text.tertiary }}>{title}</span>
      {children}
    </div>
  );
}

function AlertList({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 12,
        background: theme.surface.layer1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: theme.text.tertiary }}>{title}</span>
      {items.map((item) => (
        <span key={item} style={{ fontSize: 13, color: theme.text.secondary }}>
          • {item}
        </span>
      ))}
    </div>
  );
}

function TextMuted({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12, color: theme.text.tertiary }}>{children}</span>
  );
}

function pctDelta(current: number, prev: number) {
  if (!prev) return "0";
  return Math.round(((current - prev) / prev) * 100).toString();
}

function roleLabel(role: string | undefined) {
  switch (role) {
    case "owner":
      return "Dono";
    case "manager":
      return "Gerente";
    case "waiter":
      return "Salão";
    case "kitchen":
      return "Cozinha";
    case "cleaning":
      return "Limpeza";
    case "worker":
      return "Apoio";
    default:
      return "Equipe";
  }
}

function buildHourlySeries(
  source: Array<{ hour: number; total_cents: number }>,
) {
  const map = new Map<number, number>();
  source.forEach((item) => map.set(item.hour, item.total_cents));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    total_cents: map.get(hour) ?? 0,
  }));
}

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}h`;
}

function formatCompactCurrency(value: number) {
  const reais = value / 100;
  if (reais === 0) return "0";
  if (reais >= 1_000_000) return `${Math.round(reais / 100_000) / 10}M`;
  if (reais >= 1_000) return `${Math.round(reais / 100) / 10}k`;
  return Math.round(reais).toString();
}

function formatLastCleaning(tasks: Array<{ completedAt?: number }>) {
  const completed = tasks
    .filter((task) => task.completedAt)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  if (!completed.length) return "—";
  const last = new Date(completed[0].completedAt as number);
  return last.toLocaleTimeString(getFormatLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPulseTone(zone: string) {
  switch (zone) {
    case "critical":
      return {
        label: "Pulso crítico",
        color: theme.destructive.base,
        bg: "rgba(239, 68, 68, 0.12)",
      };
    case "high":
      return {
        label: "Pulso alto",
        color: theme.warning.base,
        bg: "rgba(245, 158, 11, 0.12)",
      };
    case "moderate":
      return {
        label: "Pulso moderado",
        color: theme.info.base,
        bg: "rgba(59, 130, 246, 0.12)",
      };
    case "low":
      return {
        label: "Pulso baixo",
        color: theme.success.base,
        bg: "rgba(34, 197, 94, 0.12)",
      };
    default:
      return {
        label: "Pulso inativo",
        color: theme.text.tertiary,
        bg: "rgba(148, 163, 184, 0.12)",
      };
  }
}

function getOperationGaps({
  specDriftsCount,
  shiftLoad,
  coreStatus,
  ordersCount,
}: {
  specDriftsCount: number;
  shiftLoad: string;
  coreStatus: string;
  ordersCount: number;
}) {
  const gaps: string[] = [];
  if (specDriftsCount > 0) gaps.push("Exceções operacionais ativas");
  if (shiftLoad === "red") gaps.push("Carga humana elevada");
  if (coreStatus !== "UP") gaps.push("Core indisponível");
  if (ordersCount >= 6) gaps.push("Fila de cozinha alta");
  return gaps.slice(0, 3);
}

function isToday(timestamp?: number) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

type OperationalStatus = "stable" | "attention" | "action_needed";

function deriveOperationalStatus({
  coreStatus,
  pulseZone,
  activeOrders,
  criticalAlerts,
  shiftState,
}: {
  coreStatus: string;
  pulseZone: string | null;
  activeOrders: number;
  criticalAlerts: number;
  shiftState: string;
}): OperationalStatus {
  if (coreStatus !== "UP") return "action_needed";
  if (criticalAlerts > 0) return "action_needed";
  if (pulseZone === "critical") return "action_needed";
  if (shiftState !== "active") return "attention";
  if (activeOrders > 20) return "attention";
  if (pulseZone === "high") return "attention";
  return "stable";
}

const OPERATIONAL_STATUS_MAP: Record<
  OperationalStatus,
  { icon: string; label: string; color: string }
> = {
  stable: { icon: "🟢", label: "Operação estável", color: theme.success.base },
  attention: {
    icon: "🟡",
    label: "Operação sob atenção",
    color: theme.warning.base,
  },
  action_needed: {
    icon: "🔴",
    label: "Ação necessária",
    color: theme.destructive.base,
  },
};

function deriveFinancialNarrative({
  todayCents,
  avg7dCents,
  yesterdayCents,
  hasHistory,
}: {
  todayCents: number;
  avg7dCents: number;
  yesterdayCents: number;
  hasHistory: boolean;
}) {
  if (!hasHistory)
    return {
      vs7dPhrase: "Sem histórico de 7 dias",
      vsYesterdayPhrase: "Sem dado de ontem",
    };

  const vs7dPct = parseInt(pctDelta(todayCents, avg7dCents), 10);
  const vs7dPhrase =
    vs7dPct > 0
      ? `📈 ${vs7dPct}% acima da média de 7 dias`
      : vs7dPct < 0
      ? `📉 ${Math.abs(vs7dPct)}% abaixo da média de 7 dias`
      : `🟰 Alinhado com a média de 7 dias`;

  const vsYesterdayPct = parseInt(pctDelta(todayCents, yesterdayCents), 10);
  const vsYesterdayPhrase =
    vsYesterdayPct > 0
      ? `📈 ${vsYesterdayPct}% melhor que ontem`
      : vsYesterdayPct < 0
      ? `📉 ${Math.abs(vsYesterdayPct)}% pior que ontem`
      : `🟰 Igual a ontem até agora`;

  return { vs7dPhrase, vsYesterdayPhrase };
}

function deriveExecutiveAlerts({
  avgTicketCents,
  historicalAvgTicketCents,
  hourlySeries,
  shiftDurationHours,
}: {
  avgTicketCents: number;
  historicalAvgTicketCents: number;
  hourlySeries: Array<{ hour: number; total_cents: number }>;
  shiftDurationHours: number;
}): string[] {
  const alerts: string[] = [];

  // Ticket médio abaixo do normal
  if (avgTicketCents > 0 && historicalAvgTicketCents > 0) {
    const ticketDelta =
      ((avgTicketCents - historicalAvgTicketCents) / historicalAvgTicketCents) *
      100;
    if (ticketDelta < -15) {
      alerts.push(
        `Ticket médio ${Math.abs(ticketDelta).toFixed(0)}% abaixo do normal`,
      );
    }
  }

  // Concentração de faturamento
  const peakHour = hourlySeries.reduce(
    (max, h) => (h.total_cents > max.total_cents ? h : max),
    { hour: 0, total_cents: 0 },
  );
  const totalCents = hourlySeries.reduce((sum, h) => sum + h.total_cents, 0);
  if (totalCents > 0 && peakHour.total_cents > totalCents * 0.4) {
    alerts.push(
      `Pico de faturamento concentrado às ${formatHour(peakHour.hour)}`,
    );
  }

  // Turno longo
  if (shiftDurationHours > 8) {
    alerts.push(`Turno aberto há ${Math.floor(shiftDurationHours)}h`);
  }

  return alerts.length > 0 ? alerts : ["Nenhuma atenção detectada"];
}
