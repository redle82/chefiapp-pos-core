/**
 * TaskAnalytics - Análise e Histórico de Tarefas
 *
 * Analisa padrões, performance e comportamento.
 *
 * DOCKER MODE: Métricas reais via readTasksForAnalytics (gm_tasks).
 * SUPABASE/OUTROS: Retorna métricas vazias (shape compatível com a UI).
 */

import type { CoreTask } from "../../infra/docker-core/types";
import {
  readEmployeeTaskHistory,
  readTaskHistory,
  readTasksForAnalytics,
} from "../../infra/readers/TaskReader";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";

/** Tarefa no shape interno usado pela lógica de analytics (status "completed" | "overdue" etc.). */
interface AnalyticsTask {
  id: string;
  status: string;
  completed_at?: string;
  due_at?: string;
  assigned_to?: string;
  employees?: { name?: string };
  recurring_task_id?: string;
  title?: string;
  category?: string;
}

function coreTaskToAnalyticsTask(t: CoreTask): AnalyticsTask {
  const ctx = t.context || {};
  const expectedSec =
    typeof ctx.expected_seconds === "number" ? ctx.expected_seconds : null;
  const elapsedSec =
    typeof ctx.elapsed_seconds === "number" ? ctx.elapsed_seconds : null;
  const delaySec =
    typeof ctx.delay_seconds === "number" ? ctx.delay_seconds : null;
  const createdMs = new Date(t.created_at).getTime();
  const dueAt =
    expectedSec != null
      ? new Date(createdMs + expectedSec * 1000).toISOString()
      : undefined;

  let status = "open";
  if (t.status === "RESOLVED") status = "completed";
  else if (t.status === "DISMISSED") status = "dismissed";
  else if (
    t.status === "OPEN" &&
    (delaySec != null
      ? delaySec > 0
      : elapsedSec != null && expectedSec != null && elapsedSec > expectedSec)
  )
    status = "overdue";

  return {
    id: t.id,
    status,
    completed_at: t.resolved_at ?? undefined,
    due_at: dueAt,
    assigned_to: t.assigned_to ?? undefined,
    employees: undefined,
    recurring_task_id: undefined,
    title: t.message,
    category: t.task_type,
  };
}

export interface TaskAnalyticsReport {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // minutos
  completionRate: number; // porcentagem
  topDelayers: Array<{
    employeeId: string;
    employeeName: string;
    delayCount: number;
  }>;
  ignoredTasks: Array<{ taskId: string; title: string; ignoredCount: number }>;
  performanceByCategory: Record<
    string,
    {
      total: number;
      completed: number;
      averageDelay: number;
    }
  >;
}

export class TaskAnalytics {
  /**
   * Analisar tarefas de um restaurante
   */
  async analyze(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TaskAnalyticsReport> {
    let tasks: AnalyticsTask[] = [];
    if (getBackendType() === BackendType.docker) {
      try {
        const coreTasks = await readTasksForAnalytics(
          restaurantId,
          startDate,
          endDate,
        );
        tasks = coreTasks.map(coreTaskToAnalyticsTask);
      } catch (e) {
        Logger.warn("[TaskAnalytics] Erro ao carregar tarefas do Core:", {
          error: String(e),
        });
      }
    }
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const overdueTasks = tasks.filter((t) => t.status === "overdue").length;

    // Calcular tempo médio de conclusão
    const completedWithTime = tasks.filter(
      (t) => t.status === "completed" && t.completed_at && t.due_at,
    );
    const averageCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, t) => {
            const delay =
              (new Date(t.completed_at).getTime() -
                new Date(t.due_at).getTime()) /
              (1000 * 60);
            return sum + Math.max(0, delay);
          }, 0) / completedWithTime.length
        : 0;

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Top delayers
    const delayers = new Map<
      string,
      { employeeId: string; employeeName: string; delayCount: number }
    >();
    for (const task of tasks) {
      if (
        task.status === "overdue" ||
        (task.completed_at &&
          task.due_at &&
          new Date(task.completed_at) > new Date(task.due_at))
      ) {
        const employeeId = task.assigned_to || "unassigned";
        const employeeName = task.employees?.name || "Não atribuído";
        const current = delayers.get(employeeId) || {
          employeeId,
          employeeName,
          delayCount: 0,
        };
        delayers.set(employeeId, {
          ...current,
          delayCount: current.delayCount + 1,
        });
      }
    }
    const topDelayers = Array.from(delayers.values())
      .sort((a, b) => b.delayCount - a.delayCount)
      .slice(0, 5);

    // Ignored tasks (tarefas que ficaram overdue múltiplas vezes)
    const ignoredTasksMap = new Map<
      string,
      { taskId: string; title: string; ignoredCount: number }
    >();
    for (const task of tasks) {
      if (task.recurring_task_id && task.status === "overdue") {
        const key = task.recurring_task_id;
        const current = ignoredTasksMap.get(key) || {
          taskId: task.id,
          title: task.title,
          ignoredCount: 0,
        };
        ignoredTasksMap.set(key, {
          ...current,
          ignoredCount: current.ignoredCount + 1,
        });
      }
    }
    const ignoredTasks = Array.from(ignoredTasksMap.values())
      .filter((t) => t.ignoredCount > 1)
      .sort((a, b) => b.ignoredCount - a.ignoredCount)
      .slice(0, 5);

    // Performance por categoria
    const performanceByCategory: Record<
      string,
      { total: number; completed: number; averageDelay: number }
    > = {};
    for (const task of tasks) {
      const category = task.category || "other";
      if (!performanceByCategory[category]) {
        performanceByCategory[category] = {
          total: 0,
          completed: 0,
          averageDelay: 0,
        };
      }
      performanceByCategory[category].total++;
      if (task.status === "completed") {
        performanceByCategory[category].completed++;
        if (task.completed_at && task.due_at) {
          const delay =
            (new Date(task.completed_at).getTime() -
              new Date(task.due_at).getTime()) /
            (1000 * 60);
          performanceByCategory[category].averageDelay += Math.max(0, delay);
        }
      }
    }

    // Calcular média de delay por categoria
    for (const category in performanceByCategory) {
      const perf = performanceByCategory[category];
      perf.averageDelay =
        perf.completed > 0 ? perf.averageDelay / perf.completed : 0;
    }

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      averageCompletionTime,
      completionRate,
      topDelayers,
      ignoredTasks,
      performanceByCategory,
    };
  }

  /**
   * Buscar histórico de uma tarefa
   */
  async getTaskHistory(taskId: string): Promise<
    Array<{
      action: string;
      actorId?: string;
      actorName?: string;
      oldStatus?: string;
      newStatus?: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }>
  > {
    if (getBackendType() !== BackendType.docker) {
      Logger.warn(
        "[TaskAnalytics] getTaskHistory não disponível fora do Docker mode.",
        { taskId },
      );
      return [];
    }

    const data = await readTaskHistory(taskId);

    return data.map((row) => ({
      action: row.action,
      actorId: row.actor_id,
      actorName: row.actor_role || "Sistema",
      oldStatus: row.old_status,
      newStatus: row.new_status,
      timestamp: new Date(row.created_at),
      metadata: row.metadata,
    }));
  }

  /**
   * Buscar histórico de um funcionário
   */
  async getEmployeeHistory(
    employeeId: string,
    limit: number = 100,
  ): Promise<
    Array<{
      taskId: string;
      taskTitle: string;
      action: string;
      timestamp: Date;
      status?: string;
    }>
  > {
    if (getBackendType() !== BackendType.docker) {
      Logger.warn(
        "[TaskAnalytics] getEmployeeHistory não disponível fora do Docker mode.",
        { employeeId, limit },
      );
      return [];
    }

    const data = await readEmployeeTaskHistory(employeeId, limit);

    return data.map((row) => ({
      taskId: row.task_id,
      taskTitle: "Tarefa",
      action: row.action,
      timestamp: new Date(row.created_at),
      status: row.new_status,
    }));
  }
}

export const taskAnalytics = new TaskAnalytics();
