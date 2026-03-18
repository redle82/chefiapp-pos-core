/**
 * ManagerHome — PAINEL OPERACIONAL DO GERENTE (inspirado em 7shifts Manager + Toast Now).
 *
 * Pergunta-chave: "O turno está saudável?"
 *
 * Layout:
 *   1. Indicador de saúde do turno (semáforo + frase + staff count)
 *   2. Gargalos detectados (dinâmico, só aparece quando há)
 *   3. 4 métricas operacionais (alertas, tarefas, equipa, pedidos)
 *   4. Ações contextuais (resolver alertas, verificar equipa)
 *   5. Ferramentas de gestão (escalas, gorjetas, avisos)
 *
 * Chat está no bottom nav — não precisa de atalho aqui.
 */

import { useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";

const theme = colors.modes.dashboard;

export function ManagerHome() {
  const { specDrifts, tasks, shiftState, activeStaffCount, employees } =
    useStaff();
  const { status: coreStatus } = useCoreHealth();
  const navigate = useNavigate();

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = pendingTasks.filter((t) => t.priority === "critical");
  const activeEmployees = employees.filter((e) => e.active).length;
  const orderTasks = tasks.filter(
    (t) => t.type === "order" && t.status !== "done",
  );

  // Bottlenecks — dynamic, context-aware
  const bottlenecks: Array<{ text: string; severity: "critical" | "warning" }> =
    [];
  if (coreStatus !== "UP")
    bottlenecks.push({ text: "Sistema instável", severity: "critical" });
  if (criticalTasks.length > 0)
    bottlenecks.push({
      text: `${criticalTasks.length} tarefa${criticalTasks.length !== 1 ? "s" : ""} urgente${criticalTasks.length !== 1 ? "s" : ""}`,
      severity: "critical",
    });
  if (specDrifts.length > 0)
    bottlenecks.push({
      text: `${specDrifts.length} exceção${specDrifts.length !== 1 ? "ões" : ""} ativa${specDrifts.length !== 1 ? "s" : ""}`,
      severity: specDrifts.length > 2 ? "critical" : "warning",
    });
  if (activeStaffCount === 0 && shiftState === "active")
    bottlenecks.push({ text: "Sem equipa ativa", severity: "critical" });
  if (orderTasks.length >= 8)
    bottlenecks.push({
      text: `Fila de cozinha alta (${orderTasks.length})`,
      severity: "warning",
    });

  const isHealthy = bottlenecks.length === 0 && shiftState === "active";
  const shiftLabel =
    shiftState === "active"
      ? "Turno ativo"
      : shiftState === "closing"
      ? "A encerrar"
      : "Sem turno";

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
      {/* ── SAÚDE DO TURNO ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          borderRadius: 16,
          backgroundColor: isHealthy
            ? "rgba(34, 197, 94, 0.08)"
            : bottlenecks.some((b) => b.severity === "critical")
            ? "rgba(239, 68, 68, 0.08)"
            : "rgba(245, 158, 11, 0.08)",
          border: `1px solid ${
            isHealthy
              ? theme.success.base
              : bottlenecks.some((b) => b.severity === "critical")
              ? theme.destructive.base
              : "#f59e0b"
          }15`,
        }}
      >
        <span style={{ fontSize: 28 }}>
          {isHealthy
            ? "🟢"
            : bottlenecks.some((b) => b.severity === "critical")
            ? "🔴"
            : "🟡"}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: isHealthy
                ? theme.success.base
                : bottlenecks.some((b) => b.severity === "critical")
                ? theme.destructive.base
                : "#f59e0b",
            }}
          >
            {isHealthy ? "Turno saudável" : "Atenção necessária"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: theme.text.secondary,
              marginTop: 2,
            }}
          >
            {shiftLabel} · {activeStaffCount} operador
            {activeStaffCount !== 1 ? "es" : ""} de {activeEmployees}
          </div>
        </div>
      </div>

      {/* ── GARGALOS (só quando há) ── */}
      {bottlenecks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "12px 14px",
            borderRadius: 12,
            backgroundColor: "rgba(239, 68, 68, 0.04)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.text.tertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Gargalos
          </span>
          {bottlenecks.map((b) => (
            <div
              key={b.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: theme.text.primary,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    b.severity === "critical"
                      ? theme.destructive.base
                      : "#f59e0b",
                  flexShrink: 0,
                }}
              />
              {b.text}
            </div>
          ))}
        </div>
      )}

      {/* ── 4 MÉTRICAS OPERACIONAIS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <MetricTile
          label="Alertas"
          value={specDrifts.length}
          alert={specDrifts.length > 0}
          onClick={() => navigate("/app/staff/mode/alerts")}
        />
        <MetricTile
          label="Tarefas"
          value={pendingTasks.length}
          alert={criticalTasks.length > 0}
          onClick={() => navigate("/app/staff/mode/tasks")}
        />
        <MetricTile
          label="Equipa"
          value={activeStaffCount}
          alert={activeStaffCount === 0 && shiftState === "active"}
          onClick={() => navigate("/app/staff/mode/team")}
        />
        <MetricTile
          label="Pedidos"
          value={orderTasks.length}
          alert={orderTasks.length >= 8}
          onClick={() => navigate("/app/staff/home/sector/kitchen")}
        />
      </div>

      {/* ── CHECKLIST DO DIA ── */}
      <ShiftTaskSummary compact maxVisible={5} />

      {/* ── AÇÕES CONTEXTUAIS ── */}
      {(specDrifts.length > 0 ||
        (activeStaffCount === 0 && shiftState === "active")) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {specDrifts.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/app/staff/mode/alerts")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${theme.destructive.base}30`,
                background: `${theme.destructive.base}08`,
                color: theme.text.primary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⚠️ Resolver alertas ({specDrifts.length})
            </button>
          )}
          {activeStaffCount === 0 && shiftState === "active" && (
            <button
              type="button"
              onClick={() => navigate("/app/staff/mode/team")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${colors.border.subtle}`,
                background: colors.surface.layer1,
                color: theme.text.primary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              👥 Verificar equipa
            </button>
          )}
        </div>
      )}

      {/* ── FERRAMENTAS DE GESTÃO ── */}
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

function MetricTile({
  label,
  value,
  alert,
  onClick,
}: {
  label: string;
  value: number;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 12px",
        borderRadius: 12,
        backgroundColor: theme.surface.layer1,
        border: `1px solid ${alert ? theme.destructive.base + "40" : colors.border.subtle}`,
        textAlign: "center",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: alert ? theme.destructive.base : theme.text.primary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: theme.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
    </button>
  );
}
