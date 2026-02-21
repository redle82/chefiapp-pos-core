/**
 * RecurringTaskEngine - Engine de Tarefas Recorrentes
 *
 * Gerencia criação e execução de tarefas recorrentes
 * (abertura, fechamento, limpeza, HACCP)
 *
 * PURE DOCKER MODE:
 * - Usa Docker Core (`gm_recurring_tasks`, RPCs) via dockerCoreClient.
 */
// @ts-nocheck


import type { PulseZone } from "../../../../core-engine/pulse";
import { dockerCoreClient } from "../../infra/docker-core/connection";

export interface RecurringTask {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  timeOfDay?: string; // HH:mm
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  assignedRole?: string;
  category:
    | "opening"
    | "closing"
    | "cleaning"
    | "haccp"
    | "operational"
    | "maintenance";
  priority: "low" | "normal" | "high" | "critical";
  estimatedMinutes: number;
  isActive: boolean;
}

export class RecurringTaskEngine {
  /**
   * Criar tarefa recorrente
   */
  async create(task: Omit<RecurringTask, "id">): Promise<string> {
    const { data, error } = await dockerCoreClient.rpc(
      "create_recurring_task",
      {
        p_restaurant_id: task.restaurantId,
        p_name: task.name,
        p_description: task.description || null,
        p_frequency: task.frequency,
        p_time_of_day: task.timeOfDay || null,
        p_day_of_week: task.dayOfWeek || null,
        p_day_of_month: task.dayOfMonth || null,
        p_assigned_role: task.assignedRole || null,
        p_category: task.category,
        p_priority: task.priority,
        p_estimated_minutes: task.estimatedMinutes,
      },
    );

    if (error) throw error;
    return data as string;
  }

  /**
   * Gerar tarefas recorrentes para hoje
   *
   * Quando pulseZone é FLOW_ALTO, tarefas não-urgentes
   * (cleaning, maintenance com prioridade low/normal) são suprimidas.
   */
  async generateForToday(
    restaurantId: string,
    date?: Date,
    pulseZone?: PulseZone,
  ): Promise<number> {
    // Em FLOW_ALTO, suprimir tarefas não-urgentes antes de gerar
    if (pulseZone === "FLOW_ALTO") {
      const suppressed = await this.suppressNonUrgent(restaurantId);
      if (suppressed > 0) {
        console.log(
          `[RecurringTaskEngine] ⏸ Suprimidas ${suppressed} tarefas ` +
            `não-urgentes (FLOW_ALTO)`,
        );
      }
    }

    const { data, error } = await dockerCoreClient.rpc(
      "generate_recurring_tasks_for_today",
      {
        p_restaurant_id: restaurantId,
        p_date: date
          ? date.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      },
    );

    if (error) throw error;
    return data as number;
  }

  /**
   * Suprimir tarefas não-urgentes durante FLOW_ALTO.
   * Desativa temporariamente tarefas de cleaning/maintenance
   * com prioridade low ou normal.
   */
  async suppressNonUrgent(restaurantId: string): Promise<number> {
    const suppressCategories: RecurringTask["category"][] = [
      "cleaning",
      "maintenance",
    ];
    const suppressPriorities: RecurringTask["priority"][] = ["low", "normal"];

    const { data, error } = await dockerCoreClient
      .from("recurring_tasks")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .in("category", suppressCategories)
      .in("priority", suppressPriorities);

    if (error || !data?.length) return 0;
    return data.length; // count only — actual suppression is skip-based
  }

  /**
   * Verificar se tarefa deve ser suprimida pelo Pulso
   */
  shouldSuppressForPulse(
    category: RecurringTask["category"],
    priority: RecurringTask["priority"],
    pulseZone: PulseZone,
  ): boolean {
    if (pulseZone !== "FLOW_ALTO") return false;
    const suppressCategories: RecurringTask["category"][] = [
      "cleaning",
      "maintenance",
    ];
    const suppressPriorities: RecurringTask["priority"][] = ["low", "normal"];
    return (
      suppressCategories.includes(category) &&
      suppressPriorities.includes(priority)
    );
  }

  /**
   * Listar tarefas recorrentes
   */
  async list(
    restaurantId: string,
    activeOnly: boolean = true,
  ): Promise<RecurringTask[]> {
    let query = dockerCoreClient
      .from("recurring_tasks")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return (data || []).map(this.mapToRecurringTask);
  }

  /**
   * Atualizar tarefa recorrente
   */
  async update(taskId: string, updates: Partial<RecurringTask>): Promise<void> {
    const { error } = await dockerCoreClient
      .from("recurring_tasks")
      .update({
        name: updates.name,
        description: updates.description,
        frequency: updates.frequency,
        time_of_day: updates.timeOfDay,
        day_of_week: updates.dayOfWeek,
        day_of_month: updates.dayOfMonth,
        assigned_role: updates.assignedRole,
        category: updates.category,
        priority: updates.priority,
        estimated_minutes: updates.estimatedMinutes,
        is_active: updates.isActive,
      })
      .eq("id", taskId);

    if (error) throw error;
  }

  /**
   * Desativar tarefa recorrente
   */
  async deactivate(taskId: string): Promise<void> {
    const { error } = await dockerCoreClient
      .from("recurring_tasks")
      .update({ is_active: false })
      .eq("id", taskId);

    if (error) throw error;
  }

  /**
   * Criar tarefas padrão de abertura
   */
  async createDefaultOpeningTasks(restaurantId: string): Promise<void> {
    const openingTasks: Omit<RecurringTask, "id" | "restaurantId">[] = [
      {
        name: "Verificar estoque",
        description: "Verificar estoque de ingredientes principais",
        frequency: "daily",
        timeOfDay: "08:00",
        category: "opening",
        priority: "high",
        estimatedMinutes: 15,
        isActive: true,
      },
      {
        name: "Ligar equipamentos",
        description: "Ligar forno, fogão, geladeiras",
        frequency: "daily",
        timeOfDay: "08:30",
        category: "opening",
        priority: "critical",
        estimatedMinutes: 10,
        isActive: true,
      },
      {
        name: "Preparar área de trabalho",
        description: "Organizar bancadas e utensílios",
        frequency: "daily",
        timeOfDay: "09:00",
        category: "opening",
        priority: "normal",
        estimatedMinutes: 20,
        isActive: true,
      },
    ];

    for (const task of openingTasks) {
      await this.create({ ...task, restaurantId });
    }
  }

  /**
   * Criar tarefas padrão de fechamento
   */
  async createDefaultClosingTasks(restaurantId: string): Promise<void> {
    const closingTasks: Omit<RecurringTask, "id" | "restaurantId">[] = [
      {
        name: "Fechar caixa",
        description: "Fechar caixa e fazer contagem",
        frequency: "daily",
        timeOfDay: "22:00",
        assignedRole: "cashier",
        category: "closing",
        priority: "critical",
        estimatedMinutes: 30,
        isActive: true,
      },
      {
        name: "Limpeza geral",
        description: "Limpeza completa da cozinha e salão",
        frequency: "daily",
        timeOfDay: "22:30",
        category: "cleaning",
        priority: "high",
        estimatedMinutes: 60,
        isActive: true,
      },
      {
        name: "Desligar equipamentos",
        description: "Desligar todos os equipamentos",
        frequency: "daily",
        timeOfDay: "23:00",
        category: "closing",
        priority: "critical",
        estimatedMinutes: 15,
        isActive: true,
      },
    ];

    for (const task of closingTasks) {
      await this.create({ ...task, restaurantId });
    }
  }

  /**
   * Criar tarefas padrão HACCP
   */
  async createDefaultHACCPTasks(restaurantId: string): Promise<void> {
    const haccpTasks: Omit<RecurringTask, "id" | "restaurantId">[] = [
      {
        name: "Verificação de temperatura",
        description: "Verificar temperatura de geladeiras e freezers",
        frequency: "daily",
        timeOfDay: "10:00",
        category: "haccp",
        priority: "critical",
        estimatedMinutes: 10,
        isActive: true,
      },
      {
        name: "Limpeza de superfícies",
        description: "Limpeza e sanitização de superfícies de contato",
        frequency: "daily",
        timeOfDay: "14:00",
        category: "haccp",
        priority: "high",
        estimatedMinutes: 30,
        isActive: true,
      },
    ];

    for (const task of haccpTasks) {
      await this.create({ ...task, restaurantId });
    }
  }

  private mapToRecurringTask(row: any): RecurringTask {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      description: row.description,
      frequency: row.frequency,
      timeOfDay: row.time_of_day,
      dayOfWeek: row.day_of_week,
      dayOfMonth: row.day_of_month,
      assignedRole: row.assigned_role,
      category: row.category,
      priority: row.priority,
      estimatedMinutes: row.estimated_minutes,
      isActive: row.is_active,
    };
  }
}

export const recurringTaskEngine = new RecurringTaskEngine();
