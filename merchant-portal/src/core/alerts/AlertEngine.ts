/**
 * AlertEngine - Engine de Alertas (mock/offline)
 *
 * IMPORTANTE (PURE DOCKER / DEV_STABLE):
 * - Este módulo está marcado como `dataSource: "mock"` em `moduleCatalog`.
 * - Portanto, NÃO deve chamar Supabase nem RPCs reais.
 * - Implementação atual: store in-memory por sessão, suficiente para demo/UX.
 *
 * OPERATIONAL_ALERTS_CONTRACT: severity "critical" = bloqueio ou perda de verdade;
 * não usar critical para estado normal (ex.: N pedidos activos). Usar info/warn/critical conforme contrato.
 */

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertCategory =
  | "operational"
  | "financial"
  | "human"
  | "system"
  | "compliance";
export type AlertStatus =
  | "active"
  | "acknowledged"
  | "resolved"
  | "ignored"
  | "escalated";

export interface Alert {
  id: string;
  restaurantId: string;
  alertType: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  details: Record<string, any>;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  ignoredAt?: Date;
  ignoredReason?: string;
  escalationLevel: number;
  escalatedTo?: string;
  escalatedAt?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

type AlertHistoryEntry = {
  action: string;
  actorId?: string;
  actorName?: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  timestamp: Date;
};

const alertsStore = new Map<string, Alert>();
const alertsHistoryStore = new Map<string, AlertHistoryEntry[]>();

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `alert_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export class AlertEngine {
  /**
   * Criar alerta
   */
  async create(alert: {
    restaurantId: string;
    alertType: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    category?: AlertCategory;
    details?: Record<string, any>;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<string> {
    const id = generateId();
    const now = new Date();

    const entry: Alert = {
      id,
      restaurantId: alert.restaurantId,
      alertType: alert.alertType,
      severity: alert.severity,
      category: alert.category || "operational",
      title: alert.title,
      message: alert.message,
      details: alert.details || {},
      status: "active",
      escalationLevel: 0,
      createdAt: now,
      updatedAt: now,
      relatedEntityType: alert.relatedEntityType,
      relatedEntityId: alert.relatedEntityId,
    };

    alertsStore.set(id, entry);
    this.appendHistory(id, {
      action: "created",
      newStatus: "active",
      timestamp: now,
    });

    return id;
  }

  /**
   * Listar alertas
   */
  async list(
    restaurantId: string,
    filters?: {
      status?: AlertStatus[];
      severity?: AlertSeverity[];
      category?: AlertCategory[];
      limit?: number;
    }
  ): Promise<Alert[]> {
    const all = Array.from(alertsStore.values()).filter(
      (a) => a.restaurantId === restaurantId
    );

    let filtered = all;

    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter((a) => filters.status!.includes(a.status));
    }

    if (filters?.severity && filters.severity.length > 0) {
      filtered = filtered.filter((a) => filters.severity!.includes(a.severity));
    }

    if (filters?.category && filters.category.length > 0) {
      filtered = filtered.filter((a) => filters.category!.includes(a.category));
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Buscar alertas ativos
   */
  async getActive(restaurantId: string): Promise<Alert[]> {
    return this.list(restaurantId, { status: ["active", "escalated"] });
  }

  /**
   * Buscar alertas críticos
   */
  async getCritical(restaurantId: string): Promise<Alert[]> {
    return this.list(restaurantId, {
      severity: ["critical"],
      status: ["active", "escalated"],
    });
  }

  /**
   * Atualizar status do alerta
   */
  async updateStatus(
    alertId: string,
    newStatus: AlertStatus,
    actorId?: string,
    notes?: string
  ): Promise<void> {
    const existing = alertsStore.get(alertId);
    if (!existing) {
      console.warn(
        "[AlertEngine] updateStatus: alerta não encontrado",
        alertId
      );
      return;
    }

    const now = new Date();
    const oldStatus = existing.status;
    const updated: Alert = { ...existing, status: newStatus, updatedAt: now };

    if (newStatus === "acknowledged") {
      updated.acknowledgedBy = actorId;
      updated.acknowledgedAt = now;
    } else if (newStatus === "resolved") {
      updated.resolvedAt = now;
    } else if (newStatus === "ignored") {
      updated.ignoredAt = now;
      updated.ignoredReason = notes;
    }

    alertsStore.set(alertId, updated);
    this.appendHistory(alertId, {
      action: "status_updated",
      actorId,
      oldStatus,
      newStatus,
      notes,
      timestamp: now,
    });
  }

  /**
   * Escalar alerta
   */
  async escalate(
    alertId: string,
    escalatedTo: string,
    reason?: string
  ): Promise<void> {
    const existing = alertsStore.get(alertId);
    if (!existing) {
      console.warn("[AlertEngine] escalate: alerta não encontrado", alertId);
      return;
    }

    const now = new Date();
    const updated: Alert = {
      ...existing,
      escalationLevel: (existing.escalationLevel || 0) + 1,
      escalatedTo,
      escalatedAt: now,
      updatedAt: now,
    };

    alertsStore.set(alertId, updated);
    this.appendHistory(alertId, {
      action: "escalated",
      actorId: escalatedTo,
      notes: reason,
      timestamp: now,
    });
  }

  /**
   * Buscar histórico de alerta
   */
  async getHistory(alertId: string): Promise<
    Array<{
      action: string;
      actorId?: string;
      actorName?: string;
      oldStatus?: string;
      newStatus?: string;
      notes?: string;
      timestamp: Date;
    }>
  > {
    const history = alertsHistoryStore.get(alertId) || [];
    return history.map((h) => ({
      ...h,
      actorName: h.actorId || "Sistema",
    }));
  }

  /**
   * Criar alertas padrão baseados em eventos
   */
  async createFromEvent(
    restaurantId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<string | null> {
    const alertMap: Record<
      string,
      {
        severity: AlertSeverity;
        category?: AlertCategory;
        title: string;
        message: string;
      }
    > = {
      order_delayed: {
        severity: "high",
        category: "operational",
        title: "Pedido atrasado",
        message: `Pedido #${eventData.orderId || "N/A"} está atrasado há ${
          eventData.delayMinutes || 0
        } minutos`,
      },
      order_sla_breach: {
        severity: "critical",
        category: "operational",
        title: "SLA de pedido violado",
        message: `Pedido #${
          eventData.orderId || "N/A"
        } excedeu o tempo máximo de espera (${
          eventData.delayMinutes ?? "—"
        } min)`,
      },
      stock_low: {
        severity: "medium",
        category: "operational",
        title: "Estoque baixo",
        message: `Produto ${
          eventData.productName || "N/A"
        } está com estoque baixo`,
      },
      stock_rupture_predicted: {
        severity: "high",
        category: "operational",
        title: "Ruptura prevista",
        message: `Ingrediente ${
          eventData.ingredientName || eventData.productName || "N/A"
        } pode esgotar em breve (projeção: ${eventData.hoursLeft ?? "—"} h)`,
      },
      margin_deviation: {
        severity: "medium",
        category: "financial",
        title: "Desvio de margem",
        message:
          eventData.message ||
          `Margem fora do esperado: ${eventData.productName ?? "produto"}`,
      },
      fiscal_delayed: {
        severity: "high",
        category: "compliance",
        title: "Fiscal em atraso",
        message:
          eventData.message ||
          "Fecho fiscal pendente. Regularize para evitar sanções.",
      },
      employee_absent: {
        severity: "critical",
        category: "human",
        title: "Funcionário ausente",
        message: `Funcionário ${
          eventData.employeeName || "N/A"
        } não compareceu ao turno`,
      },
      kitchen_overloaded: {
        severity: "high",
        category: "operational",
        title: "Cozinha sobrecarregada",
        message:
          "Cozinha está sobrecarregada. Tempo médio de preparo aumentou significativamente",
      },
      dining_overloaded: {
        severity: "medium",
        category: "operational",
        title: "Salão sobrecarregado",
        message: "Salão está sobrecarregado. Mesas aguardando atendimento",
      },
      table_unattended: {
        severity: "medium",
        category: "operational",
        title: "Mesa aguardando atendimento",
        message: `Mesa ${eventData.tableNumber ?? "N/A"} aguardando há ${
          eventData.minutesUnattended ?? 0
        } min`,
      },
    };

    const alertConfig = alertMap[eventType];
    if (!alertConfig) return null;

    try {
      return await this.create({
        restaurantId,
        alertType: eventType,
        severity: alertConfig.severity,
        category: alertConfig.category,
        title: alertConfig.title,
        message: alertConfig.message,
        details: eventData,
        relatedEntityType: eventData.entityType,
        relatedEntityId: eventData.entityId,
      });
    } catch (error) {
      console.error("Error creating alert from event (mock):", error);
      return null;
    }
  }

  private appendHistory(alertId: string, entry: AlertHistoryEntry): void {
    const existing = alertsHistoryStore.get(alertId) || [];
    alertsHistoryStore.set(alertId, [...existing, entry]);
  }
}

export const alertEngine = new AlertEngine();
