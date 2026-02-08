/**
 * TaskDashboardPage — Dashboard de Tarefas
 *
 * Mostra tarefas filtradas por papel do usuário.
 * Visual: VPC (escuro, botões grandes, espaçamento generoso).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShiftChecklistSection } from "../../components/Tasks/ShiftChecklistSection";
import { TaskCard } from "../../components/Tasks/TaskCard";
import { TaskSuggestions } from "../../components/Tasks/TaskSuggestions";
import { TaskSuggestionsMentorEngine } from "../../components/Tasks/TaskSuggestionsMentorEngine";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { useMentorshipMessages } from "../../core/intelligence/useMentorshipMessages";
import {
  taskFiltering,
  type Task,
  type UserRole,
} from "../../core/tasks/TaskFiltering";
import { taskMentor, type TaskSuggestion } from "../../core/tasks/TaskMentor";
import { GlobalLoadingView } from "../../ui/design-system/components";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  spaceLg: 32,
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;

export function TaskDashboardPage() {
  const navigate = useNavigate();
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("employee");

  // Onda 6 — MentorEngine
  const {
    messages: mentorshipMessages,
    addEvent,
    addFeedback,
  } = useMentorshipMessages();
  {
    /* Onda 6 — Simulação de eventos IA (remover em produção) */
  }
  <section style={{ marginBottom: VPC.space }}>
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() =>
          addEvent({
            type: "SLA_VIOLATED",
            orderId: "123",
            timestamp: Date.now(),
          })
        }
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          color: "#991b1b",
          cursor: "pointer",
        }}
      >
        Simular SLA violado
      </button>
      <button
        onClick={() =>
          addEvent({
            type: "STOCK_ZEROED",
            productId: "tomate",
            timestamp: Date.now(),
          })
        }
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          background: "#fef9c3",
          border: "1px solid #fde047",
          color: "#92400e",
          cursor: "pointer",
        }}
      >
        Simular estoque zerado
      </button>
      <button
        onClick={() =>
          addEvent({
            type: "ORDER_DELAYED",
            orderId: "456",
            delayMinutes: 12,
            timestamp: Date.now(),
          })
        }
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          background: "#dbeafe",
          border: "1px solid #60a5fa",
          color: "#1e3a8a",
          cursor: "pointer",
        }}
      >
        Simular atraso pedido
      </button>
    </div>
  </section>;

  useEffect(() => {
    const fetchUserData = async () => {
      const mockRole: UserRole = "employee";
      setRole(mockRole);

      if (!restaurantId) return;

      const fetchedTasks = await taskFiltering.getPendingTasksForRole(
        restaurantId,
        mockRole,
      );
      setTasks(fetchedTasks);

      const fetchedSuggestions = await taskMentor.analyzeAndSuggest(
        restaurantId,
      );
      setSuggestions(fetchedSuggestions);

      setLoading(false);
    };

    if (!loadingRestaurantId && restaurantId) {
      fetchUserData();
      // EventMonitor é iniciado no contexto operacional (EventMonitorBootstrap em App.tsx)
      // para que o sensor de ociosidade corra mesmo no Dashboard/TPV/KDS, não só em /tasks.
    }
  }, [restaurantId, loadingRestaurantId, role]);

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <GlobalLoadingView
        message="A carregar tarefas..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        padding: VPC.spaceLg,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: VPC.spaceLg }}>
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              color: VPC.text,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Minhas Tarefas
          </h1>
          <p
            style={{
              fontSize: VPC.fontSizeBase,
              color: VPC.textMuted,
              margin: 0,
            }}
          >
            Tarefas pendentes e sugestões
          </p>
        </header>

        {/* FASE 3 Passo 2: Checklist do turno (quando há turno ativo) */}
        {restaurantId && (
          <section style={{ marginBottom: VPC.spaceLg }}>
            <ShiftChecklistSection
              restaurantId={restaurantId}
              variant="compact"
            />
          </section>
        )}

        {/* Onda 6 — Sugestões MentorEngine */}
        {mentorshipMessages.length > 0 && (
          <section style={{ marginBottom: VPC.spaceLg }}>
            <TaskSuggestionsMentorEngine
              messages={mentorshipMessages}
              onFeedback={addFeedback}
            />
          </section>
        )}

        {suggestions.length > 0 && (
          <section style={{ marginBottom: VPC.spaceLg }}>
            <TaskSuggestions suggestions={suggestions} variant="dark" />
          </section>
        )}

        <section>
          {tasks.length === 0 ? (
            <div
              style={{
                padding: VPC.spaceLg,
                textAlign: "center",
                backgroundColor: VPC.surface,
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                color: VPC.textMuted,
                fontSize: VPC.fontSizeBase,
              }}
            >
              Nenhuma tarefa pendente
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={() => navigate(`/tasks/${task.id}`)}
                  variant="dark"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes vpc-fade {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
