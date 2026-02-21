/**
 * useAppFocus — App Behavior Layer (ABL).
 * Deriva o foco inicial do Manager: alertas > tarefas pendentes > operação.
 * Retorno: um único valor AppFocus (tipo enriquecido com count quando aplicável).
 */
// @ts-nocheck


import { useMemo } from "react";
import { useStaff } from "../context/StaffContext";
import { useTableAlerts } from "./useTableAlerts";

export type AppFocus =
  | { type: "alerts"; count: number }
  | { type: "tasks"; count: number }
  | { type: "operation" };

export function useAppFocus(): AppFocus {
  const { tasks } = useStaff();
  const { alerts } = useTableAlerts();

  const pendingCount = tasks.filter((t) => t.status !== "done").length;
  return useMemo((): AppFocus => {
    if (alerts.length > 0) {
      return { type: "alerts", count: alerts.length };
    }
    if (pendingCount > 0) {
      return { type: "tasks", count: pendingCount };
    }
    return { type: "operation" };
  }, [alerts.length, pendingCount]);
}
