import type { ShiftState, Task } from "@/context/AppStaffContext";

export type CoreHealthStatus = "UP" | "DOWN";

export interface ManagerOperationalHomeInput {
  tasks: Task[];
  shiftState: ShiftState;
  activeStaffCount: number;
  coreStatus: CoreHealthStatus;
  specDriftsCount: number;
}

export interface ManagerOperationalHomeModel {
  isHealthy: boolean;
  shiftLabel: string;
  bottlenecks: string[];
  pendingTasksCount: number;
  urgentPendingTasksCount: number;
  cards: Array<{ label: string; value: number; urgent: boolean }>;
}

function isTaskDone(status: Task["status"]): boolean {
  return status === "done" || status === ("completed" as Task["status"]);
}

export function buildManagerOperationalHomeModel(
  input: ManagerOperationalHomeInput,
): ManagerOperationalHomeModel {
  const pendingTasks = input.tasks.filter((task) => !isTaskDone(task.status));
  const urgentPendingTasks = pendingTasks.filter(
    (task) => task.priority === "critical" || task.priority === "urgent",
  );

  const bottlenecks: string[] = [];
  if (input.specDriftsCount > 0) {
    bottlenecks.push(
      `${input.specDriftsCount} alerta${
        input.specDriftsCount !== 1 ? "s" : ""
      } crítico${input.specDriftsCount !== 1 ? "s" : ""}`,
    );
  }
  if (urgentPendingTasks.length > 0) {
    bottlenecks.push("Tarefas urgentes pendentes");
  }
  if (input.activeStaffCount === 0 && input.shiftState === "active") {
    bottlenecks.push("Sem equipe ativa");
  }
  if (input.coreStatus !== "UP") {
    bottlenecks.push("Sistema instável");
  }

  const shiftLabel =
    input.shiftState === "active"
      ? "TURNO ATIVO"
      : input.shiftState === "closing"
      ? "A ENCERRAR"
      : "SEM TURNO";

  return {
    isHealthy: bottlenecks.length === 0 && input.shiftState === "active",
    shiftLabel,
    bottlenecks,
    pendingTasksCount: pendingTasks.length,
    urgentPendingTasksCount: urgentPendingTasks.length,
    cards: [
      {
        label: "Alertas",
        value: input.specDriftsCount,
        urgent: input.specDriftsCount > 0,
      },
      {
        label: "Tarefas",
        value: pendingTasks.length,
        urgent: pendingTasks.length > 5,
      },
      {
        label: "Equipe",
        value: input.activeStaffCount,
        urgent: input.activeStaffCount === 0,
      },
    ],
  };
}
