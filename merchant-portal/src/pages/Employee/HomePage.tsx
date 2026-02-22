/**
 * Employee Home - Início do Funcionário
 *
 * Status do turno + foco do dia
 */

import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import styles from "./HomePage.module.css";

export function EmployeeHomePage() {
  const navigate = useNavigate();

  // TODO: Integrar com Employee Time Engine
  // TODO: Buscar turno atual do usuário
  // TODO: Calcular tempo restante
  const hasShift = false; // Placeholder
  const shiftStatus = {
    status: "Em turno",
    hours: "08:00 - 16:00",
    remaining: "4h 30min",
  };

  const focusItems = [
    { id: "1", title: "Limpar cozinha", priority: "high" },
    { id: "2", title: "Verificar estoque", priority: "medium" },
    { id: "3", title: "Preparar ingredientes", priority: "low" },
  ];

  const getPriorityLabel = (priority: string) => {
    if (priority === "high") return "Alta";
    if (priority === "medium") return "Média";
    return "Baixa";
  };

  const getPriorityClassName = (priority: string) => {
    if (priority === "high") return styles.priorityHigh;
    if (priority === "medium") return styles.priorityMedium;
    return styles.priorityLow;
  };

  return (
    <div className={styles.page}>
      <Header title="Início" subtitle="Status do turno" />

      <div className={styles.content}>
        {hasShift ? (
          <>
            {/* Shift Status Card */}
            <div className={styles.shiftCard}>
              <h3 className={styles.sectionTitle}>Status do Turno</h3>
              <div className={styles.shiftMeta}>
                <div>Status: {shiftStatus.status}</div>
                <div>Horário: {shiftStatus.hours}</div>
                <div>Tempo restante: {shiftStatus.remaining}</div>
              </div>
            </div>

            {/* Focus Card */}
            <div className={styles.focusCard}>
              <h3 className={styles.sectionTitle}>Foco do Dia</h3>
              <div className={styles.focusList}>
                {focusItems.map((item) => (
                  <div key={item.id} className={styles.focusItem}>
                    <span className={styles.focusItemTitle}>{item.title}</span>
                    <span
                      className={`${
                        styles.priorityBadge
                      } ${getPriorityClassName(item.priority)}`}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/employee/tasks")}
                className={styles.primaryActionButton}
              >
                Ver todas as tarefas
              </button>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <button
                onClick={() => navigate("/employee/operation")}
                className={styles.secondaryActionButton}
              >
                Ver Operação
              </button>
              <button
                onClick={() => navigate("/employee/tasks")}
                className={styles.secondaryActionButton}
              >
                Ver Tarefas
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Você não está em turno hoje"
            message="Verifique seus próximos turnos"
            action={{
              label: "Ver próximos turnos",
              onPress: () => navigate("/employee/profile"),
            }}
          />
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
