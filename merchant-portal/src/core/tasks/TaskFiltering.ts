/**
 * TaskFiltering - Filtragem de Tarefas por Papel
 *
 * Filtra e organiza tarefas baseado no papel do usuário
 * (garçom, cozinha, gerente, owner).
 *
 * PURE DOCKER MODE (FASE 1):
 * - A leitura real de tarefas passa pelo Docker Core (`gm_tasks`)
 *   via `TaskReader` (dockerCoreClient).
 * - Este módulo faz o mapeamento e filtros em memória para o portal.
 */

import type { CoreTask } from "../../infra/docker-core/types";
import { readOpenTasksByRestaurant } from "../../infra/readers/TaskReader";

export type UserRole = "owner" | "manager" | "employee" | "cashier" | "kitchen";

export interface Task {
  id: string;
  restaurantId: string;
  recurringTaskId?: string;
  eventId?: string;
  eventType?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedRole?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
  priority: "low" | "normal" | "high" | "critical";
  category: string;
  dueAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  feedback?: string;
  feedbackRating?: number;
  impactSla?: Record<string, any>;
}

export class TaskFiltering {
  /**
   * Buscar tarefas filtradas por papel.
   *
   * FASE 1 (PURE DOCKER):
   * Lê tarefas abertas via Docker Core (`gm_tasks`) e aplica filtros em memória.
   */
  async getTasksForRole(
    restaurantId: string,
    role: UserRole,
    employeeId?: string,
    filters?: {
      status?: Task["status"][];
      priority?: Task["priority"][];
      category?: string[];
      dueBefore?: Date;
      dueAfter?: Date;
    },
  ): Promise<Task[]> {
    let coreTasks: CoreTask[] =
      (await readOpenTasksByRestaurant(restaurantId)) || [];

    // Deduplicar por (order_id, order_item_id, task_type), mantendo a mais recente
    coreTasks = deduplicateCoreTasks(coreTasks);

    let tasks = coreTasks.map((t) => this.mapCoreTaskToTask(t));

    // Filtro por funcionário (quando aplicável)
    if (employeeId) {
      tasks = tasks.filter((t) => t.assignedTo === employeeId);
    }

    // Filtros adicionais em memória
    if (filters?.status) {
      tasks = tasks.filter((t) => filters.status!.includes(t.status));
    }

    if (filters?.priority) {
      tasks = tasks.filter((t) => filters.priority!.includes(t.priority));
    }

    if (filters?.category && filters.category.length > 0) {
      tasks = tasks.filter((t) => filters.category!.includes(t.category));
    }

    if (filters?.dueAfter) {
      tasks = tasks.filter((t) => t.dueAt >= filters.dueAfter!);
    }

    if (filters?.dueBefore) {
      tasks = tasks.filter((t) => t.dueAt <= filters.dueBefore!);
    }

    return tasks;
  }

  /**
   * Buscar tarefas pendentes para um papel
   */
  async getPendingTasksForRole(
    restaurantId: string,
    role: UserRole,
    employeeId?: string,
  ): Promise<Task[]> {
    return this.getTasksForRole(restaurantId, role, employeeId, {
      status: ["pending", "in_progress"],
    });
  }

  /**
   * Buscar tarefas críticas para um papel
   */
  async getCriticalTasksForRole(
    restaurantId: string,
    role: UserRole,
    employeeId?: string,
  ): Promise<Task[]> {
    return this.getTasksForRole(restaurantId, role, employeeId, {
      status: ["pending", "in_progress", "overdue"],
      priority: ["critical", "high"],
    });
  }

  /**
   * Buscar tarefas por categoria para um papel
   */
  async getTasksByCategoryForRole(
    restaurantId: string,
    role: UserRole,
    category: string,
    employeeId?: string,
  ): Promise<Task[]> {
    return this.getTasksForRole(restaurantId, role, employeeId, {
      category: [category],
    });
  }

  /**
   * Contar tarefas por status para um papel
   */
  async countTasksByStatusForRole(
    restaurantId: string,
    role: UserRole,
    employeeId?: string,
  ): Promise<Record<string, number>> {
    const tasks = await this.getTasksForRole(restaurantId, role, employeeId);

    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
    };

    for (const task of tasks) {
      counts[task.status] = (counts[task.status] || 0) + 1;
    }

    return counts;
  }

  private mapCoreTaskToTask(row: CoreTask): Task {
    return mapCoreTaskToTask(row);
  }
}

/**
 * Deduplica tarefas do Core por chave lógica (order_id, order_item_id, task_type),
 * mantendo a de created_at mais recente. Reduz tarefas "idênticas" no dashboard.
 * Exportado para uso em TaskSystemMinimal e outras listas.
 */
export function deduplicateCoreTasks(tasks: CoreTask[]): CoreTask[] {
  const byKey = new Map<string, CoreTask>();
  for (const t of tasks) {
    const key =
      `${t.order_id ?? ""}_${t.order_item_id ?? ""}_${t.task_type}`.trim() ||
      t.id;
    const existing = byKey.get(key);
    if (
      !existing ||
      new Date(t.created_at).getTime() > new Date(existing.created_at).getTime()
    ) {
      byKey.set(key, t);
    }
  }
  return Array.from(byKey.values());
}

/**
 * Mapeia CoreTask (gm_tasks) para Task (portal).
 * Exportado para uso em TaskDetailCoreTODO e outros.
 */
export function mapCoreTaskToTask(row: CoreTask): Task {
  const priorityMap: Record<string, Task["priority"]> = {
    LOW: "low",
    MEDIA: "normal",
    ALTA: "high",
    CRITICA: "critical",
  };

  const statusMap: Record<string, Task["status"]> = {
    OPEN: "pending",
    ACKNOWLEDGED: "in_progress",
    RESOLVED: "completed",
    DISMISSED: "cancelled",
  };

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    recurringTaskId: null,
    eventId: null,
    eventType: row.source_event || undefined,
    title: row.message,
    description: row.context?.category || row.context?.template_code || "",
    assignedTo: row.assigned_to || undefined,
    assignedRole: undefined,
    status: statusMap[row.status] || "pending",
    priority: priorityMap[row.priority] || "normal",
    category:
      row.context?.category ||
      row.context?.department ||
      row.task_type ||
      row.station ||
      "operational",
    dueAt: row.context?.scheduled_for
      ? new Date(row.context.scheduled_for)
      : new Date(row.created_at),
    startedAt: row.acknowledged_at
      ? new Date(row.acknowledged_at)
      : undefined,
    completedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    feedback: undefined,
    feedbackRating: undefined,
    impactSla: {
      context: row.context,
      evidence: (row as any).evidence_json ?? {},
    },
  };
}

export const taskFiltering = new TaskFiltering();
