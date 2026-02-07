import React, { useEffect, useState } from "react";
import { useTraining } from "../../intelligence/education/TrainingContext";
import { DarkModeToggle } from "../../ui/components/DarkModeToggle"; // P3-5
import { useToast } from "../../ui/design-system";
import { ShiftForecastWidget } from "../../ui/design-system/ShiftForecastWidget";
import { StaffLayout } from "../../ui/design-system/layouts/StaffLayout";
import { Button } from "../../ui/design-system/primitives/Button";
import { Input } from "../../ui/design-system/primitives/Input";
import { Text } from "../../ui/design-system/primitives/Text";
import { AdvancedSearchPanel } from "./components/AdvancedSearchPanel"; // P4-8
import { AgoraSection } from "./components/AgoraSection"; // Tela Agora: tarefas pendentes + pedidos READY
import { GamificationPanel } from "./components/GamificationPanel"; // P6-8
import { InventoryLiteSection } from "./components/InventoryLiteSection"; // Inventory Lite: alertas repor X
import { SessionXPWidget } from "./components/SessionXPWidget"; // Phase 3: Gamification
import { useStaff } from "./context/StaffContext";
import { useContextualSuggestions } from "./hooks/useContextualSuggestions";
import { useTableAlerts } from "./hooks/useTableAlerts";
import { useTaskFilters } from "./hooks/useTaskFilters"; // P3-1 & P3-2

export const WorkerTaskStream: React.FC = () => {
  // Destructure completeTask here
  const {
    tasks,
    startTask,
    completeTask,
    checkOut,
    activeWorkerId,
    activeRole,
    shiftMetrics,
    forecast,
    shiftStart,
    coreRestaurantId,
    operationalContract,
  } = useStaff();
  const { alerts } = useTableAlerts(); // FASE 2: Alertas automáticos
  const { suggestions } = useContextualSuggestions(); // FASE 2: Sugestões contextuais
  const { activeLesson, completeLesson, dismissLesson } = useTraining();
  const { success } = useToast();

  // P3-1 & P3-2: Task filtering and search
  const { filter, setFilter, searchQuery, setSearchQuery, filteredTasks } =
    useTaskFilters(tasks);

  // P4-8: Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Listen for task completion events (dopamine feedback)
  useEffect(() => {
    const handleTaskComplete = (
      e: CustomEvent<{ message: string; taskTitle?: string }>
    ) => {
      success(e.detail.message);
    };

    window.addEventListener(
      "staff-task-complete",
      handleTaskComplete as EventListener
    );
    return () =>
      window.removeEventListener(
        "staff-task-complete",
        handleTaskComplete as EventListener
      );
  }, [success]);

  // Filter tasks relevant to view (now using filteredTasks from hook)
  const activeTasks = filteredTasks.filter((t) => t.status !== "done");

  return (
    <StaffLayout
      title="Minhas Tarefas"
      userName={activeWorkerId || "Staff"}
      role={activeRole}
      status="active"
      actions={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <DarkModeToggle />
          <Button
            tone="destructive"
            variant="outline"
            fullWidth
            onClick={checkOut}
          >
            Encerrar Turno
          </Button>
        </div>
      }
    >
      {/* AGORA - Tarefas pendentes (Core) + Pedidos READY (Orders Lite) */}
      {operationalContract?.id && (
        <div style={{ marginBottom: 16 }}>
          <AgoraSection
            restaurantId={coreRestaurantId ?? operationalContract.id}
            userId={activeWorkerId ?? undefined}
          />
        </div>
      )}

      {/* INVENTORY LITE - Alertas de stock (repor X) */}
      {operationalContract?.id && (
        <div style={{ marginBottom: 16 }}>
          <InventoryLiteSection restaurantId={coreRestaurantId ?? operationalContract.id} />
        </div>
      )}

      {/* SHIFT HEALTH - PHASE B - Always visible */}
      <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <ShiftHealthWidget metrics={shiftMetrics} />
        </div>
        {/* FORECAST - PHASE D */}
        <div style={{ flex: 1 }}>
          <ShiftForecastWidget
            pressure={forecast.pressure}
            prediction={forecast.prediction}
          />
        </div>
      </div>

      {/* SESSION XP - PHASE 3 GAMIFICATION */}
      <div style={{ marginBottom: 12 }}>
        <SessionXPWidget tasks={tasks} shiftStart={shiftStart} />
      </div>
      {/* TRAINING CARD - PHASE C - Contextual */}
      {activeLesson && (
        <LessonCard
          lesson={activeLesson}
          onComplete={completeLesson}
          onDismiss={dismissLesson}
        />
      )}

      {/* FASE 2: ALERTAS DE MESAS */}
      {alerts.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#fff3cd",
            borderRadius: 8,
            border: "1px solid #ffc107",
          }}
        >
          <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>
            ⚠️ Alertas de Mesas
          </Text>
          {alerts.map((alert) => (
            <div key={alert.tableId} style={{ marginBottom: 4 }}>
              <Text
                size="xs"
                color={alert.severity === "error" ? "error" : "warning"}
              >
                {alert.message}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* FASE 2: SUGESTÕES CONTEXTUAIS */}
      {suggestions.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#e3f2fd",
            borderRadius: 8,
            border: "1px solid #2196f3",
          }}
        >
          <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>
            💡 Sugestões
          </Text>
          {suggestions.slice(0, 3).map((suggestion) => (
            <div
              key={suggestion.id}
              style={{
                marginBottom: 8,
                padding: 8,
                backgroundColor: "white",
                borderRadius: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                <Text size="sm">{suggestion.icon || "💡"}</Text>
                <div style={{ flex: 1 }}>
                  <Text size="sm" weight="bold">
                    {suggestion.title}
                  </Text>
                  <Text
                    size="xs"
                    color="tertiary"
                    style={{ marginTop: 4, display: "block" }}
                  >
                    {suggestion.description}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* P3-1 & P3-2: FILTERS AND SEARCH */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder="🔍 Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            {showAdvancedSearch ? "✕" : "🔍 Avançada"}
          </Button>
        </div>

        {/* P4-8: Advanced Search Panel */}
        {showAdvancedSearch && (
          <AdvancedSearchPanel onClose={() => setShowAdvancedSearch(false)} />
        )}

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", "pending", "critical", "done"] as const).map(
            (filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "solid" : "outline"}
                tone={filterOption === "critical" ? "destructive" : "neutral"}
                size="sm"
                onClick={() => setFilter(filterOption)}
              >
                {filterOption === "all" && "Todas"}
                {filterOption === "pending" && "Pendentes"}
                {filterOption === "critical" && "Críticas"}
                {filterOption === "done" && "Concluídas"}
              </Button>
            )
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {activeTasks.length === 0 && alerts.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>
          <Text size="xl">✅</Text>
          <Text
            size="md"
            weight="bold"
            color="primary"
            style={{ marginTop: 12 }}
          >
            Tudo em dia
          </Text>
          <Text size="xs" color="tertiary">
            Aguardando novas atribuições...
          </Text>
        </div>
      )}

      {/* TASK LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            taskId={task.id}
            title={task.title}
            description={task.description}
            status={task.status === "focused" ? "in-progress" : "pending"}
            priority={task.priority}
            assignedAt={new Date(task.createdAt)}
            onAction={(action) => {
              if (action === "start") startTask(task.id);
              if (action === "complete") completeTask(task.id);
            }}
          />
        ))}
      </div>

      {/* P6-8: Gamification Panel */}
      <div style={{ marginTop: 24 }}>
        <GamificationPanel />
      </div>
    </StaffLayout>
  );
};
