/**
 * Employee Tasks - Tarefas do Funcionário
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import styles from "./TasksPage.module.css";

export function EmployeeTasksPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress">(
    "all",
  );

  // TODO: Integrar com Task Engine
  // TODO: Buscar tasks do usuário
  // TODO: Atualizar status em tempo real
  const tasks: any[] = []; // Placeholder

  return (
    <div className={styles.page}>
      <Header
        title="Tarefas"
        actions={
          <div className={styles.filterActions}>
            <button
              onClick={() => setFilter("all")}
              className={`${styles.filterButton} ${
                filter === "all" ? styles.filterButtonActive : ""
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`${styles.filterButton} ${
                filter === "pending" ? styles.filterButtonActive : ""
              }`}
            >
              Pendentes
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        {tasks.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa pendente"
            message="Parabéns! Você está em dia"
          />
        ) : (
          <div className={styles.taskList}>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/employee/tasks/${task.id}`)}
                className={styles.taskCard}
              >
                <div className={styles.taskHeader}>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <span
                    className={`${styles.statusBadge} ${
                      task.status === "PENDING"
                        ? styles.statusBadgePending
                        : styles.statusBadgeInProgress
                    }`}
                  >
                    {task.status === "PENDING" ? "Pendente" : "Em andamento"}
                  </span>
                </div>
                <div className={styles.taskMeta}>
                  Tipo: {task.type} | SLA: {task.sla_remaining || "N/A"}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Iniciar tarefa
                  }}
                  className={styles.primaryActionButton}
                >
                  {task.status === "PENDING" ? "Iniciar" : "Concluir"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
