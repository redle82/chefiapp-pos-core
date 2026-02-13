/**
 * HealthEngine - Engine de Saúde do Restaurante
 *
 * Gerencia health operacional, humano, financeiro e score geral
 *
 * LOOP MÍNIMO: Calcula score simples baseado em tarefas críticas abertas.
 * PURE DOCKER MODE: Usa TaskReader (dockerCoreClient) em vez de supabase.
 */

import { readOpenTasksByRestaurant } from "../../infra/readers/TaskReader";

export interface OperationalHealth {
  id: string;
  restaurantId: string;
  kitchenDelayMinutes: number;
  kitchenOverloaded: boolean;
  diningRoomOverloaded: boolean;
  averageOrderTime?: number;
  peakHourPerformance?: number;
  overallStatus: "healthy" | "degraded" | "critical";
  issuesCount: number;
  measuredAt: Date;
}

export interface HumanHealth {
  id: string;
  restaurantId: string;
  employeeId?: string;
  fatigueLevel: "normal" | "moderate" | "high" | "critical";
  overloadScore: number;
  consecutiveDays: number;
  hoursThisWeek: number;
  overtimeHours: number;
  status: "healthy" | "tired" | "overloaded" | "critical";
  measuredAt: Date;
}

export interface FinancialHealth {
  id: string;
  restaurantId: string;
  cashFlowTrend?: "positive" | "stable" | "negative";
  marginPercentage?: number;
  wastePercentage?: number;
  lossAmount: number;
  lowMargin: boolean;
  highWaste: boolean;
  cashFlowWarning: boolean;
  status: "healthy" | "warning" | "critical";
  periodStart: Date;
  periodEnd: Date;
}

export interface RestaurantHealthScore {
  id: string;
  restaurantId: string;
  operationalScore: number;
  humanScore: number;
  financialScore: number;
  systemScore: number;
  overallScore: number;
  overallStatus: "healthy" | "degraded" | "critical";
  breakdown: Record<string, any>;
  measuredAt: Date;
}

export class HealthEngine {
  /**
   * Registrar health operacional
   */
  async recordOperationalHealth(health: {
    restaurantId: string;
    kitchenDelayMinutes?: number;
    kitchenOverloaded?: boolean;
    diningRoomOverloaded?: boolean;
    averageOrderTime?: number;
    peakHourPerformance?: number;
  }): Promise<string> {
    const issuesCount =
      (health.kitchenOverloaded ? 1 : 0) +
      (health.diningRoomOverloaded ? 1 : 0);
    const overallStatus =
      issuesCount > 1 || (health.kitchenDelayMinutes || 0) > 30
        ? "critical"
        : issuesCount > 0 || (health.kitchenDelayMinutes || 0) > 15
        ? "degraded"
        : "healthy";

    // TODO: Implementar quando tabela operational_health existir no Docker Core
    // Por enquanto, retornar ID sintético em DEV_STABLE_MODE
    console.warn(
      "[HealthEngine] recordOperationalHealth não implementado no Docker Core",
    );
    return `op-health-${health.restaurantId}-${Date.now()}`;
  }

  /**
   * Registrar health humano
   */
  async recordHumanHealth(health: {
    restaurantId: string;
    employeeId?: string;
    fatigueLevel?: "normal" | "moderate" | "high" | "critical";
    overloadScore?: number;
    consecutiveDays?: number;
    hoursThisWeek?: number;
    overtimeHours?: number;
  }): Promise<string> {
    const status =
      health.fatigueLevel === "critical" || (health.overloadScore || 0) > 0.9
        ? "critical"
        : health.fatigueLevel === "high" || (health.overloadScore || 0) > 0.7
        ? "overloaded"
        : health.fatigueLevel === "moderate" ||
          (health.overloadScore || 0) > 0.5
        ? "tired"
        : "healthy";

    // TODO: Implementar quando tabela human_health existir no Docker Core
    // Por enquanto, retornar ID sintético em DEV_STABLE_MODE
    console.warn(
      "[HealthEngine] recordHumanHealth não implementado no Docker Core",
    );
    return `human-health-${health.restaurantId}-${Date.now()}`;
  }

  /**
   * Registrar health financeiro
   */
  async recordFinancialHealth(health: {
    restaurantId: string;
    cashFlowTrend?: "positive" | "stable" | "negative";
    marginPercentage?: number;
    wastePercentage?: number;
    lossAmount?: number;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<string> {
    const lowMargin = (health.marginPercentage || 0) < 20;
    const highWaste = (health.wastePercentage || 0) > 10;
    const cashFlowWarning = health.cashFlowTrend === "negative";

    const status =
      lowMargin && highWaste
        ? "critical"
        : lowMargin || highWaste || cashFlowWarning
        ? "warning"
        : "healthy";

    // TODO: Implementar quando tabela financial_health existir no Docker Core
    // Por enquanto, retornar ID sintético em DEV_STABLE_MODE
    console.warn(
      "[HealthEngine] recordFinancialHealth não implementado no Docker Core",
    );
    return `financial-health-${health.restaurantId}-${Date.now()}`;
  }

  /**
   * Calcular health score simples baseado em tarefas críticas abertas.
   *
   * LOOP MÍNIMO: Evento → Tarefa → Saúde
   * - Conta tarefas críticas/altas abertas
   * - Calcula score 0-100 (verde/amarelo/vermelho)
   * - Funciona em DEV_STABLE_MODE sem dados reais
   */
  async calculateSimpleHealthScore(restaurantId: string): Promise<{
    score: number; // 0-100
    status: "healthy" | "degraded" | "critical";
    criticalTasks: number;
    highTasks: number;
    totalOpenTasks: number;
  }> {
    try {
      const tasks = await readOpenTasksByRestaurant(restaurantId);

      const criticalTasks = tasks.filter(
        (t) => t.priority === "CRITICA" && t.status === "OPEN",
      ).length;
      const highTasks = tasks.filter(
        (t) => t.priority === "ALTA" && t.status === "OPEN",
      ).length;
      const totalOpenTasks = tasks.filter((t) => t.status === "OPEN").length;

      // Score simples: 100 - (críticas * 20) - (altas * 10)
      // Máximo de penalização: 100 pontos
      let score = 100;
      score -= criticalTasks * 20;
      score -= highTasks * 10;
      score = Math.max(0, Math.min(100, score));

      // Status baseado em score
      let status: "healthy" | "degraded" | "critical";
      if (score >= 80) {
        status = "healthy";
      } else if (score >= 50) {
        status = "degraded";
      } else {
        status = "critical";
      }

      // Se tem tarefas críticas, força status crítico
      if (criticalTasks > 0) {
        status = "critical";
      }

      return {
        score,
        status,
        criticalTasks,
        highTasks,
        totalOpenTasks,
      };
    } catch (error) {
      console.error(
        "[HealthEngine] Erro ao calcular health score simples:",
        error,
      );
      // Fallback seguro em DEV_STABLE_MODE
      return {
        score: 85,
        status: "healthy",
        criticalTasks: 0,
        highTasks: 0,
        totalOpenTasks: 0,
      };
    }
  }

  /**
   * Calcular e salvar health score do restaurante (método completo)
   */
  async calculateHealthScore(
    restaurantId: string,
  ): Promise<RestaurantHealthScore> {
    // FASE 1: Por enquanto, usar score simples baseado em tarefas
    const simpleScore = await this.calculateSimpleHealthScore(restaurantId);

    // Mapear para formato completo (sem persistir ainda)
    return {
      id: `health-${restaurantId}-${Date.now()}`,
      restaurantId,
      operationalScore: simpleScore.score / 100,
      humanScore: 1.0,
      financialScore: 1.0,
      systemScore: 1.0,
      overallScore: simpleScore.score / 100,
      overallStatus: simpleScore.status,
      breakdown: {
        criticalTasks: simpleScore.criticalTasks,
        highTasks: simpleScore.highTasks,
        totalOpenTasks: simpleScore.totalOpenTasks,
      },
      measuredAt: new Date(),
    };
  }

  /**
   * Buscar health score atual
   * LOOP MÍNIMO: Calcula em tempo real em vez de buscar do banco
   */
  async getCurrentHealthScore(
    restaurantId: string,
  ): Promise<RestaurantHealthScore | null> {
    // LOOP MÍNIMO: Calcular em tempo real em vez de buscar persistido
    return await this.calculateHealthScore(restaurantId);
  }

  /**
   * Buscar health operacional atual
   * TODO: Implementar quando tabela operational_health existir no Docker Core
   */
  async getCurrentOperationalHealth(
    restaurantId: string,
  ): Promise<OperationalHealth | null> {
    console.warn(
      "[HealthEngine] getCurrentOperationalHealth não implementado no Docker Core",
    );
    return null;
  }

  /**
   * Buscar health humano atual
   * TODO: Implementar quando tabela human_health existir no Docker Core
   */
  async getCurrentHumanHealth(restaurantId: string): Promise<HumanHealth[]> {
    console.warn(
      "[HealthEngine] getCurrentHumanHealth não implementado no Docker Core",
    );
    return [];
  }

  /**
   * Buscar health financeiro atual
   * TODO: Implementar quando tabela financial_health existir no Docker Core
   */
  async getCurrentFinancialHealth(
    restaurantId: string,
  ): Promise<FinancialHealth | null> {
    console.warn(
      "[HealthEngine] getCurrentFinancialHealth não implementado no Docker Core",
    );
    return null;
  }

  private mapToOperationalHealth(row: any): OperationalHealth {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      kitchenDelayMinutes: parseFloat(row.kitchen_delay_minutes || 0),
      kitchenOverloaded: row.kitchen_overloaded || false,
      diningRoomOverloaded: row.dining_room_overloaded || false,
      averageOrderTime: row.average_order_time
        ? parseFloat(row.average_order_time)
        : undefined,
      peakHourPerformance: row.peak_hour_performance
        ? parseFloat(row.peak_hour_performance)
        : undefined,
      overallStatus: row.overall_status,
      issuesCount: row.issues_count || 0,
      measuredAt: new Date(row.measured_at),
    };
  }

  private mapToHumanHealth(row: any): HumanHealth {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      employeeId: row.employee_id,
      fatigueLevel: row.fatigue_level,
      overloadScore: parseFloat(row.overload_score || 0),
      consecutiveDays: row.consecutive_days || 0,
      hoursThisWeek: parseFloat(row.hours_this_week || 0),
      overtimeHours: parseFloat(row.overtime_hours || 0),
      status: row.status,
      measuredAt: new Date(row.measured_at),
    };
  }

  private mapToFinancialHealth(row: any): FinancialHealth {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      cashFlowTrend: row.cash_flow_trend,
      marginPercentage: row.margin_percentage
        ? parseFloat(row.margin_percentage)
        : undefined,
      wastePercentage: row.waste_percentage
        ? parseFloat(row.waste_percentage)
        : undefined,
      lossAmount: parseFloat(row.loss_amount || 0),
      lowMargin: row.low_margin || false,
      highWaste: row.high_waste || false,
      cashFlowWarning: row.cash_flow_warning || false,
      status: row.status,
      periodStart: new Date(row.period_start),
      periodEnd: new Date(row.period_end),
    };
  }

  private mapToHealthScore(row: any): RestaurantHealthScore {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      operationalScore: parseFloat(row.operational_score || 1.0),
      humanScore: parseFloat(row.human_score || 1.0),
      financialScore: parseFloat(row.financial_score || 1.0),
      systemScore: parseFloat(row.system_score || 1.0),
      overallScore: parseFloat(row.overall_score || 1.0),
      overallStatus: row.overall_status,
      breakdown: row.breakdown || {},
      measuredAt: new Date(row.measured_at),
    };
  }
}

export const healthEngine = new HealthEngine();
