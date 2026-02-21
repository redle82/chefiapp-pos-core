/**
 * OwnerHome — RADAR DO DONO.
 *
 * Pergunta única: "Está tudo bem agora?"
 *
 * Regras:
 *   • NÃO explica • NÃO executa • SÓ responde se há ou não ação necessária
 *   • Máx. 5 cards — cada um = 1 frase clara
 *   • Nenhuma métrica profunda — detalhamento vive no Dashboard de Setor
 *   • Navegação: OwnerHome → Dashboard de Setor → Ferramenta
 */
// @ts-nocheck

import { useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

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
      label: "Tudo em ordem",
      color: colors.success.base,
      bg: "rgba(34, 197, 94, 0.10)",
      icon: "🟢",
    },
    attention: {
      label: "Requer atenção",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.10)",
      icon: "🟡",
    },
    critical: {
      label: "Ação necessária",
      color: colors.destructive.base,
      bg: "rgba(239, 68, 68, 0.10)",
      icon: "🔴",
    },
  };

  return { level, ...map[level] };
}

/* ── Radar card helpers ── */

type RadarVerdict = "ok" | "alert" | "critical";
interface RadarCard {
  sector: string;
  verdict: RadarVerdict;
  phrase: string;
  to: string;
}

const VERDICT_ICON: Record<RadarVerdict, string> = {
  ok: "🟢",
  alert: "🟡",
  critical: "🔴",
};

export function OwnerHome() {
  const { specDrifts, tasks, shiftState, activeStaffCount } = useStaff();
  const { status: coreStatus } = useCoreHealth();
  const navigate = useNavigate();

  const radar = deriveRadar(
    coreStatus,
    specDrifts,
    tasks,
    shiftState,
    activeStaffCount,
  );

  /* ── Calcular vereditos por setor (1 frase cada) ── */
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = pendingTasks.filter((t) => t.priority === "critical");
  const kitchenTasks = tasks.filter(
    (t) => t.assigneeRole === "kitchen" || t.context === "kitchen",
  );
  const kitchenPending = kitchenTasks.filter((t) => t.status !== "done");
  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const cleaningPending = cleaningTasks.filter((t) => t.status !== "done");

  const opVerdict: RadarVerdict =
    coreStatus !== "UP" || specDrifts.length > 2
      ? "critical"
      : shiftState !== "active" || specDrifts.length > 0
      ? "alert"
      : "ok";

  const taskVerdict: RadarVerdict =
    criticalTasks.length > 0
      ? "critical"
      : pendingTasks.length >= 5
      ? "alert"
      : "ok";

  const teamVerdict: RadarVerdict =
    activeStaffCount === 0 && shiftState === "active"
      ? "critical"
      : activeStaffCount <= 1 && shiftState === "active"
      ? "alert"
      : "ok";

  const kitchenVerdict: RadarVerdict =
    kitchenPending.length >= 5
      ? "critical"
      : kitchenPending.length >= 3
      ? "alert"
      : "ok";

  const cleaningVerdict: RadarVerdict =
    cleaningPending.filter((t) => t.priority === "critical").length > 0
      ? "critical"
      : cleaningPending.length > 0
      ? "alert"
      : "ok";

  const cards: RadarCard[] = [
    {
      sector: "Resumo financeiro",
      verdict: "ok",
      phrase: "Ver métricas do dia",
      to: "/app/staff/home/owner",
    },
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
      phrase:
        kitchenVerdict === "ok"
          ? "Fluindo"
          : kitchenVerdict === "alert"
          ? "Fila crescendo"
          : "Fila crítica",
      to: "/app/staff/home/sector/kitchen",
    },
    {
      sector: "Equipe",
      verdict: teamVerdict,
      phrase:
        teamVerdict === "ok"
          ? "Completa"
          : teamVerdict === "alert"
          ? "Reduzida"
          : "Sem equipe",
      to: "/app/staff/home/sector/team",
    },
    {
      sector: "Tarefas",
      verdict: taskVerdict,
      phrase:
        taskVerdict === "ok"
          ? "Em dia"
          : taskVerdict === "alert"
          ? "Acumulando"
          : "Críticas pendentes",
      to: "/app/staff/home/sector/tasks",
    },
    {
      sector: "Limpeza",
      verdict: cleaningVerdict,
      phrase:
        cleaningVerdict === "ok"
          ? "Ok hoje"
          : cleaningVerdict === "alert"
          ? "Pendências"
          : "Urgente",
      to: "/app/staff/home/sector/cleaning",
    },
  ];

  /* ── Exceções (máx. 3, só quando algo está errado) ── */
  const exceptions: string[] = [];
  if (coreStatus !== "UP")
    exceptions.push("Core indisponível — verifique a ligação ao servidor");
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
        padding: "20px 16px",
        backgroundColor: colors.surface.base,
        gap: 20,
      }}
    >
      {/* ── VEREDITO GLOBAL ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 20px",
          borderRadius: 14,
          backgroundColor: radar.bg,
        }}
      >
        <span style={{ fontSize: 32 }}>{radar.icon}</span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: radar.color,
            letterSpacing: "0.02em",
          }}
        >
          {radar.label}
        </span>
      </div>

      {/* ── EXCEÇÕES (só quando há) ── */}
      {exceptions.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {exceptions.slice(0, 3).map((ex) => (
            <span
              key={ex}
              style={{
                fontSize: 13,
                color: colors.text.primary,
                fontWeight: 500,
              }}
            >
              • {ex}
            </span>
          ))}
        </div>
      )}

      {/* ── 5 CARDS RADAR — 1 frase por setor ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cards.map((card) => (
          <div
            key={card.sector}
            role="button"
            tabIndex={0}
            onClick={() => navigate(card.to)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && navigate(card.to)
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: colors.surface.layer1,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {VERDICT_ICON[card.verdict]}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: colors.text.primary,
                flex: 1,
              }}
            >
              {card.sector}
            </span>
            <span
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                textAlign: "right",
              }}
            >
              {card.phrase}
            </span>
          </div>
        ))}
      </div>

      {/* ── Espaço vazio intencional ── */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
