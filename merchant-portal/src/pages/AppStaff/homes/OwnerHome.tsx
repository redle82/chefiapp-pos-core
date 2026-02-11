/**
 * OwnerHome — Home ESTRATÉGICA do Dono.
 *
 * Pergunta-chave: "O restaurante está sob controle agora?"
 *
 * Regra: HOME = visão sistêmica, não execução.
 *   • Status global (semáforo)
 *   • Exceções ativas (alertas + tarefas críticas)
 *   • Dashboards por setor (resumos clicáveis → Dashboard de Setor)
 *   • Navegação: OwnerHome → Dashboard de Setor → Ferramenta
 */
import { useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

type OperationLevel = "normal" | "attention" | "critical";

function getOperationLevel(
  coreStatus: string,
  specDrifts: { severity?: string }[],
  tasks: { status?: string; priority?: string }[],
  shiftState: string,
  activeStaffCount: number,
): {
  level: OperationLevel;
  label: string;
  color: string;
  bg: string;
  icon: string;
} {
  const criticalAlerts = specDrifts.filter(
    (d) => d.severity === "critical" || d.severity === "high",
  );
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.priority === "critical",
  );

  // Decide level
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

  const map = {
    normal: {
      label: "OPERAÇÃO NORMAL",
      color: colors.success.base,
      bg: "rgba(34, 197, 94, 0.10)",
      icon: "🟢",
    },
    attention: {
      label: "ATENÇÃO",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.10)",
      icon: "🟡",
    },
    critical: {
      label: "CRÍTICO",
      color: colors.destructive.base,
      bg: "rgba(239, 68, 68, 0.10)",
      icon: "🔴",
    },
  };

  return { level, ...map[level] };
}

export function OwnerHome() {
  const { specDrifts, tasks, shiftState, activeStaffCount } = useStaff();
  const { status: coreStatus } = useCoreHealth();
  const navigate = useNavigate();
  const op = getOperationLevel(
    coreStatus,
    specDrifts,
    tasks,
    shiftState,
    activeStaffCount,
  );

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = pendingTasks.filter((t) => t.priority === "critical");
  const cleaningTasks = tasks.filter(
    (t) =>
      t.context === "floor" ||
      t.type === "maintenance" ||
      t.type === "reactive" ||
      (t.assigneeRole && ["cleaning", "worker"].includes(t.assigneeRole)),
  );
  const cleaningPending = cleaningTasks.filter((t) => t.status !== "done");
  const kitchenTasks = tasks.filter(
    (t) => t.assigneeRole === "kitchen" || t.context === "kitchen",
  );
  const kitchenPending = kitchenTasks.filter((t) => t.status !== "done");

  const exceptions: string[] = [];
  if (coreStatus !== "UP") exceptions.push("Sistema instável");
  if (criticalTasks.length > 0)
    exceptions.push(
      `${criticalTasks.length} tarefa${
        criticalTasks.length !== 1 ? "s" : ""
      } crítica${criticalTasks.length !== 1 ? "s" : ""}`,
    );
  if (specDrifts.length > 0)
    exceptions.push(
      `${specDrifts.length} alerta${specDrifts.length !== 1 ? "s" : ""} ativo${
        specDrifts.length !== 1 ? "s" : ""
      }`,
    );
  if (shiftState === "closing") exceptions.push("Turno a encerrar");
  if (shiftState !== "active" && shiftState !== "closing")
    exceptions.push("Turno inativo");
  if (activeStaffCount === 0 && shiftState === "active")
    exceptions.push("Sem equipe ativa");

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
      {/* ── 1. STATUS GERAL (semáforo) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderRadius: 14,
          backgroundColor: op.bg,
        }}
      >
        <span style={{ fontSize: 28 }}>{op.icon}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: op.color,
            letterSpacing: "0.04em",
          }}
        >
          {op.label}
        </span>
      </div>

      {/* ── Contexto compacto (turno + equipe) ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          fontSize: 12,
          color: colors.text.secondary,
        }}
      >
        <span>
          Turno:{" "}
          <strong style={{ color: colors.text.primary }}>
            {shiftState === "active"
              ? "ATIVO"
              : shiftState === "closing"
              ? "A ENCERRAR"
              : "SEM TURNO"}
          </strong>
        </span>
        <span>
          Equipe:{" "}
          <strong style={{ color: colors.text.primary }}>
            {activeStaffCount > 0
              ? `${activeStaffCount} ativo${activeStaffCount !== 1 ? "s" : ""}`
              : "—"}
          </strong>
        </span>
      </div>

      {/* ── Excecoes globais (overlay) ── */}
      {exceptions.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.text.tertiary,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            ⚠️ ATENÇÃO
          </span>
          {exceptions.slice(0, 3).map((ex) => (
            <span
              key={ex}
              style={{
                fontSize: 14,
                color: colors.text.primary,
                fontWeight: 500,
              }}
            >
              • {ex}
            </span>
          ))}
        </div>
      )}

      {/* ── Dashboards por setor (clicáveis → Dashboard de Setor nível 2) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {[
          {
            sector: "OPERAÇÃO",
            to: "/app/staff/home/sector/operation",
            value: `Turno ${shiftState === "active" ? "ativo" : "inativo"}`,
            detail: `Caixa: — • ${specDrifts.length} alerta${
              specDrifts.length !== 1 ? "s" : ""
            }`,
          },
          {
            sector: "TAREFAS",
            to: "/app/staff/home/sector/tasks",
            value: `${pendingTasks.length} pendente${
              pendingTasks.length !== 1 ? "s" : ""
            }`,
            detail: `${criticalTasks.length} crítica${
              criticalTasks.length !== 1 ? "s" : ""
            }`,
          },
          {
            sector: "EQUIPE",
            to: "/app/staff/home/sector/team",
            value: `${activeStaffCount} ativo${
              activeStaffCount !== 1 ? "s" : ""
            }`,
            detail: activeStaffCount === 0 ? "Turno incompleto" : "Equipe ok",
          },
          {
            sector: "COZINHA",
            to: "/app/staff/home/sector/kitchen",
            value: `${kitchenPending.length} pedido${
              kitchenPending.length !== 1 ? "s" : ""
            } pendente${kitchenPending.length !== 1 ? "s" : ""}`,
            detail: kitchenPending.length === 0 ? "Sem fila" : "Fila ativa",
          },
          {
            sector: "LIMPEZA",
            to: "/app/staff/home/sector/cleaning",
            value: `${cleaningPending.length} pendente${
              cleaningPending.length !== 1 ? "s" : ""
            }`,
            detail: `${cleaningTasks.length} tarefa${
              cleaningTasks.length !== 1 ? "s" : ""
            } hoje`,
          },
        ].map((card) => (
          <div
            key={card.sector}
            role="button"
            tabIndex={0}
            onClick={() => navigate(card.to)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && navigate(card.to)
            }
            style={{
              padding: "14px",
              borderRadius: 12,
              backgroundColor: colors.surface.layer1,
              border: "1px solid transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.text.tertiary,
                letterSpacing: "0.02em",
              }}
            >
              {card.sector}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: colors.text.secondary }}>
              {card.detail}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.action.text,
                marginTop: 4,
              }}
            >
              Ver setor →
            </div>
          </div>
        ))}
      </div>

      {/* ── Espaço vazio intencional ── */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
