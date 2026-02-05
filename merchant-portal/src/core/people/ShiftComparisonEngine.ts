/**
 * ShiftComparisonEngine - Engine de Comparação Turno Real vs Planejado
 *
 * Compara turno planejado com turno real executado
 */

// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { supabase } from "../supabase";

export interface ShiftComparison {
  id: string;
  restaurantId: string;
  shiftId?: string;
  employeeId: string;
  plannedStart: Date;
  plannedEnd: Date;
  plannedRole?: string;
  plannedTasks: string[];
  actualStart?: Date;
  actualEnd?: Date;
  actualRole?: string;
  actualTasksCompleted: number;
  startDelayMinutes: number;
  endDelayMinutes: number;
  tasksDifference: number;
  efficiencyScore: number;
  deviationReason?: string;
}

export class ShiftComparisonEngine {
  /**
   * Criar comparação
   */
  async create(comparison: {
    restaurantId: string;
    shiftId?: string;
    employeeId: string;
    plannedStart: Date;
    plannedEnd: Date;
    plannedRole?: string;
    plannedTasks?: string[];
    actualStart?: Date;
    actualEnd?: Date;
    actualRole?: string;
    actualTasksCompleted?: number;
    deviationReason?: string;
  }): Promise<string> {
    // Calcular diferenças
    const startDelay =
      comparison.actualStart && comparison.plannedStart
        ? Math.max(
            0,
            (comparison.actualStart.getTime() -
              comparison.plannedStart.getTime()) /
              (1000 * 60)
          )
        : 0;

    const endDelay =
      comparison.actualEnd && comparison.plannedEnd
        ? Math.max(
            0,
            (comparison.actualEnd.getTime() - comparison.plannedEnd.getTime()) /
              (1000 * 60)
          )
        : 0;

    const tasksDifference =
      (comparison.actualTasksCompleted || 0) -
      (comparison.plannedTasks?.length || 0);

    // Calcular score de eficiência (1.0 = perfeito)
    let efficiencyScore = 1.0;
    if (startDelay > 0) efficiencyScore -= (startDelay / 60) * 0.1; // -0.1 por hora de atraso
    if (endDelay > 0) efficiencyScore -= (endDelay / 60) * 0.1;
    if (tasksDifference < 0)
      efficiencyScore -= Math.abs(tasksDifference) * 0.05; // -0.05 por tarefa não feita
    efficiencyScore = Math.max(0, Math.min(1, efficiencyScore));

    const { data, error } = await supabase
      .from("shift_comparisons")
      .insert({
        restaurant_id: comparison.restaurantId,
        shift_id: comparison.shiftId || null,
        employee_id: comparison.employeeId,
        planned_start: comparison.plannedStart.toISOString(),
        planned_end: comparison.plannedEnd.toISOString(),
        planned_role: comparison.plannedRole || null,
        planned_tasks: comparison.plannedTasks || [],
        actual_start: comparison.actualStart?.toISOString() || null,
        actual_end: comparison.actualEnd?.toISOString() || null,
        actual_role: comparison.actualRole || null,
        actual_tasks_completed: comparison.actualTasksCompleted || 0,
        start_delay_minutes: Math.round(startDelay),
        end_delay_minutes: Math.round(endDelay),
        tasks_difference: tasksDifference,
        efficiency_score: efficiencyScore,
        deviation_reason: comparison.deviationReason || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Listar comparações de um funcionário
   */
  async listByEmployee(
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ShiftComparison[]> {
    let query = supabase
      .from("shift_comparisons")
      .select("*")
      .eq("employee_id", employeeId)
      .order("planned_start", { ascending: false });

    if (startDate) {
      query = query.gte("planned_start", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("planned_start", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToComparison);
  }

  /**
   * Calcular média de eficiência
   */
  async getAverageEfficiency(
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const comparisons = await this.listByEmployee(
      employeeId,
      startDate,
      endDate
    );

    if (comparisons.length === 0) return 1.0;

    const sum = comparisons.reduce((acc, c) => acc + c.efficiencyScore, 0);
    return sum / comparisons.length;
  }

  private mapToComparison(row: any): ShiftComparison {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      shiftId: row.shift_id,
      employeeId: row.employee_id,
      plannedStart: new Date(row.planned_start),
      plannedEnd: new Date(row.planned_end),
      plannedRole: row.planned_role,
      plannedTasks: row.planned_tasks || [],
      actualStart: row.actual_start ? new Date(row.actual_start) : undefined,
      actualEnd: row.actual_end ? new Date(row.actual_end) : undefined,
      actualRole: row.actual_role,
      actualTasksCompleted: row.actual_tasks_completed || 0,
      startDelayMinutes: row.start_delay_minutes || 0,
      endDelayMinutes: row.end_delay_minutes || 0,
      tasksDifference: row.tasks_difference || 0,
      efficiencyScore: parseFloat(row.efficiency_score || 1.0),
      deviationReason: row.deviation_reason,
    };
  }
}

export const shiftComparisonEngine = new ShiftComparisonEngine();
