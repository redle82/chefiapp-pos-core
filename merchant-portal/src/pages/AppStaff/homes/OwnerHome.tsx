/**
 * OwnerHome — RADAR DO DONO (inspirado em Toast Now + 7shifts Manager).
 *
 * Pergunta única: "Está tudo bem agora?"
 *
 * Layout:
 *   1. Veredito global (semáforo 🟢🟡🔴 + frase)
 *   2. Exceções urgentes (máx. 3, só quando existem)
 *   3. 3 métricas chave (vendas hoje, pedidos, equipe ativa)
 *   4. Radar por setor (5 linhas clicáveis: operação, cozinha, equipe, tarefas, limpeza)
 *   5. Ações contextuais (só aparecem quando relevantes)
 *
 * Chat está no bottom nav — não precisa de atalho aqui.
 */
import { useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { useDailyMetrics } from "../../../hooks/useDailyMetrics";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";

const theme = colors.modes.dashboard;

type OperationLevel = "normal" | "attention" | "critical";

function deriveRadar(
  coreStatus: string,
  specDrifts: { status?: string }[],
  tasks: { status?: string; priority?: string }[],
  shiftState: string,
  activeStaffCount: number,
) {
  const criticalAlerts = specDrifts.filter(
    (d) =>
      (d as unknown as { severity?: string }).severity === "critical" ||
      (d as unknown as { severity?: string }).severity === "high",
  );
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.priority === "critical",
  );

  let level: OperationLevel = "normal";
  if (coreStatus !== "UP") level = "critical";
  else if (criticalAlerts.length > 0 || overdueTasks.length > 0)
    level = "critical";
  else if (
    specDrifts.length > 0 ||
    tasks.filter((t) => t.status !== "done").length >= 5 ||
    shiftState !== "active" ||
    activeStaffCount === 0
  )
    level = "attention";

  const map: Record<
    OperationLevel,
    { label: string; color: string; bg: string; icon: string }
  > = {
    normal: {
      label: "Operação estável",
      color: theme.success.base,
      bg: "rgba(34, 197, 94, 0.08)",
      icon: "🟢",
    },
    attention: {
      label: "Requer atenção",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      icon: "🟡",
    },
    critical: {
      label: "Ação necessária",
      color: theme.destructive.base,
      bg: "rgba(239, 68, 68, 0.08)",
      icon: "🔴",
    },
  };

  return { level, ...map[level] };
}

type RadarVerdict = "ok" | "alert" | "critical";

const VERDICT_DOT: Record<RadarVerdict, string> = {
  ok: "#4ade80",
  alert: "#f59e0b",
  critical: "#ef4444",
};

export function OwnerHome() {
  const {
    coreRestaurantId,
    specDrifts,
    tasks,
    shiftState,
    activeStaffCount,
    employees,
  } = useStaff();
  const { status: coreStatus } = useCoreHealth();
  const { data: dailyMetrics, loading: dailyLoading } = useDailyMetrics(
    coreRestaurantId,
    "ACTIVE",
  );
  const navigate = useNavigate();

  const radar = deriveRadar(
    coreStatus,
    specDrifts,
    tasks,
    shiftState,
    activeStaffCount,
  );

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = pendingTasks.filter((t) => t.priority === "critical");
  const kitchenPending = tasks.filter(
    (t) =>
      t.status !== "done" &&
      (t.assigneeRole === "kitchen" || t.context === "kitchen"),
  );
  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const cleaningPending = cleaningTasks.filter((t) => t.status !== "done");
  const activeEmployees = employees.filter((e) => e.active).length;

  // Financial snapshot
  const todaySales = dailyMetrics?.total_sales_cents ?? 0;
  const totalOrders = dailyMetrics?.total_orders ?? 0;
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  // Radar verdicts
  const opVerdict: RadarVerdict =
    coreStatus !== "UP" || specDrifts.length > 2
      ? "critical"
      : shiftState !== "active" || specDrifts.length > 0
      ? "alert"
      : "ok";

  const kitchenVerdict: RadarVerdict =
    kitchenPending.length >= 5
      ? "critical"
      : kitchenPending.length >= 3
      ? "alert"
      : "ok";

  const teamVerdict: RadarVerdict =
    activeStaffCount === 0 && shiftState === "active"
      ? "critical"
      : activeStaffCount <= 1 && shiftState === "active"
      ? "alert"
      : "ok";

  const taskVerdict: RadarVerdict =
    criticalTasks.length > 0
      ? "critical"
      : pendingTasks.length >= 5
      ? "alert"
      : "ok";

  const cleaningVerdict: RadarVerdict =
    cleaningPending.filter((t) => t.priority === "critical").length > 0
      ? "critical"
      : cleaningPending.length > 0
      ? "alert"
      : "ok";

  const radarItems = [
    {
      sector: "Operação",
      verdict: opVerdict,
      phrase:
        opVerdict === "ok"
          ? "Normal"
          : opVerdict === "alert"
          ? "Em atenção"
          : "Instável",
      to: "/app/staff/home/sector/operation",
    },
    {
      sector: "Cozinha",
      verdict: kitchenVerdict,
      phrase: `${kitchenPending.length} na fila`,
      to: "/app/staff/home/sector/kitchen",
    },
    {
      sector: "Equipa",
      verdict: teamVerdict,
      phrase: `${activeStaffCount} ativo${activeStaffCount !== 1 ? "s" : ""}`,
      to: "/app/staff/home/sector/team",
    },
    {
      sector: "Tarefas",
      verdict: taskVerdict,
      phrase: `${pendingTasks.length} pendente${pendingTasks.length !== 1 ? "s" : ""}`,
      to: "/app/staff/home/sector/tasks",
    },
    {
      sector: "Limpeza",
      verdict: cleaningVerdict,
      phrase:
        cleaningPending.length === 0
          ? "Em dia"
          : `${cleaningPending.length} pendente${cleaningPending.length !== 1 ? "s" : ""}`,
      to: "/app/staff/home/sector/cleaning",
    },
  ];

  // Exceptions — only when something needs action
  const exceptions: string[] = [];
  if (coreStatus !== "UP") exceptions.push("Core indisponível");
  if (criticalTasks.length > 0)
    exceptions.push(`${criticalTasks.length} tarefa(s) crítica(s)`);
  if (shiftState !== "active" && shiftState !== "closing")
    exceptions.push("Turno inativo");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: "16px",
        backgroundColor: colors.surface.base,
        gap: 16,
        overflow: "auto",
        paddingBottom: 80,
      }}
    >
      {/* ── VEREDITO GLOBAL ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          borderRadius: 16,
          backgroundColor: radar.bg,
          border: `1px solid ${radar.color}15`,
        }}
      >
        <span style={{ fontSize: 28 }}>{radar.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: radar.color,
            }}
          >
            {radar.label}
          </div>
          {exceptions.length > 0 && (
            <div
              style={{
                fontSize: 12,
                color: theme.text.secondary,
                marginTop: 2,
              }}
            >
              {exceptions.slice(0, 2).join(" · ")}
            </div>
          )}
        </div>
      </div>

      {/* ── 3 MÉTRICAS CHAVE (Toast Now pattern) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        <MetricPill
          label="Vendas"
          value={
            dailyLoading
              ? "…"
              : todaySales > 0
              ? formatCurrency(todaySales)
              : "R$ 0"
          }
          accent={todaySales > 0}
        />
        <MetricPill
          label="Pedidos"
          value={dailyLoading ? "…" : totalOrders.toString()}
        />
        <MetricPill
          label="Equipa"
          value={`${activeStaffCount}/${activeEmployees}`}
          alert={activeStaffCount === 0 && shiftState === "active"}
        />
      </div>

      {/* ── RADAR POR SETOR ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: theme.text.tertiary,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Radar
        </span>
        {radarItems.map((item) => (
          <div
            key={item.sector}
            role="button"
            tabIndex={0}
            onClick={() => navigate(item.to)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && navigate(item.to)
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 14px",
              borderRadius: 10,
              backgroundColor: "transparent",
              cursor: "pointer",
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: VERDICT_DOT[item.verdict],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.text.primary,
                flex: 1,
              }}
            >
              {item.sector}
            </span>
            <span style={{ fontSize: 13, color: theme.text.secondary }}>
              {item.phrase}
            </span>
            <span style={{ fontSize: 12, color: theme.text.tertiary }}>→</span>
          </div>
        ))}
      </div>

      {/* ── CHECKLIST DO DIA ── */}
      <ShiftTaskSummary compact maxVisible={3} title="Verificações do Dia" />

      {/* ── AÇÕES CONTEXTUAIS (só quando relevantes) ── */}
      {(specDrifts.length > 0 ||
        criticalTasks.length > 0 ||
        (activeStaffCount === 0 && shiftState === "active")) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.text.tertiary,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Ação rápida
          </span>
          {specDrifts.length > 0 && (
            <ActionButton
              icon="⚠️"
              label={`Resolver ${specDrifts.length} alerta${specDrifts.length !== 1 ? "s" : ""}`}
              color={theme.destructive.base}
              onClick={() => navigate("/app/staff/mode/alerts")}
            />
          )}
          {criticalTasks.length > 0 && (
            <ActionButton
              icon="🔥"
              label={`${criticalTasks.length} tarefa${criticalTasks.length !== 1 ? "s" : ""} crítica${criticalTasks.length !== 1 ? "s" : ""}`}
              color="#f59e0b"
              onClick={() => navigate("/app/staff/mode/tasks")}
            />
          )}
          {activeStaffCount === 0 && shiftState === "active" && (
            <ActionButton
              icon="👥"
              label="Sem equipa ativa"
              color={theme.text.secondary}
              onClick={() => navigate("/app/staff/mode/team")}
            />
          )}
        </div>
      )}

      {/* ── FERRAMENTAS SECUNDÁRIAS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        {[
          { icon: "📋", label: "Escalas", to: "/app/staff/home/schedule" },
          { icon: "💰", label: "Gorjetas", to: "/app/staff/home/tips" },
          {
            icon: "🔔",
            label: "Avisos",
            to: "/app/staff/home/notifications",
          },
        ].map((tool) => (
          <button
            key={tool.to}
            type="button"
            onClick={() => navigate(tool.to)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "12px 8px",
              borderRadius: 12,
              border: `1px solid ${colors.border.subtle}`,
              background: colors.surface.layer1,
              color: theme.text.secondary,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Shared components ── */

function MetricPill({
  label,
  value,
  accent,
  alert,
}: {
  label: string;
  value: string;
  accent?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 10px",
        borderRadius: 12,
        background: theme.surface.layer1,
        border: alert
          ? `1px solid ${theme.destructive.base}40`
          : accent
          ? `1px solid ${theme.action.base}20`
          : "none",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: alert
            ? theme.destructive.base
            : accent
            ? theme.text.primary
            : theme.text.primary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: theme.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
        borderRadius: 10,
        border: `1px solid ${color}30`,
        background: `${color}08`,
        color: theme.text.primary,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
