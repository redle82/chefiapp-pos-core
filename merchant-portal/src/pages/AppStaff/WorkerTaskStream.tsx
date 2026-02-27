import React, { useEffect, useState } from "react";
import { useTraining } from "../../intelligence/education/TrainingContext";
import { DarkModeToggle } from "../../ui/components/DarkModeToggle"; // P3-5
import { useToast } from "../../ui/design-system";
import { Button } from "../../ui/design-system/Button";
import { Input } from "../../ui/design-system/Input";
import { StaffLayout } from "../../ui/design-system/layouts/StaffLayout";
import { LessonCard } from "../../ui/design-system/LessonCard";
import { Text } from "../../ui/design-system/primitives/Text";
import { ShiftForecastWidget } from "../../ui/design-system/ShiftForecastWidget";
import { ShiftHealthWidget } from "../../ui/design-system/ShiftHealthWidget";
import { TaskCard } from "../../ui/design-system/TaskCard";
import { AdvancedSearchPanel } from "./components/AdvancedSearchPanel"; // P4-8
import { AgoraSection } from "./components/AgoraSection"; // Tela Agora: tarefas pendentes + pedidos READY
import { InventoryLiteSection } from "./components/InventoryLiteSection"; // Inventory Lite: alertas repor X
import { useStaff } from "./context/StaffContext";
import { useContextualSuggestions } from "./hooks/useContextualSuggestions";
import { useTableAlerts } from "./hooks/useTableAlerts";
import { useTaskFilters } from "./hooks/useTaskFilters"; // P3-1 & P3-2
import styles from "./WorkerTaskStream.module.css";

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
        <div className={styles.sidebarActions}>
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
        <div className={styles.sectionSpacing}>
          <AgoraSection
            restaurantId={coreRestaurantId ?? operationalContract.id}
            userId={activeWorkerId ?? undefined}
          />
        </div>
      )}

      {/* INVENTORY LITE - Alertas de stock (repor X) */}
      {operationalContract?.id && (
        <div className={styles.sectionSpacing}>
          <InventoryLiteSection
            restaurantId={coreRestaurantId ?? operationalContract.id}
          />
        </div>
      )}

      {/* SHIFT HEALTH - PHASE B - Always visible */}
      <div className={styles.healthRow}>
        <div className={styles.healthCell}>
          <ShiftHealthWidget metrics={shiftMetrics} />
        </div>
        {/* FORECAST - PHASE D */}
        <div className={styles.healthCell}>
          <ShiftForecastWidget
            pressure={forecast.pressure}
            prediction={forecast.prediction}
          />
        </div>
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
        <div className={styles.alertsSection}>
          <Text size="sm" weight="bold" className={styles.alertLabel}>
            ⚠️ Alertas de Mesas
          </Text>
          {alerts.map((alert) => (
            <div key={alert.tableId} className={styles.alertItem}>
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
        <div className={styles.suggestionsSection}>
          <Text size="sm" weight="bold" className={styles.suggestionLabel}>
            💡 Sugestões
          </Text>
          {suggestions.slice(0, 3).map((suggestion) => (
            <div key={suggestion.id} className={styles.suggestionCard}>
              <div className={styles.suggestionContent}>
                <Text size="sm">{suggestion.icon || "💡"}</Text>
                <div className={styles.suggestionBody}>
                  <Text size="sm" weight="bold">
                    {suggestion.title}
                  </Text>
                  <Text
                    size="xs"
                    color="tertiary"
                    className={styles.suggestionDesc}
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
      <div className={styles.filtersSection}>
        {/* Search Input */}
        <div className={styles.searchRow}>
          <Input
            placeholder="🔍 Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
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
        <div className={styles.filterButtons}>
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
        <div className={styles.emptyState}>
          <Text size="xl">✅</Text>
          <Text
            size="md"
            weight="bold"
            color="primary"
            className={styles.emptyTitle}
          >
            Tudo em dia
          </Text>
          <Text size="xs" color="tertiary">
            Aguardando novas atribuições...
          </Text>
        </div>
      )}

      {/* TASK LIST */}
      <div className={styles.taskList}>
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            taskId={task.id}
            title={task.title}
            description={task.description}
            status={task.status === "focused" ? "in-progress" : "pending"}
            priority={task.priority}
            assignedAt={new Date(task.createdAt)}
            onAction={(action: "start" | "complete" | "validate") => {
              if (action === "start") startTask(task.id);
              if (action === "complete") completeTask(task.id);
            }}
          />
        ))}
      </div>
    </StaffLayout>
  );
};
