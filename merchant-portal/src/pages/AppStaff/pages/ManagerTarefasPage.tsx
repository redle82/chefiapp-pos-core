/**
 * Tarefas (/app/staff/mode/tasks) — Execução + Contexto.
 *
 * Regras:
 *   • Execução pura — não explica, não analisa
 *   • Mensagens de vazio diferenciadas por papel
 *   • Modal rápido + prioridades visuais + tabs
 * UI: scroll é do Shell; sem duplicar layout.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TaskCard } from "../../../ui/design-system/TaskCard";
import { Button } from "../../../ui/design-system/primitives/Button";
import { Card } from "../../../ui/design-system/primitives/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { QuickTaskModal } from "../components/QuickTaskModal";
import { useStaff } from "../context/StaffContext";
import { useAppStaffHaptics } from "../hooks/useAppStaffHaptics";
import { useAppStaffPermissions } from "../hooks/useAppStaffPermissions";

export function ManagerTarefasPage() {
  const { tasks, employees, createTask, activeRole } = useStaff();
  const navigate = useNavigate();
  const perms = useAppStaffPermissions();
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
  const { triggerHaptic } = useAppStaffHaptics();

  const activeTasks = tasks.filter((t) => t.status !== "done");

  const mapPriority = (
    p: "critical" | "attention" | "background" | "urgent" | undefined,
  ): "critical" | "high" | "medium" | "low" => {
    if (!p) return "medium";
    if (p === "critical") return "critical";
    if (p === "urgent") return "high";
    if (p === "attention") return "medium";
    return "low";
  };

  type TabId = "criticas" | "operacionais" | "concluidas";
  const [activeTab, setActiveTab] = useState<TabId>("criticas");
  const [pressedTab, setPressedTab] = useState<TabId | null>(null);
  const [fabPressed, setFabPressed] = useState(false);

  const criticalTasks = activeTasks.filter(
    (t) => t.priority === "critical" || t.priority === "urgent",
  );
  const operationalTasks = activeTasks.filter(
    (t) => !criticalTasks.includes(t),
  );
  const completedTasks = tasks.filter((t) => t.status === "done");

  const getTasksForTab = (): typeof tasks => {
    if (activeTab === "criticas") return criticalTasks;
    if (activeTab === "operacionais") return operationalTasks;
    return completedTasks;
  };

  const visibleTasks = getTasksForTab();

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        paddingBottom: 80, // espaço para bottom nav + FAB
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: colors.text.primary,
          }}
        >
          Tarefas
        </h1>
      </div>

      {/* Tabs: feedback tátil (scale 0.97) — app UX */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 4,
          borderRadius: 999,
          backgroundColor: colors.surface.layer1,
        }}
      >
        {[
          { id: "criticas", label: "Críticas" },
          { id: "operacionais", label: "Operacionais" },
          { id: "concluidas", label: "Concluídas" },
        ].map((tab) => {
          const selected = activeTab === tab.id;
          const pressed = pressedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabId)}
              onPointerDown={() => setPressedTab(tab.id)}
              onPointerUp={() => setPressedTab(null)}
              onPointerLeave={() => setPressedTab(null)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: selected ? colors.action.base : "transparent",
                color: selected ? colors.action.text : colors.text.secondary,
                transition: "transform 0.08s ease",
                transform: pressed ? "scale(0.97)" : "scale(1)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {visibleTasks.length === 0 ? (
        <Card
          surface="layer1"
          padding="lg"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 32 }} aria-hidden>
            {activeTab === "concluidas" ? "🎉" : "✅"}
          </div>
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
          >
            {activeTab === "concluidas"
              ? "Histórico limpo"
              : "Nenhuma tarefa nesta aba"}
          </Text>
          <Text size="sm" color="tertiary">
            {activeTab === "concluidas"
              ? "Ainda não há tarefas concluídas neste turno."
              : perms.canCreateTask
              ? activeRole === "owner"
                ? "Nenhuma tarefa crítica agora. Crie ações para a equipe abaixo."
                : "Nada pendente. Use o botão abaixo para criar a próxima ação."
              : "Aguarde instruções. Sem tarefas atribuídas neste momento."}
          </Text>
          {perms.canCreateTask && activeTab !== "concluidas" && (
            <Button
              size="sm"
              tone="action"
              style={{ marginTop: 4 }}
              onClick={() => {
                triggerHaptic("primaryAction");
                setShowQuickTaskModal(true);
              }}
            >
              Criar primeira tarefa
            </Button>
          )}
          {!perms.canCreateTask && activeTab !== "concluidas" && (
            <Button
              size="sm"
              tone="neutral"
              style={{ marginTop: 4 }}
              onClick={() =>
                navigate(
                  activeRole
                    ? `/app/staff/home/${activeRole}`
                    : "/app/staff/home",
                )
              }
            >
              Voltar ao início
            </Button>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              taskId={task.id}
              title={task.title}
              description={task.description}
              status={
                task.status === "done"
                  ? "completed"
                  : task.status === "focused"
                  ? "in-progress"
                  : "pending"
              }
              priority={mapPriority(task.priority)}
              assignedAt={new Date(task.createdAt)}
            />
          ))}
        </div>
      )}

      {/* CTA flutuante: Nova tarefa — feedback tátil */}
      {perms.canCreateTask && (
        <button
          type="button"
          onClick={() => setShowQuickTaskModal(true)}
          onPointerDown={() => setFabPressed(true)}
          onPointerUp={() => setFabPressed(false)}
          onPointerLeave={() => setFabPressed(false)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 88,
            minWidth: 56,
            minHeight: 56,
            borderRadius: 999,
            border: "none",
            backgroundColor: colors.action.base,
            color: colors.action.text,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            cursor: "pointer",
            transition: "transform 0.08s ease",
            transform: fabPressed ? "scale(0.97)" : "scale(1)",
          }}
        >
          +
        </button>
      )}

      <QuickTaskModal
        isOpen={showQuickTaskModal}
        onClose={() => setShowQuickTaskModal(false)}
        employees={employees}
        onCreateTask={createTask}
      />
    </div>
  );
}
