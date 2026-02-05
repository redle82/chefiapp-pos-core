/**
 * EventTaskGenerator - Gerador de Tarefas por Eventos
 *
 * Gera tarefas automaticamente baseado em eventos do sistema
 * (pedido atrasado, estoque baixo, ausência de funcionário, etc)
 *
 * PURE DOCKER MODE:
 * - Usa Docker Core (`gm_task_rules`, RPCs) via dockerCoreClient.
 */

import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { getAlertThresholds } from "../alerts/alertThresholds";

export interface TaskRule {
  id: string;
  restaurantId: string;
  eventType: string;
  condition: Record<string, any>;
  taskTemplate: {
    title: string;
    description: string;
    assignedRole?: string;
    priority: "low" | "normal" | "high" | "critical";
    dueAt?: string; // ISO string ou relativo como "1 hour"
  };
  isActive: boolean;
}

export class EventTaskGenerator {
  /**
   * Criar regra de geração de tarefa
   */
  async createRule(rule: Omit<TaskRule, "id">): Promise<string> {
    const { data, error } = await dockerCoreClient
      .from("task_rules")
      .insert({
        restaurant_id: rule.restaurantId,
        event_type: rule.eventType,
        condition: rule.condition,
        task_template: rule.taskTemplate,
        priority: rule.taskTemplate.priority,
        is_active: rule.isActive,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Gerar tarefa a partir de evento.
   *
   * LOOP MÍNIMO: Cria tarefa diretamente em gm_tasks sem depender de RPC.
   */
  async generateFromEvent(
    restaurantId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<string | null> {
    try {
      const title = this.getDefaultTitle(eventType, eventData);
      const description = this.getDefaultDescription(eventType, eventData);
      const priority = this.getDefaultPriority(eventType);
      const dueAt = this.calculateDueAt(eventType);

      // Mapear prioridade para formato do Core
      const corePriorityMap: Record<
        string,
        "LOW" | "MEDIA" | "ALTA" | "CRITICA"
      > = {
        low: "LOW",
        normal: "MEDIA",
        high: "ALTA",
        critical: "CRITICA",
      };

      // Determinar task_type baseado no evento (CONTRATO_DE_ATIVIDADE_OPERACIONAL: restaurant_idle)
      const taskTypeMap: Record<string, string> = {
        order_delayed: "ATRASO_ITEM",
        table_unattended: "PEDIDO_ESQUECIDO",
        stock_low: "ESTOQUE_CRITICO",
        employee_absent: "EQUIPAMENTO_CHECK",
        restaurant_idle: "MODO_INTERNO",
        order_created: "PEDIDO_NOVO",
      };

      // Criar tarefa diretamente em gm_tasks
      // Schema: id, restaurant_id, order_id, order_item_id, task_type, station, priority, message, context, status, assigned_to, created_at, acknowledged_at, resolved_at, updated_at, auto_generated, source_event
      const { data, error } = await dockerCoreClient
        .from("gm_tasks")
        .insert({
          restaurant_id: restaurantId,
          order_id: eventData.orderId || null,
          order_item_id: eventData.orderItemId || null,
          task_type: (taskTypeMap[eventType] || "ITEM_CRITICO") as any,
          station: eventData.station || null,
          priority: corePriorityMap[priority] || "MEDIA",
          message: title,
          context: {
            ...eventData,
            description,
            event_type: eventType,
          },
          status: "OPEN",
          assigned_to: null,
          auto_generated: true,
          source_event: eventType,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[EventTaskGenerator] Erro ao criar tarefa:", error);
        return null;
      }

      console.log(
        `[EventTaskGenerator] ✅ Tarefa criada: ${data.id} para evento ${eventType}`
      );
      return data.id;
    } catch (error) {
      console.error("[EventTaskGenerator] Erro ao gerar tarefa:", error);
      return null;
    }
  }

  /**
   * Criar regras padrão (limiares conforme ALERT_THRESHOLDS_CONTRACT)
   */
  async createDefaultRules(restaurantId: string): Promise<void> {
    const thresholds = getAlertThresholds(restaurantId);
    const defaultRules: Omit<TaskRule, "id">[] = [
      {
        restaurantId,
        eventType: "order_delayed",
        condition: { delay_minutes: { $gt: thresholds.order_delayed_minutes } },
        taskTemplate: {
          title: "Pedido atrasado",
          description: "Verificar pedido atrasado e tomar ação",
          assignedRole: "manager",
          priority: "high",
          dueAt: "0 minutes", // Imediato
        },
        isActive: true,
      },
      {
        restaurantId,
        eventType: "stock_low",
        condition: { threshold: 0.2 }, // 20% do estoque mínimo
        taskTemplate: {
          title: "Estoque baixo",
          description: "Verificar estoque e fazer pedido de compra",
          assignedRole: "manager",
          priority: "high",
          dueAt: "2 hours",
        },
        isActive: true,
      },
      {
        restaurantId,
        eventType: "employee_absent",
        condition: {},
        taskTemplate: {
          title: "Funcionário ausente",
          description: "Funcionário não compareceu ao turno",
          assignedRole: "manager",
          priority: "critical",
          dueAt: "0 minutes",
        },
        isActive: true,
      },
      {
        restaurantId,
        eventType: "table_unattended",
        condition: {
          minutes_unattended: { $gt: thresholds.table_unattended_minutes },
        },
        taskTemplate: {
          title: "Mesa sem atendimento",
          description: `Mesa aguardando atendimento há mais de ${thresholds.table_unattended_minutes} minutos`,
          assignedRole: "employee",
          priority: "high",
          dueAt: "0 minutes",
        },
        isActive: true,
      },
    ];

    for (const rule of defaultRules) {
      try {
        await this.createRule(rule);
      } catch (error) {
        console.error("Error creating default rule:", error);
      }
    }
  }

  /**
   * Listar regras
   */
  async listRules(
    restaurantId: string,
    activeOnly: boolean = true
  ): Promise<TaskRule[]> {
    let query = dockerCoreClient
      .from("task_rules")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return (data || []).map(this.mapToTaskRule);
  }

  private getDefaultTitle(
    eventType: string,
    eventData: Record<string, any>
  ): string {
    const titles: Record<string, string> = {
      order_delayed: `Pedido atrasado #${eventData.orderId || "N/A"}`,
      stock_low: `Estoque baixo: ${eventData.productName || "Produto"}`,
      employee_absent: `Funcionário ausente: ${
        eventData.employeeName || "N/A"
      }`,
      table_unattended: `Mesa ${
        eventData.tableNumber || "N/A"
      } sem atendimento`,
      restaurant_idle: "Restaurante em modo interno — checklist e organização",
      order_created: `Preparar pedido #${
        eventData.orderNumber ?? eventData.orderId ?? "N/A"
      }`,
    };

    return titles[eventType] || `Tarefa gerada por ${eventType}`;
  }

  private getDefaultDescription(
    eventType: string,
    eventData: Record<string, any>
  ): string {
    const descriptions: Record<string, string> = {
      order_delayed: `Pedido #${eventData.orderId} está atrasado. Verificar status e tomar ação.`,
      stock_low: `Produto ${eventData.productName} está com estoque baixo (${
        eventData.currentStock || "N/A"
      }). Fazer pedido de compra.`,
      employee_absent: `Funcionário ${eventData.employeeName} não compareceu ao turno. Verificar e reorganizar escalas.`,
      table_unattended: `Mesa ${
        eventData.tableNumber
      } está aguardando atendimento há ${
        eventData.minutesUnattended || "N/A"
      } minutos.`,
      restaurant_idle: `Modo interno: sem pedidos ativos há ${
        eventData.minutesSinceLastOrder ?? "?"
      } min. Aproveitar para checklist do turno, limpeza, organização ou preparação.`,
      order_created: `Novo pedido criado. Mesa ${
        eventData.tableNumber ?? "—"
      }. Preparar e entregar.`,
    };

    return (
      descriptions[eventType] ||
      `Tarefa gerada automaticamente pelo evento ${eventType}`
    );
  }

  private getDefaultPriority(
    eventType: string
  ): "low" | "normal" | "high" | "critical" {
    const priorities: Record<string, "low" | "normal" | "high" | "critical"> = {
      order_delayed: "high",
      stock_low: "high",
      employee_absent: "critical",
      table_unattended: "high",
      restaurant_idle: "normal",
      order_created: "high",
    };

    return priorities[eventType] || "normal";
  }

  private calculateDueAt(eventType: string): Date | null {
    const now = new Date();
    const dueAtMap: Record<string, number> = {
      order_delayed: 0, // Imediato
      stock_low: 2 * 60 * 60 * 1000, // 2 horas
      employee_absent: 0, // Imediato
      table_unattended: 0, // Imediato
      restaurant_idle: 60 * 60 * 1000, // 1 hora (modo interno)
      order_created: 15 * 60 * 1000, // 15 min (preparar pedido)
    };

    const delay = dueAtMap[eventType] ?? 60 * 60 * 1000; // 1 hora padrão
    return new Date(now.getTime() + delay);
  }

  private mapToTaskRule(row: any): TaskRule {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      eventType: row.event_type,
      condition: row.condition,
      taskTemplate: row.task_template,
      isActive: row.is_active,
    };
  }
}

export const eventTaskGenerator = new EventTaskGenerator();
