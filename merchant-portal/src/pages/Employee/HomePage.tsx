/**
 * Employee Home - Início do Funcionário
 *
 * Status do turno + foco do dia
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import styles from "./HomePage.module.css";

export function EmployeeHomePage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const hasShift = false;
  const shiftStatus = {
    status: t("common:employee.onShift"),
    hours: "08:00 - 16:00",
    remaining: "4h 30min",
  };

  const focusItems = [
    { id: "1", title: "Limpar cozinha", priority: "high" },
    { id: "2", title: "Verificar estoque", priority: "medium" },
    { id: "3", title: "Preparar ingredientes", priority: "low" },
  ];

  const getPriorityLabel = (priority: string) => {
    if (priority === "high") return t("common:employee.priorityHigh");
    if (priority === "medium") return t("common:employee.priorityMedium");
    return t("common:employee.priorityLow");
  };

  const getPriorityClassName = (priority: string) => {
    if (priority === "high") return styles.priorityHigh;
    if (priority === "medium") return styles.priorityMedium;
    return styles.priorityLow;
  };

  return (
    <div className={styles.page}>
      <Header title={t("common:employee.home")} subtitle={t("common:employee.shiftStatus")} />

      <div className={styles.content}>
        {hasShift ? (
          <>
            <div className={styles.shiftCard}>
              <h3 className={styles.sectionTitle}>{t("common:employee.shiftStatus")}</h3>
              <div className={styles.shiftMeta}>
                <div>Status: {shiftStatus.status}</div>
                <div>{t("common:employee.schedule")}: {shiftStatus.hours}</div>
                <div>{t("common:employee.remaining")}: {shiftStatus.remaining}</div>
              </div>
            </div>

            <div className={styles.focusCard}>
              <h3 className={styles.sectionTitle}>{t("common:employee.focusOfDay")}</h3>
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
                {t("common:employee.viewAllTasks")}
              </button>
            </div>

            <div className={styles.quickActions}>
              <button
                onClick={() => navigate("/employee/operation")}
                className={styles.secondaryActionButton}
              >
                {t("common:employee.viewOperation")}
              </button>
              <button
                onClick={() => navigate("/employee/tasks")}
                className={styles.secondaryActionButton}
              >
                {t("common:employee.viewTasks")}
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            title={t("common:employee.noShift")}
            message={t("common:employee.noShiftDesc")}
            action={{
              label: t("common:employee.startShift"),
              onPress: () => navigate("/employee/profile"),
            }}
          />
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
